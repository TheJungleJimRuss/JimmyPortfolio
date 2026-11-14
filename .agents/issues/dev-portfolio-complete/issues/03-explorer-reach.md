# Explorer reach: projects only or whole page
Type: prototype
Status: resolved
Blocked by: none

## Question

Should the File Explorer cover only the Projects section (Hero, About/Stack, Contact stay as scrolling sections) or the whole Dev portfolio after the Intro sequence (a desktop where About, Contact and Projects are folders/windows)? Resolve with two rough throwaway prototypes side by side, checked at phone and desktop widths, then the user picks.

## Answer

**B: the whole Dev portfolio is a desktop OS** (2026-11-12, user's pick). After the Intro sequence, the page is a desktop: Projects, About and Contact are desktop icons that open draggable windows (the projects window is a File Explorer with a sidebar and breadcrumbs), plus a taskbar listing open windows. The Hero name sits on the desktop. On phones, windows open full screen above the taskbar and cover the hero.

Rejected: A (explorer only in the Projects section of a scrolling page), C (the whole page as one full-screen explorer window).

Prototype (primary source): branch `prototype/explorer-reach`, file `prototype-explorer-reach.html`; run `npm run dev` and open `/prototype-explorer-reach.html?variant=B`. Never merge.
