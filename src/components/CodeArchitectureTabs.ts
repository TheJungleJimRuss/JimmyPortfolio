import { siteConfig, type CodeTabItem } from '../config/siteConfig';
import { tactileAudio } from './TactileAudio';

export function initCodeArchitectureTabs(): void {
  const tabStrip = document.getElementById('codeTabStrip');
  const subsystemTitle = document.getElementById('codeSubsystemTitle');
  const subsystemDesc = document.getElementById('codeSubsystemDesc');
  const codeBlock = document.getElementById('codeInspectorPre');
  const highlightsFooter = document.getElementById('codeHighlightsFooter');
  const copyCodeBtn = document.getElementById('copyCodeSnippetBtn');

  if (!tabStrip || !codeBlock) return;

  let currentTab: CodeTabItem = siteConfig.codeTabs[0];

  function renderActiveTab(item: CodeTabItem) {
    currentTab = item;
    if (subsystemTitle) subsystemTitle.textContent = `${item.subsystem} (${item.language})`;
    if (subsystemDesc) subsystemDesc.textContent = item.description;
    if (codeBlock) codeBlock.textContent = item.code;

    if (highlightsFooter) {
      highlightsFooter.innerHTML = item.highlights
        .map((h) => `<div><span style="color: var(--accent-primary);">&#9656;</span> ${h}</div>`)
        .join('');
    }
  }

  tabStrip.innerHTML = siteConfig.codeTabs
    .map(
      (tab, idx) => `
      <button
        type="button"
        class="code-tab-btn ${idx === 0 ? 'active' : ''}"
        data-tab-id="${tab.id}"
      >
        ${tab.filename}
      </button>
    `
    )
    .join('');

  tabStrip.querySelectorAll<HTMLButtonElement>('.code-tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-tab-id');
      const found = siteConfig.codeTabs.find((t) => t.id === id);
      if (!found) return;

      tactileAudio.playTick(960);
      tabStrip.querySelectorAll('.code-tab-btn').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      renderActiveTab(found);
    });
  });

  copyCodeBtn?.addEventListener('click', () => {
    tactileAudio.playConfirmChime();
    navigator.clipboard.writeText(currentTab.code).then(() => {
      const orig = copyCodeBtn.textContent;
      copyCodeBtn.textContent = 'COPIED TO CLIPBOARD';
      setTimeout(() => {
        copyCodeBtn.textContent = orig;
      }, 2200);
    });
  });

  renderActiveTab(siteConfig.codeTabs[0]);
}
