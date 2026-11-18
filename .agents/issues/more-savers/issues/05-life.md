# 05: Life saver

**What to build:** The Hero name's letters, from a small hand-authored cell bitmap (no DOM text), become live cells on a grid sized so the name spans most of the width, and run under Conway's rules. When the board stalls (no change or a short repeat) or after about 60 seconds, it fades and re-seeds from the name. Calm mode steps at most once every few seconds. It is a pure, seeded `SaverMotion` plus a 2D-canvas `SaverRenderer` drawn in the visitor's Phosphor color, registered with one line in the saver layer, so choosing it in the Settings panel (or Random landing on it) shows it. Under reduced motion it runs at about a tenth of the pace with fades instead of cuts. Any input ends it with the layer's plain fade.

**Blocked by:** 01 (Kinds, Random and grouped saver list).

**Status:** ready-for-agent

- [ ] Vitest on the motion: same seed gives the same state; everything stays inside the viewport over thousands of steps and after a resize; state size stays bounded; calm runs at roughly a tenth of the pace
- [ ] Vitest: generation 0 equals the name pattern; a blinker oscillates and a block stays still; stall detection or the ~60s cap triggers a re-seed back to the name
- [ ] Renderer clears fully on resize (no smeared frames) and reads `--phosphor`; no static import from the Desktop entry
- [ ] `npm run build` passes with the Desktop budget flat; `npm test` passes; browser preview at 375 / 768 / 1440 in Green and Amber with CRT on, plus reduced motion, zero console errors, screenshots
