# 03: File Explorer and Project windows

**What to build:** The Projects window is a File Explorer at `~/projects` listing the four projects flat (icon, name, category badge) with a sidebar (Projects navigates; About and Contact open or focus their own windows) and shallow breadcrumbs. Opening a project opens its own Project window titled `~/projects/<slug>` with the 16:9 stage area on top and the scrolling slot column below (controls notes, badge, title, tags, summary, Source/Live links, spec list, Deep dive, Challenges), every slot optional and showing its `[ ... ]` marker.

**Blocked by:** 02

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] Four projects listed; click opens a Project window; several can be open side by side
- [ ] Slot order and limits follow the spec; empty optional slots do not render
- [ ] Stage area shows the poster placeholder only (loading comes in ticket 05)
- [ ] Maximize gives the window the full Desktop; works full-screen on phones
