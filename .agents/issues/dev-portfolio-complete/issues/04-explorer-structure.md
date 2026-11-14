# File Explorer structure and behaviour
Type: grilling
Status: resolved
Blocked by: 03

## Question

03 settled that the whole Dev portfolio is a Desktop (prototype branch `prototype/explorer-reach`, variant B). How does it behave: desktop icons and the Hero name's place on the Desktop; window management (drag, resize, focus, minimize/close, one vs many open windows, what is open on arrival); the taskbar; inside the File Explorer, the folder hierarchy, what each project's folder contains and breadcrumb navigation; what opening a project does (an explorer pane vs its own window); back/URL/history and deep links; and phone behaviour (the prototype's full-screen windows cover the hero).

## Answer

Settled with the user, 2026-11-12:

- **Windows (desktop/tablet):** many can be open at once. Each can be dragged and brought to front, and has minimize, maximize and close. Sizes are fixed, with no resize handles.
- **Hero window:** the Hero name lives in its own ordinary window (drag, minimize, close). A "JIMMY RUSS" Desktop icon reopens it.
- **Desktop icons:** JIMMY RUSS (Hero window), Projects, About, Contact.
- **Arrival:** after the Intro sequence, the Hero window is in front and the Projects File Explorer is open with it.
- **File Explorer:** `~/projects` lists the four projects flat, with no category folders. Breadcrumbs stay shallow. The sidebar lists Desktop locations (Projects, About, Contact): Projects navigates the explorer, About and Contact open or focus their own windows (one layout each, never shown inside the explorer).
- **Opening a project:** opens that project's own Project window, holding the Project stage, summary, specs and deep dive. Several Project windows can be open side by side, and maximize gives a live stage the full Desktop.
- **Taskbar:** a button per open window (click focuses or restores it), a `← GATEWAY` exit that replaces today's top nav, and a clock. No start menu.
- **Deep links:** one project per URL (`dev.html#<project>`). The Intro sequence still plays (and waits for input); when the Desktop appears, that Project window is open. Browser Back closes the window the link opened.
- **Phones (< ~700px):** one window at a time fills the screen, like a phone OS. The taskbar switches between open windows, the Hero window acts as home, and there's no dragging.
- **Persistence:** none. Every visit starts from the arrival layout (plus the deep-linked project).

Prototype reference: branch `prototype/explorer-reach`, variant B (it differs from this answer: the hero is wallpaper there, and the sidebar lists projects).
