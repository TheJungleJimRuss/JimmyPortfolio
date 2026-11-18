# 09: Outline trace draws the Desktop

**What to build:** After the Boot shell, the shell text fades and the Outline trace draws the whole arrival layout outside in (Taskbar and icons, File Explorer, Hero window frame, then the Hero name, which blooms as today) in about 3s, ignoring input. Window text fades in after each frame closes. Layout lock covers the whole Desktop until the bloom, then it re-lays out once. A deep-linked window opens after the bloom.

**Blocked by:** 02, 03, 08

**Status:** done

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [x] About 1.2s OS parts then about 1.8s name trace at constant `linear` speed
- [x] Phones trace Taskbar, full-screen Hero window frame and title bar, then the Stacked name
- [x] Identical for every arrival; input ignored during the trace
- [x] Reduced motion shows the finished Desktop with no trace
- [x] Captured at 375/768/1024 and landscape

## Notes

- Done 2026-11-14, uncommitted. Pure schedule in `src/components/DesktopTrace.ts` (`buildOsTrace`, `closedParts`, `shouldTrace`, constants `OS_TRACE_MS` 1200, `NAME_TRACE_MS` 1800, `TEXT_FADE_MS`), tests in `DesktopTrace.test.ts`; DOM adapter `DesktopTraceView.ts` draws a full-screen SVG from the live layout and marks `trace-done-<part>` on `#desktop`; `IntroSequenceController` takes a `desktopTrace` option and runs it before the name trace (`startTrace(NAME_TRACE_MS)`), with 4 new tests.
- Timing: desktop = Taskbar 0-400ms, icons 100-450, File Explorer 400-850, Hero window 800-1200; phone = Taskbar 0-500, Hero window 400-1200 (full-screen frame and title bar). Strokes use `pathLength=1`, CSS `linear`. Then the unchanged 1.8s name trace and bloom.
- CSS (`desktop.css`): `.is-tracing` makes window/Taskbar/icon chrome transparent and hides text until the part's `trace-done-*` class fades it in (280ms); `pointer-events: none` during the trace; `.dt-trace` hidden under reduced motion.
- `DesktopController.reveal()` now only reveals the Desktop (at the bloom start, with the single re-layout from the Layout lock release); the deep-linked window opens in `openDeepLink()`, called from the intro's `onFinish` after the bloom (checked: ~0.9s after reveal).
- Reduced motion skips the trace (`skipToEnd`), no `is-tracing` ever applied. Checked in the browser at 375, 768, 1024 and 812x375 (mid-trace and finished); no console errors.
- The Layout lock layout is read when the trace starts (`desktop.getState().layout`); strokes are measured once at their start, so a rotation mid-trace does not move them.
