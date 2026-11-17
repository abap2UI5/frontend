# AGENTS.md — AI Assistant Guide for the abap2UI5 extension

## What this repository is

The legacy code of abap2UI5 that the core no longer ships. A system whose
code - or an addon - still uses one of these objects installs this
repository next to abap2UI5 and keeps working unchanged.

One object of the core's `src/99` did not come along and must not be added:
`z2ui5_cl_http_handler`, the empty subclass that kept the former handler
name alive, was deleted (maintainer decision 2026-11-17). What named it
names `z2ui5_cl_ui5_http_handler` now.

| Package | What | Came from |
|---|---|---|
| `src/` | the utility classes `z2ui5_cl_util*`, `z2ui5_cx_util_error`, table `z2ui5_t_91` | the core's `src/99/01` (2026-11-02), by way of abap2UI5/abap2UI5-ext |
| `src/01` | the XML view builder `z2ui5_cl_xml_view`, `z2ui5_cl_xml_view_cc`, `z2ui5_if_types` | the core's `src/99` (2026-11-17) |
| `src/02` | the seventeen popups `z2ui5_cl_pop_*` | the core's `src/99/02` (2026-11-17) |

Until 2026-11 this repository was `abap2UI5/frontend`, a **delivery
repository**: its branches (`standard`, `cloud`, `standard_new`, ...) carried
the ICF node, the BSP and the cloud service, generated in abap2UI5 and pushed
here. Those objects are part of abap2UI5 itself now (its `src/03`, and its
generated branch `cloud`), and nothing is delivered here any more. The old
branches stay as they were for installations that still point at them; they
are not rebuilt.

**Language:** English for code, comments, commits, PRs and docs.

## Rules

- **The code is frozen.** It is the core's `src/99` at the time of each move
  (one line of `z2ui5_cl_util_xml` differs, see below). Do not refactor,
  extend or restyle it; fix only what stops it from activating against a
  current abap2UI5 release. New utilities belong in
  [abap-util](https://github.com/abap-util/abap-util), a new popup in
  [abap2UI5-addons/popups](https://github.com/abap2UI5-addons/popups), a new
  view in `z2ui5_cl_ui5_view_builder` of the core - never here.
- **No object is renamed and none is added.** Every name here is one an
  installation already has, from the core. The packages are `src/`, `src/01`
  and `src/02` for that reason too: the utilities stay where a system that
  installed abap2UI5-ext has them.
- **Dependency on the core, by package:**
  - `src/` calls `z2ui5_cl_ajson`, `z2ui5_cl_srt_*` and the public types
    `ty_s_name_value` / `ty_t_name_value` of `z2ui5_cl_ui5_util_context` (all
    in the core's `src/00`) - nothing marked `FROZEN-ONLY` there.
    `z2ui5_cl_util_xml` reads its XML-attribute escape format from
    `z2ui5_cl_util` for that reason - the only line that differs from the
    core's former `src/99/01`.
  - `src/01` and `src/02` call the public API (`z2ui5_if_client`,
    `z2ui5_if_app`, `z2ui5_cl_ui5_view_builder`)
    **and the `FROZEN-ONLY` symbols of `z2ui5_cl_ui5_util_context`**, which
    the core keeps for exactly these classes. The core cannot drop one of
    them before the call here is gone - redirecting such a call to
    `z2ui5_cl_util`, which holds the original, is the change that frees it.
- **The abaplint configs load `src/00` to `src/02` of a pinned core
  release**, not all of `src/`: a release up to 1.149.0 still ships these
  classes itself in `src/99`, and loading that would define every object
  twice. For the same reason the classes of `src/01` and `src/02` can only be
  installed next to a core release **after 1.149.0**.
- **The test classes moved with their objects and run on a system only.**
  In the core they ran in the transpiled unit suite; this repository lints,
  it does not transpile.

## Validation

`npm run check` runs what CI runs: abaplint Standard (`abaplint.jsonc`) and
ABAP Cloud (`.github/abaplint/abap_cloud.jsonc`). `publish-702` writes the
downported branch `702` on every push to `main`, `abap-702` lints it.
All `.abap`/`.xml`/config files are LF-only (`.gitattributes`).
