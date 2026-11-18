import { describe, expect, it } from 'vitest';
import { desktopChunks, measureDesktop, type BudgetChunk } from './desktopBudget';

const chunk = (fileName: string, imports: string[] = [], isEntry = false, name = fileName): BudgetChunk => ({
  fileName,
  code: fileName,
  imports,
  isEntry,
  name,
});

const chunks = [
  chunk('dev.js', ['shared.js'], true, 'dev'),
  chunk('shared.js'),
  chunk('main.js', ['three.js'], true, 'main'),
  chunk('three.js'),
];
const size = (code: string) => (code === 'dev.js' ? 100_000 : 200_000);

describe('Desktop budget', () => {
  it('counts the dev entry and its static imports only', () => {
    expect(desktopChunks(chunks).map((c) => c.fileName).sort()).toEqual(['dev.js', 'shared.js']);
  });

  it('passes at exactly the limit and fails one byte over', () => {
    expect(measureDesktop(chunks, 300, size).ok).toBe(true);
    expect(measureDesktop(chunks, 299.999, size).ok).toBe(false);
  });

  it('throws when the dev entry is missing', () => {
    expect(() => desktopChunks([chunk('main.js', [], true, 'main')])).toThrow(/dev/);
  });
});
