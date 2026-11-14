# Unity 6 web build embedding for the KCC stage
Type: research
Status: resolved
Blocked by: none

## Question

What would embedding a Unity 6 (6000.x) web build of the Kinematic Character Controller in the Dev portfolio's Project stage take? Facts needed: typical build size and load time for a small scene (compression: Brotli/gzip, hosting headers), WebGL vs WebGPU target, mobile browser support and memory limits (iOS Safari especially), iframe vs direct canvas embedding (isolation, input capture, pointer lock, keyboard focus, pausing when off-screen), and how a Vite multi-page site serves the build files.

## Answer

Findings: branch `research/unity-web-embedding`, file `.agents/issues/dev-portfolio-complete/research/01-unity-web-embedding.md`. Facts only, gist:
- Size: no official figures. Unofficial Unity 6.0 + Brotli measurements: empty URP about 10.7 MB, heavily stripped about 2 MB; a KCC scene will be above that floor. The host must send `Content-Encoding` and the Wasm/JS content types. Brotli only over HTTPS in Chrome/Firefox. Decompression Fallback avoids headers but loads slower and leaks memory on `Quit()`.
- WebGL 2 is the only stable target; WebGPU is experimental in Unity 6.x.
- Mobile: officially iOS Safari 15+ / Android Chrome 58+, no memory floor. iOS kills the tab under memory pressure (soft cap about 1.5 GB). No pointer lock on iOS.
- Embedding: Unity captures all page keyboard input unless `captureAllKeyboardInput = false`. Pointer lock and fullscreen need a user gesture and iframe `allow` flags. Safari disables IndexedDB caching inside iframes. A same-origin iframe or canvas keeps rendering off-screen unless paused. `Quit()` releases memory unreliably.
- Vite: `public/` is served as-is, and Vite 6 sends the right headers for `.br`/`.gz` (read from source, not tested). The old `UnityChamber.ts` used a root-absolute `/unity-build/` path that breaks under `base: './'` (that file is deleted in the working tree).
- Unverified: Brotli on http://localhost, `vite preview` double compression, which iOS release fixed Wasm memory, current Firefox/Safari off-screen throttling.
