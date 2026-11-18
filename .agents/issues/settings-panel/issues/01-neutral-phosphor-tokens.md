# 01: Neutral phosphor tokens (prefactor)

**What to build:** The Dev portfolio draws every green from one set of neutral phosphor tokens (a base color plus mid, dim and faint alphas) instead of `--desk-green*` names and hard-coded `#00ff41` values, so a later Phosphor color only has to swap the token values. Nothing looks different to the visitor. The settled Hero name stays `#F0F4F8`, and the Gateway's styles are untouched.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] Every green on the Dev portfolio (Desktop, Boot shell, Outline trace, intro styles) reads from the phosphor tokens, with no `--desk-green*` names and no hard-coded phosphor green left in Dev styles
- [ ] The tokens can be redefined under a `data-phosphor` attribute on the root element (only Green defined for now)
- [ ] Gateway styles and the Three.js hero are unchanged
- [ ] `npm run build` and `npm test` pass, and the Desktop looks identical at 375 and 1024 (before/after screenshots)
