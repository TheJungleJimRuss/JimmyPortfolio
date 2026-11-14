# 11: Bundle budget gate and cleanup

**What to build:** A build check fails when Desktop JS exceeds 350 KB gzip before any stage loads (Three.js tree-shaken and code-split), and the retired scrolling sections, `#viewDetail` page and unused code are removed.

**Blocked by:** 09, 10

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] `npm run build` enforces the 350 KB gzip budget and reports sizes
- [ ] Old card grid, detail view and unused components removed with tests updated
- [ ] Final run: build 0 errors, `npm test` green, responsive screenshots, temp files cleaned
