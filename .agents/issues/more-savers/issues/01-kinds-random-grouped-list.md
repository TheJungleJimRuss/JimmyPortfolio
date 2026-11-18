# 01: Kinds, Random and grouped saver list

**What to build:** The Settings panel's Screensaver group becomes a grouped two-column radio list (Classic: Letter drift, Line trace, Bouncing name · Signal: Oscilloscope, Harmonograph · Systems: Pathfinder, Life, Circuit · Flight: Contours, Radar, Terrain · then Random and None), still one radio group. The eight new kinds and `random` are valid settings that are remembered and survive a reload; the inline head script in `dev.html` mirrors them. Choosing Random makes each Screensaver start (idle or Preview) pick a built saver at random, never the one shown last in this page visit. Line trace stays the default. The glossary's Screensaver entry is corrected (Line trace is the default) and lists the new savers and Random. Labels and headings are working placeholders.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

- [ ] `ScreensaverKind`, `SCREENSAVERS` and the head script accept `oscilloscope`, `harmonograph`, `pathfinder`, `life`, `circuit`, `contours`, `radar`, `terrain`, `random`; storage version stays `v:1`; unknown values fall back to `lineTrace`
- [ ] Pure `resolveSaverKind(kind, last, rand, pool)` per the spec; the pool is the kinds the saver layer can draw (so unbuilt savers are never picked); the controller keeps `last` in memory only
- [ ] Vitest: Settings round-trip for every new value; `resolveSaverKind` never returns `last` when the pool has 2+, never `random`/`none`, passes concrete kinds through, null for `none`
- [ ] Grouped list: headings label their sub-sections for screen readers; arrow keys move through all radios as one group; two columns hold at 375px with no horizontal scroll
- [ ] Preview on Random shows a random built saver
- [ ] `npm run build` passes, Desktop budget flat; `npm test` passes; panel screenshots at 375 and 1440
