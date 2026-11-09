export type PersonaMode = 'dev' | 'drone';

export type PersonaChangeListener = (mode: PersonaMode) => void;

const STORAGE_KEY = 'portfolio_persona';

export class PersonaController {
  private currentMode: PersonaMode = 'dev';
  private listeners: Set<PersonaChangeListener> = new Set();

  constructor() {
    this.init();
  }

  public init(): void {
    const fromUrl = this.readFromUrl();
    if (fromUrl) {
      this.currentMode = fromUrl;
      this.safeSaveStorage(fromUrl);
      return;
    }

    const fromStorage = this.readFromStorage();
    if (fromStorage) {
      this.currentMode = fromStorage;
      return;
    }

    this.currentMode = 'dev';
  }

  public getMode(): PersonaMode {
    return this.currentMode;
  }

  public setMode(mode: PersonaMode): void {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    this.safeSaveStorage(mode);
    this.syncUrl(mode);
    this.notify();
  }

  public toggle(): void {
    const nextMode: PersonaMode = this.currentMode === 'dev' ? 'drone' : 'dev';
    this.setMode(nextMode);
  }

  public subscribe(listener: PersonaChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      listener(this.currentMode);
    }
  }

  private readFromUrl(): PersonaMode | null {
    try {
      if (typeof window === 'undefined' || !window.location) return null;
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'drone' || modeParam === 'dev') {
        return modeParam;
      }
      return null;
    } catch {
      return null;
    }
  }

  private readFromStorage(): PersonaMode | null {
    try {
      if (typeof localStorage === 'undefined') return null;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'drone' || stored === 'dev') {
        return stored;
      }
      return null;
    } catch {
      return null;
    }
  }

  private safeSaveStorage(mode: PersonaMode): void {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, mode);
      }
    } catch {
      // Storage unavailable or disabled
    }
  }

  private syncUrl(mode: PersonaMode): void {
    try {
      if (typeof window === 'undefined' || !window.history || !window.location) return;
      const url = new URL(window.location.href || 'http://localhost');
      url.searchParams.set('mode', mode);
      window.history.replaceState({}, '', `${url.pathname}${url.search}`);
    } catch {
      // History API unavailable
    }
  }
}
