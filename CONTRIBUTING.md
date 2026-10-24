# Contributing

Open an issue with expected behavior, versions and a minimal reproduction. Use synthetic actors; do not upload campaign exports, credentials, private logs or licensed content.

Keep changes focused on applying damage to its recorded target. PF2e owns damage calculation and application. Do not guess targets, alter selection or duplicate IWR logic.

Run `npm test`. Runtime changes also need native validation of recipient selection, IWR, Undo and original-target preservation; see docs/testing.md. Only claim versions actually checked.

Releases require matching package/manifest versions and a `vVERSION` tag. GitHub Actions publishes module.json, module.zip and SHA256SUMS. Licensed integration fixtures are not distributed.
