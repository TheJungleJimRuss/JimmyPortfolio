# 09: Outline trace draws the Desktop

**What to build:** After the Boot shell, the shell text fades and the Outline trace draws the whole arrival layout outside in (Taskbar and icons, File Explorer, Hero window frame, then the Hero name, which blooms as today) in about 3s, ignoring input. Window text fades in after each frame closes. Layout lock covers the whole Desktop until the bloom, then it re-lays out once. A deep-linked window opens after the bloom.

**Blocked by:** 02, 03, 08

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] About 1.2s OS parts then about 1.8s name trace at constant `linear` speed
- [ ] Phones trace Taskbar, full-screen Hero window frame and title bar, then the Stacked name
- [ ] Identical for every arrival; input ignored during the trace
- [ ] Reduced motion shows the finished Desktop with no trace
- [ ] Captured at 375/768/1024 and landscape
