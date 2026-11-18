import type { DesktopLayout } from './DesktopState';
import { TEXT_FADE_MS, osTraceEndMs, type DesktopTraceLike, type TracePart, type TraceStep } from './DesktopTrace';

const SVG_NS = 'http://www.w3.org/2000/svg';

interface Rect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Thin DOM adapter for the Desktop's Outline trace: measures the already laid out Desktop, draws its
 * lines as strokes on a full-screen SVG, and marks each part done on the root so its text fades in.
 * Timing and order come from DesktopTrace.ts. Strokes use `pathLength=1` so every stroke draws at a
 * constant `linear` speed regardless of its size.
 */
export function createDesktopTraceView(root: HTMLElement, getLayout: () => DesktopLayout): DesktopTraceLike {
  const doc = root.ownerDocument;
  let svg: SVGSVGElement | null = null;
  let timers: ReturnType<typeof setTimeout>[] = [];
  let resolvePlay: (() => void) | null = null;

  const rectOf = (el: Element | null): Rect | null => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 ? { left: r.left, top: r.top, width: r.width, height: r.height } : null;
  };
  const rects = (selector: string): Rect[] =>
    Array.from(root.querySelectorAll(selector))
      .map(rectOf)
      .filter((r): r is Rect => r !== null);

  const box = (r: Rect) => `M${r.left} ${r.top}h${r.width}v${r.height}h${-r.width}Z`;
  const hLine = (r: Rect, y: number) => `M${r.left} ${y}h${r.width}`;
  const vLine = (r: Rect, x: number) => `M${x} ${r.top}v${r.height}`;

  /** Path data for each stroke of a part, read from the live layout. */
  function pathsFor(part: TracePart): string[] {
    const windowParts = (id: string): string[] => {
      const win = root.querySelector(`[data-window="${id}"]`);
      const frame = rectOf(win);
      const bar = rectOf(win?.querySelector('.desk-titlebar') ?? null);
      if (!frame) return [];
      return [box(frame), ...(bar ? [hLine(frame, bar.top + bar.height)] : [])];
    };
    switch (part) {
      case 'taskbar':
        return rects('#taskbar, .taskbar-power, .taskbar-btn').map(box);
      case 'icons':
        return rects('.desk-icon').map(box);
      case 'explorer': {
        const sidebar = rectOf(root.querySelector('[data-window="projects"] .fx-sidebar'));
        return [
          ...windowParts('projects'),
          ...(sidebar ? [vLine(sidebar, sidebar.left + sidebar.width)] : []),
          ...rects('[data-window="projects"] .fx-row').map(box),
        ];
      }
      case 'hero':
        return windowParts('hero');
    }
  }

  function draw(step: TraceStep): void {
    if (!svg) return;
    for (const d of pathsFor(step.part)) {
      const path = doc.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');
      path.setAttribute('class', 'dt-stroke');
      path.dataset.part = step.part;
      path.style.strokeDasharray = '1';
      path.style.strokeDashoffset = '1';
      svg.append(path);
      // Force a style flush so the transition runs from the hidden state.
      void path.getBoundingClientRect();
      path.style.transition = `stroke-dashoffset ${step.durationMs}ms linear, opacity 300ms ease-out`;
      path.style.strokeDashoffset = '0';
    }
  }

  function closePart(part: TracePart): void {
    root.classList.add(`trace-done-${part}`);
    svg?.querySelectorAll<SVGElement>(`.dt-stroke[data-part="${part}"]`).forEach((p) => {
      p.style.opacity = '0';
    });
  }

  function cleanup(): void {
    for (const t of timers) clearTimeout(t);
    timers = [];
    svg?.remove();
    svg = null;
  }

  return {
    layout: getLayout,
    play(steps) {
      cleanup();
      svg = doc.createElementNS(SVG_NS, 'svg');
      svg.setAttribute('class', 'dt-trace');
      svg.setAttribute('aria-hidden', 'true');
      doc.body.append(svg);
      root.classList.add('is-tracing');
      for (const part of ['taskbar', 'icons', 'explorer', 'hero']) root.classList.remove(`trace-done-${part}`);

      return new Promise<void>((resolve) => {
        resolvePlay = resolve;
        for (const step of steps) {
          timers.push(setTimeout(() => draw(step), step.startMs));
          timers.push(setTimeout(() => closePart(step.part), step.startMs + step.durationMs));
        }
        // Resolve once the last frame has closed and its text fade has started.
        timers.push(
          setTimeout(() => {
            resolvePlay = null;
            resolve();
          }, osTraceEndMs(steps) + Math.min(TEXT_FADE_MS, 80)),
        );
      });
    },
    finish() {
      for (const part of ['taskbar', 'icons', 'explorer', 'hero'] as const) root.classList.add(`trace-done-${part}`);
      cleanup();
      resolvePlay?.();
      resolvePlay = null;
    },
  };
}
