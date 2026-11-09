import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PersonaController } from './PersonaController';

describe('PersonaController', () => {
  let mockStorage: Record<string, string>;

  beforeEach(() => {
    mockStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockStorage[key] ?? null,
      setItem: (key: string, value: string) => { mockStorage[key] = value; },
      removeItem: (key: string) => { delete mockStorage[key]; },
      clear: () => { mockStorage = {}; },
    });

    vi.stubGlobal('window', {
      location: {
        search: '',
        pathname: '/',
      },
      history: {
        replaceState: vi.fn(),
      },
    });
  });

  it('defaults to "dev" mode when no url param or stored preference exists', () => {
    const controller = new PersonaController();
    expect(controller.getMode()).toBe('dev');
  });

  it('initializes to "drone" when ?mode=drone is present in URL search', () => {
    window.location.search = '?mode=drone';
    const controller = new PersonaController();
    expect(controller.getMode()).toBe('drone');
  });

  it('falls back to "dev" when URL param is invalid', () => {
    window.location.search = '?mode=unknown_persona';
    const controller = new PersonaController();
    expect(controller.getMode()).toBe('dev');
  });

  it('reads from localStorage when no URL search param is present', () => {
    mockStorage['portfolio_persona'] = 'drone';
    const controller = new PersonaController();
    expect(controller.getMode()).toBe('drone');
  });

  it('prefers URL search parameter over localStorage', () => {
    mockStorage['portfolio_persona'] = 'dev';
    window.location.search = '?mode=drone';
    const controller = new PersonaController();
    expect(controller.getMode()).toBe('drone');
  });

  it('toggles mode and notifies subscribers', () => {
    const controller = new PersonaController();
    const listener = vi.fn();
    const unsubscribe = controller.subscribe(listener);

    controller.toggle();
    expect(controller.getMode()).toBe('drone');
    expect(listener).toHaveBeenCalledWith('drone');
    expect(mockStorage['portfolio_persona']).toBe('drone');

    controller.toggle();
    expect(controller.getMode()).toBe('dev');
    expect(listener).toHaveBeenCalledWith('dev');
    expect(mockStorage['portfolio_persona']).toBe('dev');

    unsubscribe();
    controller.toggle();
    expect(listener).toHaveBeenCalledTimes(2);
  });
});
