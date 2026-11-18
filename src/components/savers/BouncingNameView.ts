/** DOM rendering for Bouncing name: the stacked Hero name in the hero font, moved by transform, with a corner bloom. */
import { bouncingName, type BouncingNameState } from './BouncingName';
import type { SaverRenderer } from './SaverRenderer';

const BLOOM_MS = 600;
const seen = new WeakMap<HTMLElement, number>();

export const bouncingNameView: SaverRenderer<BouncingNameState> = {
  motion: bouncingName,
  mount(host, state) {
    host.classList.add('saver-bouncing-name');
    const box = document.createElement('div');
    box.className = 'saver-bouncing-box';
    box.setAttribute('aria-hidden', 'true');
    Object.assign(box.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap',
      fontFamily: 'var(--font-hero)',
      fontWeight: '800',
      lineHeight: '0.95',
      color: 'var(--phosphor)',
      willChange: 'transform',
      pointerEvents: 'none',
    });
    for (const line of ['JIMMY', 'RUSS']) {
      const span = document.createElement('span');
      span.textContent = line;
      box.append(span);
    }
    host.append(box);
    seen.set(host, state.corners);
  },
  draw(state, _view, host) {
    const box = host.querySelector<HTMLElement>('.saver-bouncing-box');
    if (!box) return;
    box.style.fontSize = `${state.size.toFixed(1)}px`;
    box.style.width = `${state.w.toFixed(1)}px`;
    box.style.height = `${state.h.toFixed(1)}px`;
    box.style.transform = `translate(${state.x.toFixed(1)}px, ${state.y.toFixed(1)}px)`;
    if (state.corners !== (seen.get(host) ?? 0)) {
      seen.set(host, state.corners);
      // Brief phosphor flare; no text.
      box.animate?.(
        [
          { filter: 'brightness(1)', textShadow: '0 0 0 transparent' },
          { filter: 'brightness(1.8)', textShadow: '0 0 24px var(--phosphor), 0 0 64px var(--phosphor)', offset: 0.25 },
          { filter: 'brightness(1)', textShadow: '0 0 0 transparent' },
        ],
        { duration: BLOOM_MS, easing: 'ease-out' },
      );
    }
  },
};
