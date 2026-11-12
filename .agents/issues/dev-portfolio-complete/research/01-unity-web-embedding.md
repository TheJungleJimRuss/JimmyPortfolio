# Research: embedding a Unity 6 web build in the Project stage

Ticket: `.agents/issues/dev-portfolio-complete/issues/01-unity-web-embedding.md`
Researched: 2026-11-12. Facts only, no design decision.

Unity's manual moved from `docs.unity3d.com/<ver>/Documentation/Manual/...` to `docs.unity.com/en-us/engine/<ver>/manual/...` (old URLs return a 301). The URLs below are the new ones. "6000.0" means Unity 6.0, "6000.3" is 6.3 LTS, and "6000.6" is 6.6, which is the "Current" manual as of this date.

---

## 1. Build size, load time, compression, headers

### What a build contains
A Web build's `Build/` folder holds `<name>.loader.js`, `<name>.framework.js` (the JS runtime and plug-ins), `<name>.wasm`, and `<name>.data` (assets and scenes). It can also hold `.symbols.json` (only with Debug Symbols), `.mem` (only for multithreaded builds) and `.jpg` (only with a splash image). With compression on, file names get a `.gz` or `.br` suffix, or `.unityweb` when Decompression Fallback is on. [Web Build folder (6000.0)](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/building-distribution/building)

### Typical size: no official figure
- Unity's own size pages give no MB numbers. They list levers instead: Strip Engine Code, `Enable Exceptions: None`, Crunch or ASTC textures, no development builds, and Code Optimization "Disk Size with LTO". [Distribution size and code stripping](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/building-distribution/distributionsize-codestripping), [Optimize for mobile](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/building-distribution/web-optimization-mobile)
- The best measured data point is a personal gist by Aras Pranckevičius (long-time Unity graphics engineer), on Unity 6.0.23 (Oct 2024) with Brotli. It is not official Unity documentation. [gist](https://gist.github.com/aras-p/740c2d4f9977ce92b7de72b1394dd365)
  - Untouched default 3D URP template, empty: **10.7 MB** (3.7 MB data, 6.9 MB code)
  - 2D Built-in RP: 7.7 MB
  - Splash off and packages removed: 6.9 MB
  - Higher stripping level: 4.8 MB
  - Also removing Input System and Unity UI: 2.3 MB
  - Plus "Disk Size with LTO": **2.0 MB** (0.4 MB data, 1.5 MB code)
- Implication for a KCC demo: it needs a 3D scene, a character, input and probably URP, so it starts above the empty floor. The 2 MB result depends on removing the Input System and UI, which a playable controller demo likely uses. The real number has to come from the Build Report on the actual project (see the `unity-build-size` skill).
- Runtime memory is separate from download size. A forum user reports about 200 MB of memory for a stripped, empty Unity 6 release build. That is a community report, not verified. [Unity Discussions](https://discussions.unity.com/t/web-build-memory-consumption-on-unity-6/1613334)

### Load time
- Unity gives no absolute figure for a small scene. Its only official numbers are a case study (*Ready, Set, Cook!*). Load fell from 12 s to 5.5 s at 48 Mbps and from 6.1 s to 3.6 s at 176 Mbps after runtime improvements, and a 25 % drop in load time came with 50 % more active sessions. [Unity blog, Nov 2023](https://unity.com/blog/engine-platform/web-runtime-updates-enhance-browser-experience)
- Load time covers more than the download: WebAssembly compile, `.data` decompression and parsing, and the first scene load. The manual's "Show Diagnostics Overlay" (Publishing Settings) reports "Page Load Time to First Frame", total WASM heap and FPS. `performance.memory` works only in Chrome and Edge, not on iOS. [Web Player settings](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/class-player-settings-web-gl)
- With **Data Caching**, `.data` (and AssetBundles) are stored in IndexedDB, so repeat visits skip the download. A `cacheControl(url)` hook in the template returns `must-revalidate`, `immutable` or `no-store`. [Caching in Web](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/caching)
- The manual adds that "Apple Safari doesn't support IndexedDB for content running in an iFrame". [Browser compatibility](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/intro/browsercompatibility)

### Compression options [Deploy Web application](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/building-distribution/deploying)

| Option | Facts from the manual |
|---|---|
| **Gzip** | Default. Bigger than Brotli but faster to build. Decoded natively by all browsers over HTTP and HTTPS. |
| **Brotli** | Best ratio, slowest to build. "Chrome and Firefox only natively support Brotli compression over HTTPS." |
| **Disabled** | For your own post-processing, or when the host compresses statically. |

- The setting applies only to release builds. Development builds are never compressed.
- **Decompression Fallback** (off by default) embeds a JS decompressor for hosts whose headers you can't set. Files get a `.unityweb` suffix. It gives "a large loader size and a less efficient loading scheme", and WebAssembly streaming compilation doesn't work with it.
- A Unity issue-tracker entry says memory is not released after `Quit()` when fallback is on, marked Won't Fix. [Issue tracker](https://issuetracker.unity3d.com/issues/webgl-players-memory-is-not-released-when-calling-quit-function-on-unity-instance-with-decompress-fallback-enabled)

### HTTP headers the host must send
From [Deploy Web application](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/building-distribution/deploying) and the [Apache samples](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/building-distribution/server-configuration-code-samples/web-server-config-apache):

| Files | Header |
|---|---|
| `*.gz` | `Content-Encoding: gzip` |
| `*.br` | `Content-Encoding: br` |
| `.wasm`, `.wasm.gz`, `.wasm.br` | `Content-Type: application/wasm` (needed for streaming compilation) |
| `.js`, `.js.gz`, `.js.br` | `Content-Type: application/javascript` |
| `.data.br`, `.symbols.json.*` | `Content-Type: application/octet-stream` |
| `.data.gz` | `Content-Type: application/gzip` (a workaround for [WebKit bug 247421](https://bugs.webkit.org/show_bug.cgi?id=247421); octet-stream would be the correct type) |
| `.unityweb` (fallback builds) | Optional `Content-Encoding` matching the compression method |

- `Cross-Origin-Opener-Policy: same-origin`, `Cross-Origin-Embedder-Policy: require-corp` and `Cross-Origin-Resource-Policy: cross-origin` are needed **only** if "Enable Native C/C++ Multithreading" is on. That setting is experimental, and Unity recommends leaving it off. C# threads are not supported on Web at all. [Technical overview](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/intro/technical-overview), [Player settings](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/class-player-settings-web-gl)
- The samples also add `Access-Control-Allow-Origin: *`, which matters only when build files load from another origin.

---

## 2. WebGL 2 vs WebGPU in Unity 6

- **WebGL 2 is the default.** "Auto Graphics API" enables WebGL 2.0, and the Unity 6.6 manual calls it the "Default API, widely accepted by most browsers". Unity Web content requires WebGL 2, WebAssembly and a 64-bit browser. [Player settings](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/class-player-settings-web-gl), [Compare WebGPU and WebGL2 (6000.6)](https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/develop/graphics/web-graphics-apis-intro), [Browser compatibility](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/intro/browsercompatibility)
- **WebGPU is experimental in Unity.**
  - Unity 6.0's Player settings page doesn't mention it. Public experimental access arrived with Unity 6.1. [Unity Discussions announcement](https://discussions.unity.com/t/public-access-to-webgpu-experimental-in-unity-6-1/1572462)
  - The 6.3 LTS manual titles the section "WebGPU (Experimental)" and says it "is currently experimental and not supported by all browsers and devices". It lists limitations including compute shaders, GPU readback, texture formats, terrain, fonts, GI, video and shader variants. Async compute, dynamic resolution and cubemap arrays are not supported. [WebGPU limitations (6000.3)](https://docs.unity.com/en-us/engine/6000.3/manual/platform-specific/webgl/develop/graphics/web-gpu/limitations)
  - The 6.6 manual describes WebGPU as having "Limited browser and device support". It doesn't use the word "experimental" on the comparison page.
  - WebGPU is never enabled automatically. You turn off Auto Graphics API and add it to the list, with WebGL 2 kept as a fallback.
  - `webglContextAttributes` is ignored under WebGPU. [JS interface](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/interactingwithbrowserscripting/web-js-interface)
- **Browser side:** Chrome shipped WebGPU in 113 (desktop: Windows D3D12, macOS, ChromeOS with Vulkan) and 121 (Android 12+, Qualcomm or ARM GPUs). [Chrome for Developers](https://developer.chrome.com/docs/web-platform/webgpu/overview) Safari shipped it in 26.0 on macOS, iOS, iPadOS and visionOS. [WebKit: Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)

---

## 3. Mobile support and memory (iOS Safari especially)

### Unity's statement
- Unity 6.0 and 6.6: "The Unity Web platform supports some mobile browsers". The supported list is **iOS Safari 15+** and **Chrome 58+ on Android**, with a note to use the latest browser versions. [Browser compatibility (6000.6)](https://docs.unity.com/en-us/engine/6000.6/manual/platform-specific/webgl/intro/browsercompatibility)
- Unity promised clearer minimum-hardware guidance for Unity 6. The current manual still states no minimum hardware or memory figures. [Unity blog, Nov 2023](https://unity.com/blog/engine-platform/web-runtime-updates-enhance-browser-experience)
- Mobile tuning advice: Brotli, Disk Size with LTO, ASTC textures (8x8 suggested), and the fastest quality level. [Optimize for mobile](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/building-distribution/web-optimization-mobile)

### Unity heap settings [Player settings](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/class-player-settings-web-gl), [Memory in Web](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/memory)
- Initial Memory Size defaults to 32 MB. Maximum Memory Size defaults to 2048 MB (up to 4096 MB, with known Chrome and Firefox bugs above 2048).
- Growth mode can be None, Linear (16 MB steps) or Geometric (recommended: factor 0.2, capped at 96 MB per step).
- Unity's advice for mobile: set Initial Memory Size to the app's typical heap use. Heap resizing "can cause your application to crash if the browser fails to allocate a contiguous memory block".
- The managed GC runs only once, at the end of each frame. [Technical overview](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/intro/technical-overview)

### iOS Safari (WebKit): no published limit
- A WebKit engineer said in 2021 that iOS kills processes based on "system pressure not a fixed limit". The reporter also noted that on Safari `memory.grow()` doesn't fail: the tab gets killed and reloaded instead. [WebKit bug 221530](https://bugs.webkit.org/show_bug.cgi?id=221530)
- Simon Fraser (WebKit) said in 2024 that iPhone WebContent processes have a "soft" limit of about 1.5 GB. Above it, a process can be killed by jetsam when the system is under memory pressure. [WebKit bug 277848](https://bugs.webkit.org/show_bug.cgi?id=277848)
- A 2024 report said that available Wasm memory shrank across reloads (1 GB, then 300 MB, then 28 MB). It was merged into a WebKit "MegaBug" on Wasm and Gigacage fragmentation, and WebKit engineers then enlarged the Gigacage and enabled Wasm fast-memory on iOS. Neither bug names the iOS version that shipped the fix. [Bug 269777](https://bugs.webkit.org/show_bug.cgi?id=269777), [Bug 269937](https://bugs.webkit.org/show_bug.cgi?id=269937)
- A 2025 report describes reload and memory-reclaim problems from iOS 18.4 onward. Its current status was not checked. [Bug 295618](https://bugs.webkit.org/show_bug.cgi?id=295618)

### Input on mobile
- Unity Web implements `Input.touches`, and the soft keyboard can be turned off via `WebGLInput.mobileKeyboardSupport`. [Input in Web](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/input)
- Gyro and accelerometer input works only in a secure context (HTTPS, or `http://localhost`).
- A touch KCC demo needs on-screen controls built in Unity. The manual provides no virtual joystick.

---

## 4. iframe vs direct canvas embedding

### How each is wired
- **Direct canvas:** the host page loads `<name>.loader.js`, then calls `createUnityInstance(canvas, config, onProgress)`. That returns a Promise of `unityInstance`. `config` holds `dataUrl`, `frameworkUrl`, `codeUrl`, `streamingAssetsUrl`, `companyName`, `productName`, `productVersion`, plus `devicePixelRatio`, `matchWebGLToCanvasSize`, `webglContextAttributes` and `cacheControl`. [JS interface](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/interactingwithbrowserscripting/web-js-interface), [Canvas size](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/canvas-size)
- **Canvas sizing:** by default Unity keeps the WebGL render-target size in step with the canvas CSS size, at high DPI. A 16:9 box is therefore just CSS on the canvas. `devicePixelRatio: 1` forces low-DPI rendering, which is cheaper on phones. [Canvas size](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/canvas-size)
- **iframe:** the build's own `index.html`, from Unity's template, is loaded in an `<iframe>`.
  - Every iframe is a full browsing context with its own memory cost. [MDN iframe](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/iframe)
  - `loading="lazy"` defers fetching until the frame nears the viewport.
  - `allow="fullscreen"` (the modern form of `allowfullscreen`) is needed for `requestFullscreen()` inside the frame.

### Isolation
- In a direct embed, Unity's loader, globals and listeners run inside the portfolio's own document.
- An iframe keeps them in a separate document and JS realm. Cross-document calls then need `postMessage`, or same-origin `contentWindow` access.
- MDN says that for a same-origin frame, combining `sandbox="allow-scripts allow-same-origin"` lets the framed page remove its own sandbox. Same-origin sandboxing therefore adds no real protection.

### Keyboard focus stealing
- The manual says: "By default, Unity Web processes all keyboard input the web page receives, regardless of whether the Web canvas has focus". This can break HTML text fields, because "Unity consumes the input events before the rest of the page can receive them".
- The fix is `WebGLInput.captureAllKeyboardInput = false`. Unity then takes input only while its canvas has focus. [Input in Web](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/input)
- In a direct canvas embed, the default therefore captures the host page's keys. That includes the portfolio's own hotkeys and any File Explorer keyboard model.
- In an iframe, key events go to whichever document has focus. Unity's capture then covers only the iframe document, but the visitor has to click into the frame before it gets keys. This is inferred from the DOM focus model, not stated by Unity.

### Pointer lock
- Unity uses `Element.requestPointerLock` through `Cursor.lockState = CursorLockMode.Locked`. Locking needs a user gesture, and Unity defers the request to the *next* user event, so you trigger it on mouse or key *down*.
- Esc releases the lock. `WebGLInput.stickyCursorLock` defaults to `true`, so Unity re-locks the next time the canvas gets focus. [Input in Web](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/input)
- From MDN: pointer lock requires transient activation. Inside an iframe, a sandboxed frame needs the `allow-pointer-lock` token. Re-requesting right after the user exits with the default gesture fails. When combined with fullscreen, `requestPointerLock()` must be called first. The API is not Baseline. [MDN requestPointerLock](https://developer.mozilla.org/en-US/docs/Web/API/Element/requestPointerLock)
- **iOS/iPadOS:** the WebKit umbrella bug for Pointer Lock on iOS, iPadOS and visionOS is still NEW (last changed 2026-07-06, with no shipping release noted). A related 2025 fix gates it behind mouse availability in WebKit Nightly. [Bug 216621](https://bugs.webkit.org/show_bug.cgi?id=216621), [Bug 296923](https://bugs.webkit.org/show_bug.cgi?id=296923)
- Fullscreen likewise needs a user gesture, and Safari protects the Esc key.

### Pausing and unloading when off-screen or when the visitor leaves
- **Tab hidden:** most browsers stop `requestAnimationFrame` in background tabs and hidden iframes and throttle timers. An iframe's visibility state is the same as its parent's. Hiding an iframe with `display:none` does *not* fire visibility events inside it. [MDN Page Visibility](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API)
- **Scrolled off-screen, same tab:**
  - Chromium stops rAF and ResizeObserver for **cross-origin** iframes that are off-screen or `display:none` (unified in M112, 2023). [blink-dev PSA](https://groups.google.com/a/chromium.org/g/blink-dev/c/op-z7fMMmWY)
  - **Same-origin** iframes and a direct canvas are not throttled for being off-screen. [blink-dev 2015 intent](https://groups.google.com/a/chromium.org/g/blink-dev/c/_SRHebxivJs)
  - Firefox throttles off-screen frames to about 1 Hz without the cross-origin restriction. Safari throttles only rAF. These cross-browser details come from 2015–2023 Chromium threads and were not re-checked against the current Firefox and Safari source.
  - A same-origin Unity embed therefore keeps rendering while off-screen unless the page pauses it. One way is an `IntersectionObserver` plus a call into Unity, such as `unityInstance.SendMessage` to a script that sets `Time.timeScale` or disables the camera. The manual documents no built-in pause API.
- **Run In Background** (Player setting) only controls whether content keeps running when the canvas or window loses focus. [Player settings](https://docs.unity.com/en-us/engine/6000.0/manual/platform-specific/webgl/develop/class-player-settings-web-gl)
- **Unload:** `Application.Unload()` is not supported on Web. Unity says to "use the `unityInstance.Quit()` JavaScript function" instead. [Application.Unload (6000.3)](https://docs.unity.com/en-us/engine/6000.3/script-reference/unityengine/application/unload.md)
  - Unity's issue tracker has entries on memory not being fully released after `Quit()`. One is marked Won't Fix for the Decompression Fallback case. Another, "WebGL Memory Leaks when unloading a Unity Instance", is tagged a third-party issue. [Issue tracker search](https://issuetracker.unity3d.com/issues/webgl-memory-leaks-when-unloading-a-unity-instance)
  - Removing an iframe element tears down its whole browsing context. That is the browser's job, not Unity's, so it doesn't depend on `Quit()` working correctly.

---

## 5. Serving the build from this Vite multi-page site

- **`public/`:** files there are served at `/` in dev and "copied to the root of the dist directory as-is", without hashing or processing. You reference them by root-absolute path. The directory is set with `publicDir`. [Vite: public directory](https://vite.dev/guide/assets#the-public-directory) Unity's fixed file names suit this.
- **Dev and preview headers:** `server.headers` and `preview.headers` set extra response headers. [Vite server options](https://vite.dev/config/server-options), [preview options](https://vite.dev/config/preview-options)
- **Pre-compressed files in Vite 6.4.4 (this repo):** checked in `node_modules/vite/dist/node/chunks/dep-3O3b9SCF.js`.
  - Vite serves `public/` and `vite preview` output through `sirv`. Its `toHeaders()` sets `Content-Encoding: br` or `gzip` on any file whose name ends in `.br` or `.gz`.
  - It takes `Content-Type` from the name minus that suffix, so `x.wasm.br` goes out as `application/wasm` with `Content-Encoding: br`.
  - So Brotli and gzip Unity builds should decode in `vite` and `vite preview` without extra config. Not verified against a real build.
  - `vite preview` also runs a `compression()` middleware. Whether it skips already-encoded responses was not verified.
  - Unity says Chrome and Firefox decode Brotli only over HTTPS. Whether they advertise `br` on `http://localhost` was not verified. This repo's `dev-lan` config (`@vitejs/plugin-basic-ssl`) already serves HTTPS.
- **Static hosting:** whatever host is chosen must send the header table in section 1. Each host's handling of pre-compressed `.br` and `.gz` files has to be checked against its own docs; this research didn't cover specific hosts. Where the headers can't be set, Unity's options are Disabled compression or Decompression Fallback. Hosting is out of scope per the map.
- **What's in the repo now:**
  - `public/unity-build/README.md` describes dropping a build there.
  - `src/components/UnityChamber.ts` probes `/unity-build/index.html` and then injects `<iframe src="/unity-build/index.html" allow="fullscreen; autoplay">`.
  - That path is root-absolute, while `vite.config.ts` uses `base: './'`. A root-absolute URL breaks if the site is deployed under a sub-path.
  - The current iframe has no `allow-pointer-lock` issue, because it isn't sandboxed. It is same-origin, so Chromium's off-screen throttling does not apply to it.

---

## Implications for the stage decision

- **Download weight:** expect several MB compressed for a URP 3D KCC scene. Empty-project floors run from about 2 MB (heavily stripped) to about 10.7 MB (default template). Measure with the Build Report. Loading it lazily, only when the KCC stage opens, keeps it off the Dev page's first load.
- **Headers:** Brotli gives the smallest files but needs `Content-Encoding: br` and HTTPS. Gzip works over HTTP. Decompression Fallback avoids header setup at the cost of a bigger loader, no streaming compile, and a known memory leak on `Quit()`.
- **Graphics API:** WebGL 2 is Unity's default and the only non-experimental target. WebGPU in Unity is experimental (6.1+) and would need WebGL 2 as a fallback anyway.
- **Mobile:** Unity officially supports iOS Safari 15+ and Android Chrome 58+, but publishes no hardware or memory floor. iOS memory limits are pressure-based (about 1.5 GB soft), and failed growth kills the tab instead of throwing. Pointer lock is not shipped on iOS. A mobile stage needs touch controls in the Unity build, or a non-Unity fallback (video or still).
- **iframe:**
  - Keeps Unity's global keyboard capture out of the host page.
  - Lets the browser drop the whole context when the element is removed.
  - Needs `allow="fullscreen"`, plus `allow-pointer-lock` if sandboxed.
  - Costs an extra browsing context, and Safari disables IndexedDB data caching inside iframes.
- **Direct canvas:**
  - Shares the page's document.
  - Needs `captureAllKeyboardInput = false` to protect host hotkeys and fields.
  - Depends on `unityInstance.Quit()` for teardown.
- **Off-screen pausing:** neither a same-origin iframe nor a direct canvas pauses automatically when scrolled off-screen. A visibility or IntersectionObserver hook that calls into Unity, or unloading the stage when the visitor leaves the detail view, has to be built either way.
