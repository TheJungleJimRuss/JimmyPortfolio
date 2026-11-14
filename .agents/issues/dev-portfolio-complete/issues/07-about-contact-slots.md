# About, Stack and Contact slots
Type: grilling
Status: resolved
Blocked by: 03

## Question

What are the final About, Core Stack and Contact slots (headings, paragraphs, tag groups, contact links), given that 03 made About and Contact Desktop icons that open their own windows (what each window contains, and its size)?

## Answer

Settled with the user, 2026-11-12:

**About window** (title bar `~/about`, about 560×640px, scrolls). Slots in order:

| # | Slot | Limit |
|---|---|---|
| 1 | Heading | ≤ 40 chars |
| 2 | Main bio | ~60–120 words |
| 3 | Secondary paragraph (philosophy) | ~40–80 words |
| 4 | Stack: 2–4 tag groups, each a group label you name + up to 6 short tags | — |
| 5 | Copyright line (small, at the end of the scroll) | one line |

No portrait photo. The Stack lives here; there is no Stack icon or window.

**Contact window** (title bar `~/contact`, about 420×320px, fits without scrolling). Slots in order:

| # | Slot | Limit |
|---|---|---|
| 1 | Heading | ≤ 40 chars |
| 2 | Call to action | 1–2 sentences, ≤ 200 chars |
| 3 | Copy email button (copies the address, shows a "copied" toast; button label is a slot) | — |
| 4 | GitHub profile link (github.com/TheJungleJimRuss, new tab) | — |
| 5 | LinkedIn profile link (URL and label are slots, new tab) | — |

No mailto link.

**Both windows:** open from their Desktop icons and the File Explorer sidebar; draggable, minimize/maximize/close like every window; full screen on phones. Deep links `dev.html#about` and `dev.html#contact` follow the Project window rules (the Intro sequence plays, then the window is open; Back closes it). Every text slot is the user's and shows its `[ ... ]` marker until filled.
