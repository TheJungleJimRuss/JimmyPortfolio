/**
 * Keeps page-wide layers (the Phosphor cursor, then the CRT overlay) above every other top-layer element. The Power
 * menu and Settings panel are popovers, which the browser puts in the top layer above any z-index; the last element
 * shown there is drawn on top. So each layer is a `popover="manual"` element, re-shown in order whenever another
 * popover opens. Manual popovers take no part in light dismiss, so this never closes the menus. Without the
 * Popover API the layers stay ordinary fixed elements ordered by z-index.
 */
export function keepOnTopLayer(layers: readonly HTMLElement[], doc: Document = document): void {
  if (!Object.hasOwn(HTMLElement.prototype, 'popover')) return;
  const raise = (): void => {
    for (const el of layers) {
      if (el.matches(':popover-open')) el.hidePopover();
      el.showPopover();
    }
  };
  raise();
  // `toggle` does not bubble; a capture listener on the document still sees every popover's.
  doc.addEventListener('toggle', (e) => {
    const t = e.target;
    if ((e as ToggleEvent).newState === 'open' && t instanceof HTMLElement && !layers.includes(t)) raise();
  }, true);
}
