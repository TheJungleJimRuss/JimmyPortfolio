import { CONTACT, type ContactSlots } from '../data/contact';
import { PLACEHOLDER } from '../data/projects';
import { contactView, copyText, type ContactLink } from './AboutContactModel';

const TOAST_MS = 2000;

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function linkItem(link: ContactLink): HTMLElement {
  const li = el('li');
  if (link.url === null) {
    // Placeholder URL: plain text, not an anchor (like Source/Live in the Project window).
    li.append(el('span', 'pw-link is-pending', link.label));
  } else {
    const a = el('a', 'pw-link', link.label);
    a.href = link.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    li.append(a);
  }
  return li;
}

/** Contact window content. No scrolling; the "copied" toast is a status region inside the window. */
export function createContactWindow(slots: ContactSlots = CONTACT): HTMLElement {
  const view = contactView(slots);
  const root = el('div', 'ac ac-contact');
  if (view.heading) root.append(el('h2', 'ac-slot ac-heading', view.heading));
  if (view.callToAction) root.append(el('p', 'ac-slot ac-cta', view.callToAction));

  const button = el('button', 'ac-copy', view.copy.label);
  button.type = 'button';
  button.disabled = !view.copy.enabled;
  if (view.copy.label === PLACEHOLDER) button.setAttribute('aria-label', 'Copy email');
  const toast = el('span', 'ac-toast');
  toast.setAttribute('role', 'status');

  let timer: ReturnType<typeof setTimeout> | undefined;
  let last = '';
  button.addEventListener('click', async () => {
    if (!view.copy.enabled) return;
    const outcome = await copyText(view.copy.email);
    let message = outcome === 'copied' ? 'Copied' : 'Copy failed';
    if (message === last) message += ' '; // VoiceOver skips identical repeats
    last = message;
    clearTimeout(timer);
    toast.textContent = '';
    toast.dataset.failed = String(outcome === 'failed');
    requestAnimationFrame(() => {
      toast.textContent = message;
      toast.classList.add('is-shown');
    });
    timer = setTimeout(() => {
      toast.classList.remove('is-shown');
      toast.textContent = '';
    }, TOAST_MS);
  });

  const actions = el('div', 'ac-slot ac-actions');
  actions.append(button, toast);
  root.append(actions);

  const links = el('ul', 'ac-slot pw-links');
  links.append(linkItem(view.github));
  if (view.linkedin) links.append(linkItem(view.linkedin));
  root.append(links);
  return root;
}
