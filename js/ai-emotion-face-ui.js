// Show AI mood as a compact facial emoji instead of a text badge.
(() => {
  "use strict";

  const EMOTION_FACES = Object.freeze({
    fresh: "🤩",
    calm: "😌",
    confident: "😎",
    tilted: "😤",
    cautious: "😰",
  });

  function emotionFace(emotion) {
    return EMOTION_FACES[emotion] || EMOTION_FACES.calm;
  }

  function emotionCopy(emotion) {
    if (typeof aiEmotionMeta !== "function") return "目前情緒";
    const meta = aiEmotionMeta(emotion);
    return `${meta.label}：${meta.detail}`;
  }

  function createFaceBadge(player, profile = false) {
    const badge = document.createElement("span");
    badge.className = profile ? "ai-emotion-face-badge is-profile" : "ai-emotion-face-badge";
    badge.textContent = emotionFace(player.emotion);
    badge.title = emotionCopy(player.emotion);
    badge.setAttribute("aria-label", emotionCopy(player.emotion));
    return badge;
  }

  function decorateSeat(seat) {
    const position = Number(seat.dataset.profilePosition);
    const player = state.players?.find(candidate => !candidate.isHuman && candidate.position === position);
    if (!player) return;

    seat.querySelector(".seat-header > .emotion-chip")?.remove();
    const avatar = seat.querySelector(".player-emoji");
    if (!avatar) return;

    avatar.querySelector(".ai-emotion-face-badge")?.remove();
    avatar.appendChild(createFaceBadge(player));
  }

  function decorateProfile() {
    const panel = document.querySelector("#aiProfilePanel");
    if (!panel || panel.hidden) return;
    const player = state.players?.find(candidate => !candidate.isHuman && candidate.position === state.selectedProfilePosition);
    if (!player) return;

    panel.querySelector(".ai-profile-tags .emotion-chip")?.remove();
    panel.querySelectorAll(".ai-profile-now > span").forEach(item => {
      if (item.textContent.trim().startsWith("情緒")) item.remove();
    });

    const avatar = panel.querySelector(".ai-profile-avatar");
    if (!avatar) return;
    avatar.querySelector(".ai-emotion-face-badge")?.remove();
    avatar.appendChild(createFaceBadge(player, true));
  }

  function decorateEmotionFaces() {
    document.querySelectorAll(".seat[data-profile-position]").forEach(decorateSeat);
    decorateProfile();
  }

  function installStyles() {
    if (document.querySelector("#aiEmotionFaceStyles")) return;
    const style = document.createElement("style");
    style.id = "aiEmotionFaceStyles";
    style.textContent = `
      html body .seat-header {
        grid-template-rows: repeat(2, 23px) !important;
        min-height: 66px !important;
      }
      html body .seat-header .seat-identity {
        grid-row: 1 / 3 !important;
      }
      html body .seat-header .seat-status {
        grid-row: 2 !important;
      }
      html body .seat-header > .emotion-chip {
        display: none !important;
      }
      html body .player-emoji,
      html body .ai-profile-avatar {
        position: relative !important;
        overflow: visible !important;
      }
      .ai-emotion-face-badge {
        position: absolute;
        z-index: 4;
        right: -8px;
        bottom: -7px;
        display: grid;
        place-items: center;
        width: 19px;
        height: 19px;
        border: 1px solid rgba(255,255,255,.65);
        border-radius: 999px;
        background: rgba(5,13,16,.94);
        font-size: .72rem;
        line-height: 1;
        box-shadow: 0 4px 10px rgba(0,0,0,.32);
        pointer-events: none;
      }
      .ai-emotion-face-badge.is-profile {
        right: -7px;
        bottom: -6px;
        width: 23px;
        height: 23px;
        font-size: .88rem;
      }
      .ai-profile-tags .emotion-chip,
      .ai-profile-now > span[data-emotion],
      .seat-header > .emotion-chip {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  const originalRender = window.render;
  if (typeof originalRender === "function") {
    window.render = function renderWithEmotionFaces(...args) {
      const result = originalRender.apply(this, args);
      decorateEmotionFaces();
      return result;
    };
  }

  installStyles();
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", decorateEmotionFaces, { once: true })
    : decorateEmotionFaces();

  window.AiEmotionFaceUI = {
    faces: { ...EMOTION_FACES },
    refresh: decorateEmotionFaces,
  };
})();
