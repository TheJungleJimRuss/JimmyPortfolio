# 07: Deep links and Back

**What to build:** `dev.html#<project>`, `#about` and `#contact` open that window once the Desktop appears; browser Back closes the window the link opened.

**Blocked by:** 03, 04

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] Each hash opens the right window on arrival (the intro still plays and waits)
- [ ] Back closes the deep-linked window and adds no extra history entries
- [ ] Unknown hashes fall back to the ordinary arrival layout
