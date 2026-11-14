import { describe, it, expect } from 'vitest';
import { assessBuild, isLoopbackHost, resolveBuildUrl, type ProbedFile } from './KccBuild';

const MB = 1024 * 1024;
const f = (over: Partial<ProbedFile> = {}): ProbedFile => ({ ok: true, contentType: 'text/javascript', contentEncoding: 'br', length: null, ...over });
const build = (over: Partial<ProbedFile> = {}): ProbedFile[] => [f(), f({ contentType: 'application/wasm' }), f(over), f()];

describe('assessBuild', () => {
  it('accepts an encoded build within budget', () => {
    expect(assessBuild(build({ length: 5 * MB }), 15, false)).toEqual({ ok: true });
  });
  it('rejects missing files or a loader that is not JavaScript (SPA fallback)', () => {
    expect(assessBuild(build({ ok: false }), 15, true)).toEqual({ ok: false, reason: 'missing' });
    expect(assessBuild([f({ contentType: 'text/html' }), f(), f(), f()], 15, true)).toEqual({ ok: false, reason: 'missing' });
    expect(assessBuild([], 15, true)).toEqual({ ok: false, reason: 'missing' });
  });
  it('rejects a large file served without Content-Encoding on a real host', () => {
    expect(assessBuild(build({ length: 36 * MB, contentEncoding: null }), 15, false)).toEqual({ ok: false, reason: 'no-compression' });
  });
  it('rejects a build whose reported size is over budget', () => {
    expect(assessBuild(build({ length: 16 * MB }), 15, false)).toEqual({ ok: false, reason: 'over-budget' });
  });
  it('skips the compression and size rules on loopback hosts', () => {
    expect(assessBuild(build({ length: 36 * MB, contentEncoding: null }), 15, true)).toEqual({ ok: true });
  });
});

describe('paths', () => {
  it('resolves a relative path against the site base, never root-absolute', () => {
    expect(resolveBuildUrl('kcc/index.html', './', 'https://x.test/site/dev.html').href).toBe('https://x.test/site/kcc/index.html');
    expect(resolveBuildUrl('/kcc/index.html', './', 'https://x.test/site/dev.html').href).toBe('https://x.test/site/kcc/index.html');
    expect(resolveBuildUrl('kcc/index.html', '/sub/', 'https://x.test/dev.html').href).toBe('https://x.test/sub/kcc/index.html');
  });
  it('recognises loopback hosts', () => {
    expect(isLoopbackHost('localhost')).toBe(true);
    expect(isLoopbackHost('thejunglejimruss.github.io')).toBe(false);
  });
});
