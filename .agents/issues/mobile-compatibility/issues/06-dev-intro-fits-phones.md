# 06: Dev Intro sequence fits phones

**What to build:** On phones and tablets the Dev portfolio's full Intro sequence plays at its normal timing and fits the screen. Each boot log line stays on one row with the font shrunk to fit, and the Outline trace SVG is sized correctly with no overflow at 375px. On iOS, the tap that starts the intro unlocks audio so the ticks and bass tone play when sound is on. The page fits landscape phones and notches, and the "← GATEWAY" nav clears the safe area and is easy to tap.

**Blocked by:** 01 (Delete unused components and dead layout CSS)

**Status:** ready-for-agent

- [ ] Boot log lines never wrap or overflow at 375px; text unchanged
- [ ] Trace SVG aspect ratio matches its viewBox; minimum width fits a 375px content area; the single-line trace still lands exactly on the solid text
- [ ] IntroSequenceController test: overlay pointerdown triggers the audio resume
- [ ] Intro ticks and the materialize tone are audible in Mobile Safari when sound is enabled
- [ ] viewport-fit=cover, dynamic viewport height with a fallback, and safe-area insets on the Dev portfolio; the nav has at least a 44px tap target
- [ ] Prompt copy unchanged
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
- [ ] Checked in Mobile Safari in the iOS Simulator
