# Spec: Mobile compatibility pass

Status: ready-for-agent
Created: 2026-11-11 (from a grill-with-docs session; terms per `GLOSSARY.md`)

## Problem Statement

The Gateway and the Dev portfolio are built for a desktop with a mouse and keyboard. On a phone or tablet:

- the Hero name is wider than the screen;
- the Gateway's 3D hero only reacts while a finger is dragging, and its hover glow never appears;
- the Intro sequence's boot log and Outline trace overflow narrow screens;
- some content blocks are too tall for a phone, and the layout doesn't account for collapsing browser bars or the notch;
- the intro tick sounds may stay silent on iOS.

So visitors on phones and tablets get a broken first impression.

## Solution

Phones and tablets, in portrait and landscape, get the same identity and the same signature moments as desktop, adapted for touch:

- In portrait or narrow viewports the Hero name becomes the **Stacked name** (JIMMY over RUSS) on both pages, including the Gateway's 3D mesh, the CSS fallback hero and the Outline trace.
- On touch devices the 3D hero tilts with a finger drag and sways slowly when idle.
- A tap on a pathway navigates at once, and the Dev glow plays while the finger is down.
- The Intro sequence keeps its full timing, scaled to fit. Its layout is held by **Layout lock** until the hero materializes.
- Landscape phones are fully supported, using dynamic viewport units and safe-area insets.
- Reduced-motion preferences are respected everywhere.
- Unused components and dead layout CSS are removed first, so the pass touches only live code.

## User Stories

1. As a phone visitor, I want the Hero name to fit my screen without horizontal scrolling, so that the first impression isn't broken.
2. As a portrait phone visitor, I want the name stacked as JIMMY over RUSS, so that the letters stay large and legible.
3. As a landscape phone or tablet visitor, I want the Single-line name, so that it uses the wide space well.
4. As a phone visitor on the Gateway, I want the 3D Hero name stacked too, so that the identity matches the Dev portfolio.
5. As a touch visitor on the Gateway, I want to drag my finger to tilt the 3D name, so that I get the same tactile play as mouse users.
6. As a touch visitor who isn't touching the screen, I want the 3D name to sway gently, so that it still feels alive.
7. As a touch visitor, I want the hero to ease back to idle when I lift my finger, so that it doesn't freeze at an odd angle.
8. As a touch visitor, I want one tap on "01 // Dev & Game Systems" to go straight to the Dev portfolio, so that I'm never confused by double-tap behavior.
9. As a touch visitor, I want the Dev glow on the hero while my finger is pressed on the Dev pathway, so that I still see the effect.
10. As a touch visitor, I want the pathways' hairline underline feedback on press instead of a sticky hover, so that styles don't stay stuck after navigating back.
11. As a touch visitor, I want the sound switch to be a comfortable tap target, so that I can enable audio without zooming.
12. As a touch visitor, I want the audio hint visible without hover, so that I know the sound switch exists.
13. As a keyboard visitor on desktop, I want the D/F/M hotkeys to keep working, so that nothing regresses.
14. As a phone visitor entering the Dev portfolio, I want the full boot log and Outline trace, so that I get the signature intro.
15. As a phone visitor, I want each boot log line on one row with the font shrunk to fit, so that it reads like a real terminal.
16. As a phone visitor, I want the Outline trace to match the Stacked name exactly, so that the materialized hero lands where the outline was drawn.
17. As a visitor who rotates mid-intro, I want the layout held until the hero materializes, so that the trace never breaks or restarts.
18. As a visitor who rotated during the intro, I want the hero to switch to the right layout once it has materialized, so that it fits the new orientation.
19. As a visitor who rotates after the intro, I want the hero to switch layout immediately, so that it always fits.
20. As an iOS visitor who taps to start the intro, I want the intro tick and bass tones to play when audio is on, so that sound works on Safari.
21. As a landscape phone visitor, I want the intro, hero and nav sized to the visible viewport, so that nothing hides behind browser bars.
22. As a visitor on a notched phone in landscape, I want content kept out of the notch and home-indicator areas, so that nothing is clipped.
23. As a phone visitor, I want the fixed "← GATEWAY" nav clear of the safe area and easy to tap, so that I can always get back.
24. As a phone visitor, I want project cards in a single column with sensible thumbnail heights, so that browsing is comfortable.
25. As a phone visitor, I want the demo viewport not to force a 420px minimum height, so that it doesn't dominate the screen.
26. As a touch visitor, I want card hover effects only on devices that can hover, so that taps don't leave cards stuck in a hover state.
27. As a tablet visitor, I want layouts that use the extra width without stretching the phone layout, so that tablets feel designed for.
28. As a visitor with reduced motion enabled, I want the 3D hero to sit still (no idle sway, no tilt), so that motion doesn't bother me.
29. As a visitor with reduced motion enabled, I want the Gateway entrance and hover transitions reduced to simple fades, so that the site stays comfortable.
30. As a visitor with reduced motion enabled, I want the Intro sequence to keep skipping to the end, so that existing behavior holds.
31. As a phone visitor, I want the 3D hero to render efficiently, so that battery and frame rate stay reasonable.
32. As a phone visitor without WebGL, I want the CSS fallback hero stacked and tilting with touch the same way, so that the fallback stays on par.
33. As the site owner, I want unused components and dead CSS removed, so that the codebase only contains what visitors see.
34. As the site owner, I want all copy left untouched, including "CLICK OR PRESS ANY KEY", so that the wording stays mine.
35. As the site owner, I want desktop behavior unchanged, so that the mobile pass doesn't regress what's already polished.

## Implementation Decisions

- **Order of work**: delete dead code first. That means Hero3DScene, UnityChamber, TiltSpotlightCards, CollideSlideSandbox and the unreferenced rules in the layout stylesheet. Confirm each one is unreferenced by both entry pages and by `vite.config.ts` inputs before deleting.
- **New module: viewport layout policy.** It is pure, with no DOM access. It takes viewport facts and returns layout decisions, and it is the single new test seam. Its shape:

  ```ts
  type NameLayout = 'stacked' | 'single-line';
  type InputMode = 'touch' | 'mouse';

  interface ViewportFacts {
    width: number;
    height: number;
    coarsePointer: boolean;   // (pointer: coarse)
    canHover: boolean;        // (hover: hover)
    reducedMotion: boolean;   // (prefers-reduced-motion: reduce)
  }

  interface LayoutDecision {
    nameLayout: NameLayout;
    inputMode: InputMode;
    idleDrift: boolean;
    tiltEnabled: boolean;
  }

  interface ViewportLayoutPolicy {
    decide(facts: ViewportFacts): LayoutDecision;
  }

  interface LayoutLock {
    lock(): void;                                  // at Intro sequence start
    release(): NameLayout;                         // at hero materialization; returns layout to apply
    request(layout: NameLayout): NameLayout;       // returns the effective layout (locked or requested)
  }
  ```

- **Stacked name rule**: stacked when the viewport is portrait (height > width) or narrower than about 600px. Otherwise single-line. The policy owns the exact threshold.
- **A thin DOM adapter** reads media queries and viewport size, calls the policy, and publishes the decision as a data attribute on the root element. CSS keys off that attribute, and the components subscribe to changes.
- **Gateway 3D hero (HeroName3D)**:
  - It accepts a layout. Stacked means two text meshes with line spacing, and `updateCameraDistance()` frames the two-line bounding box.
  - Inputs: pointer-driven tilt for mouse; touch-drag tilt plus idle drift for touch. It eases back to idle on release.
  - Reduced motion disables tilt and drift.
  - Resizing moves from a window resize listener to a ResizeObserver on the canvas container.
  - On coarse pointers the pixel ratio is capped lower than desktop.
- **CSS fallback hero (HeroNameDualIdentity)** mirrors the same layout and inputs.
- **Gateway interaction (GatewayController / landing)**:
  - Branch glow is driven by pointer events (`pointerdown`/`pointerup`/`pointercancel` plus `pointerenter`/`pointerleave` for mouse), not mouse-only events.
  - A tap navigates on release with the existing 160ms exit fade.
  - All hover-only CSS moves under `@media (hover: hover)`.
  - The audio hint is visible by default on non-hover devices.
  - The sound switch and pathway links get at least 44px touch targets.
  - Hotkeys are unchanged.
- **Dev portfolio hero and Outline trace**:
  - A second, stacked SVG outline layout of the boolean-unioned glyph paths is added alongside the single-line one.
  - The existing trace math (exact lengths, CTM-scaled dasharray, linear timing, 50ms cascade) applies to whichever layout is active.
  - The SVG sizing mismatch is fixed: CSS aspect ratio vs the viewBox, and a minimum width wider than a 375px content area.
  - The hero text and trace scale to fit the content width.
- **Layout lock (IntroSequenceController)**:
  - The layout is locked when the Intro sequence starts and released at hero materialization.
  - Any layout change requested while locked is applied on release.
  - Reduced-motion skip releases immediately.
- **Boot log**: monospace font size scales so the longest line fits on one row (no wrapping, no copy changes).
- **Audio unlock**: the intro overlay's `pointerdown` resumes TactileAudio's AudioContext inside the gesture. Timer-driven ticks then play on iOS.
- **Viewport and safe areas**:
  - Both pages get `viewport-fit=cover`.
  - Full-height sections use `dvh`, with a `vh` fallback.
  - The fixed nav, gateway padding and intro overlay respect `env(safe-area-inset-*)`.
- **Dev layout**: the demo viewport's minimum height is relaxed on small viewports, and the project thumbnail height is tuned for phones. The tablet breakpoint keeps the existing 860px grid collapse, and the policy's thresholds stay consistent with it.
- **Reduced motion**: it covers the Gateway entrance, gateway hover transitions and the HeroName3D render loop (static frame), on top of what is already covered.
- **Palette and type are unchanged.** No new glow tropes.

## Testing Decisions

- **What a good test is**: it asserts external behavior through a module's public interface (layout decisions, emitted states, which mesh layout is built, whether drift runs). It doesn't reach into private fields or frame-by-frame internals.
- **Viewport layout policy** (new suite): table-driven cases covering
  - portrait phone → stacked; landscape phone → single-line; portrait iPad → stacked; landscape iPad → single-line; narrow desktop window → stacked;
  - coarse pointer → touch input + idle drift; reduced motion → no drift, no tilt;
  - Layout lock: requests while locked return the locked layout; release returns the latest requested layout.
- **HeroName3D** (existing suite): with a stacked layout it builds two line meshes; touch input enables drag tilt and idle drift; reduced motion disables both.
- **IntroSequenceController** (existing suite): layout is locked from start to materialization; a mid-intro layout change applies on release; overlay `pointerdown` triggers the audio resume.
- **GatewayController** (existing suite): pointer press on the Dev pathway sets the dev glow state, and release or cancel clears it. Hotkeys still work.
- **Visual fit** is not unit-tested. It is verified in the browser (`web-runtime-verification`) at 375, 768 and 1024 widths, portrait and landscape, with zero horizontal overflow and zero console errors, plus Mobile Safari in the iOS Simulator for dvh, safe areas, touch and audio unlock. Screenshots go in the PR.
- Prior art: the existing Vitest suites listed above, especially `HeroOutlineTracer.test.ts` and `IntroSequenceController.test.ts` for timing and state assertions.
- Gates: `npm run build` exits 0; `npm test` passes; temporary mocks are cleaned up.

## Out of Scope

- Drone side pages, drone hover effect, transmitter takeoff and topographic cards (separate vision items).
- Dev projects File Explorer (not built yet; it should be built mobile-ready when it is).
- Gyroscope/device-orientation tilt.
- Any copy changes, including a touch-specific intro prompt.
- Soundtrack integration.
- Foldables and viewports under 360px beyond "no overflow".

## Further Notes

- The stacked Outline trace must keep the glyph rules in the project notes: boolean-unioned M/Y/R contours, flat M apex, exact lengths. The +30-unit Y kerning shift applies only to the single-line layout; the stacked layout needs its own JIMMY line spacing checked against the solid text.
- A good first ticket is the dead-code deletion, then the policy module, because both are independent of the visual work.
