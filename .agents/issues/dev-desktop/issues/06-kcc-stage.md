# 06: Kinematic Character Controller stage

**What to build:** The KCC stage loads a Unity WebGL 2 build in a same-origin iframe on desktop/tablet and shows gameplay video on phones or when WebGL 2 is missing. Keys reach the game only while the stage has focus; Esc or an outside click returns the keyboard, and a hint shows who has it. Until the build and video exist, the poster and "coming soon" slots show.

**Blocked by:** 05

**Status:** ready-for-agent

Spec: `.agents/issues/dev-portfolio-complete/spec.md` (approved 2026-11-13). Vocabulary from `GLOSSARY.md`. Never write site copy; keep `[ ... ]` markers (AGENTS.md). Verify per AGENTS.md: `npm run build` zero errors, `npm test` passes, UI checked at 375/768/1024 and landscape phone with screenshots, temp files removed.

- [ ] Build path works with the site's relative base
- [ ] Keyboard hand-off and hint behave as specified (`captureAllKeyboardInput = false`)
- [ ] Phone and no-WebGL2 fallback to the video slot
- [ ] Build over 15 MB Brotli, or a host without `Content-Encoding`, uses the video instead
- [ ] Placeholder state works with no build present

## Notes (2026-11-13)

The user finished the WebGL build: `~/Downloads/WebGLController/Builds/WebGL/` (index.html + `Build/WebGL.{loader.js,framework.js,wasm,data}`). Raw about 49 MB (wasm 36.8 MB, data 12.2 MB); gzip -9 about 15.5 MB total, Brotli not measured (likely about 12 MB, expected under the 15 MB limit; confirm). Still missing: gameplay video, poster, public repo.
