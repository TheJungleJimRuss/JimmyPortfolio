# Spec: Complete the Dev portfolio (the Desktop)
Status: ready-for-agent
Approval: waiting for the user's "Approved" before `/to-tickets`.
Map: `map.md` (every decision below traces to a resolved ticket in `issues/`).

Vocabulary follows `GLOSSARY.md`: Gateway, Dev portfolio, Hero name, Stacked name, Desktop, Taskbar, Hero window, File Explorer, Project window, Project stage, About window, Stack. Also used: **Boot shell** (the bare terminal before the trace) and **Outline trace** (the line drawing that builds the Desktop); both belong in the glossary when built.

## Problem Statement

The Dev portfolio is a scrolling page with placeholder project cards, About and Contact sections. It does not yet show the owner's four projects the way a developer's work should be shown: playable or browsable, in an OS-like space that fits the dev identity. Visitors on phones, keyboards and screen readers must still be able to use it, and heavy builds must not slow the first visit.

## Solution

After the Intro sequence the Dev portfolio is a **Desktop**: a dark OS-like surface (phosphor green `#00FF41` on black) with icons, draggable windows and a Taskbar. The Hero name sits in its own Hero window. A File Explorer lists the four projects; each opens its own Project window with a Project stage (live demo, live site or in-progress state) and a fixed set of write-up slots. About and Contact are their own windows. The Boot shell and Outline trace draw the Desktop in. Every text slot is the user's; each shows its `[ ... ]` marker until filled (AGENTS.md).

## User Stories

1. As a visitor, I want the Boot shell to wait for my input, so that I choose when the intro starts.
2. As a visitor, I want any key, click or tap to start the Boot shell, so that it works on every device.
3. As a visitor, I want the command line typed out and the output printed fast, so that the intro feels like a real boot without dragging.
4. As an impatient visitor, I want a second input to finish the output and go straight to the trace, so that I can skip the wait.
5. As a visitor, I want the Outline trace to draw the Desktop outside in and finish with the Hero name blooming, so that the arrival has a clear climax.
6. As a visitor, I want the trace to always play out (input ignored), so that the Desktop never appears half-built.
7. As a returning visitor, I want the intro on every visit with no memory, so that the experience is consistent.
8. As a visitor, I want the Hero window in front and the Projects File Explorer open on arrival, so that I see the owner and the work immediately.
9. As a visitor, I want Desktop icons for JIMMY RUSS, Projects, About and Contact, so that I can reopen anything I closed.
10. As a visitor, I want to drag windows and bring them to front by clicking, so that I can arrange the Desktop.
11. As a visitor, I want minimize, maximize and close on every window, so that it behaves like an OS.
12. As a visitor, I want windows at fixed sizes with no resize handles, so that layouts stay predictable.
13. As a visitor, I want several windows open at once, so that I can compare projects side by side.
14. As a visitor, I want a Taskbar button per open window that focuses or restores it, so that I never lose a window.
15. As a visitor, I want a `← GATEWAY` exit and a clock on the Taskbar, so that I can leave or orient myself.
16. As a visitor, I want the File Explorer to list the four projects flat at `~/projects` with icon, name and category badge, so that I can scan them.
17. As a visitor, I want breadcrumbs that stay shallow, so that I always know where I am.
18. As a visitor, I want the sidebar to offer Projects, About and Contact, so that I can switch places without the Desktop.
19. As a visitor, I want About and Contact from the sidebar to open or focus their own windows, so that they never replace the project list.
20. As a visitor, I want a click on a project to open its own Project window titled `~/projects/<slug>`, so that I can read it without leaving the list.
21. As a visitor, I want the Project stage on top and a scrolling column below, so that the work comes first.
22. As a visitor, I want maximize to give a live stage the whole Desktop, so that I can play or browse it large.
23. As a visitor, I want a Project stage to start as a poster and load only on click, so that nothing heavy loads unasked.
24. As a visitor, I want only one stage live at a time (the previous returns to its poster), so that my device stays fast.
25. As a visitor, I want a stage to pause on minimize and be removed on close, so that hidden stages cost nothing.
26. As a KCC visitor on desktop, I want the Unity build in the stage, so that I can play the controller.
27. As a KCC visitor, I want keys to reach the game only while the stage has focus, with Esc or an outside click returning the keyboard, and a hint showing who has it, so that the page is never trapped.
28. As a phone visitor, I want the KCC stage to show gameplay video (also where WebGL 2 is missing), so that I see it without a build that may crash my browser.
29. As a visitor, I want Photography Portfolio and Music Studio Website (AlcoveSite) to load their live sites in the stage plus a visit link, so that I can browse them in place.
30. As a phone visitor, I want those two to show a poster and an "open live site" link to a new tab, so that embedding limits don't hurt.
31. As a visitor, I want Drone Desktop to show an in-progress stage with a status slot, so that an unbuilt project is shown honestly.
32. As a visitor, I want optional slots to be hidden when a project has none (no Source link without a remote), so that nothing looks broken.
33. As a visitor, I want the Project window to hold controls notes, badge, title, tech tags, summary, Source and Live links, a spec list, a Deep dive and Challenges, so that I can judge the work in depth.
34. As a visitor, I want the About window (`~/about`) with heading, two bio paragraphs, the Stack groups and a copyright line, so that I learn who built this.
35. As a visitor, I want the Contact window (`~/contact`) with a call to action, a Copy email button with a "copied" toast, and GitHub and LinkedIn links, so that I can reach the owner.
36. As a visitor, I want deep links `dev.html#<project>`, `#about` and `#contact` to open that window after the bloom, so that I can share a specific project.
37. As a visitor, I want browser Back to close the window a deep link opened, so that Back behaves as expected.
38. As a phone visitor, I want one full-screen window at a time, the Hero window as home and the Taskbar to switch, so that it feels like a phone OS.
39. As a phone visitor, I want no dragging, so that touch scrolling is never fought.
40. As a keyboard user, I want Tab through icons, windows and Taskbar and Enter to open, so that I can use everything without a mouse.
41. As a keyboard user, I want Esc to close the focused window (or first leave a focused KCC stage), so that I can always back out.
42. As a keyboard user, I want focus to move into a window when it opens and back to its icon when it closes, so that I never lose my place.
43. As a screen reader user, I want each window announced as a non-modal dialog labelled by its title, and the Taskbar as a toolbar with pressed state, so that structure is clear.
44. As a screen reader user, I want open, close and restore announced politely once, so that I know what changed.
45. As a screen reader user, I want the Boot shell and trace hidden and one status line saying the Desktop is ready, so that decoration doesn't block me.
46. As a reduced-motion user, I want the Boot shell to wait for input then show all output at once and the finished Desktop with no trace and no window motion, so that nothing moves unexpectedly.
47. As a visitor on a slow connection, I want the Desktop's JS at or under 350 KB gzip before any stage loads, so that the first load is fast.
48. As the owner, I want every text slot to show its `[ ... ]` marker until I fill it, so that I keep control of all copy.
49. As the owner, I want a stage to have a defined placeholder state, so that assets drop in without code changes.

## Implementation Decisions

**Architecture (one pure seam, thin adapters):**
- A pure, DOM-free **Desktop state** module owns all window and stage logic. A DOM adapter renders it and forwards input, following the existing Policy + Adapter pattern (`ViewportLayoutPolicy` + `ViewportLayoutAdapter`).
- Layout mode (desktop/tablet vs phone, below about 700px) comes from the existing viewport layout publisher; Desktop state receives it as an input.

```ts
type WindowId = 'hero' | 'projects' | 'about' | 'contact' | `project:${string}`;
type StageState = 'poster' | 'loaded' | 'paused';
type StageMedium = 'unity-webgl' | 'iframe' | 'in-progress';

interface WindowState {
  id: WindowId;
  minimized: boolean;
  maximized: boolean;
  position: { x: number; y: number };   // ignored in phone mode
}

interface DesktopState {
  windows: WindowState[];               // order = z-order, last is front
  focused: WindowId | null;
  stages: Record<string, StageState>;   // key = project slug
  layout: 'desktop' | 'phone';
  announcement: string | null;          // polite live region text
}

type DesktopAction =
  | { type: 'arrive'; deepLink?: WindowId }       // after the bloom
  | { type: 'open'; id: WindowId }                // opens or focuses/restores
  | { type: 'focus'; id: WindowId }
  | { type: 'minimize' | 'maximize' | 'close'; id: WindowId }
  | { type: 'move'; id: WindowId; position: { x: number; y: number } }
  | { type: 'loadStage'; slug: string }
  | { type: 'setLayout'; layout: 'desktop' | 'phone' }
  | { type: 'back' };                             // closes the deep-linked window

declare function reduce(state: DesktopState, action: DesktopAction): DesktopState;
```

**Behaviour rules the reducer encodes:**
- Arrival layout: Hero window in front, Projects File Explorer open. A deep link opens that window as well, after the bloom.
- No persistence; every visit starts from the arrival layout.
- Many windows open at once on desktop/tablet; each draggable, with minimize, maximize and close; fixed sizes.
- Phone: exactly one window visible at a time; Hero window is home; opening another replaces the visible one; no moving.
- **One live stage:** `loadStage` sets that stage `loaded` and returns any other `loaded` stage to `poster`. Minimize sets a loaded stage to `paused`; restore resumes it. Close returns the stage to `poster` (iframe removed).
- Browser history: a deep link pushes no extra entry beyond the hash; Back closes the window it opened.
- Every open/close/restore sets `announcement`.

**Windows and content:**
- Windows: Hero (`JIMMY RUSS`), Projects (File Explorer, `~/projects`), About (`~/about`, about 560×640px, scrolls), Contact (`~/contact`, about 420×320px, no scroll), and one Project window per project (`~/projects/<slug>`).
- Desktop icons: JIMMY RUSS, Projects, About, Contact. The Taskbar has a button per open window, `← GATEWAY` (replaces the top nav) and a clock; no start menu.
- File Explorer: flat four projects (Kinematic Character Controller, Drone Desktop, Photography Portfolio, Music Studio Website); row = icon, name, category badge. Sidebar: Projects navigates; About and Contact open or focus their own windows.
- **Project window slots (all optional, hidden when empty), in order:** controls notes (≤120 chars, under the stage), category badge (one word), title (≤40), tech tags (≤5), summary (≤220 chars), links (Source, Live site; labels fixed), spec list (3–5 key/value rows), Deep dive (~150–300 words), Challenges (user-titled heading, ~150–300 words). Write-ups allow paragraphs, bullets, inline code and short code blocks; no images.
- **About slots:** heading (≤40), main bio (~60–120 words), secondary paragraph (~40–80 words), Stack (2–4 tag groups, label plus up to 6 tags), copyright line. No photo; Stack has no icon of its own.
- **Contact slots:** heading (≤40), call to action (≤200 chars), Copy email button (label is a slot; copies, shows a "copied" toast), GitHub link (github.com/TheJungleJimRuss), LinkedIn link (URL and label slots). No mailto.
- All text slots are the user's copy and show `[ ... ]` markers; nothing is written for them.

**Project stages:**

| Project | Desktop / tablet | Phones |
|---|---|---|
| Kinematic Character Controller | Poster, click loads Unity WebGL 2 build in a same-origin iframe | Gameplay video (also if WebGL 2 missing) |
| Photography Portfolio | Poster, click loads the live GitHub Pages site in an iframe, plus visit link | Poster plus new-tab link |
| Drone Desktop | In-progress stage (wireframe/spec visuals plus user-written status slot) | Same |
| Music Studio Website (AlcoveSite) | Poster, click loads the live GitHub Pages site in an iframe, plus visit link | Poster plus new-tab link |

- Every stage has a poster slot and a placeholder state so builds don't wait for assets.
- KCC keyboard: `captureAllKeyboardInput = false`; keys reach the game only while the stage has focus; Esc or an outside click returns the keyboard; a small hint shows which has it.
- Unity build served from the site's static assets using a path that works with the relative base; compression headers are a hosting concern (see Out of Scope).

**Intro:**
- **Boot shell:** bare full-screen shell, text flush top-left, about 16px padding (10px phone, plus safe-area insets), line height about 1.3, font about 14px (12px phone), wrapping like a terminal, `#00FF41` on black with a faint glow. Waiting state: prompt, blinking block cursor, one hint line. Any key, click or tap starts it. Command types out character by character, output prints fast. Structure is fixed (prompt line, N output lines, final line, hint); every line is a user-written slot with a max length; current lines stay as placeholders. A second input skips to the trace.
- **Outline trace:** shell text fades quickly, then the trace draws on clean black, outside in: Taskbar and icons, File Explorer (frame, title bar, sidebar, folder icons), Hero window frame, then the Hero name, which closes and blooms as today. About 3s total (about 1.2s OS parts, about 1.8s name at constant `linear` speed). Window text fades in after its frame closes. Input ignored. Identical for every arrival; a deep-linked window opens after the bloom with ordinary window-open motion. Phones trace the Taskbar, full-screen Hero window frame and title bar, then the Stacked name.
- **Layout lock** covers the whole Desktop: the layout chosen at trace start holds until the bloom, then the Desktop re-lays out once.

**Accessibility:**
- Keyboard: Tab through icons, windows and Taskbar; Enter opens; Esc closes the focused window, or first leaves a focused KCC stage; focus moves into a window on open and back to its icon on close. No extra shortcuts.
- Roles: windows are `role="dialog"` with `aria-modal="false"` labelled by the title bar; the Taskbar is a toolbar with pressed state; one polite live region announces open/close/restore.
- Reduced motion: Boot shell waits for input, then all output at once and the finished Desktop; no trace; no window motion. Boot shell and trace are `aria-hidden`; one status line announces the Desktop is ready.

**Budgets:**
- Desktop JS at most 350 KB gzip before any stage loads (Three.js tree-shaken and code-split); enforced as a build check.
- KCC build at most 15 MB Brotli; where the host cannot send `Content-Encoding`, use the gameplay video instead of Decompression Fallback.
- At most one live stage at a time.

**Retired:** the scrolling sections and `#viewDetail` page in the current Dev portfolio; "Key Constraints & Solvers" becomes the generic Challenges slot; the "Extra links" slot is dropped.

## Testing Decisions

- A good test drives the Desktop state through its actions and asserts the resulting state (what is open, in front, minimized, loaded, announced). It never asserts rendering details or internal helpers.
- **One seam:** `reduce(state, action)` on the pure Desktop state module, tested with Vitest. Cases: arrival layout; open/focus/restore; minimize/maximize/close; z-order; one-live-stage rule and its poster reset; pause on minimize and resume; close resets stage; phone mode one-window rule and Hero as home; deep-link arrival; Back closing the deep-linked window; announcements.
- Prior art: `ViewportLayoutPolicy.test.ts`, `HeroMotion.test.ts`, `PersonaController.test.ts`.
- Not unit-tested, verified in a real browser at 375, 768, 1024 and landscape phone with screenshots (AGENTS.md): rendering, drag, trace and bloom, Boot shell, keyboard and focus movement, screen-reader roles, reduced-motion, stage loading, the 350 KB budget check (`npm run build`).
- `npm run build` exits 0 and `npm test` passes; temporary files are removed.

## Out of Scope

- Writing any site copy, bios, project text or boot lines (the user writes them).
- Hosting, domain, SEO, deploy pipeline and server headers for the Unity build.
- Résumé/CV download.
- Dev-side audio (SFX, soundtrack hook).
- The Drone side and Gateway changes.
- Producing the Unity WebGL build, gameplay video, captures or the Drone Desktop app itself; stages ship with placeholder states.
- Window resizing, window-position persistence, start menu, extra Desktop icons or windows.

## Further Notes

- Prototype reference (never merge): branch `prototype/explorer-reach`, `prototype-explorer-reach.html` variant B. It differs from the decisions: there the hero is wallpaper and the sidebar lists projects.
- Research reference: `research/01-unity-web-embedding.md` on branch `research/unity-web-embedding`.
- Glossary additions to make when built: Boot shell, Outline trace, Layout lock (already defined by the mobile pass).
- Suggested slicing for `/to-tickets`: Desktop state seam; window chrome and Taskbar; File Explorer; Project window and slots; stage lifecycle per medium; About and Contact; Boot shell; Outline trace of the Desktop; deep links and history; accessibility pass; budget check.
