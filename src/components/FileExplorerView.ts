import type { DesktopAction } from './DesktopState';
import { explorerBreadcrumbs, explorerRows, SIDEBAR_ITEMS } from './ProjectModel';

const SVG_NS = 'http://www.w3.org/2000/svg';

function icon(path: string): SVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('viewBox', '0 0 32 32');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '1.5');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  const p = document.createElementNS(SVG_NS, 'path');
  p.setAttribute('d', path);
  svg.append(p);
  return svg;
}

const FOLDER_ICON = 'M4 9h8l2 3h14v14H4z';
const PROJECT_ICON = 'M7 4h13l5 5v19H7zM20 4v5h5M11 15h10M11 20h10';
const ABOUT_ICON = 'M7 4h18v24H7zM11 11h10M11 16h10M11 21h6';
const CONTACT_ICON = 'M4 8h24v16H4zM4 9l12 9 12-9';
const SIDEBAR_ICONS: Record<string, string> = { Projects: FOLDER_ICON, About: ABOUT_ICON, Contact: CONTACT_ICON };

/**
 * Builds the File Explorer content for `~/projects`: sidebar, shallow breadcrumbs and a flat list
 * of projects. Projects (sidebar) navigates within the explorer; About and Contact open their windows.
 * Category badges are the owner's copy and show the `[ ... ]` marker until written.
 */
export function createFileExplorer(dispatch: (action: DesktopAction) => void): HTMLElement {
  const root = document.createElement('div');
  root.className = 'fx';

  const sidebar = document.createElement('nav');
  sidebar.className = 'fx-sidebar';
  sidebar.setAttribute('aria-label', 'Explorer sidebar');
  const list = document.createElement('ul');
  list.className = 'fx-sidebar-list';

  const main = document.createElement('div');
  main.className = 'fx-main';

  const crumbs = document.createElement('nav');
  crumbs.className = 'fx-crumbs';
  crumbs.setAttribute('aria-label', 'Breadcrumb');
  const crumbList = document.createElement('ol');
  for (const c of explorerBreadcrumbs()) {
    const li = document.createElement('li');
    if (c.current) li.setAttribute('aria-current', 'page');
    li.textContent = c.label;
    crumbList.append(li);
  }
  crumbs.append(crumbList);

  const rowsEl = document.createElement('ul');
  rowsEl.className = 'fx-rows';
  rowsEl.setAttribute('aria-label', 'Projects');
  for (const row of explorerRows()) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fx-row';
    btn.dataset.slug = row.slug;
    const name = document.createElement('span');
    name.className = 'fx-row-name';
    name.textContent = row.name;
    const badge = document.createElement('span');
    badge.className = 'fx-badge';
    badge.textContent = row.category;
    btn.append(icon(PROJECT_ICON), name, badge);
    btn.addEventListener('click', () => dispatch({ type: 'open', id: row.windowId }));
    li.append(btn);
    rowsEl.append(li);
  }

  for (const item of SIDEBAR_ITEMS) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'fx-side-btn';
    const label = document.createElement('span');
    label.textContent = item.label;
    btn.append(icon(SIDEBAR_ICONS[item.label]), label);
    if (item.target.kind === 'explorer') {
      btn.setAttribute('aria-current', 'page');
      // Already at ~/projects: navigating here returns the list to the top and focuses it.
      btn.addEventListener('click', () => {
        rowsEl.scrollTo({ top: 0 });
        rowsEl.querySelector<HTMLElement>('.fx-row')?.focus({ preventScroll: true });
      });
    } else {
      const { id } = item.target;
      btn.addEventListener('click', () => dispatch({ type: 'open', id }));
    }
    li.append(btn);
    list.append(li);
  }

  sidebar.append(list);
  main.append(crumbs, rowsEl);
  root.append(sidebar, main);
  return root;
}
