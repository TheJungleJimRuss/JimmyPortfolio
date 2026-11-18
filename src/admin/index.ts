/**
 * Admin mode (dev build only): edit About, Contact and Project slots in a side panel, keep drafts in
 * localStorage and export them as TypeScript for `src/data/`. Loaded by `dev.ts` through a dynamic import
 * behind `import.meta.env.DEV` and `?admin=1`, so production builds never contain it.
 */
import './admin.css';
import { ABOUT } from '../data/about';
import { CONTACT } from '../data/contact';
import { PROJECTS, type ProjectSlots } from '../data/projects';
import { validateAbout, validateContact } from '../components/AboutContactModel';
import { validateSlots } from '../components/ProjectModel';
import { applyDraft, exportDraft, isEmptyDraft, loadDraft, resetDraft, saveDraft, type AdminDraft } from './AdminModel';
import { buildFields } from './AdminFields';

const clone = <T>(v: T): T => JSON.parse(JSON.stringify(v)) as T;

/** Committed values, captured before any draft is applied. */
const BASE = {
  about: clone(ABOUT),
  contact: clone(CONTACT),
  projects: Object.fromEntries(PROJECTS.map((p) => [p.slug, clone(p.slots)])) as Record<string, ProjectSlots>,
};

function storage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

/** Applies the saved draft over the in-memory data. Call before any window is created. */
export function applyAdminDraft(): void {
  const s = storage();
  if (!s) return;
  const draft = loadDraft(s);
  if (draft.about) Object.assign(ABOUT, applyDraft(BASE.about, draft.about));
  if (draft.contact) Object.assign(CONTACT, applyDraft(BASE.contact, draft.contact));
  for (const p of PROJECTS) {
    const patch = draft.projects?.[p.slug];
    if (patch) p.slots = applyDraft(BASE.projects[p.slug] ?? p.slots, patch);
  }
}

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function mountAdmin(): void {
  const s = storage();
  let draft: AdminDraft = s ? loadDraft(s) : { version: 1 };

  const panel = el('aside', 'adm');
  panel.setAttribute('aria-label', 'Admin mode');
  const bar = el('div', 'adm-bar');
  const title = el('strong', 'adm-title', 'ADMIN');
  const toggle = el('button', 'adm-btn', 'Edit');
  const exportBtn = el('button', 'adm-btn', 'Export');
  const resetBtn = el('button', 'adm-btn', 'Reset draft');
  const status = el('span', 'adm-status');
  status.setAttribute('role', 'status');
  for (const b of [toggle, exportBtn, resetBtn]) b.type = 'button';
  bar.append(title, toggle, exportBtn, resetBtn, status);

  const body = el('div', 'adm-body');
  body.hidden = true;
  const issues = el('ul', 'adm-issues');
  const out = el('textarea', 'adm-export');
  out.readOnly = true;
  out.hidden = true;
  out.rows = 12;
  out.setAttribute('aria-label', 'Exported TypeScript');

  const working = {
    about: applyDraft(BASE.about, draft.about),
    contact: applyDraft(BASE.contact, draft.contact),
    projects: Object.fromEntries(PROJECTS.map((p) => [p.slug, applyDraft(BASE.projects[p.slug] ?? p.slots, draft.projects?.[p.slug])])) as Record<string, ProjectSlots>,
  };

  function refresh(): void {
    const all: string[] = [
      ...validateAbout(working.about).map((m) => `about: ${m}`),
      ...validateContact(working.contact).map((m) => `contact: ${m}`),
      ...PROJECTS.flatMap((p) => validateSlots(working.projects[p.slug] ?? {}).map((m) => `${p.slug}: ${m}`)),
    ];
    issues.replaceChildren(...all.map((m) => el('li', undefined, m)));
    status.textContent = `${all.length} issue${all.length === 1 ? '' : 's'}${isEmptyDraft(draft) ? '' : ' · draft saved'}`;
    out.hidden = true;
  }

  function persist(patch: Partial<AdminDraft>): void {
    draft = { ...draft, ...patch };
    if (s) saveDraft(s, draft);
    refresh();
  }

  const section = (label: string, value: object, onChange: () => void): HTMLElement => {
    const d = el('details', 'adm-section');
    d.append(el('summary', undefined, label));
    d.append(buildFields(value as Record<string, unknown>, onChange));
    return d;
  };

  body.append(
    section('About', working.about, () => persist({ about: working.about })),
    section('Contact', working.contact, () => persist({ contact: working.contact })),
  );
  for (const p of PROJECTS) {
    const slots = working.projects[p.slug];
    if (!slots) continue;
    body.append(section(`Project: ${p.name}`, slots, () => persist({ projects: { ...draft.projects, [p.slug]: slots } })));
  }
  const note = el('p', 'adm-note', 'Edits are saved as a draft in this browser. Reload to see them in the windows.');
  body.prepend(note, issues);
  body.append(out);

  toggle.addEventListener('click', () => {
    body.hidden = !body.hidden;
    toggle.textContent = body.hidden ? 'Edit' : 'Close';
    toggle.setAttribute('aria-expanded', String(!body.hidden));
  });
  toggle.setAttribute('aria-expanded', 'false');

  exportBtn.addEventListener('click', async () => {
    const e = exportDraft(draft, BASE);
    const text = [e.about, e.contact, e.projects].filter(Boolean).join('\n');
    if (!text) {
      status.textContent = 'Nothing to export';
      return;
    }
    body.hidden = false;
    toggle.textContent = 'Close';
    out.value = text;
    out.hidden = false;
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied export to clipboard';
    } catch {
      out.select();
      status.textContent = 'Export shown; copy it manually';
    }
  });

  const sampleBtn = el('button', 'adm-btn', 'Load sample');
  sampleBtn.type = 'button';
  bar.insertBefore(sampleBtn, status);
  sampleBtn.addEventListener('click', async () => {
    if (!window.confirm('Replace your draft with SAMPLE text (browser only, not written to src/data) and reload?')) return;
    const { SAMPLE_DRAFT } = await import('./sampleDraft');
    if (s) saveDraft(s, SAMPLE_DRAFT);
    window.location.reload();
  });

  resetBtn.addEventListener('click', () => {
    if (!window.confirm('Discard the saved draft and reload?')) return;
    if (s) resetDraft(s);
    window.location.reload();
  });

  panel.append(bar, body);
  document.body.append(panel);
  refresh();
}
