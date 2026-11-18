# 03: CRT filter

**What to build:** The Settings panel gets a CRT filter slider with four steps (Off default, Low, Med, High). It lays scanlines, a slight curve and a vignette over the Desktop, plus flicker at Med and High. The overlay never blocks clicks, sits below the Settings panel and the Screensaver, tints with the Phosphor color, and is remembered on the next visit. Under reduced motion there is no flicker.

**Blocked by:** 02.

**Status:** ready-for-agent

- [ ] A range input with four labelled steps, announced with its current value
- [ ] Every control stays clickable and all text stays readable at High
- [ ] No flicker under `prefers-reduced-motion`
- [ ] Persists through the Settings model; Reset returns it to Off
- [ ] Screenshots of each step at 375 and 1024
