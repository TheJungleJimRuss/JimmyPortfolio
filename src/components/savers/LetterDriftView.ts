/** DOM rendering for Letter drift: one span per letter in the hero font, positioned by transform. */
import { letterDrift, type LetterDriftState } from './LetterDrift';

/** Calm mode: a short glide to each new spot, then the frame holds still until the next nudge. */
const CALM_GLIDE_MS = 700;
import type { SaverRenderer } from './SaverRenderer';

const RETURN_MS = 450;

export const letterDriftView: SaverRenderer<LetterDriftState> = {
  motion: letterDrift,
  mount(host, state) {
    host.classList.add('saver-letters');
    for (const l of state.letters) {
      const span = document.createElement('span');
      span.className = 'saver-letter';
      span.textContent = l.ch;
      host.append(span);
    }
    // Calm mode eases between its rare nudges; the live mode is driven frame by frame.
    host.style.setProperty('--saver-ease', state.calm ? `${CALM_GLIDE_MS}ms` : '0ms');
  },
  draw(state, _view, host) {
    host.style.fontSize = `${state.size}px`;
    const spans = host.children;
    state.letters.forEach((l, i) => {
      (spans[i] as HTMLElement).style.transform = `translate(${l.x.toFixed(1)}px, ${l.y.toFixed(1)}px) translate(-50%, -50%)`;
    });
  },
  /** Letters glide back to the Hero name layout; returns how long that takes. */
  exit(state, host) {
    host.style.setProperty('--saver-ease', `${RETURN_MS}ms`);
    const spans = host.children;
    state.letters.forEach((l, i) => {
      (spans[i] as HTMLElement).style.transform = `translate(${l.hx}px, ${l.hy}px) translate(-50%, -50%)`;
    });
    return RETURN_MS;
  },
};
