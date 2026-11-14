# 05: Project stage lifecycle and live-site stages

**What to build:** Stages start as posters and load only on click. Photography Portfolio and AlcoveSite load their live GitHub Pages sites in an iframe with a visit link (phones: poster plus new-tab link); Drone Desktop shows an in-progress stage with a status slot. Only one stage is live at a time; minimize pauses/hides, close removes the iframe and reopening shows the poster.

**Blocked by:** 03

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] Click-to-load for the two live sites; nothing heavy loads before a click
- [ ] Loading a second stage returns the first to its poster
- [ ] Minimize pauses/hides; close removes the iframe completely
- [ ] Phones show poster plus open-in-new-tab link
- [ ] Each stage has a defined placeholder state; assets drop in without code changes
