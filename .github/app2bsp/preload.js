#!/usr/bin/env node

// Builds the UI5 component preload bundle and drops it into the webapp, so
// that the next step (run.js) turns it into a BSP page like every other file.
// Run it from the same working directory as run.js, before run.js:
//
//     node .github/app2bsp/preload.js
//     node .github/app2bsp/run.js
//
// Why: UI5 asks for `<component>/Component-preload.js` on every component
// start. The BSP had no such file, so the request answered 404 ("failed to
// load JavaScript resource: z2ui5/Component-preload.js") and UI5 fell back to
// fetching every module on its own - around 50 round trips per app start.
//
// The bundle is purely ADDITIVE: every single file stays in the BSP unchanged,
// UI5 just no longer has to request them one by one. Nothing in the webapp
// references the bundle - UI5 finds it by convention.
//
// Not minified, on purpose. A minified bundle is one line per module (up to
// 18k characters here) and a BSP page cannot carry a line longer than 255
// characters - run.js would chop such a line into 255-character chunks, which
// the SAP side serves back with newlines in between, splitting JavaScript
// tokens and string literals. Keeping the source formatting keeps the longest
// line at 211 characters. The bundle still turns ~50 requests into one; a
// minified variant needs a line breaker that only ever breaks where JavaScript
// allows it, which is a separate step.

const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Same working-directory contract as run.js
const appDir = './frontend/app';
const webappDir = path.join(appDir, 'webapp');
const distDir = path.join(appDir, 'dist');
const bundleName = 'Component-preload.js';

// A BSP page line, as in run.js - the limit this build has to respect.
const bspLineWidth = 255;

// UI5 Tooling builds a project, not a folder: it wants a ui5.yaml next to
// webapp/ and a package.json it can resolve the project from. Neither belongs
// to the delivered webapp, so both are written here and removed again in the
// cleanup below. The version is never rendered into the output (the sources
// carry no ${version} placeholder), so it cannot make the build irreproducible.
const tempProjectFiles = {
    'ui5.yaml': fs.readFileSync(path.join(__dirname, 'ui5-build.yaml'), 'utf8'),
    'package.json': '{\n  "name": "z2ui5",\n  "version": "0.0.1",\n  "private": true\n}\n',
};

function resolveUi5Cli() {
    try {
        return require.resolve('@ui5/cli/bin/ui5.cjs');
    } catch {
        throw new Error(
            '@ui5/cli not found - run `npm ci` in the repository root before building a BSP branch.',
        );
    }
}

function runUi5Build() {
    try {
        execFileSync(
            process.execPath,
            [resolveUi5Cli(), 'build', '--config', 'ui5.yaml', '--exclude-task=minify',
             '--clean-dest', '--dest', 'dist'],
            { cwd: appDir, stdio: ['ignore', 'pipe', 'pipe'] },
        );
    } catch (error) {
        // The build log is the only thing that says WHY it failed, and it is
        // captured above so the branch build stays quiet on the happy path.
        process.stderr.write(String(error.stdout ?? ''));
        process.stderr.write(String(error.stderr ?? ''));
        throw error;
    }
}

// The bundler appends a sourceMappingURL for Component-preload.js.map. That map
// is not worth a BSP page for an unminified bundle - every original file is
// served next to it - and a reference to a file that is not there is exactly
// the 404 this whole step removes.
function stripSourceMappingUrl(content) {
    return content.replace(/^\/\/# sourceMappingURL=.*\r?\n?/m, '');
}

function assertBspCompatible(content) {
    if (!/sap\.ui\.predefine\(\s*"z2ui5\/Component"/.test(content)) {
        throw new Error(
            `${bundleName}: no "z2ui5/Component" module in the bundle - the build produced ` +
            'something other than the component preload.',
        );
    }
    content.split('\n').forEach((line, index) => {
        if (line.length > bspLineWidth) {
            throw new Error(
                `${bundleName} line ${index + 1} is ${line.length} characters (max ${bspLineWidth}) - ` +
                'a BSP page cannot carry it and run.js would chop it into 255-character chunks, ' +
                'breaking the JavaScript. Shorten the frontend source line, or exclude the ' +
                'resource from the bundle in ui5-build.yaml.',
            );
        }
    });
}

for (const [name, content] of Object.entries(tempProjectFiles)) {
    fs.writeFileSync(path.join(appDir, name), content, 'utf8');
}

try {
    runUi5Build();

    const bundle = stripSourceMappingUrl(fs.readFileSync(path.join(distDir, bundleName), 'utf8'));
    assertBspCompatible(bundle);
    fs.writeFileSync(path.join(webappDir, bundleName), bundle, 'utf8');

    const modules = (bundle.match(/sap\.ui\.predefine\(/g) || []).length;
    console.log(`Generated ${bundleName} (${modules} modules, ${bundle.length} bytes).`);
} finally {
    fs.rmSync(distDir, { recursive: true, force: true });
    for (const name of Object.keys(tempProjectFiles)) {
        fs.rmSync(path.join(appDir, name), { force: true });
    }
}
