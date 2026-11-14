import { ABOUT, type AboutSlots } from '../data/about';
import { aboutVisible, type AboutView } from './AboutContactModel';

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function node(view: AboutView): HTMLElement {
  switch (view.slot) {
    case 'heading':
      return el('h2', 'ac-slot ac-heading', view.text);
    case 'bio':
      return el('p', 'ac-slot ac-bio', view.text);
    case 'secondary':
      return el('p', 'ac-slot ac-secondary', view.text);
    case 'copyright':
      return el('p', 'ac-slot ac-copyright', view.text);
    case 'stack': {
      const section = el('section', 'ac-slot ac-stack');
      section.setAttribute('aria-label', 'Stack');
      for (const g of view.groups) {
        const group = el('div', 'ac-group');
        group.append(el('h3', 'ac-group-label', g.label));
        const ul = el('ul', 'ac-tags');
        for (const t of g.tags) ul.append(el('li', 'ac-tag', t));
        group.append(ul);
        section.append(group);
      }
      return section;
    }
  }
}

/** About window content: one scrolling column of slots (heading, bio, secondary, Stack, copyright). */
export function createAboutWindow(slots: AboutSlots = ABOUT): HTMLElement {
  const root = el('div', 'ac ac-about');
  for (const view of aboutVisible(slots)) root.append(node(view));
  return root;
}
