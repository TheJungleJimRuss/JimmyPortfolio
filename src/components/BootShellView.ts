import { totalRows, type BootFrame, type BootLines } from './BootShell';

/** Thin DOM adapter: builds the Boot shell rows once and paints frames. No logic beyond painting. */
export interface BootShellViewLike {
  /** Paints one frame; `null` shows only the waiting state (prompt, cursor, hint). */
  render(frame: BootFrame | null): void;
  /** Hides everything after the shell has handed over. */
  dispose(): void;
}

export function createBootShellView(overlay: HTMLElement, lines: BootLines): BootShellViewLike {
  const doc = overlay.ownerDocument;
  const shell = doc.createElement('div');
  shell.className = 'boot-shell';

  const row = (cls = ''): HTMLDivElement => {
    const el = doc.createElement('div');
    el.className = `boot-row ${cls}`.trim();
    return el;
  };

  const promptRow = row();
  const prefix = doc.createElement('span');
  prefix.textContent = `${lines.promptPrefix} `;
  const command = doc.createElement('span');
  promptRow.append(prefix, command);

  const outputRows = [...lines.output, lines.final].map((text) => {
    const el = row();
    el.textContent = text;
    el.hidden = true;
    return el;
  });
  const hint = row('boot-hint');
  hint.textContent = lines.hint;

  const cursor = doc.createElement('span');
  cursor.className = 'boot-cursor';
  cursor.setAttribute('aria-hidden', 'true');
  promptRow.append(cursor);

  shell.append(promptRow, ...outputRows, hint);
  overlay.replaceChildren(shell);

  return {
    render(frame) {
      if (frame === null) {
        hint.hidden = false;
        return;
      }
      hint.hidden = true;
      command.textContent = lines.command.slice(0, frame.commandChars);
      outputRows.forEach((el, i) => {
        el.hidden = i >= frame.rows;
      });
      // The cursor trails the last visible row, like a terminal.
      const last = frame.rows > 0 ? outputRows[Math.min(frame.rows, totalRows(lines)) - 1] : promptRow;
      last.append(cursor);
    },
    dispose() {
      shell.hidden = true;
    },
  };
}
