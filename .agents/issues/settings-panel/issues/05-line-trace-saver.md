# 05: Line trace saver

**What to build:** Line trace becomes a Screensaver choice. Phosphor lines on black turn at right angles across the screen, slowly fill it, then clear and start over. It's drawn on a 2D canvas, its own flat take with no copy of any existing screensaver's look. Under reduced motion a static line pattern changes slowly every few seconds.

**Blocked by:** 04.

**Status:** ready-for-agent

- [ ] `lineTrace` motion tested: deterministic by seed, right-angle turns only, stays in bounds through a resize, resets when full, calm pacing
- [ ] Selectable in the panel, previewable, and persisted
- [ ] Canvas is sized for the device pixel ratio and redrawn on resize; screenshots at 375 and 1024
