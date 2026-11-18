/** Unity build probing for the KCC stage: file layout, the size/compression rule, WebGL 2 detection. */

const MB = 1024 * 1024;
/** Files over this size must come with a `Content-Encoding`, or the host cannot serve the build within budget. */
const LARGE_FILE_BYTES = 1 * MB;

/** Files the Unity loader needs, relative to the build page's folder. */
export const BUILD_FILES = [
  'Build/WebGL.loader.js',
  'Build/WebGL.framework.js',
  'Build/WebGL.data',
  'Build/WebGL.wasm',
] as const;

export interface ProbedFile {
  ok: boolean;
  contentType: string | null;
  contentEncoding: string | null;
  /** Content-Length, when the host reports one (it may be absent for compressed responses). */
  length: number | null;
}

export type BuildVerdict = { ok: true } | { ok: false; reason: 'missing' | 'no-compression' | 'over-budget' };

/**
 * Decides whether the host can serve the build: every file answers, the loader is JavaScript (not a SPA
 * fallback page), large files are encoded, and the summed reported size fits `maxBuildMB`.
 * Loopback hosts (dev server, preview) skip the compression rule since they are not the shipping host.
 */
export function assessBuild(files: readonly ProbedFile[], maxBuildMB: number, loopback: boolean): BuildVerdict {
  if (files.length === 0 || files.some((f) => !f.ok)) return { ok: false, reason: 'missing' };
  const loader = files[0];
  if (loader && !(loader.contentType ?? '').includes('javascript')) return { ok: false, reason: 'missing' };
  if (loopback) return { ok: true };
  if (files.some((f) => f.length !== null && f.length > LARGE_FILE_BYTES && !f.contentEncoding)) {
    return { ok: false, reason: 'no-compression' };
  }
  const total = files.reduce((sum, f) => sum + (f.length ?? 0), 0);
  if (total > maxBuildMB * MB) return { ok: false, reason: 'over-budget' };
  return { ok: true };
}

export function isLoopbackHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]' || hostname.endsWith('.localhost');
}

/** Absolute URLs of the build files next to `pageUrl`. */
export function buildFileUrls(pageUrl: URL): URL[] {
  return BUILD_FILES.map((f) => new URL(f, pageUrl));
}

/** Resolves a base-relative path (`kcc/index.html`) against the current page; never root-absolute. */
export function resolveBuildUrl(buildPath: string, base: string, pageHref: string): URL {
  const baseUrl = new URL(base.endsWith('/') ? base : `${base}/`, pageHref);
  return new URL(buildPath.replace(/^\/+/, ''), baseUrl);
}

async function probeFile(url: URL): Promise<ProbedFile> {
  try {
    const res = await fetch(url, { method: 'HEAD', cache: 'no-store' });
    const len = res.headers.get('content-length');
    return {
      ok: res.ok,
      contentType: res.headers.get('content-type'),
      contentEncoding: res.headers.get('content-encoding'),
      length: len === null ? null : Number(len),
    };
  } catch {
    return { ok: false, contentType: null, contentEncoding: null, length: null };
  }
}

export async function probeBuild(pageUrl: URL, maxBuildMB: number): Promise<BuildVerdict> {
  const files = await Promise.all(buildFileUrls(pageUrl).map(probeFile));
  return assessBuild(files, maxBuildMB, isLoopbackHost(pageUrl.hostname));
}

let webgl2Cached: boolean | undefined;

/** Feature detection; checked once, and the probe context is released at once. */
export function hasWebGL2(): boolean {
  if (webgl2Cached !== undefined) return webgl2Cached;
  try {
    const gl = document.createElement('canvas').getContext('webgl2');
    webgl2Cached = !!gl;
    gl?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl2Cached = false;
  }
  return webgl2Cached;
}

/** The parts of the Keyboard Lock API we use (Chromium only; not in TypeScript's DOM lib). */
export interface KeyboardLock {
  lock(keyCodes: string[]): Promise<void>;
  unlock(): void;
}

export function keyboardLock(): KeyboardLock | undefined {
  return (navigator as Navigator & { keyboard?: Partial<KeyboardLock> }).keyboard?.lock
    ? (navigator as unknown as { keyboard: KeyboardLock }).keyboard
    : undefined;
}

/**
 * Browsers spend Esc on leaving fullscreen. While the game stage is fullscreen, claim Esc so it reaches the
 * game (its pause menu); holding Esc still leaves fullscreen. Must run in the top-level page.
 */
export function syncEscapeLock(fullscreenEl: Element | null, stage: Element, kb: KeyboardLock | undefined): void {
  if (!kb) return;
  if (fullscreenEl === stage) kb.lock(['Escape']).catch(() => {});
  else kb.unlock();
}
