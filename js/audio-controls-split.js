// Separate SFX and BGM toggles with independent 0–100% volume controls.
(() => {
  "use strict";

  if (typeof Audio !== "object" || !Audio) return;

  const BGM_DEFAULT_MIGRATION_KEY = "texasHoldemBgmDefault60V1";
  const originalCleanup = typeof Audio.cleanup === "function" ? Audio.cleanup.bind(Audio) : null;
  const portraitMedia = window.matchMedia("(max-width: 900px) and (orientation: portrait)");
  let resumeBgmAfterPortrait = false;

  // SFX are already gated by state.isMuted in the game flow. Keep BGM independent.
  Audio.setMuted = value => Boolean(value);

  // Short SFX nodes clean themselves. Do not stop the continuous BGM between hands.
  Audio.cleanup = () => {};

  function applyDefaultVolumes() {
    try {
      if (!localStorage.getItem(BGM_DEFAULT_MIGRATION_KEY)) {
        Audio.setBgmVolume?.(0.6);
        localStorage.setItem(BGM_DEFAULT_MIGRATION_KEY, "true");
      }
    } catch (_) {
      // Use the engine's current value when storage is unavailable.
    }
  }

  function removePreviewUi() {
    document.querySelector("#audioPreviewButtonC")?.remove();
    document.querySelector("#audioPreviewPanelC")?.remove();
    document.querySelector("#audioPreviewStylesC")?.remove();
  }

  function syncBgmButton() {
    const button = document.querySelector("#bgmButton");
    if (!button) return;
    const enabled = Boolean(Audio.isBgmEnabled?.());
    button.textContent = enabled ? "🎶 BGM" : "🎵 BGM";
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "關閉背景音樂" : "開啟背景音樂");
    button.title = enabled ? "關閉背景音樂" : "開啟背景音樂";
    button.classList.toggle("is-bgm-on", enabled);
  }

  function syncVolumeControls() {
    const sfxSlider = document.querySelector("#sfxVolumeSlider");
    const bgmSlider = document.querySelector("#bgmVolumeSlider");
    const sfxOutput = document.querySelector("#sfxVolumeOutput");
    const bgmOutput = document.querySelector("#bgmVolumeOutput");
    const sfxPercent = Math.round((Audio.getSfxVolume?.() ?? 0.6) * 100);
    const bgmPercent = Math.round((Audio.getBgmVolume?.() ?? 0.6) * 100);

    if (sfxSlider) sfxSlider.value = String(sfxPercent);
    if (bgmSlider) bgmSlider.value = String(bgmPercent);
    if (sfxOutput) sfxOutput.textContent = `${sfxPercent}%`;
    if (bgmOutput) bgmOutput.textContent = `${bgmPercent}%`;
  }

  function closeVolumePanel() {
    const panel = document.querySelector("#audioVolumePanel");
    const button = document.querySelector("#audioVolumeButton");
    if (!panel || !button) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  function installControls() {
    const sfxButton = document.querySelector("#muteButton");
    if (!sfxButton || document.querySelector("#bgmButton")) return;

    applyDefaultVolumes();

    const style = document.createElement("style");
    style.id = "splitAudioControlsStyles";
    style.textContent = `
      #bgmButton.is-bgm-on {
        border-color: rgba(112,216,201,.58);
        background: rgba(112,216,201,.13);
        color: var(--cyan);
      }
      #audioVolumeButton[aria-expanded="true"] {
        border-color: rgba(240,194,94,.55);
        background: rgba(240,194,94,.12);
        color: var(--gold);
      }
      .audio-volume-panel {
        position: fixed;
        z-index: 190;
        top: 72px;
        right: 16px;
        width: min(330px, calc(100vw - 24px));
        padding: 13px;
        border: 1px solid rgba(240,194,94,.34);
        border-radius: 13px;
        background: rgba(5,13,17,.97);
        color: var(--ink);
        box-shadow: 0 22px 54px rgba(0,0,0,.48);
        backdrop-filter: blur(18px);
      }
      .audio-volume-panel[hidden] { display: none; }
      :root[data-theme="light"] .audio-volume-panel {
        background: rgba(255,250,239,.98);
        border-color: rgba(95,69,35,.22);
      }
      .audio-volume-panel h2 { margin: 0 0 10px; font-size: .86rem; }
      .audio-volume-row {
        display: grid;
        grid-template-columns: 72px 1fr 42px;
        align-items: center;
        gap: 9px;
        min-height: 38px;
        color: var(--muted);
        font-size: .7rem;
        font-weight: 800;
      }
      .audio-volume-row input { width: 100%; }
      .audio-volume-row output { color: var(--ink); text-align: right; font-variant-numeric: tabular-nums; }
      .audio-volume-note { margin: 9px 0 0; color: var(--muted); font-size: .62rem; text-align: center; }
      @media (max-width: 620px) {
        .audio-volume-panel { top: 56px; right: 10px; }
      }
    `;
    document.head.appendChild(style);

    const bgmButton = document.createElement("button");
    bgmButton.id = "bgmButton";
    bgmButton.className = "ghost-button tool-button";
    bgmButton.type = "button";
    sfxButton.insertAdjacentElement("afterend", bgmButton);

    const volumeButton = document.createElement("button");
    volumeButton.id = "audioVolumeButton";
    volumeButton.className = "ghost-button tool-button";
    volumeButton.type = "button";
    volumeButton.textContent = "🎚 音量";
    volumeButton.setAttribute("aria-expanded", "false");
    volumeButton.setAttribute("aria-controls", "audioVolumePanel");
    bgmButton.insertAdjacentElement("afterend", volumeButton);

    const panel = document.createElement("section");
    panel.id = "audioVolumePanel";
    panel.className = "audio-volume-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "音效與背景音樂音量");
    panel.innerHTML = `
      <h2>音量控制</h2>
      <label class="audio-volume-row">
        <span>🔊 音效</span>
        <input id="sfxVolumeSlider" type="range" min="0" max="100" step="1" value="60" aria-label="遊戲音效音量" />
        <output id="sfxVolumeOutput">60%</output>
      </label>
      <label class="audio-volume-row">
        <span>🎵 BGM</span>
        <input id="bgmVolumeSlider" type="range" min="0" max="100" step="1" value="60" aria-label="背景音樂音量" />
        <output id="bgmVolumeOutput">60%</output>
      </label>
      <p class="audio-volume-note">兩者可獨立調整，範圍 0～100%。</p>
    `;
    document.body.appendChild(panel);

    bgmButton.addEventListener("click", () => {
      Audio.toggleBgm?.();
      syncBgmButton();
    });

    volumeButton.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      volumeButton.setAttribute("aria-expanded", String(!panel.hidden));
      if (!panel.hidden) syncVolumeControls();
    });

    panel.querySelector("#sfxVolumeSlider")?.addEventListener("input", event => {
      Audio.setSfxVolume?.(Number(event.target.value) / 100);
      syncVolumeControls();
    });

    panel.querySelector("#bgmVolumeSlider")?.addEventListener("input", event => {
      Audio.setBgmVolume?.(Number(event.target.value) / 100);
      syncVolumeControls();
    });

    document.addEventListener("click", event => {
      if (!panel.hidden && !panel.contains(event.target) && !volumeButton.contains(event.target)) closeVolumePanel();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) closeVolumePanel();
    });

    syncBgmButton();
    syncVolumeControls();
  }

  function handlePortraitChange() {
    if (portraitMedia.matches) {
      resumeBgmAfterPortrait = Boolean(Audio.isBgmEnabled?.());
      if (resumeBgmAfterPortrait) Audio.stopBgm?.({ persist: false });
      closeVolumePanel();
    } else if (resumeBgmAfterPortrait) {
      Audio.startBgm?.({ persist: false });
      resumeBgmAfterPortrait = false;
    }
    syncBgmButton();
  }

  function install() {
    removePreviewUi();
    installControls();
    setTimeout(removePreviewUi, 80);
    setTimeout(removePreviewUi, 240);
    handlePortraitChange();
  }

  if (portraitMedia.addEventListener) portraitMedia.addEventListener("change", handlePortraitChange);
  else portraitMedia.addListener(handlePortraitChange);

  window.addEventListener("pagehide", () => {
    try { Audio.cleanupSfx?.(); } catch (_) {}
    try { originalCleanup?.(); } catch (_) {}
  }, { once: true });

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", () => setTimeout(install, 0), { once: true })
    : setTimeout(install, 0);
})();
