// Prominent AI turn focus with glow only.
(() => {
  "use strict";

  if (typeof window.render !== "function") return;

  const originalRender = window.render;

  function currentThinkingPlayer() {
    if (state.handOver || state.currentActorIndex <= 0) return null;
    const player = state.players?.[state.currentActorIndex];
    if (!player || player.isHuman || player.folded || player.allIn) return null;
    return String(player.status || "").includes("Thinking") ? player : null;
  }

  function seatFor(player) {
    return document.querySelector(`.seat[data-profile-position="${player.position}"]`);
  }

  function removeTurnVisuals() {
    document.querySelectorAll(".seat.ai-turn-active").forEach(seat => {
      seat.classList.remove("ai-turn-active");
    });
  }

  function ensureVisuals(player) {
    const seat = seatFor(player);
    if (!seat) return null;

    seat.classList.add("ai-turn-active");
    return seat;
  }

  function syncTurnIndicator() {
    const player = currentThinkingPlayer();
    document.querySelectorAll(".seat.ai-turn-active").forEach(seat => {
      if (!player || Number(seat.dataset.profilePosition) !== player.position) {
        seat.classList.remove("ai-turn-active");
      }
    });

    if (!player) {
      return;
    }

    ensureVisuals(player);
  }

  function installStyles() {
    if (document.querySelector("#aiTurnIndicatorStyles")) return;
    const style = document.createElement("style");
    style.id = "aiTurnIndicatorStyles";
    style.textContent = `
      html body .seat.ai-turn-active {
        z-index: 12 !important;
        filter:
          drop-shadow(0 14px 24px rgba(0,0,0,.26))
          drop-shadow(0 0 24px rgba(255,194,70,.24)) !important;
        transform: translateY(-1px);
      }
      html body .seat.ai-turn-active .seat-header {
        overflow: visible !important;
        animation: none !important;
        filter: none !important;
        border-color: rgba(255,211,102,.92) !important;
        background:
          radial-gradient(circle at 16% 0%, rgba(255,211,102,.22), transparent 54%),
          linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.045)),
          rgba(5,13,16,.74) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.2),
          0 0 0 2px rgba(255,211,102,.16),
          0 0 26px rgba(255,194,70,.32),
          0 0 54px rgba(255,194,70,.13),
          0 16px 30px rgba(0,0,0,.28) !important;
      }
      html body .seat.ai-turn-active .player-emoji {
        isolation: isolate;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.18),
          0 0 13px rgba(255,211,102,.34) !important;
      }
      html body .seat.ai-turn-active .seat-status.is-thinking {
        border-color: rgba(255,211,102,.45) !important;
        background: rgba(255,211,102,.12) !important;
        color: #ffe7a3 !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.14),
          0 0 14px rgba(255,211,102,.18) !important;
      }
      html body .seat.ai-turn-active .seat-status.is-thinking::after {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  window.render = function renderWithAiTurnIndicator(...args) {
    const result = originalRender.apply(this, args);
    syncTurnIndicator();
    return result;
  };

  installStyles();
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState !== "hidden") {
      syncTurnIndicator();
    }
  });

  window.AiTurnIndicator = {
    refresh: syncTurnIndicator,
    clear: removeTurnVisuals,
  };
})();
