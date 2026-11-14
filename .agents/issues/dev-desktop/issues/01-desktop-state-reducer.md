# 01: Desktop state reducer

**What to build:** A pure, DOM-free Desktop state module that owns all window and stage logic, driven by actions and fully covered by Vitest tests. Demoable through its tests alone.

**Blocked by:** None (can start immediately)

**Status:** done (2026-11-13, uncommitted)

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [x] Arrival layout: Hero window in front, Projects File Explorer open; a deep-linked window opens too
- [x] open / focus / restore, minimize, maximize, close and z-order behave as in the spec
- [x] One-live-stage rule: loading a stage returns any other loaded stage to poster; minimize pauses, restore resumes, close resets to poster
- [x] Phone layout shows exactly one window, Hero window is home, no moving
- [x] `back` closes the deep-linked window; every open/close/restore sets an announcement
- [x] Tests drive actions and assert state only (prior art: ViewportLayoutPolicy.test.ts)
