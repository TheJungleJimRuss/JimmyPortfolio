# Accessibility of the Desktop
Type: grilling
Status: resolved
Blocked by: 04, 08, 09

## Question

How is the Desktop (04) used without a mouse and with assistive tech: the keyboard model for icons, windows and the Taskbar (Tab order, arrow keys, shortcuts to cycle, minimize or close windows, Esc behaviour next to a focused KCC stage), focus placement when a window opens, closes or is restored, screen-reader roles (dialog vs region, live announcements), how the Boot shell (08) and the Outline trace (09) are presented to screen readers, and the reduced-motion version of window motion?

## Answer

Settled with the user, 2026-11-13:

- **Keyboard:** Tab through icons, windows and Taskbar; Enter opens; Esc closes the focused window, or first returns the keyboard from a focused KCC stage. Focus moves into a window on open and back to its icon on close. No extra shortcuts.
- **Screen readers:** each window is `role="dialog"` with `aria-modal="false"`, labelled by its title bar; the Taskbar is a toolbar with pressed state; open/close/restore is announced through one polite live region.
- **Reduced motion:** the Boot shell waits for input, then the Desktop simply appears. The Boot shell and Outline trace are `aria-hidden`, and one status line announces the Desktop is ready. Windows open and close without motion.

