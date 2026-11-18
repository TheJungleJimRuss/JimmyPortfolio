import { gzipSync } from 'node:zlib';
import type { Plugin } from 'vite';

/** Desktop JS budget in KB (1 KB = 1000 bytes, like Vite's own report): the dev.html entry and everything it imports statically. */
export const DESKTOP_BUDGET_KB = 350;

export interface BudgetChunk {
  fileName: string;
  code: string;
  imports: string[];
  isEntry: boolean;
  name: string;
}

export interface BudgetReport {
  files: { fileName: string; gzipBytes: number }[];
  totalGzipBytes: number;
  limitBytes: number;
  ok: boolean;
}

/** Chunks the Desktop loads before any stage: its entry chunk plus the transitive static imports. Dynamic imports are excluded. */
export function desktopChunks(chunks: readonly BudgetChunk[], entryName = 'dev'): BudgetChunk[] {
  const byFile = new Map(chunks.map((c) => [c.fileName, c]));
  const entry = chunks.find((c) => c.isEntry && c.name === entryName);
  if (!entry) throw new Error(`Desktop budget: no entry chunk named "${entryName}"`);
  const seen = new Set<string>();
  const stack = [entry.fileName];
  while (stack.length) {
    const file = stack.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    for (const dep of byFile.get(file)?.imports ?? []) stack.push(dep);
  }
  return [...seen].flatMap((f) => (byFile.has(f) ? [byFile.get(f)!] : []));
}

export function measureDesktop(
  chunks: readonly BudgetChunk[],
  limitKb = DESKTOP_BUDGET_KB,
  gzipSize: (code: string) => number = (code) => gzipSync(code).length,
): BudgetReport {
  const files = desktopChunks(chunks).map((c) => ({ fileName: c.fileName, gzipBytes: gzipSize(c.code) }));
  const totalGzipBytes = files.reduce((sum, f) => sum + f.gzipBytes, 0);
  const limitBytes = limitKb * 1000;
  return { files, totalGzipBytes, limitBytes, ok: totalGzipBytes <= limitBytes };
}

export function formatReport(report: BudgetReport): string {
  const kb = (n: number) => `${(n / 1000).toFixed(2)} KB`;
  const lines = report.files.map((f) => `  ${f.fileName}  ${kb(f.gzipBytes)} gzip`);
  const verdict = report.ok ? 'within budget' : 'OVER BUDGET';
  return [
    'Desktop JS budget (dev.html entry + static imports, before any stage loads):',
    ...lines,
    `  total ${kb(report.totalGzipBytes)} gzip of ${kb(report.limitBytes)} limit: ${verdict}`,
  ].join('\n');
}

/** Fails the build when the Desktop's JS exceeds the budget; always prints the sizes. */
export function desktopBudgetPlugin(): Plugin {
  return {
    name: 'desktop-js-budget',
    apply: 'build',
    generateBundle(_options, bundle) {
      const chunks: BudgetChunk[] = Object.values(bundle).flatMap((o) =>
        o.type === 'chunk'
          ? [{ fileName: o.fileName, code: o.code, imports: o.imports, isEntry: o.isEntry, name: o.name }]
          : [],
      );
      const report = measureDesktop(chunks);
      this.info(formatReport(report));
      if (!report.ok) this.error(`Desktop JS is over the ${DESKTOP_BUDGET_KB} KB gzip budget. ${formatReport(report)}`);
    },
  };
}
