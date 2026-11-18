# 04: Screensaver + Letter drift

**What to build:** The Desktop gets a Screensaver. The Settings panel gets a saver radio group (Letter drift default, None; more savers come in 05–07), a wait picker (30s / 1m default / 5m) and a Preview button. After the chosen wait with no input, the saver layer covers the Desktop. Any input ends it and leaves the Desktop as it was, without also clicking what's underneath. A playing Project stage, a hidden tab or None keep it off. The saver layer code lazy-loads the first time it's needed. Letter drift pulls the Hero name's letters apart over black in the Phosphor color and brings them back together on exit. Under reduced motion it shows a calm, near-still version.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] `screensaverShouldShow` (pure, fake clock) is tested at the wait boundary, with None, stagePlaying, hidden and preview
- [ ] The `SaverMotion` interface from the spec, and `letterDrift` tested for determinism by seed, staying in bounds, and calm-mode pacing
- [ ] Idle reset on pointermove, pointerdown, keydown, wheel and touchstart, and when the tab becomes visible again; the saver layer is `aria-hidden` and focus is kept
- [ ] Saver code is not in the Desktop's first-load chunk (the budget printout confirms); no Three.js on the Dev portfolio
- [ ] Works on the phone layout after touch idle; screenshots at 375 and 1024
