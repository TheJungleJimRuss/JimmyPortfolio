# 04: Gateway tap, press glow and touch chrome

**What to build:** On the Gateway, one tap on a pathway navigates straight through, and the Dev glow plays on the hero while the finger is down. Hover-only styles apply only on devices that can hover, so nothing stays stuck after navigating back. The sound switch and pathways are comfortable tap targets, and the audio hint is visible on touch. The page fits landscape phones and notches, and reduced motion turns the entrance and hover transitions into simple fades. The D/F/M hotkeys still work.

**Blocked by:** 02 (Viewport layout policy and root layout attribute)

**Status:** ready-for-agent

- [ ] GatewayController tests: pointer press on the Dev pathway sets the dev glow state; release and cancel clear it; hotkeys unchanged
- [ ] Tap navigates on release with the existing exit fade (no double-tap)
- [ ] All hover-only Gateway CSS is gated to hover-capable devices; the audio hint is shown by default on non-hover devices
- [ ] Sound switch and pathway links have at least 44px touch targets
- [ ] viewport-fit=cover, dynamic viewport height with a fallback, and safe-area insets on the Gateway
- [ ] Reduced motion covers the Gateway entrance and hover transitions
- [ ] No copy changes
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
- [ ] Checked in Mobile Safari in the iOS Simulator
