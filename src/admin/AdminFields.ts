/**
 * Generic form builder for slot objects. Edits the object in place and calls `onChange`.
 * Strings: input or textarea. String arrays: one per line. Arrays of objects: rows with add/remove.
 * Write-up `body`: JSON, validated on input.
 */
import { PLACEHOLDER } from '../data/projects';
import { linesOrMarker, textOrMarker } from './AdminModel';

const LONG = new Set(['bio', 'secondary', 'summary', 'callToAction', 'controlsNotes']);

function el<K extends keyof HTMLElementTagNameMap>(tag: K, className?: string, text?: string): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

let uid = 0;

function field(label: string, control: HTMLElement): HTMLElement {
  const wrap = el('div', 'adm-field');
  const id = `adm-f-${uid++}`;
  const l = el('label', undefined, label);
  l.htmlFor = id;
  control.id = id;
  wrap.append(l, control);
  return wrap;
}

function templateOf(sample: unknown): unknown {
  if (typeof sample === 'string') return PLACEHOLDER;
  if (Array.isArray(sample)) return [PLACEHOLDER];
  if (typeof sample === 'object' && sample !== null) {
    return Object.fromEntries(Object.entries(sample).map(([k, v]) => [k, templateOf(v)]));
  }
  return sample;
}

export function buildFields(obj: Record<string, unknown>, onChange: () => void): HTMLElement {
  const root = el('div', 'adm-fields');
  for (const key of Object.keys(obj)) {
    const value = obj[key];

    if (typeof value === 'string') {
      const long = LONG.has(key);
      const input = long ? el('textarea') : el('input');
      if (input instanceof HTMLTextAreaElement) input.rows = 4;
      input.value = value;
      input.addEventListener('input', () => {
        obj[key] = textOrMarker(input.value);
        onChange();
      });
      root.append(field(key, input));
    } else if (key === 'body') {
      const area = el('textarea', 'adm-json');
      area.rows = 8;
      area.value = JSON.stringify(value, null, 2);
      const err = el('span', 'adm-err');
      area.addEventListener('input', () => {
        try {
          const parsed: unknown = JSON.parse(area.value);
          if (!Array.isArray(parsed)) throw new Error('body must be an array of blocks');
          obj[key] = parsed;
          err.textContent = '';
          onChange();
        } catch (e) {
          err.textContent = e instanceof Error ? e.message : 'Invalid JSON';
        }
      });
      const wrap = field('body (JSON blocks)', area);
      wrap.append(err);
      root.append(wrap);
    } else if (Array.isArray(value) && value.every((v) => typeof v === 'string')) {
      const area = el('textarea');
      area.rows = Math.max(2, value.length);
      area.value = value.join('\n');
      area.addEventListener('input', () => {
        obj[key] = linesOrMarker(area.value);
        onChange();
      });
      root.append(field(`${key} (one per line)`, area));
    } else if (Array.isArray(value)) {
      const group = el('fieldset', 'adm-group');
      group.append(el('legend', undefined, key));
      const arr = value as Record<string, unknown>[];
      const draw = (): void => {
        group.replaceChildren(el('legend', undefined, key));
        arr.forEach((item, i) => {
          const row = el('div', 'adm-row');
          row.append(buildFields(item, onChange));
          const del = el('button', 'adm-btn', 'Remove');
          del.type = 'button';
          del.addEventListener('click', () => {
            arr.splice(i, 1);
            draw();
            onChange();
          });
          row.append(del);
          group.append(row);
        });
        const add = el('button', 'adm-btn', 'Add');
        add.type = 'button';
        add.addEventListener('click', () => {
          arr.push(templateOf(arr[0] ?? {}) as Record<string, unknown>);
          draw();
          onChange();
        });
        group.append(add);
      };
      draw();
      root.append(group);
    } else if (typeof value === 'object' && value !== null) {
      const group = el('fieldset', 'adm-group');
      group.append(el('legend', undefined, key), buildFields(value as Record<string, unknown>, onChange));
      root.append(group);
    }
  }
  return root;
}
