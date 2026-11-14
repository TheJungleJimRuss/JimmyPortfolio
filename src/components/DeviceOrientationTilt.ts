import { createOrientationTracker } from './HeroMotion';

/** iOS-only static; not in lib.dom types. */
interface OrientationEventCtor {
  requestPermission?: () => Promise<'granted' | 'denied'>;
}

export interface OrientationWindow {
  screen: { orientation?: { angle: number } };
  addEventListener(type: 'deviceorientation', l: (e: DeviceOrientationEvent) => void): void;
  removeEventListener(type: 'deviceorientation', l: (e: DeviceOrientationEvent) => void): void;
  DeviceOrientationEvent?: OrientationEventCtor;
}

export interface DeviceOrientationTilt {
  /** Turn listening on (touch + motion allowed) or off. Off clears the pose with (null, null). */
  setEnabled(enabled: boolean): void;
  /** iOS: ask once, from inside a user gesture. Android/desktop: no-op. Denial falls back silently. */
  requestPermissionOnce(): Promise<void>;
}

/**
 * Owns the deviceorientation listener and iOS permission so the hero components stay free of
 * device APIs. Feeds normalized tilt (or null) to onTilt.
 */
export function createDeviceOrientationTilt(
  win: OrientationWindow,
  onTilt: (x: number | null, y: number | null) => void,
): DeviceOrientationTilt {
  const tracker = createOrientationTracker();
  const ctor = win.DeviceOrientationEvent;
  const needsPermission = typeof ctor?.requestPermission === 'function';
  let enabled = false;
  let granted = !needsPermission;
  let asked = false;
  let listening = false;

  const handler = (e: DeviceOrientationEvent) => {
    const sample = e.beta === null || e.gamma === null ? null : { beta: e.beta, gamma: e.gamma };
    const tilt = tracker.update(sample, win.screen.orientation?.angle ?? 0, performance.now());
    if (tilt) onTilt(tilt.x, tilt.y);
  };

  const sync = () => {
    const want = enabled && granted;
    if (want && !listening) {
      win.addEventListener('deviceorientation', handler);
      listening = true;
    } else if (!want && listening) {
      win.removeEventListener('deviceorientation', handler);
      listening = false;
      tracker.reset();
      onTilt(null, null);
    }
  };

  return {
    setEnabled(next) {
      enabled = next;
      sync();
    },
    async requestPermissionOnce() {
      if (!enabled || asked || !needsPermission) return;
      asked = true;
      try {
        granted = (await ctor!.requestPermission!()) === 'granted';
      } catch {
        granted = false;
      }
      sync();
    },
  };
}
