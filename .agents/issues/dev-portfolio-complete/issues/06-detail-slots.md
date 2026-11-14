# Project detail view slots
Type: grilling
Status: resolved
Blocked by: 04

## Question

What text and data slots does a project's detail view carry (title, summary, specs list, controls notes, deep dive, constraints, links), are they the same for all four projects or per-project, and how long is each slot? They render inside the project's own Project window (04), which can be maximized; on phones it fills the screen.

## Answer

Settled with the user, 2026-11-12:

- **One shared slot set for all four projects; every slot is optional.** An empty slot doesn't render (e.g. no controls notes for Photography, no Source link while the KCC has no remote).
- **Layout:** the 16:9 Project stage sits on top; below it one column scrolls inside the window (the same on phones and when maximized).
- **Title bar:** `~/projects/<slug>`, matching the File Explorer breadcrumbs and the `dev.html#<slug>` deep link.
- **Column order and limits:**

| # | Slot | Limit |
|---|---|---|
| 1 | Controls notes (under the stage) | ≤ 120 chars |
| 2 | Category badge | one word |
| 3 | Title | ≤ 40 chars |
| 4 | Tech tags | up to 5 short tags |
| 5 | Summary | 1–2 sentences, ≤ 220 chars |
| 6 | Links: Source (GitHub), Live site | label fixed by the build; each hidden when absent |
| 7 | Spec list | 3–5 key/value rows |
| 8 | Deep dive (heading + body) | ~150–300 words |
| 9 | Challenges (heading you title per project + body) | ~150–300 words |

- **Write-up format (8, 9):** paragraphs, bullet lists, inline code and short code blocks. No images.
- **File Explorer row:** icon, project name and category badge only; the summary waits for the Project window.
- Replaces today's `#viewDetail` slots: "Key Constraints & Solvers" becomes the generic Challenges slot; "Extra links" was not wanted.
- All slot text is the user's; until filled, each shows its `[ ... ]` marker.
