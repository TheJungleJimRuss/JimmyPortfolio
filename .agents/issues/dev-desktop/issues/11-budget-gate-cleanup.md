# 11: Bundle budget gate and cleanup

**What to build:** A build check fails when Desktop JS exceeds 350 KB gzip before any stage loads (Three.js tree-shaken and code-split), and the retired scrolling sections, `#viewDetail` page and unused code are removed.

**Blocked by:** 09, 10

**Status:** done

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [x] `npm run build` enforces the 350 KB gzip budget and reports sizes
- [x] Old card grid, detail view and unused components removed with tests updated
- [x] Final run: build 0 errors, `npm test` green, responsive screenshots, temp files cleaned

## Notes (2026-11-14)

- Budget: `build/desktopBudget.ts` (Vite plugin in `vite.config.ts`, tests in `build/desktopBudget.test.ts`) sums gzip of the `dev.html` entry chunk plus its static imports and fails `npm run build` above 350 KB; it prints the sizes every build. Current Desktop JS: 16.41 KB gzip (dev 14.74 + ViewportLayoutAdapter 1.67). Three.js lives only in the Gateway chunk (`main`, 145.8 KB gzip), which the Desktop never loads; no stage adds JS to the Desktop entry. `chunkSizeWarningLimit` raised to 600 so the Gateway's Three.js chunk does not drown the real gate.
- Removed: `CodeArchitectureTabs.ts`, `ScrollController.ts`, `src/config/siteConfig.ts` (only consumer was CodeArchitectureTabs), `src/styles/effects3d.css` (old tilt-card/project-card grid, no references; its import dropped from `landing.ts` and `index.html`), and the dead `.wf-label`/`.wf-box`/`.wf-btn`/`.wf-tag*` and persona-pill rules in `wireframe.css`. `dev.html` already had no scrolling sections or `#viewDetail`.
- Kept: `PersonaController` (unreferenced by the app but tested; may serve the Drone side).
- Verified: build 0 errors, 291 tests pass, browser checks at 375, 768, 1024 and 812x375 landscape (Gateway, Boot shell, Desktop, Projects window; no horizontal overflow).
