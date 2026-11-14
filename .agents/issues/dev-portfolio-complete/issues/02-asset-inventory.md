# Take stock of each project's builds and media
Type: task
Status: resolved
Blocked by: none

## Question

For each of the four projects, what exists today: playable builds (and their platform), video captures, screenshots, live URLs, repos? HITL: the user lists them per project (checklist below); the answer records what exists, where it lives, and what is missing.

- [x] Kinematic Character Controller
- [x] Drone Desktop
- [x] Photography Portfolio
- [x] Music Studio Website

## Answer

Inventory as of 2026-11-12 (found on disk, confirmed by the user):

| Project | Source | Build / live | Media | Missing |
|---|---|---|---|---|
| Kinematic Character Controller | `~/Downloads/WebGLController`, Unity 6000.6.3, no git remote | WebGL build settings prepped (commit 2026-11-12), no WebGL build yet | Only temporary pipeline screenshots in `Temp/` | WebGL build, video capture, screenshots, public repo |
| Drone Desktop | `~/Downloads/DroneDesktop`, notes only | None: an offline drone flight-logbook PWA (React + Dexie) at the wireframe stage | None | Everything; the project isn't built yet |
| Photography Portfolio | GitHub `TheJungleJimRuss/Photography-Portfolio` (`~/Downloads/PhotographyPortfolio`) | Live on GitHub Pages: https://thejunglejimruss.github.io/Photography-Portfolio/ | 59 images (28 MB); 2 videos (`CATCAT.mp4`, `Puppy.mp4`) | Real videos (the 2 videos are stand-ins; all 59 photos are the user's own; the README's 5 Wikimedia credits are stale and no Wikimedia photos are on the site, confirmed by the user 2026-11-12) |
| Music Studio Website | "AlcoveSite", GitHub `TheJungleJimRuss/AlcoveSite` (`~/Downloads/AlcoveSite`), static HTML | Live on GitHub Pages: https://thejunglejimruss.github.io/AlcoveSite/ (user, 2026-11-12) | 4 images | Captures |

Facts later tickets depend on:
- Drone Desktop is the logbook PWA, not a ground control station; the card's placeholder description is outdated (the user rewrites the copy).
- Photography Portfolio and AlcoveSite have live, embeddable sites today. Nothing else has a build or real capture yet, so the stage decisions (05) need a placeholder plan for unbuilt projects.
