# 02: Viewport layout policy and root layout attribute

**What to build:** A pure viewport layout policy decides, from viewport facts, whether the Hero name is the Stacked name or the Single-line name, whether input is touch or mouse, and whether idle drift and tilt are allowed. It includes the Layout lock. A thin adapter on both pages publishes the decision on the root element and updates it live on rotate and resize. Nothing visual changes yet.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

Interface (from the spec):

```ts
type NameLayout = 'stacked' | 'single-line';
type InputMode = 'touch' | 'mouse';
interface ViewportFacts { width: number; height: number; coarsePointer: boolean; canHover: boolean; reducedMotion: boolean; }
interface LayoutDecision { nameLayout: NameLayout; inputMode: InputMode; idleDrift: boolean; tiltEnabled: boolean; }
interface ViewportLayoutPolicy { decide(facts: ViewportFacts): LayoutDecision; }
interface LayoutLock { lock(): void; release(): NameLayout; request(layout: NameLayout): NameLayout; }
```

- [ ] Table-driven tests: portrait phone → stacked; landscape phone → single-line; portrait iPad → stacked; landscape iPad → single-line; narrow desktop window (<~600px) → stacked
- [ ] Coarse pointer → touch input with idle drift; reduced motion → no drift and no tilt
- [ ] Layout lock tests: requests while locked return the locked layout; release returns the latest requested layout
- [ ] The root attribute updates live on both pages when the viewport rotates or resizes, or when the reduced-motion preference changes
- [ ] `npm run build` exits 0 and `npm test` passes
- [ ] Browser check at 375, 768 and 1024 widths (portrait and landscape): no horizontal overflow, zero console errors, screenshots attached
