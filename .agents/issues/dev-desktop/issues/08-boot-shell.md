# 08: Boot shell

**What to build:** A bare full-screen shell replaces the current terminal intro: flush top-left text, about 16px padding (10px phone, safe-area insets), about 14px font (12px phone), wrapping like a terminal, green on black with a faint glow. It waits at a prompt with a blinking block cursor and a hint line until any key, click or tap, then types the command out and prints output fast. A second input finishes the output and hands over to the trace. Every line is a user-written slot with a max length; current lines stay as placeholders.

**Blocked by:** None (can start immediately)

**Status:** done

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [x] Waits for input on every visit, no session memory
- [x] Typing then fast output; second input skips to the handover
- [x] Reduced motion: still waits, then all output at once
- [x] Structure fixed (prompt, N output lines, final line, hint) with max lengths documented

## Notes

- Done 2026-11-13, uncommitted. Pure logic in `src/components/BootShell.ts` (slots + max lengths `BOOT_MAX`, `validateBootLines`, `buildBootSchedule`, `nextPhase`), tests in `BootShell.test.ts`; DOM adapter `BootShellView.ts`; `IntroSequenceController` now waits at the prompt and drives the phases. `IntroCommandRunner` (+ test) deleted; `#introOverlay` in `dev.html` is now an empty `aria-hidden` shell filled by the adapter.
- Fixed structure: prompt prefix, command, exactly 4 output lines, final line, hint. Max lengths: prefix 32, command 60, output/final 90 each, hint 60. Current lines are placeholders; edit `DEFAULT_BOOT_LINES` in `BootShell.ts`.
- Timing: 45ms per command character, 220ms pause, 35ms per output row, 600ms hold, then 320ms fade into the unchanged trace/bloom.
- Decisions: output ending on its own hands over after the hold (no second input needed); reduced motion shows all output at once and waits for a second input before showing the Desktop; input is ignored once the trace starts; Layout lock now begins at the handover (not while waiting); key chords with Cmd/Ctrl/Alt do not start the shell.
