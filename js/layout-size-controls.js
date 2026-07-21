// Balanced card sizes + user-adjustable size controls inside the existing layout editor.
(() => {
  "use strict";

  const STORAGE_KEY = "texasHoldemLayoutSizesV1";
  const DEFAULTS = Object.freeze({
    heroCard: 92,
    boardCard: 86,
    aiCard: 44,
    aiSeat: 158,
    aiProfile: 272,
  });

  const LIMITS = Object.freeze({
    heroCard: [70, 115],
    boardCard: [65, 105],
    aiCard: [32, 58],
    aiSeat: [142, 188],
    aiProfile: [230, 330],
  });

  const CSS_VARS = Object.freeze({
    heroCard: "--layout-hero-card-width",
    boardCard: "--layout-board-card-width",
    aiCard: "--layout-ai-card-width",
    aiSeat: "--layout-ai-seat-width",
    aiProfile: "--layout-ai-profile-width",
  });

  let sizes = readSavedSizes();

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function normalize(raw) {
    const normalized = { ...DEFAULTS };
    Object.keys(DEFAULTS).forEach(key => {
      const [min, max] = LIMITS[key];
      const value = Number(raw?.[key]);
      if (Number.isFinite(value)) normalized[key] = Math.round(clamp(value, min, max));
    });
    return normalized;
  }

  function readSavedSizes() {
    try {
      return normalize(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null"));
    } catch (_) {
      return { ...DEFAULTS };
    }
  }

  function saveSizes() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sizes));
    } catch (error) {
      console.warn("Layout size settings were not saved:", error);
    }
  }

  function applySizes() {
    const root = document.documentElement;
    Object.keys(CSS_VARS).forEach(key => {
      root.style.setProperty(CSS_VARS[key], `${sizes[key]}px`);
    });
    syncControls();
    requestAnimationFrame(() => {
      if (typeof applyLayoutPanelPosition === "function") applyLayoutPanelPosition();
    });
  }

  function setSize(key, value, { persist = true } = {}) {
    if (!(key in DEFAULTS)) return;
    const [min, max] = LIMITS[key];
    sizes[key] = Math.round(clamp(Number(value) || DEFAULTS[key], min, max));
    if (persist) saveSizes();
    applySizes();
  }

  function resetSizes() {
    sizes = { ...DEFAULTS };
    try { localStorage.removeItem(STORAGE_KEY); } catch (_) {}
    applySizes();
    if (typeof announce === "function") announce("牌卡與資訊卡大小已還原");
  }

  function syncControls() {
    document.querySelectorAll("[data-layout-size]").forEach(input => {
      const key = input.dataset.layoutSize;
      if (!(key in sizes)) return;
      input.value = String(sizes[key]);
      const output = document.querySelector(`[data-layout-size-output="${key}"]`);
      if (output) output.textContent = `${sizes[key]}px`;
    });
  }

  function installStyles() {
    if (document.querySelector("#layoutSizeControlStyles")) return;
    const style = document.createElement("style");
    style.id = "layoutSizeControlStyles";
    style.textContent = `
      :root {
        --layout-hero-card-width: 92px;
        --layout-board-card-width: 86px;
        --layout-ai-card-width: 44px;
        --layout-ai-seat-width: 158px;
        --layout-ai-profile-width: 272px;
      }

      html body #playerCards .card {
        width: clamp(70px, min(var(--layout-hero-card-width), 10vw), 115px) !important;
      }
      html body .board-cards .card {
        width: clamp(65px, min(var(--layout-board-card-width), 7.2vw), 105px) !important;
      }
      html body .seat .card {
        width: clamp(32px, min(var(--layout-ai-card-width), 5vw), 58px) !important;
      }

      html body .seat,
      html body .seat-header {
        width: clamp(142px, min(var(--layout-ai-seat-width), 16vw), 188px) !important;
        inline-size: clamp(142px, min(var(--layout-ai-seat-width), 16vw), 188px) !important;
        max-width: clamp(142px, min(var(--layout-ai-seat-width), 16vw), 188px) !important;
      }
      html body .seat-header {
        min-height: 58px !important;
        padding-top: 9px !important;
        padding-bottom: 8px !important;
      }
      html body .player-emoji {
        width: 29px !important;
        height: 29px !important;
        font-size: 1.14rem !important;
      }
      html body .seat h2 {
        font-size: .94rem !important;
      }

      html body .ai-profile-panel {
        width: clamp(230px, min(var(--layout-ai-profile-width), 31vw), 330px) !important;
        padding: 12px !important;
      }
      html body .ai-profile-avatar {
        width: 44px !important;
        height: 44px !important;
        font-size: 1.52rem !important;
      }

      .layout-editor-panel {
        max-height: calc(100% - 16px);
        overflow: auto;
      }
      .layout-size-controls {
        display: grid;
        gap: 7px;
        padding-top: 9px;
        border-top: 1px solid rgba(255,255,255,.1);
      }
      .layout-size-controls-head {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }
      .layout-size-controls-head strong {
        margin: 0;
        color: var(--gold);
        font-size: .76rem;
      }
      .layout-size-controls-head button {
        min-width: 0;
        min-height: 26px;
        padding: 3px 8px;
        border-radius: 7px;
        font-size: .64rem;
      }
      .layout-size-row {
        display: grid;
        grid-template-columns: 76px minmax(80px, 1fr) 43px;
        align-items: center;
        gap: 7px;
        color: var(--muted);
        font-size: .66rem;
        font-weight: 820;
      }
      .layout-size-row input {
        width: 100%;
        min-width: 0;
      }
      .layout-size-row output {
        color: var(--ink);
        text-align: right;
        font-variant-numeric: tabular-nums;
      }
      .layout-size-note {
        margin: 0;
        color: rgba(172,192,186,.78);
        font-size: .6rem;
        line-height: 1.35;
      }
    `;
    document.head.appendChild(style);
  }

  function sliderRow(key, label) {
    const [min, max] = LIMITS[key];
    return `
      <label class="layout-size-row">
        <span>${label}</span>
        <input type="range" min="${min}" max="${max}" step="1" value="${sizes[key]}" data-layout-size="${key}" aria-label="${label}大小" />
        <output data-layout-size-output="${key}">${sizes[key]}px</output>
      </label>`;
  }

  function installControls() {
    const panel = document.querySelector("#layoutEditorPanel");
    if (!panel || panel.querySelector("#layoutSizeControls")) return;

    const section = document.createElement("section");
    section.id = "layoutSizeControls";
    section.className = "layout-size-controls";
    section.innerHTML = `
      <div class="layout-size-controls-head">
        <strong>牌卡與資訊卡大小</strong>
        <button id="resetLayoutSizesButton" type="button">還原大小</button>
      </div>
      ${sliderRow("heroCard", "我的手牌")}
      ${sliderRow("boardCard", "公共牌")}
      ${sliderRow("aiCard", "AI 手牌")}
      ${sliderRow("aiSeat", "AI 資訊卡")}
      ${sliderRow("aiProfile", "AI 詳細卡")}
      <p class="layout-size-note">拖曳時即時預覽，調整後會自動儲存在這台裝置。</p>
    `;

    const dialogueControls = panel.querySelector("#dialogueArrowControls");
    panel.insertBefore(section, dialogueControls || null);

    section.addEventListener("input", event => {
      const input = event.target.closest("[data-layout-size]");
      if (!input) return;
      setSize(input.dataset.layoutSize, input.value);
    });

    section.querySelector("#resetLayoutSizesButton")?.addEventListener("click", resetSizes);
    document.querySelector("#resetLayoutButton")?.addEventListener("click", resetSizes);

    const status = document.querySelector("#layoutStatus");
    if (status && status.textContent.includes("拖曳牌桌元素")) {
      status.textContent = "拖曳位置，也可調整牌卡與資訊卡大小";
    }

    syncControls();
    requestAnimationFrame(() => {
      if (typeof applyLayoutPanelPosition === "function") applyLayoutPanelPosition();
    });
  }

  function install() {
    installStyles();
    applySizes();
    installControls();
  }

  window.LayoutSizeController = {
    getSizes: () => ({ ...sizes }),
    setSize,
    reset: resetSizes,
  };

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", install, { once: true })
    : install();
})();
