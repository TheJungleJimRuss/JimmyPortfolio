# 10: Accessibility pass

**What to build:** The Desktop is usable by keyboard and screen reader: Tab through icons, windows and Taskbar, Enter opens, Esc closes the focused window (or first leaves a focused KCC stage), focus moves into a window on open and back to its icon on close. Windows are non-modal dialogs labelled by title, the Taskbar is a toolbar with pressed state, one polite live region announces open/close/restore. Boot shell and trace are `aria-hidden` with one status line announcing the Desktop is ready; reduced motion removes window motion.

**Blocked by:** 03, 04, 06, 09

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] Full keyboard walk-through works without a mouse
- [ ] Roles and live region verified in the browser accessibility tree
- [ ] Boot shell and trace hidden from assistive tech; ready announcement present
- [ ] prefers-reduced-motion verified end to end
