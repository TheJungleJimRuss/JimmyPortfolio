# 03: Gateway 3D hero touch input

**What to build:** On touch devices the Gateway's 3D Hero name tilts with a finger drag, eases back when the finger lifts, and sways gently when idle. With reduced motion it sits still. The CSS fallback hero behaves the same way. Mouse behavior on desktop is unchanged. The canvas resizes from its container, and phones render at a lower pixel-ratio cap.

**Blocked by:** 02 (Viewport layout policy and root layout attribute)

**Status:** ready-for-agent

- [ ] HeroName3D tests: touch input enables drag tilt and idle drift; reduced motion disables both; mouse input keeps current tilt ranges
- [ ] CSS fallback hero mirrors touch drag, idle drift and reduced-motion stillness
- [ ] The hero eases back to idle on pointerup/pointercancel
- [ ] Resize driven by observing the canvas container rather than the window
- [ ] Pixel ratio capped lower on coarse pointers; frame rate stays smooth in the simulator
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
- [ ] Checked in Mobile Safari in the iOS Simulator
