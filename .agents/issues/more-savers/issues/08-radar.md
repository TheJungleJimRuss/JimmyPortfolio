# 08: Radar saver

**What to build:** A circular scope with a rotating sweep arm and a fading wake; unlabeled blips drift slowly, brighten as the arm passes over them, then fade. No text anywhere. It is a pure, seeded `SaverMotion` plus a 2D-canvas `SaverRenderer` drawn in the visitor's Phosphor color, registered with one line in the saver layer, so choosing it in the Settings panel (or Random landing on it) shows it. Under reduced motion it runs at about a tenth of the pace with fades instead of cuts. Any input ends it with the layer's plain fade.

**Blocked by:** 01 (Kinds, Random and grouped saver list).

**Status:** ready-for-agent

- [ ] Vitest on the motion: same seed gives the same state; everything stays inside the viewport over thousands of steps and after a resize; state size stays bounded; calm runs at roughly a tenth of the pace
- [ ] Vitest: the arm angle advances at a steady rate and wraps; blips stay inside the scope circle; a blip's brightness peaks when the arm passes its bearing
- [ ] Renderer clears fully on resize (no smeared frames) and reads `--phosphor`; no static import from the Desktop entry
- [ ] `npm run build` passes with the Desktop budget flat; `npm test` passes; browser preview at 375 / 768 / 1440 in Green and Amber with CRT on, plus reduced motion, zero console errors, screenshots
