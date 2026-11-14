# 08: Boot shell

**What to build:** A bare full-screen shell replaces the current terminal intro: flush top-left text, about 16px padding (10px phone, safe-area insets), about 14px font (12px phone), wrapping like a terminal, green on black with a faint glow. It waits at a prompt with a blinking block cursor and a hint line until any key, click or tap, then types the command out and prints output fast. A second input finishes the output and hands over to the trace. Every line is a user-written slot with a max length; current lines stay as placeholders.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] Waits for input on every visit, no session memory
- [ ] Typing then fast output; second input skips to the handover
- [ ] Reduced motion: still waits, then all output at once
- [ ] Structure fixed (prompt, N output lines, final line, hint) with max lengths documented
