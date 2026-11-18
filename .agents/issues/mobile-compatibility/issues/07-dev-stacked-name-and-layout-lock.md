# 07: Dev Stacked name, stacked Outline trace and Layout lock

**What to build:** In portrait and narrow viewports the Dev portfolio's Hero name is the Stacked name, and the Outline trace draws a matching two-line outline that the hero materializes into exactly. The Layout lock holds the layout chosen at the start of the Intro sequence. If the visitor rotates mid-intro, the new layout applies once the hero has materialized. After the intro, rotation switches layout immediately.

**Blocked by:** 02 (Viewport layout policy and root layout attribute), 06 (Dev Intro sequence fits phones)

**Status:** ready-for-agent

- [ ] Stacked SVG outline built from the boolean-unioned glyph contours (flat M apex), line spacing matched to the stacked solid text; single-line Y kerning shift untouched
- [ ] Trace math unchanged for both layouts: exact lengths, CTM-scaled dash lengths, linear timing, 50ms cascade
- [ ] HeroOutlineTracer tests cover both layouts finishing on time
- [ ] IntroSequenceController tests: layout locked from intro start to materialization; a mid-intro change applies on release; reduced-motion skip releases immediately
- [ ] Manual check: rotate mid-trace in the simulator, the trace completes, then the hero switches layout
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
- [ ] Checked in Mobile Safari in the iOS Simulator
