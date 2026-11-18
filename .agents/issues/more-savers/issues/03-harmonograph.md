# 03: Harmonograph saver

**What to build:** A pen on two or more damped pendulums draws a spiral that settles toward the centre; once its amplitude is small the drawing fades out and a new seeded set of pendulums begins. It is a pure, seeded `SaverMotion` plus a 2D-canvas `SaverRenderer` drawn in the visitor's Phosphor color, registered with one line in the saver layer, so choosing it in the Settings panel (or Random landing on it) shows it. Under reduced motion it runs at about a tenth of the pace with fades instead of cuts. Any input ends it with the layer's plain fade.

**Blocked by:** 01 (Kinds, Random and grouped saver list).

**Status:** ready-for-agent

- [ ] Vitest on the motion: same seed gives the same state; everything stays inside the viewport over thousands of steps and after a resize; state size stays bounded; calm runs at roughly a tenth of the pace
- [ ] Vitest: amplitude decays monotonically; a re-seed happens after the drawing settles and the new parameters differ from the old
- [ ] Renderer clears fully on resize (no smeared frames) and reads `--phosphor`; no static import from the Desktop entry
- [ ] `npm run build` passes with the Desktop budget flat; `npm test` passes; browser preview at 375 / 768 / 1440 in Green and Amber with CRT on, plus reduced motion, zero console errors, screenshots
