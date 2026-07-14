# v45 - GitHub Pages Docs Nojekyll

Date: 2026-07-06

Changes:
- Added root `.nojekyll` to prevent GitHub Pages from running Jekyll on the static app.
- Added `docs/.nojekyll` for repositories configured to publish from `/docs`.
- Added `docs/index.html`, `docs/styles.css`, and `docs/app.js` as a deployment copy of the current v41 app.
- Kept the root app files unchanged from v41.

Why:
- GitHub Pages was trying to build `/docs` with Jekyll and failed.
- This project is a pure static HTML/CSS/JS app, so Jekyll should be bypassed.

Verification:
- `/Users/qoo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node --check docs/app.js`
- Confirmed `docs/index.html`, `docs/styles.css`, and `docs/app.js` match the root files.
