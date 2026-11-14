# Project stage medium for each project
Type: grilling
Status: resolved
Blocked by: 01, 02

## Question

For each of the four projects, what does its Project stage show (live embed, video, image gallery, or a mix), given the Unity embedding facts (01) and the assets that exist (02)? Includes the fallback when a medium can't load (e.g. phones, no WebGL).

## Answer

Settled with the user, 2026-11-12, using 01 (Unity web facts) and 02 (inventory):

| Project | Desktop / tablet | Phones | Until assets exist |
|---|---|---|---|
| Kinematic Character Controller | Poster → click loads the Unity WebGL 2 build in a same-origin iframe; the build ships in this site's `public/` | Gameplay video (also used when WebGL 2 is missing) | Poster slot + "coming soon" slot |
| Photography Portfolio | Poster → click loads https://thejunglejimruss.github.io/Photography-Portfolio/ in an iframe, plus a "visit site" link | Poster + "open live site" in a new tab | n/a (live) |
| Drone Desktop | In-progress stage: wireframe/spec visuals + a status slot the user writes; swaps to a live PWA iframe once built | Same in-progress stage | Poster slot + status slot |
| Music Studio Website (AlcoveSite) | Poster → click loads https://thejunglejimruss.github.io/AlcoveSite/ in an iframe, plus a "visit site" link | Poster + "open live site" in a new tab | n/a (live) |

Rules for every stage:
- **Load:** every stage starts as a still poster, and nothing heavy loads until the visitor clicks.
- **Keyboard (KCC):** keys reach the game only while the stage has focus (`captureAllKeyboardInput = false`). Esc or clicking outside returns the keyboard to the Desktop, and a small hint shows which one has it.
- **Minimize** pauses the stage (or hides the iframe); **close** removes the iframe completely, and reopening shows the poster again.
- **Placeholders:** each stage has a defined placeholder state, so the build doesn't wait for assets; assets drop in without code changes.
- Both GitHub Pages sites returned no `X-Frame-Options`/CSP frame blocking (checked 2026-11-12). Compression headers for the Unity build are left to the out-of-scope hosting effort.
