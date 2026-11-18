import { describe, it, expect } from 'vitest';
import { circuit, CIRCUIT_TICK_MS, CIRCUIT_CALM_TICK_MS, type CircuitState } from './Circuit';

const view = { width: 400, height: 300 };
const run = (steps: number, dt = 16, seed = 7, v = view, calm = false): CircuitState => {
  let s = circuit.init(seed, v, calm);
  for (let i = 0; i < steps; i++) s = circuit.step(s, dt, v);
  return s;
};
const total = (s: CircuitState): number => s.traces.reduce((n, t) => n + t.cells.length, 0);
const DX = [1, 1, 0, -1, -1, -1, 0, 1];
const DY = [0, 1, 1, 1, 0, -1, -1, -1];
const dirOf = (dx: number, dy: number): number => DX.findIndex((x, i) => x === dx && DY[i] === dy);

/** Every structural rule of a board, asserted on one state. */
function checkBoard(s: CircuitState): void {
  const seen = new Map<number, number>(); // cell -> trace id
  s.traces.forEach((t, id) => {
    t.cells.forEach((c, i) => {
      expect(c).toBeGreaterThanOrEqual(0);
      expect(c).toBeLessThan(s.cols * s.rows);
      expect(seen.has(c)).toBe(false); // never overlaps an occupied cell
      seen.set(c, id);
      expect(s.occ[c]).toBe(1);
      if (i > 0) {
        const p = t.cells[i - 1];
        const dx = (c % s.cols) - (p % s.cols);
        const dy = Math.floor(c / s.cols) - Math.floor(p / s.cols);
        expect(Math.abs(dx)).toBeLessThanOrEqual(1);
        expect(Math.abs(dy)).toBeLessThanOrEqual(1);
        expect(dx !== 0 || dy !== 0).toBe(true);
        if (i > 1) {
          const q = t.cells[i - 2];
          const d0 = dirOf((p % s.cols) - (q % s.cols), Math.floor(p / s.cols) - Math.floor(q / s.cols));
          const d1 = dirOf(dx, dy);
          const turn = (d1 - d0 + 8) % 8;
          expect([0, 1, 7]).toContain(turn); // at most 45 degrees per step
        }
      }
    });
  });
  expect(seen.size).toBe(s.occ.reduce((n, v) => n + v, 0));
  // Nothing touches: only consecutive cells of one trace may be 8-adjacent.
  for (const [c, id] of seen) {
    const cx = c % s.cols;
    const cy = Math.floor(c / s.cols);
    for (let k = 0; k < 8; k++) {
      const nx = cx + DX[k];
      const ny = cy + DY[k];
      if (nx < 0 || ny < 0 || nx >= s.cols || ny >= s.rows) continue;
      const other = seen.get(ny * s.cols + nx);
      if (other === undefined) continue;
      expect(other).toBe(id);
      const cells = s.traces[id].cells;
      expect(Math.abs(cells.indexOf(c) - cells.indexOf(ny * s.cols + nx))).toBe(1);
    }
  }
}

describe('circuit', () => {
  it('is deterministic per seed', () => {
    expect(run(300, 16, 7)).toEqual(run(300, 16, 7));
    expect(run(300, 16, 7)).not.toEqual(run(300, 16, 8));
  });
  it('keeps a legal board: orthogonal or 45 degree single steps, no overlap, no touching', () => {
    let s = circuit.init(3, view, false);
    for (let i = 0; i < 400; i++) {
      s = circuit.step(s, 16, view);
      if (i % 20 === 0) checkBoard(s);
    }
    checkBoard(s);
    expect(total(s)).toBeGreaterThan(50);
  });
  it('actually uses diagonals and straight runs', () => {
    const s = run(1500, 16, 11);
    let diag = 0;
    let straight = 0;
    for (const t of s.traces) {
      for (let i = 1; i < t.cells.length; i++) {
        const dx = (t.cells[i] % s.cols) - (t.cells[i - 1] % s.cols);
        const dy = Math.floor(t.cells[i] / s.cols) - Math.floor(t.cells[i - 1] / s.cols);
        if (dx !== 0 && dy !== 0) diag++;
        else straight++;
      }
    }
    expect(diag).toBeGreaterThan(0);
    expect(straight).toBeGreaterThan(diag / 4);
  });
  it('places via dots on traced cells', () => {
    let any = false;
    for (let seed = 1; seed < 6 && !any; seed++) {
      const s = run(1500, 16, seed);
      any = s.vias.length > 0;
      for (const v of s.vias) expect(s.occ[v]).toBe(1);
    }
    expect(any).toBe(true);
  });
  it('stays inside the viewport over thousands of steps and after a resize', () => {
    let s = circuit.init(5, view, false);
    for (let i = 0; i < 3000; i++) {
      s = circuit.step(s, 50, view);
      expect(s.cols * s.cellX).toBeCloseTo(view.width);
      expect(s.rows * s.cellY).toBeCloseTo(view.height);
      expect(s.alpha).toBeGreaterThanOrEqual(0);
      expect(s.alpha).toBeLessThanOrEqual(1);
    }
    for (const nv of [{ width: 200, height: 600 }, { width: 1600, height: 900 }, { width: 80, height: 60 }]) {
      s = circuit.step(s, 16, nv);
      expect(s.width).toBe(nv.width);
      expect(s.occ.length).toBe(s.cols * s.rows);
      expect(s.cols * s.cellX).toBeCloseTo(nv.width);
      expect(s.rows * s.cellY).toBeCloseTo(nv.height);
      checkBoard(s);
      for (let i = 0; i < 200; i++) s = circuit.step(s, 16, nv);
      checkBoard(s);
    }
  });
  it('keeps state bounded', () => {
    let s = circuit.init(9, view, false);
    for (let i = 0; i < 5000; i++) {
      s = circuit.step(s, 50, view);
      expect(total(s)).toBeLessThanOrEqual(s.cols * s.rows);
      expect(s.vias.length).toBeLessThanOrEqual(s.cols * s.rows);
      expect(s.traces.length).toBeLessThanOrEqual(s.cols * s.rows);
    }
  });
  it('holds, fades out and restarts when the board is done', () => {
    const small = { width: 160, height: 120 };
    let s = circuit.init(2, small, false);
    const phases = new Set<string>();
    let restarted = false;
    let prev = total(s);
    for (let i = 0; i < 4000; i++) {
      const before = s.alpha;
      s = circuit.step(s, 50, small);
      phases.add(s.phase);
      expect(Math.abs(s.alpha - before)).toBeLessThanOrEqual(0.5); // fades, not cuts
      const now = total(s);
      if (now < prev - 5) {
        restarted = true;
        expect(s.alpha).toBeLessThan(0.1); // the new board fades in from nothing
        checkBoard(s);
      }
      prev = now;
    }
    expect(phases.has('hold')).toBe(true);
    expect(phases.has('out')).toBe(true);
    expect(restarted).toBe(true);
  });
  it('calm grows at about a tenth of the live pace and stores calm in state', () => {
    expect(CIRCUIT_CALM_TICK_MS / CIRCUIT_TICK_MS).toBeCloseTo(10);
    expect(circuit.init(4, view, true).calm).toBe(true);
    const grown = (calm: boolean): number => {
      let s = circuit.init(4, view, calm);
      const base = total(s);
      for (let i = 0; i < 100; i++) s = circuit.step(s, 30, view); // 3 s
      return total(s) - base;
    };
    const live = grown(false);
    const calm = grown(true);
    expect(live).toBeGreaterThan(0);
    expect(calm / live).toBeGreaterThan(0.04);
    expect(calm / live).toBeLessThan(0.25);
  });
  it('does not mutate the previous state', () => {
    const s = run(100, 16, 6);
    const snap = structuredClone(s);
    circuit.step(s, 16, view);
    circuit.step(s, 500, view);
    expect(s).toEqual(snap);
  });
});
