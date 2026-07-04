# app2app_v2

Generates the **legacy-free (UI5 2.0) variant** of this frontend, taking the
classic webapp coding over **1:1** and adapting only the bootstrap layer so it
runs on the legacy-free OpenUI5 build.

```
cloud/app/webapp ──▶ patchIndexHtml + patchManifest ──▶ .github/app2bsp ──▶ bsp_rename(Z2UI5_V2) ──▶ src/
```

The result is published to the [`frontend-legacy-free`](https://github.com/abap2UI5/frontend-legacy-free) repo
and to the [`standard_v2`](https://github.com/abap2UI5/frontend/tree/standard_v2) branch of this repo
(kept up to date by the `auto_bsp_v2` workflow).

## Run

```bash
npm run build_legacy_free      # -> .github/app2app_v2/out/src
npm run build_bsp_v2           # -> src/ (used on the standard_v2 branch)
```

This clones the `cloud` webapp, applies the bootstrap patch and reuses the
existing `.github/app2bsp` + `bsp_rename` tooling. Nothing else is touched.

## The only adaptations (everything else is 1:1)

| File | Change | Why |
| --- | --- | --- |
| `index.html` | load `1.142.0-legacy-free` SDK (CDN); 2.x config attributes `resource-roots` / `on-init` / `compat-version` / `frame-options`; `preconnect`; `libs=sap.m` | bootstrap the legacy-free build |
| `manifest.json` | `minUI5Version 1.136.0`, `_version 2.0.0` | legacy-free starts at 1.136 |

Deployment identity is renamed to `Z2UI5_V2` (parallel install). Backend handler
is shared (`/sap/bc/z2ui5`) by default; pass `--own-backend` for an isolated one.

> The classic frontend JS is already forward-compatible (no jQuery.sap, no
> sync APIs, guarded `getCore()` fallbacks) — so no code changes are needed,
> only the bootstrap.
