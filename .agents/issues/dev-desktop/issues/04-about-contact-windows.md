# 04: About and Contact windows

**What to build:** About window (`~/about`, about 560×640px, scrolls) with heading, main bio, secondary paragraph, 2–4 Stack tag groups and a copyright line; Contact window (`~/contact`, about 420×320px, no scroll) with heading, call to action, Copy email button with a "copied" toast, GitHub link and LinkedIn link. Opened from icons and the explorer sidebar.

**Blocked by:** 02

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] All slots show `[ ... ]` markers; limits per spec; no portrait photo, no mailto
- [ ] Copy email copies the address and shows the toast
- [ ] GitHub (new tab) and LinkedIn (URL/label slots, new tab) links work
- [ ] Windows behave like every other window, full-screen on phones
