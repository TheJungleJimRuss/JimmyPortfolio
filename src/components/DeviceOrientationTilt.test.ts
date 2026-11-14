import { describe, it, expect, vi } from 'vitest';
import { createDeviceOrientationTilt, type OrientationWindow } from './DeviceOrientationTilt';

function fakeWindow(permission?: () => Promise<'granted' | 'denied'>) {
  const listeners = new Set<(e: Event) => void>();
  const win = {
    screen: { orientation: { angle: 0 } },
    addEventListener: (_t: string, l: (e: Event) => void) => listeners.add(l),
    removeEventListener: (_t: string, l: (e: Event) => void) => listeners.delete(l),
    DeviceOrientationEvent: permission ? { requestPermission: permission } : {},
  } as unknown as OrientationWindow;
  const fire = (beta: number | null, gamma: number | null) =>
    listeners.forEach((l) => l({ beta, gamma } as unknown as Event));
  return { win, fire, listeners };
}

describe('createDeviceOrientationTilt', () => {
  it('does not listen until enabled for touch, and stops when disabled (nulling the pose)', () => {
    const { win, fire, listeners } = fakeWindow();
    const onTilt = vi.fn();
    const t = createDeviceOrientationTilt(win, onTilt);
    expect(listeners.size).toBe(0);
    t.setEnabled(true);
    expect(listeners.size).toBe(1);
    fire(60, 0);
    expect(onTilt).toHaveBeenLastCalledWith(0, 0);
    fire(70, 0);
    expect(onTilt.mock.calls.at(-1)![1]).toBeLessThan(0);
    t.setEnabled(false);
    expect(listeners.size).toBe(0);
    expect(onTilt).toHaveBeenLastCalledWith(null, null);
  });

  it('ignores null readings (no sensor)', () => {
    const { win, fire } = fakeWindow();
    const onTilt = vi.fn();
    createDeviceOrientationTilt(win, onTilt).setEnabled(true);
    fire(null, null);
    expect(onTilt).not.toHaveBeenCalled();
  });

  it('requests iOS permission once, on demand, and falls back silently when denied', async () => {
    const req = vi.fn().mockResolvedValue('denied');
    const { win, listeners } = fakeWindow(req);
    const t = createDeviceOrientationTilt(win, vi.fn());
    t.setEnabled(true);
    expect(listeners.size).toBe(0); // iOS waits for the gesture
    await t.requestPermissionOnce();
    await t.requestPermissionOnce();
    expect(req).toHaveBeenCalledTimes(1);
    expect(listeners.size).toBe(0);
  });

  it('starts listening after iOS permission is granted', async () => {
    const { win, listeners } = fakeWindow(() => Promise.resolve('granted'));
    const t = createDeviceOrientationTilt(win, vi.fn());
    t.setEnabled(true);
    await t.requestPermissionOnce();
    expect(listeners.size).toBe(1);
  });

  it('does not request permission while disabled', async () => {
    const req = vi.fn().mockResolvedValue('granted');
    const { win } = fakeWindow(req);
    await createDeviceOrientationTilt(win, vi.fn()).requestPermissionOnce();
    expect(req).not.toHaveBeenCalled();
  });
});
