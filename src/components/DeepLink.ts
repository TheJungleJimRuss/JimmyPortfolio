import type { WindowId } from './DesktopState';
import { projectWindowId } from './ProjectModel';

/**
 * Maps a URL hash to the Window it should open on arrival, or `null` for the ordinary arrival layout.
 * Accepts `#about`, `#contact` and `#<slug>` for known project slugs; tolerates `#/about`, `#/about/`
 * and case differences. Anything else (empty, unknown, malformed escapes) is `null`.
 */
export function parseDeepLink(hash: string, knownSlugs: readonly string[]): WindowId | null {
  let key = hash.replace(/^#/, '').replace(/^\/+/, '').replace(/\/+$/, '');
  try {
    key = decodeURIComponent(key);
  } catch {
    return null;
  }
  key = key.trim().toLowerCase();
  if (key === 'about' || key === 'contact') return key;
  return knownSlugs.includes(key) ? projectWindowId(key) : null;
}

type HistoryHost = Pick<Window, 'history' | 'location' | 'addEventListener'>;

const SENTINEL = { portfolioDeepLink: true } as const;

/**
 * Keeps browser history in step with a deep-linked Window.
 *
 * The deep link is the current entry. When it opens a window, one sentinel entry with the same URL is
 * pushed on top, so Back lands on the deep-link entry (a popstate we handle) instead of leaving the page.
 * Back then closes the window and the hash is cleared with replaceState, leaving the next Back to leave
 * normally. If the window is closed any other way while the sentinel is on top, the sentinel is popped
 * with `history.back()` for the same result. Opening windows by clicks never touches the URL.
 */
export class DeepLinkHistory {
  private open = false;
  private onSentinel = false;

  constructor(
    private readonly onBack: () => void,
    private readonly win: HistoryHost = window,
  ) {
    // A reload while on the sentinel entry keeps its state: reuse it instead of stacking another.
    this.onSentinel = win.history.state?.portfolioDeepLink === true && win.location.hash !== '';
    win.addEventListener('popstate', () => this.handlePopState());
  }

  /** Call with `DesktopState.deepLinked` after every state change. */
  sync(deepLinked: WindowId | null): void {
    const isOpen = deepLinked !== null;
    if (isOpen === this.open) return;
    this.open = isOpen;
    if (isOpen) {
      if (!this.onSentinel) {
        this.win.history.pushState(SENTINEL, '', this.url(true));
        this.onSentinel = true;
      }
    } else if (this.onSentinel) {
      // Closed by the user's own close or another window: drop the hash now (reload-safe), then pop the sentinel.
      this.clearHash();
      this.win.history.back();
    } else {
      this.clearHash();
    }
  }

  private handlePopState(): void {
    const onSentinel = this.win.history.state?.portfolioDeepLink === true;
    this.onSentinel = onSentinel;
    if (!onSentinel && this.open) {
      this.onBack();
      this.clearHash();
    } else if (!this.open && this.win.location.hash !== '') {
      this.clearHash();
    }
  }

  private clearHash(): void {
    if (this.win.location.hash === '') return;
    this.win.history.replaceState(this.win.history.state, '', this.url(false));
  }

  private url(withHash: boolean): string {
    const { pathname, search, hash } = this.win.location;
    return pathname + search + (withHash ? hash : '');
  }
}
