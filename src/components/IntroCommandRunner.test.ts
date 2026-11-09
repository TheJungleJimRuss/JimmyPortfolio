import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { IntroCommandRunner } from './IntroCommandRunner';

describe('IntroCommandRunner', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('provides a list of predefined pretend command lines', () => {
    const runner = new IntroCommandRunner();
    const sequence = runner.getCommandSequence();
    expect(sequence.length).toBeGreaterThanOrEqual(4);
    expect(sequence[0].text).toContain('./initialize_portfolio.sh');
    expect(sequence[0].delayMs).toBeGreaterThan(0);
  });

  it('runs command sequence sequentially and emits lines via callback', async () => {
    const runner = new IntroCommandRunner();
    const emittedLines: string[] = [];
    const onLine = vi.fn((line: string) => {
      emittedLines.push(line);
    });

    const runPromise = runner.run(onLine);

    // Fast-forward through delays
    await vi.runAllTimersAsync();
    await runPromise;

    expect(onLine).toHaveBeenCalledTimes(runner.getCommandSequence().length);
    expect(emittedLines[0]).toContain('./initialize_portfolio.sh');
  });

  it('cancels scheduled lines immediately on cancel()', async () => {
    const runner = new IntroCommandRunner();
    const onLine = vi.fn();

    const runPromise = runner.run(onLine);
    runner.cancel();

    await vi.runAllTimersAsync();
    await runPromise;

    expect(onLine).not.toHaveBeenCalled();
  });
});
