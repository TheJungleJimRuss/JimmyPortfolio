# PortfolioSite — project notes
> History: `.agents/NOTES_ARCHIVE.md`. Keep this file under ~100 lines; move finished work to the top of the archive.

## Status
2026-11-18 — More savers (spec + tickets in `.agents/issues/more-savers/`) built on branch `feat/more-savers` (uncommitted): Pathfinder, Life, Circuit, Contours, Terrain, plus Random; one flat radio list (categories removed). The user cut Letter drift, Oscilloscope, Harmonograph and Radar. 426 tests pass, Desktop budget 23.51 KB gzip; browser-checked.
2026-11-18 — CRT filter is now an on/off switch, on by default (former High look), covering the Power menu, Settings panel and a drawn Phosphor cursor; 377 tests pass, Desktop budget 23.27 KB gzip.
2026-11-18 — Settings panel (spec + tickets 01-07 in `.agents/issues/settings-panel/`) built on branch `feat/settings-panel` (uncommitted): Screensaver (4 savers), Phosphor color, CRT filter. 372 tests pass, Desktop budget 22.41 KB gzip; browser-checked at 375/768/812x375/1440.
2026-11-16 — Power menu replaces `← GATEWAY` on the Taskbar (uncommitted); 311 tests pass, browser-checked at 1024 and 375.
2026-11-14 — Mobile pass and Dev Desktop tickets 01-11 are done (uncommitted, branch `feat/desktop-state-reducer`). `npm run build` exits 0 with the Desktop JS budget at 16.41 KB gzip of 350; 291 Vitest tests pass; browser-checked at 375/768/1024 and landscape.

## Current goal
Dual-site portfolio (Dev + Drone). Dev Desktop (spec `.agents/issues/dev-portfolio-complete/spec.md`, tickets in `.agents/issues/dev-desktop/issues/`) is complete; the Drone side is not started.

## Active decisions
- **Package**: `jimmy-russ-portfolio`. Stack: Vite v6, TypeScript, Three.js v0.170, Vitest v5.
- **Commands**: build `npm run build` (`tsc && vite build`); test `npm test` (`vitest run`). Dev server on `http://localhost:5173`.
- **Copy**: the user writes all site copy, bios and project text. Never generate bios or replace placeholders.
- **Pages** (multi-page Vite, `rollupOptions.input` in `vite.config.ts`):
  - `index.html` + `src/landing.ts`: Landing Gateway. 3D hero "JIMMY RUSS", audio switch `[M]`, pathways `01 // Dev & Game Systems` (to `./dev.html`) and `02 // Aerial Flight Ops`.
  - `dev.html` + `src/dev.ts`: Dev portfolio. Boot shell (waits for first key/click/tap) → Outline trace of the Desktop → hero materializes. The Desktop (`DesktopState` reducer, `DesktopController`/`DesktopView`) holds Hero, File Explorer, Project, About and Contact windows, a Taskbar whose left-end Power menu (`PowerMenu.ts`: popover + invoker + focusgroup, with fallbacks) offers Restart (reload to the Boot shell, deep link dropped) and Shut Down (520ms power-off collapse, then the Gateway; plain fade under reduced motion), deep links + Back (`DeepLink`). Terms in `GLOSSARY.md`; no scrolling sections or `#viewDetail` remain.
- **Palette & type**:
  - Dev: phosphor green `#00FF41` on pure black `#000000` (`--bg-page`, scrollbar track, `html`/`body` in `wireframe.css` and `intro-trace.css`). No digital rain/falling glyphs.
  - Drone: `#64B5F6`. Settled hero text: `#F0F4F8`.
  - Hero font: `var(--font-hero)` = `'Outfit-Schibsted-J'`, `'Outfit'`, weight 800; 3D mesh uses `src/assets/outfit_hero.typeface.json`.
- **Gateway** (`GatewayController`, `HeroNameDualIdentity`, `TactileAudio`): ultra-minimal; borderless text links with animated hairline underlines (green Dev / blue Drone), inline borderless sound switch, no footer status or quick-access UI. Hotkeys D/F/M.
- **`HeroName3D.ts`** (Three.js solid mesh):
  - `bevelEnabled: false`, `size: 1.65`, `depth: 0.44`, matte `metalness: 0.0`, `roughness: 0.88`, directional studio lighting. Emission only on the letters.
  - Resting rotation `{ x: 0, y: 0 }` (faces forward with the cursor centered; pointer coords normalized to the hero's bounding center in `landing.ts`).
  - Tilt range yaw 0.55 rad, pitch 0.35 rad; translation parallax X ±0.45, Y ±0.22; lerp 0.14; point light range X ±5.5, Y ±3.5; `updateCameraDistance()` margin keeps drift inside the canvas.
  - Color/emissive lerped per frame (no binary jumps).
  - Dev hover: emissive 1.4 front / 0.9 sides, base color `#d6f7df`, point light 1.8. `gateway.css` bloom: `drop-shadow(0 0 8px rgba(0,255,65,0.45)) drop-shadow(0 0 20px rgba(0,255,65,0.20))`.
  - Drone hover glow disabled (emissive 0, `[data-state='drone']` neutralized in `gateway.css`), kept for a future dedicated drone effect.
  - Graceful fallback to the DOM/CSS layer hero when WebGL is unavailable. CSS fallback (`HeroNameDualIdentity.ts`) mirrors tilt ±36° yaw / ±28° pitch, translation ±18px X / ±12px Y.
- **Intro trace** (`HeroOutlineTracer.ts`): 1,800ms constant-speed `linear` trace, 50ms cascade, `stroke-dasharray`/`dashoffset` scaled by the live CTM scale. The hero transitions the moment the last stroke closes: 850ms `heroMaterializeBloom` (green bloom → mint-white → `#F0F4F8`), SVG outline fade-out 650ms, tactile bass tone. Dev mode activates immediately on gateway launch; all terminal UI is removed after the intro.
- **Page transitions**: `<meta name="color-scheme" content="dark">` + inline `#000000` background in both pages' `<head>`, `@view-transition { navigation: auto; }`, 160ms `.page-is-exiting` fade on gateway/dev links. `src/dev.ts` sets `history.scrollRestoration = 'manual'` and `scrollTo(0, 0)` on load, `pageshow` and `beforeunload`.
- **Settings panel** (`Settings.ts` model, `SettingsPanel.ts`, Taskbar right-end gear): stored under localStorage `portfolio.dev.settings` `{v:1,settings}`; the inline head script in `dev.html` mirrors the key, version and allowed values, so keep them in sync. Phosphor colors are `[data-phosphor]` token blocks in `tokens.css` (`--phosphor`, `--phosphor-rgb`, …); `--desk-green*` is gone. CRT is `'on'|'off'` (old low/med/high read as on; `<html data-crt="on">` by default). The CRT overlay and `PhosphorCursor` are `popover="manual"`; `TopLayer.ts` re-shows them (cursor, then overlay) whenever another popover opens so they stay above it. The cursor replaces the system pointer only on `(pointer: fine)` while CRT is on. Both hide while a saver layer exists (saver z 10003). Savers are a lazy chunk (`SaverLayer.ts`); to add one: a `SaverMotion` + `SaverRenderer` in `savers/`, a `RENDERERS` entry, a `ScreensaverKind` value and a radio in `dev.html`.
- **Desktop JS budget**: `build/desktopBudget.ts` (Vite plugin) fails `npm run build` if `dev.html`'s entry + static imports exceed 350 KB gzip, and prints sizes each build. Three.js is Gateway-only (`main` chunk); keep it out of `src/dev.ts` imports.
- **Persona**: `PersonaController` switches "dev"/"drone" with URL query param support and localStorage persistence.
- **Audio**: Jimmy will write and produce the original soundtrack; tactile SFX (typing, clicks, rotor spool); unfiltered clean playback.

## Gotchas
- **`vector-effect="non-scaling-stroke"`** makes browsers evaluate `stroke-dasharray`/`dashoffset` in screen pixels, not viewBox units. Scale lengths by the CTM, or strokes finish early and the intro freezes.
- **Easing on outline traces**: cubic-bezier easing plus length buffers make closed outlines finish visually before timers fire. Use exact lengths (`Math.ceil(length)`) and `linear`.
- **`.intro-overlay.is-fading`** needs `opacity: 0 !important; visibility: hidden;` so the black overlay doesn't block the trace.
- **Glyph outlines**: `M`, `Y`, `R` TrueType component subpaths overlap; the SVG paths are boolean-unioned single contours. `M` apex follows Outfit ExtraBold's flat horizontal top.
- **Kerning in SVG paths**: the `Y` path in `dev.html` is shifted +30 font units (start 2536.0 → 2566.0) to match M–Y kerning in the solid text.
- When changing `src/components/`, run `npm test` to catch regressions in `PersonaController.test.ts`.

## Next steps
- More savers: committed and pushed on `feat/more-savers` (2026-11-18), not merged to main; saver labels are placeholders the user will rename. Life replays the same run each cycle (seeded from the name).
- Settings panel: commit `feat/settings-panel` (user's call). Optional cleanups from review: shared popover controller for Power menu + Settings, shared canvas/`--phosphor`/calm-tick helpers for savers, derived alpha tokens declared once.
- `formatClock` in `DesktopView.ts` was switched to 12-hour AM/PM outside the Settings work; confirm it's intended.
- Commit the mobile pass + Dev Desktop work (large uncommitted diff; user's call).
- Fill the `[ ... ]` copy slots (projects, About, Contact) in `src/data/`; the user writes all copy.
- Open: iOS Simulator Safari check (needs full Xcode); landscape-phone "PROJECTS" cue sits tight under RUSS on the Gateway; `PersonaController` is unreferenced by the app (tested only), delete or reuse for the Drone side.
- Phone testing needs HTTPS (deviceorientation): launch config `dev-lan` (`--host --port 5180 --mode lan`) → `https://<LAN-IP>:5180/`.

Not yet started (2026-11-04 vision):
- Drone side: RadioMaster-style transmitter takeoff (press/click advances throttle, motors spool, lift-off through clouds into open sky) with a reactive 3D drone (mouse banking, scroll altitude).
- Drone cards: minimalist layout with subtle topographic contour lines.
- Dedicated Drone hover effect for the gateway hero.
- Soundtrack integration once the user's music is ready.
