# Living Project Notes: PortfolioSite

## 1. Project Overview & Scope
- **Project Name**: jimmy-russ-portfolio
- **Stack**: Vite v6, TypeScript, Three.js (v0.170), Vitest v5
- **Status**: Active & Verified
- **Build Command**: `npm run build` (`tsc && vite build`)
- **Test Command**: `npm test` (`vitest run`)

## 2. Core Architecture & Components
- **Three.js Background Scene**: Responsive 3D canvas rendering interactive graphics.
- **PersonaController**: Mode switching between "dev" and "drone" state, with URL query parameter support and localStorage persistence.
- **Copywriting Rule**: The user writes all site copy, bio text, and project descriptions. Agents must NEVER generate fake bios or replace structural text placeholders.

## 3. Active Roadmap & Milestones
- [x] Three.js canvas setup
- [x] PersonaController state and URL sync
- [x] Vitest test suite (55 passing unit tests across 10 test suites)
- [x] Clean production build
- [x] Antigravity workflow rules and living notes initialized
- [x] Minimalist Intro Terminal Trace Sequence (single click -> pretend commands -> glowing green laser line traces JIMMY RUSS -> materializes into gateway)
- [x] Landing Gateway & Dual-Identity Name Hero (Milestone 1: architectural typography, 3D tilt, phosphor green & cloud emitters, audio switch, hotkeys D/F/M)
- [x] Dev Boot Terminal & Interactive Keystroke Compiler (Milestone 2: fullscreen interactive bootloader, phosphor green logs, laser scanner sweep, dockable bottom CLI drawer)

## 4. Architectural Decisions & Conventions Log
- `2026-10-25`: Codified strict copywriting mandate (preserve user copy and placeholders). Enforced Vitest test verification and clean TypeScript build checks before task completion.
- `2026-11-04`: Aligned on core dual-site polish vision:
  - Intro sequence: Minimalist arrival right on page open. A single click or button press starts automated pretend commands (~1.5s), followed by a glowing phosphor green line tracing the hero outline and materializing it.
  - Landing Portal: Name hero (JIMMY RUSS) with dedicated audio toggle switch (ON/OFF, no player UI), clean pathway choice between Dev and Drone.
  - Dev side: Terminal boot with interactive keystroke/click code compilation & wireframe laser blueprint site assembly in clean phosphor green on deep black (palette only; no digital rain/falling glyph tropes).
  - Dev projects: Custom dark-mode OS File Explorer with custom window chrome, phosphor green accents on black, and breadcrumb navigation.
  - Drone side: RadioMaster-style transmitter takeoff sequence starting on the ground; pressing/clicking advances throttle stick, spools up motors, lifts off, cuts through clouds into open sky/landscape with reactive 3D drone (mouse banking & scroll altitude).
  - Drone cards: Minimalist layout with subtle topographic contour lines and no clutter.
  - Audio: Jimmy will write and produce his own original song/music for the site soundtrack, paired with tactile sound effects (typing, clicks, rotor spool). Unfiltered clean playback.
- `2026-11-05`: Implemented Landing Gateway & Dual-Identity Name Hero (Milestone 1). Added `GatewayController` with Vitest TDD suite (9 tests), `HeroNameDualIdentity` with 3D tilt and launch burst animations (5 tests), responsive gateway layout in `src/styles/gateway.css`, and `TactileAudioEngine` integration. Removed footer status and quick access UI per user direction to achieve an ultra-clean minimalist composition.
- `2026-11-05`: Upgraded JIMMY RUSS hero title to authentic Three.js 3D WebGL extruded mesh typography with specular bevels and mouse perspective tracking (`HeroName3D`, 5 new Vitest tests, total 25 passing tests). Stripped all diffuse background emitter boxes so strictly the physical letter mesh contours glow in phosphor green (`#00FF41` for Dev) and atmospheric sky (`#64B5F6` for Drone).
- `2026-11-05`: Aligned gateway hero typography with the exact dev site hero font (`var(--font-hero)`: `'Outfit-Schibsted-J'`, `'Outfit'`, 800 weight) with non-metallic architectural 3D extruded depth slabs and mouse-tracking perspective tilt, eliminating metallic reflections while maintaining razor-sharp letter-only phosphor green emission.
- `2026-11-05`: Enhanced 3D letterform depth to multi-layer volumetric physical extrusion slices with tangible matte side walls and resting isometric perspective (pitch 6deg, yaw -9deg), delivering bold tactile 3D block geometry while maintaining the exact dev site font and letter-contour-only emission. All 25 Vitest tests pass cleanly.
- `2026-11-05`: Transitioned Gateway Hero to a genuine Three.js WebGL solid 3D polygonal mesh (`HeroName3D`) with sharp un-beveled edges (`bevelEnabled: false`), continuous solid side walls, matte architectural finish (`metalness: 0.0`, `roughness: 0.88`), directional studio lighting, and exact ExtraBold 800-weight Outfit + Schibsted Grotesk typography via `outfit_hero.typeface.json`. Confined emission strictly to the solid 3D letters on hover. Fully responsive and verified across desktop and mobile.
- `2026-11-05`: Scaled up 3D hero letters to prominent heroic scale (`size: 1.65`, `depth: 0.44`) with responsive camera framing and expanded canvas height in `gateway.css` and `HeroName3D.ts`. Verified clean layout across desktop and mobile.
- `2026-11-05`: Redesigned gateway navigation and sound toggle to an ultra-minimalist typographical aesthetic. Replaced bulky boxed cards with clean borderless text links featuring animated hairline underlines (`#00FF41` for Dev, `#64B5F6` for Drone) and an inline borderless sound switch. All 25 Vitest tests pass cleanly.
- `2026-11-05`: Implemented per-frame color and emissive intensity lerping in `HeroName3D.ts` (smooth `emissive.lerp` and intensity easing in the WebGL render loop), eliminating binary state jumping for buttery smooth color transitions across idle, Dev, and Drone states.
- `2026-11-05`: Implemented Dev Boot Terminal Plan (Milestone 2). Created pure `DevBuildEngine` with kinematic compilation steps and Vitest suite (6 tests), fullscreen interactive `DevTerminalBoot` with keystroke/pointer compiler and skip functionality (7 tests), hardware-accelerated phosphor green blueprint laser sweep animation in `dev-terminal.css`, and persistent dockable `DevCliDrawer` with hotkey (\`), interactive commands (`help`, `status`, `switch`, `reboot`, `clear`), and telemetry status (8 tests, 46 total tests passing cleanly). Production build succeeds with 0 errors.
- `2026-11-05`: Eliminated the delayed view transition switch that caused the pause/abrupt jump when entering Dev mode. Dev mode is now activated immediately upon gateway launch so the user is directly on the Dev page; the terminal pretend commands stream above the hero, and upon completion the overlay fades away as the phosphor green laser beam visibly draws along `JIMMY`, then `RUSS` directly on `#wfHeroName` before smoothly materializing into solid text. All terminal UI is completely removed after the intro. All 34 tests pass cleanly.
- `2026-11-09`: Set the dev site background (`--bg-page`, scrollbar track, and `html`/`body`) to pure black (`#000000`) in `wireframe.css` and `intro-trace.css`. Confirmed all 35 tests pass cleanly and Vite live server is active on `http://localhost:5173`.
- `2026-11-09`: Adjusted hero outline tracing dynamics in `HeroOutlineTracer.ts`: reduced inter-letter stagger from 210ms down to a fluid 75ms cascade, increased individual stroke tracing duration from 1260ms to 2400ms, and tuned easing from snappy `(0.2, 0.9, 0.3, 1)` to steady `cubic-bezier(0.25, 0.1, 0.25, 1)`. All 35 tests pass cleanly and commit `20bec5c` pushed to remote.
- `2026-11-10`: Eliminated the delay where glowing green letters sat completed before fading. Root cause: cubic-bezier easing and a 5% length buffer caused closed loop outlines to visually finish at ~1,800ms while timers waited until 3,350ms (a 1.5s freeze). Resolved by: (1) setting exact stroke-dasharray length (`Math.ceil(length)`), (2) switching stroke animation to constant-speed `linear` tracing so strokes actively move right up to completion, (3) locking totalAnimTime to 2,280ms (60ms stagger + 1,800ms stroke), and (4) triggering immediate 250ms cross-fade with `!important` CSS overrides the millisecond the last stroke closes. Verified in live browser across time slices. All 35 tests pass and pushed to GitHub main.
- `2026-11-10`: Separated Landing Gateway and Dev Portfolio into distinct dedicated HTML pages:
  - `index.html`: Dedicated Landing Gateway powered by `src/landing.ts` featuring the 3D interactive hero title ("JIMMY RUSS"), audio switch `[M]`, and pathways (`01 // Dev & Game Systems` routing to `./dev.html`, `02 // Aerial Flight Ops`). Enhanced `HeroName3D.ts` with graceful WebGL fallback to keep DOM extruded 3D layers visible if hardware acceleration is unavailable.
  - `dev.html`: Dedicated Developer Portfolio page powered by `src/dev.ts`. Plays terminal boot stream + laser outline trace on entry, then smoothly materializes solid hero text and unlocks all project cards, chambers, and details. Includes top fixed navigation (`← GATEWAY` button returning to `./index.html`).
  - Multi-page Vite configuration in `vite.config.ts` (`rollupOptions.input` for `index.html` and `dev.html`).
  - Zero copy modifications; all placeholders preserved. All 35 Vitest tests pass cleanly and production build exits with code 0.
- `2026-11-10`: Resolved page transition flash, reload viewport jump, and landing hero 3D mouse tracking:
  - Eliminated browser navigation flash: added `<meta name="color-scheme" content="dark" />` and inline critical `#000000` background in `<head>` of both `index.html` and `dev.html`, added native `@view-transition { navigation: auto; }`, and added a 160ms `.page-is-exiting` fade-out on link clicks (`01 // Dev & Game Systems` and `← GATEWAY`).
  - Reload initial viewport: set `history.scrollRestoration = 'manual'` and instant `window.scrollTo(0, 0)` on script execution, `pageshow`, and `beforeunload` in `src/dev.ts` so reloading `dev.html` always starts right at the top hero terminal sequence.
  - Restored 3D hero mouse tracking on `index.html`: added `pointermove` and `pointerleave` listeners in `src/landing.ts` routing normalized coordinates to `HeroName3D` and `HeroNameDualIdentity`. All 35 tests pass and verified end-to-end via CDP.

## 5. Known Gotchas & Quirks
- `2026-11-06`: Diagnosed and resolved the hero outline tracing issue. Fixed the inline style override on `.intro-overlay.is-fading` with `opacity: 0 !important; visibility: hidden;` so the black overlay doesn't block the trace view. Resolved glyph fragmentation on `M`, `Y`, and `R` caused by overlapping TrueType component subpaths: performed 2D polygon boolean union to merge stems, bowls, and diagonal arms into unified single-contour vector silhouettes with zero internal seams or crossbars. Corrected `M`'s central join from an artificial point to Outfit ExtraBold's authentic flat horizontal apex and exact diagonal slope (`1.51` parallel inner/outer angles at top-inner `1047`/`1529` and leg-join `y=340.1`), and slowed down tracing duration (2.8s) and materialization cross-fade (1.2s) for a deliberate, cinematic transition. Implemented smooth in-place stream transition from landing page to terminal intro (eliminated 700ms click lag and removed fullscreen blackout curtain cut, streaming boot commands directly on the continuous dark canvas with clean upward dissolve into the laser trace). All 35 tests pass cleanly and `npm run build` exits 0.
- When modifying component logic in `src/components/`, always run `npm test` to prevent regressions in `PersonaController.test.ts`.
