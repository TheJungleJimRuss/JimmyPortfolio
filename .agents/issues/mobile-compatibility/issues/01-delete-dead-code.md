# 01: Delete unused components and dead layout CSS

**What to build:** Remove the components that neither the Gateway nor the Dev portfolio loads (Hero3DScene, UnityChamber, TiltSpotlightCards, CollideSlideSandbox) and the unreferenced rules in the layout stylesheet. Both pages look and behave exactly as before.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Each removed module is confirmed unreferenced by both entry pages, their imports and the Vite inputs before deletion
- [ ] Only layout CSS rules with no matching markup are removed
- [ ] Desktop Gateway and Dev portfolio render identically before and after (screenshot comparison)
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
