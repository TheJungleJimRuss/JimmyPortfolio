# 05: Gateway Stacked name

**What to build:** In portrait and narrow viewports the Gateway's 3D Hero name shows as the Stacked name, JIMMY over RUSS, framed so both lines are large and stay inside the canvas while tilting. Rotating to landscape switches back to the Single-line name. The CSS fallback hero stacks the same way.

**Blocked by:** 03 (Gateway 3D hero touch input)

**Status:** ready-for-agent

- [ ] HeroName3D tests: a stacked layout builds two line meshes; a single-line layout builds one
- [ ] Camera framing fits the two-line bounds with drift margin; letters are visibly larger than the single-line version on a 375px phone
- [ ] Layout switches live on rotate with no reload and no leaked meshes
- [ ] CSS fallback hero stacks in the same viewports
- [ ] Desktop single-line hero unchanged (materials, lighting, hover emissive)
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
- [ ] Checked in Mobile Safari in the iOS Simulator
