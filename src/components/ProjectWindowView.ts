import type { Inline, ProjectEntry, WriteUp, WriteUpBlock } from '../data/projects';
import type { DesktopAction, DesktopState } from './DesktopState';
import { hasWebGL2, probeBuild, resolveBuildUrl } from './KccBuild';
import {
  findProject,
  KEYBOARD_HINT,
  keyboardOwner,
  stageView,
  visibleSlots,
  type SlotView,
  type StageLink,
  type StageView,
} from './ProjectModel';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function inline(parent: HTMLElement, runs: Inline[]): void {
  for (const run of runs) {
    if ('code' in run) parent.append(el('code', 'pw-code', run.code));
    else parent.append(document.createTextNode(run.text));
  }
}

function block(b: WriteUpBlock): HTMLElement {
  switch (b.kind) {
    case 'paragraph': {
      const p = el('p');
      inline(p, b.content);
      return p;
    }
    case 'bullets': {
      const ul = el('ul');
      for (const item of b.items) {
        const li = el('li');
        inline(li, item);
        ul.append(li);
      }
      return ul;
    }
    case 'code': {
      const pre = el('pre', 'pw-pre');
      pre.append(el('code', undefined, b.code));
      return pre;
    }
  }
}

function writeUp(className: string, w: WriteUp): HTMLElement {
  const section = el('section', `pw-slot ${className}`);
  if (w.heading) section.append(el('h3', 'pw-heading', w.heading));
  for (const b of w.body ?? []) section.append(block(b));
  return section;
}

function slotNode(view: SlotView): HTMLElement {
  switch (view.slot) {
    case 'controlsNotes':
      return el('p', 'pw-slot pw-controls', view.text);
    case 'category':
      return el('p', 'pw-slot pw-badge', view.text);
    case 'title':
      return el('h2', 'pw-slot pw-title', view.text);
    case 'tags': {
      const ul = el('ul', 'pw-slot pw-tags');
      ul.setAttribute('aria-label', 'Tech tags');
      for (const t of view.tags) ul.append(el('li', 'pw-tag', t));
      return ul;
    }
    case 'summary':
      return el('p', 'pw-slot pw-summary', view.text);
    case 'links': {
      const ul = el('ul', 'pw-slot pw-links');
      for (const l of view.links) {
        const li = el('li');
        if (l.url === null) {
          li.append(el('span', 'pw-link is-pending', `${l.label} `), el('span', 'pw-marker', '[ ... ]'));
        } else {
          const a = el('a', 'pw-link', l.label);
          a.href = l.url;
          a.target = '_blank';
          a.rel = 'noopener noreferrer';
          li.append(a);
        }
        ul.append(li);
      }
      return ul;
    }
    case 'specs': {
      const dl = el('dl', 'pw-slot pw-specs');
      for (const r of view.rows) {
        const row = el('div', 'pw-spec');
        row.append(el('dt', undefined, r.key), el('dd', undefined, r.value));
        dl.append(row);
      }
      return dl;
    }
    case 'deepDive':
      return writeUp('pw-deep-dive', view.writeUp);
    case 'challenges':
      return writeUp('pw-challenges', view.writeUp);
  }
}

export interface ProjectWindowHandle {
  el: HTMLElement;
  /** Re-renders only the stage area from Desktop state; the slot column and its scroll position stay. */
  update(state: DesktopState): void;
}

interface StageHooks {
  mountUnity(frame: HTMLElement, view: Extract<StageView, { kind: 'unity' }>): void;
}

/** Trusted sites only (our own GitHub Pages). allow-same-origin keeps their storage and relative fetches working
 *  inside their own cross-origin frame; it does not touch this page. No top-navigation, downloads or modals. */
/** Virtual desktop viewport the live site lays out in before being scaled to the stage. */
const LIVE_VIEWPORT_W = 1280;
const LIVE_VIEWPORT_H = 720;
const SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-forms';

function stageLink(link: StageLink): HTMLAnchorElement {
  const a = el('a', 'pw-link pw-stage-link', link.label);
  a.href = link.url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  return a;
}

function stageNode(project: ProjectEntry, view: StageView, dispatch: (a: DesktopAction) => void, hooks: StageHooks): HTMLElement {
  const frame = el('div', 'pw-stage');
  frame.tabIndex = -1;
  frame.setAttribute('role', 'group');
  frame.setAttribute('aria-label', `${project.name} stage`);
  frame.dataset.stage = view.kind;
  switch (view.kind) {
    case 'iframe': {
      const f = el('iframe', 'pw-frame');
      f.title = `${project.name} live site`;
      f.loading = 'eager';
      f.referrerPolicy = 'no-referrer';
      f.setAttribute('sandbox', SANDBOX);
      f.src = view.url;
      frame.append(f);
      // Render the site at a real desktop viewport, then scale the whole thing down to fit the stage.
      frame.classList.add('is-scaled');
      f.style.width = `${LIVE_VIEWPORT_W}px`;
      f.style.height = `${LIVE_VIEWPORT_H}px`;
      if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(([entry]) => {
          const w = entry?.contentRect.width ?? 0;
          if (w > 0) f.style.transform = `scale(${w / LIVE_VIEWPORT_W})`;
        }).observe(frame);
      }
      break;
    }
    case 'unity':
      hooks.mountUnity(frame, view);
      break;
    case 'video': {
      if (view.videoUrl) {
        const v = el('video', 'pw-video');
        v.controls = true;
        v.playsInline = true;
        v.preload = 'none';
        v.setAttribute('aria-label', `${project.name} gameplay video`);
        v.src = view.videoUrl;
        frame.append(v);
      } else {
        frame.append(el('span', 'pw-stage-marker', '[ ... ]'));
      }
      break;
    }
    case 'poster': {
      frame.append(el('span', 'pw-stage-marker', '[ ... ]'));
      if (view.canLoad) {
        const load = el('button', 'pw-load', 'Load');
        load.type = 'button';
        load.addEventListener('click', () => {
          dispatch({ type: 'loadStage', slug: project.slug });
        });
        frame.append(load);
      }
      break;
    }
    case 'in-progress': {
      frame.classList.add('is-wire');
      for (const part of ['bar', 'side', 'main']) frame.append(el('span', `pw-wire pw-wire-${part}`));
      frame.append(el('span', 'pw-stage-marker', '[ ... ]'));
      break;
    }
    case 'paused':
      frame.append(el('span', 'pw-stage-marker', '[ ... ]'));
      break;
  }
  return frame;
}

/**
 * Project window content: the 16:9 stage area, driven by Desktop state through `update`, and one
 * scrolling column of optional slots below it. Stage lifecycle lives in the reducer; this only renders it.
 */
export function createProjectWindow(slug: string, dispatch: (a: DesktopAction) => void): ProjectWindowHandle | null {
  const project = findProject(slug);
  if (!project) return null;
  const root = el('div', 'pw');
  root.dataset.slug = slug;

  const stageBox = el('div', 'pw-stagebox');
  const column = el('div', 'pw-column');
  for (const view of visibleSlots(project.slots)) column.append(slotNode(view));
  root.append(stageBox, column);

  let shown = '';
  let lastState: DesktopState | null = null;
  let buildFailed = false;
  let teardown: (() => void) | null = null;
  let pendingHint: HTMLElement | null = null;

  /** Same-origin Unity iframe: probe the host first, hand the keyboard back on Shift+Esc or any outside click. */
  const mountUnity: StageHooks['mountUnity'] = (frame, view) => {
    const pageUrl = resolveBuildUrl(view.buildPath, import.meta.env.BASE_URL, document.baseURI);
    const hint = el('p', 'pw-kbd', KEYBOARD_HINT.desktop);
    hint.setAttribute('aria-hidden', 'true');
    frame.append(el('span', 'pw-stage-marker', '[ ... ]'));
    pendingHint = hint;
    let iframe: HTMLIFrameElement | null = null;
    let alive = true;

    const sync = () => {
      const owner = keyboardOwner(!!iframe && document.activeElement === iframe);
      hint.textContent = KEYBOARD_HINT[owner];
      frame.dataset.keyboard = owner;
    };
    const release = () => {
      iframe?.blur();
      frame.closest<HTMLElement>('.desk-window')?.focus({ preventScroll: true });
      sync();
    };
    const fail = () => {
      if (!alive || buildFailed) return;
      buildFailed = true;
      refresh();
    };
    const onMessage = (e: MessageEvent) => {
      if (e.origin === location.origin && e.source === iframe?.contentWindow && e.data?.type === 'kcc:error') fail();
    };
    const later = () => setTimeout(sync, 0);
    window.addEventListener('message', onMessage);
    window.addEventListener('blur', later);
    window.addEventListener('focus', later);
    document.addEventListener('focusin', later);
    document.addEventListener('pointerdown', later, true);
    teardown = () => {
      alive = false;
      window.removeEventListener('message', onMessage);
      window.removeEventListener('blur', later);
      window.removeEventListener('focus', later);
      document.removeEventListener('focusin', later);
      document.removeEventListener('pointerdown', later, true);
    };

    void probeBuild(pageUrl, view.maxBuildMB).then((verdict) => {
      if (!alive) return;
      if (!verdict.ok) return fail();
      const f = el('iframe', 'pw-frame');
      f.title = `${project.name} game`;
      f.allow = 'fullscreen; gamepad';
      f.setAttribute('allowfullscreen', '');
      f.addEventListener('load', () => {
        try {
          f.contentDocument?.addEventListener(
            'keydown',
            (e) => {
              if (e.key === 'Escape' && e.shiftKey) release(); // plain Esc belongs to the game
            },
            true,
          );
        } catch {
          /* cross-origin host: Esc cannot be seen; clicking outside still returns the keyboard */
        }
      });
      iframe = f;
      frame.prepend(f);
      f.src = pageUrl.href;
    });
  };

  const refresh = (): void => {
    shown = '';
    if (lastState) update(lastState);
  };

  const update = (state: DesktopState): void => {
    lastState = state;
    const stageState = state.stages[slug];
    if (stageState !== 'loaded' && stageState !== 'paused') buildFailed = false;
    const webgl2 = project.stage.medium === 'unity-webgl' ? hasWebGL2() : true;
    const view = stageView(project.stage, stageState, state.layout, { webgl2, buildFailed });
    const key = JSON.stringify(view);
    if (key === shown) return;
    shown = key;
    teardown?.();
    teardown = null;
    pendingHint = null;
    const hadFocus = stageBox.contains(document.activeElement);
    const node = stageNode(project, view, dispatch, { mountUnity });
    const nodes: HTMLElement[] = [node];
    if (pendingHint) {
      const actions = el('div', 'pw-stage-actions');
      actions.append(pendingHint);
      nodes.push(actions);
      pendingHint = null;
    }
    if ('link' in view && view.link) {
      const actions = el('div', 'pw-stage-actions');
      actions.append(stageLink(view.link));
      nodes.push(actions);
    }
    stageBox.replaceChildren(...nodes);
    if (hadFocus) node.focus({ preventScroll: true });
  };
  return { el: root, update };
}
