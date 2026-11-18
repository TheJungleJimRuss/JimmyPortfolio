# 02: Settings panel + Phosphor color

**What to build:** A Settings button at the right end of the Taskbar, next to the clock, opens the Settings panel: a flyout above the button on the desktop layout and a bottom sheet on the phone layout. It works like the Power menu (popover invoker, Escape or an outside click closes it, focus goes back to the button, same fallbacks). Its first group is Phosphor color (Green default, Amber, White, Blue), which recolors the whole Dev portfolio at once and is remembered on the next visit. On a later visit the Boot shell and Outline trace draw in the stored color with no green flash first. A Reset to defaults link restores everything. There's no deep link and no Back entry.

**Blocked by:** 01.

**Status:** ready-for-agent

- [ ] The Settings model (the types, `DEFAULT_SETTINGS`, `parseSettings`, `serializeSettings`, `loadSettings`, `saveSettings` from the spec) covers all four settings, with one versioned storage key and per-field fallback
- [ ] Vitest: defaults on null, corrupt or unknown-version input; single-field fallback; round-trip; storage that throws; Reset
- [ ] The panel is a fieldset with a legend and a radio group; keyboard and screen-reader use works; it's a bottom sheet with thumb-sized targets on the phone layout
- [ ] The inline head script sets `data-phosphor` before first paint and survives blocked storage
- [ ] The settled Hero name stays `#F0F4F8`; the Gateway is unaffected
- [ ] Build passes inside the Desktop JS budget; screenshots of each color at 375 and 1024
