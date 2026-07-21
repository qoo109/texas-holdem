// Separate SFX and BGM controls; remove the temporary audio preview UI.
(() => {
  "use strict";

  if (typeof Audio !== "object" || !Audio) return;

  const originalCleanup = typeof Audio.cleanup === "function" ? Audio.cleanup.bind(Audio) : null;
  const portraitMedia = window.matchMedia("(max-width: 900px) and (orientation: portrait)");
  let resumeBgmAfterPortrait = false;

  // SFX are already gated by state.isMuted throughout the game flow.
  // Keep BGM independent when the SFX button is toggled.
  Audio.setMuted = value => Boolean(value);

  // Starting a new hand calls Audio.cleanup(). Short SFX nodes clean themselves,
  // so do not stop the continuous BGM between hands.
  Audio.cleanup = () => {};

  function removePreviewUi() {
    document.querySelector("#audioPreviewButtonC")?.remove();
    document.querySelector("#audioPreviewPanelC")?.remove();
    document.querySelector("#audioPreviewStylesC")?.remove();
  }

  function syncBgmButton() {
    const button = document.querySelector("#bgmButton");
    if (!button) return;
    const enabled = typeof Audio.isBgmEnabled === "function" && Audio.isBgmEnabled();
    button.textContent = enabled ? "🎶 BGM" : "🎵 BGM";
    button.setAttribute("aria-pressed", String(enabled));
    button.setAttribute("aria-label", enabled ? "關閉背景音樂" : "開啟背景音樂");
    button.title = enabled ? "關閉背景音樂" : "開啟背景音樂";
    button.classList.toggle("is-bgm-on", enabled);
  }

  function installBgmButton() {
    const sfxButton = document.querySelector("#muteButton");
    if (!sfxButton || document.querySelector("#bgmButton")) return;

    const style = document.createElement("style");
    style.id = "splitAudioControlsStyles";
    style.textContent = `
      #bgmButton.is-bgm-on {
        border-color: rgba(112,216,201,.58);
        background: rgba(112,216,201,.13);
        color: var(--cyan);
      }
    `;
    document.head.appendChild(style);

    const button = document.createElement("button");
    button.id = "bgmButton";
    button.className = "ghost-button tool-button";
    button.type = "button";
    sfxButton.insertAdjacentElement("afterend", button);

    button.addEventListener("click", () => {
      if (typeof Audio.toggleBgm === "function") Audio.toggleBgm();
      syncBgmButton();
    });

    syncBgmButton();
  }

  function handlePortraitChange() {
    if (portraitMedia.matches) {
      resumeBgmAfterPortrait = Boolean(Audio.isBgmEnabled?.());
      if (resumeBgmAfterPortrait) Audio.stopBgm?.({ persist: false });
    } else if (resumeBgmAfterPortrait) {
      Audio.startBgm?.({ persist: false });
      resumeBgmAfterPortrait = false;
    }
    syncBgmButton();
  }

  function install() {
    removePreviewUi();
    installBgmButton();
    setTimeout(removePreviewUi, 80);
    setTimeout(removePreviewUi, 240);
    handlePortraitChange();
  }

  if (portraitMedia.addEventListener) {
    portraitMedia.addEventListener("change", handlePortraitChange);
  } else {
    portraitMedia.addListener(handlePortraitChange);
  }

  window.addEventListener("pagehide", () => {
    try { originalCleanup?.(); } catch (_) {}
  }, { once: true });

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", () => setTimeout(install, 0), { once: true })
    : setTimeout(install, 0);
})();