# 10: Accessibility pass

**What to build:** The Desktop is usable by keyboard and screen reader: Tab through icons, windows and Taskbar, Enter opens, Esc closes the focused window (or first leaves a focused KCC stage), focus moves into a window on open and back to its icon on close. Windows are non-modal dialogs labelled by title, the Taskbar is a toolbar with pressed state, one polite live region announces open/close/restore. Boot shell and trace are `aria-hidden` with one status line announcing the Desktop is ready; reduced motion removes window motion.

**Blocked by:** 03, 04, 06, 09

**Status:** done

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [x] Full keyboard walk-through works without a mouse
- [x] Roles and live region verified in the browser accessibility tree
- [x] Boot shell and trace hidden from assistive tech; ready announcement present
- [x] prefers-reduced-motion verified end to end

## Notes

- Done 2026-11-14, uncommitted. Most of the pass already existed from tickets 03, 06, 08 and 09 (dialog roles with `aria-modal="false"`, toolbar with `aria-pressed`, `aria-hidden` boot shell and trace, reduced-motion CSS); verified in the browser and fixed the gaps.
- Pure logic with tests: `escapeAction` (leave a stage that owns the keyboard first, then close) and `closeFocusTargets` (icon, with Project windows returning to the Projects icon; Taskbar button on phone where icons are hidden) in `DesktopView.ts`; `reduce` now clears the announcement on every action (no-op actions still return the same state object), so each open/close/restore announces once and a repeat is still read.
- `DesktopController`: Esc handling uses `escapeAction`; `dispatch` announces through one `announce()` (live region cleared, then set after 60ms, so repeats are read), also used for `Desktop ready`; focus after close/Back goes through `closeFocusTargets`.
- Browser-checked (Playwright, dev server): Tab order icons, windows (title, controls, content), Taskbar; Enter opens and focus enters the window; Esc closes and focus returns to the icon (Taskbar button on phone); KCC iframe Esc returns the keyboard first, second Esc closes; roles in the accessibility tree; reduced motion (no trace, window and Taskbar animation none, `Desktop ready` announced) at 375, 768, 1024 and landscape 812x375.
- Decision: minimize announces nothing (not in the ticket). Taskbar and announcement labels for Project windows still use the slug (`windowLabel`), a copy decision left to the user.
- Amended 2026-11-14: while the KCC game owns the keyboard, plain Esc goes to the game (its own pause/menu); **Shift+Esc** (or clicking outside) hands the keyboard back, then Esc closes the window. Hint reads "Keyboard: game (Shift+Esc to leave)".
