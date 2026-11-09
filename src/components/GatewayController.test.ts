import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GatewayController, type GatewayConfig } from './GatewayController';

describe('GatewayController', () => {
  let controller: GatewayController;
  let config: GatewayConfig;

  beforeEach(() => {
    config = {
      initialAudioEnabled: false,
      onLaunchDev: vi.fn(),
      onLaunchDrone: vi.fn(),
    };
    controller = new GatewayController();
  });

  it('initializes with default branch "none" and specified audio state', () => {
    expect(controller.getBranch()).toBe('none');
    expect(controller.isAudioEnabled()).toBe(false);
  });

  it('updates branch state when setBranch is called', () => {
    controller.setBranch('dev');
    expect(controller.getBranch()).toBe('dev');

    controller.setBranch('drone');
    expect(controller.getBranch()).toBe('drone');

    controller.setBranch('none');
    expect(controller.getBranch()).toBe('none');
  });

  it('notifies branch subscribers on branch changes', () => {
    const subscriber = vi.fn();
    controller.onBranchChange(subscriber);

    controller.setBranch('dev');
    expect(subscriber).toHaveBeenCalledWith('dev');

    controller.setBranch('drone');
    expect(subscriber).toHaveBeenCalledWith('drone');
  });

  it('toggles audio state and notifies subscribers', () => {
    const audioSub = vi.fn();
    controller.onAudioChange(audioSub);

    const newState = controller.toggleAudio();
    expect(newState).toBe(true);
    expect(controller.isAudioEnabled()).toBe(true);
    expect(audioSub).toHaveBeenCalledWith(true);

    const secondState = controller.toggleAudio();
    expect(secondState).toBe(false);
    expect(controller.isAudioEnabled()).toBe(false);
    expect(audioSub).toHaveBeenCalledWith(false);
  });

  it('triggers onLaunchDev when "d" or "D" key is pressed', () => {
    controller.mount(null, config);

    controller.handleKey({ key: 'd' });
    expect(config.onLaunchDev).toHaveBeenCalledTimes(1);

    controller.handleKey({ key: 'D' });
    expect(config.onLaunchDev).toHaveBeenCalledTimes(2);
  });

  it('triggers onLaunchDrone when "f" or "F" key is pressed', () => {
    controller.mount(null, config);

    controller.handleKey({ key: 'f' });
    expect(config.onLaunchDrone).toHaveBeenCalledTimes(1);

    controller.handleKey({ key: 'F' });
    expect(config.onLaunchDrone).toHaveBeenCalledTimes(2);
  });

  it('toggles audio when "m" or "M" key is pressed', () => {
    controller.mount(null, config);

    controller.handleKey({ key: 'm' });
    expect(controller.isAudioEnabled()).toBe(true);

    controller.handleKey({ key: 'M' });
    expect(controller.isAudioEnabled()).toBe(false);
  });

  it('identifies deep links to skip gateway if ?mode= or ?view= is present', () => {
    expect(GatewayController.hasDeepLink('?mode=dev')).toBe(true);
    expect(GatewayController.hasDeepLink('?mode=drone')).toBe(true);
    expect(GatewayController.hasDeepLink('?view=detail')).toBe(true);
    expect(GatewayController.hasDeepLink('')).toBe(false);
    expect(GatewayController.hasDeepLink('?other=123')).toBe(false);
  });

  it('cleans up handlers when disposed', () => {
    controller.mount(null, config);
    controller.dispose();

    controller.handleKey({ key: 'd' });
    // Disposed controller should not trigger callbacks
    expect(config.onLaunchDev).not.toHaveBeenCalled();
  });
});
