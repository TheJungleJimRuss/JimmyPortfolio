# 02: Desktop shell with Taskbar and Hero window

**What to build:** After the intro, the Dev portfolio shows the Desktop: black surface with icons JIMMY RUSS, Projects, About, Contact, a Taskbar (button per open window, `← GATEWAY`, clock) and a draggable Hero window with minimize/maximize/close, rendered from the reducer. Phones show one full-screen window with the Taskbar switching. The old scrolling sections stop being shown.

**Blocked by:** 01

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] Icons reopen their windows; Taskbar buttons focus or restore; `← GATEWAY` replaces the top nav
- [ ] Hero window drags, fronts on click, fixed size, Hero name (Stacked name) renders inside
- [ ] Phone (< ~700px): one full-screen window, Hero window as home, no dragging
- [ ] Phosphor green on black, no rain or neon-glow tropes
- [ ] Browser-checked at 375/768/1024 and landscape with screenshots
