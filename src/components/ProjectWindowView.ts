import type { Inline, WriteUp, WriteUpBlock } from '../data/projects';
import { findProject, visibleSlots, type SlotView } from './ProjectModel';

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

/**
 * Project window content: the 16:9 stage area (poster placeholder only; loading arrives with the
 * stage ticket) and one scrolling column of optional slots below it.
 */
export function createProjectWindow(slug: string): HTMLElement | null {
  const project = findProject(slug);
  if (!project) return null;
  const root = el('div', 'pw');
  root.dataset.slug = slug;

  const stage = el('div', 'pw-stage');
  stage.setAttribute('role', 'img');
  stage.setAttribute('aria-label', `${project.name} stage poster`);
  stage.append(el('span', 'pw-stage-marker', '[ ... ]'));

  const column = el('div', 'pw-column');
  for (const view of visibleSlots(project.slots)) column.append(slotNode(view));

  root.append(stage, column);
  return root;
}
