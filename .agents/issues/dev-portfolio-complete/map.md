# Map: Complete the Dev portfolio
Label: wayfinder:map

## Destination

An approved, build-ready spec for the finished Dev portfolio (structure, File Explorer, per-project stages, every copy slot) that `/to-tickets` can slice. "Complete" means every slot exists and is sized; the user's own copy fills them separately.

## Notes

- Domain: the Dev portfolio (`dev.html`, `src/dev.ts`). Vocabulary from `GLOSSARY.md` (Dev portfolio, Hero name, Intro sequence, File Explorer, Project stage).
- Skills: `grilling` + `domain-modeling` for grilling tickets; `prototype` for prototype tickets; `modern-web-guidance` and `frontend-design:frontend-design` for any UI question.
- Standing preferences: never write copy, keep `[ ... ]` slots (AGENTS.md); phosphor green `#00FF41` on black, no digital rain or neon-glow tropes; must work at 375/768/1024 + landscape (mobile pass); specs use TS interfaces without bodies, wireframe outlines or Mermaid.
- Settled while charting (2026-11-12): projects are the current four (Kinematic Character Controller, Drone Desktop, Photography Portfolio, Music Studio Website); the File Explorer is still the plan; each Project stage picks its own medium; no extras beyond Hero, Projects, About/Stack, Contact; some project assets exist.

## Decisions so far

<!-- one line per closed ticket: [title](issues/NN-slug.md): gist -->

- [Unity 6 web build embedding for the KCC stage](issues/01-unity-web-embedding.md): feasible on WebGL 2 at roughly 2–10+ MB Brotli, with real costs: keyboard capture, no iOS pointer lock, iOS memory kills, unreliable unload.
- [Explorer reach: projects only or whole page](issues/03-explorer-reach.md): the whole Dev portfolio becomes a desktop OS (icons, draggable windows, taskbar); the projects window is the File Explorer.
- [File Explorer structure and behaviour](issues/04-explorer-structure.md): many draggable fixed-size windows; Hero window + Projects open on arrival; flat ~/projects; each project opens its own Project window; taskbar with GATEWAY; hash deep links after the intro; phones show one full-screen window at a time.
- [Boot terminal look and start trigger](issues/08-boot-terminal.md): bare full-screen shell, tight top-left text with a faint glow; waits for any key, click or tap; typed command then fast output; line text is user-written slots; a second input skips to the trace.
- [Outline trace draws the Desktop](issues/09-trace-draws-desktop.md): the shell clears, then about 3s outside in (Taskbar, icons, explorer, Hero window, Hero name blooms last); unskippable; deep-linked window opens after the bloom; Layout lock covers the whole Desktop.
- [Take stock of each project's builds and media](issues/02-asset-inventory.md): only Photography Portfolio is live (GitHub Pages); the KCC has no WebGL build yet; Drone Desktop is an unbuilt logbook PWA; Music Studio is AlcoveSite, live on GitHub Pages.
- [Project stage medium for each project](issues/05-stage-mediums.md): KCC loads the WebGL build on click (video on phones); Photography and AlcoveSite load their live sites in iframes (new tab on phones); Drone shows an in-progress stage; every stage is click-to-load, pauses on minimize and is removed on close.
- [Project detail view slots](issues/06-detail-slots.md): one shared, optional slot set; stage on top with a scrolling column (controls notes, badge, title, tags, summary, Source/Live links, 3–5 specs, Deep dive, Challenges) under tight length limits; title bar `~/projects/<slug>`.
- [About, Stack and Contact slots](issues/07-about-contact-slots.md): About window (`~/about`) holds heading, two bio paragraphs, 2–4 Stack tag groups and the © line; Contact window (`~/contact`) holds heading, call to action, Copy email, GitHub and LinkedIn; both deep-link (`#about`, `#contact`).
- [Load and performance budget](issues/10-load-budget.md): 1 live stage at a time; Desktop JS at most 350 KB gzip; KCC build at most 15 MB Brotli, otherwise video.
- [Accessibility of the Desktop](issues/11-desktop-accessibility.md): standard window keyboard pattern, windows as non-modal dialogs, boot/trace skipped and announced under reduced motion.

## Not yet specified

- **Approval**: `spec.md` is written (2026-11-13, `ready-for-agent`); it waits for the user's "Approved" before `/to-tickets`.

## Out of scope

- Hosting, domain, SEO and deploy pipeline: going live is a separate effort.
- Résumé/CV download: not wanted on the finished page.
- Dev-side audio (SFX, soundtrack hook): not part of this effort.
- Writing site copy: the user writes it; this map only sizes the slots.
- Drone side and Gateway changes.
