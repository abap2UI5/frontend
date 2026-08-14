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
// The bundle canNOT be delivered under that conventional name: a BSP page name
// must not contain a hyphen, and CL_O2_API_PAGES=>CREATE_NEW_PAGE rejects it
// with sy-subrc=2 (invalid_name), which fails the whole WAPA import. (Standard
// Fiori apps carry Component-preload.js as a MIME object, not as a BSP page -
// that is why the name works there.) So the bundle ships as `preload.js` and
// index.html points the bootstrap at it via `data-sap-ui-oninit`, the same
// mechanism the ABAP-only variant uses (z2ui5_cl_ui5_http_handler).
//
// That also removes the 404 rather than just avoiding a second one: UI5 skips
// the Component-preload request entirely when the component module is already
// registered ("only load the Component-preload file if the Component module is
// not yet available", sap/ui/core/Component.js), and the bundle registers it.
//
// Apart from the bootstrap line the step is ADDITIVE: every single file stays
// in the BSP unchanged, UI5 just no longer has to request them one by one.
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
const builtBundleName = 'Component-preload.js';

// The delivered name - no hyphen, so it survives CREATE_NEW_PAGE.
const bundleName = 'preload.js';
const bundleModule = 'z2ui5/preload';

// The bootstrap module index.html starts the app with today, and what it is
// replaced by: loading the bundle as the oninit module registers every module
// first, and pulling in ComponentSupport as its dependency then starts the
// component (ComponentSupport.run() runs when the module is required). Written
// as a module reference, not a global function name, because the legacy-free
// (UI5 2.x) bootstrap of standard_v2 only accepts `module:`.
const bootModule = 'module:sap/ui/core/ComponentSupport';
const bootReplacement = `module:${bundleModule}`;
const bootTail = `sap.ui.define(["sap/ui/core/ComponentSupport"], function () {\n  "use strict";\n});\n`;

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

// index.html boots the app through the bundle instead of ComponentSupport
// directly. Fails loudly rather than shipping a bundle nothing ever loads.
function patchIndexHtml() {
    const file = path.join(webappDir, 'index.html');
    const html = fs.readFileSync(file, 'utf8');
    if (!html.includes(bootModule)) {
        throw new Error(
            `index.html: bootstrap module "${bootModule}" not found - the bootstrap changed, ` +
            `so ${bundleName} would be built and never loaded. Adjust bootModule in preload.js.`,
        );
    }
    fs.writeFileSync(file, html.split(bootModule).join(bootReplacement), 'utf8');
}

function assertBspCompatible(content) {
    if (!/sap\.ui\.predefine\(\s*"z2ui5\/Component"/.test(content)) {
        throw new Error(
            `${bundleName}: no "z2ui5/Component" module in the bundle - the build produced ` +
            'something other than the component preload.',
        );
    }
    // A BSP page name is restricted; the hyphen in the built name is exactly
    // what CREATE_NEW_PAGE rejects, so guard against shipping one by accident.
    if (/[^A-Za-z0-9_.]/.test(bundleName)) {
        throw new Error(
            `${bundleName}: a BSP page name may only contain letters, digits, "_" and "." - ` +
            'CL_O2_API_PAGES=>CREATE_NEW_PAGE fails the whole import with sy-subrc=2 (invalid_name).',
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

    const bundle = stripSourceMappingUrl(fs.readFileSync(path.join(distDir, builtBundleName), 'utf8')) + bootTail;
    assertBspCompatible(bundle);
    fs.writeFileSync(path.join(webappDir, bundleName), bundle, 'utf8');
    patchIndexHtml();

    const modules = (bundle.match(/sap\.ui\.predefine\(/g) || []).length;
    console.log(`Generated ${bundleName} (${modules} modules, ${bundle.length} bytes), index.html boots it.`);
} finally {
    fs.rmSync(distDir, { recursive: true, force: true });
    for (const name of Object.keys(tempProjectFiles)) {
        fs.rmSync(path.join(appDir, name), { force: true });
    }
}
