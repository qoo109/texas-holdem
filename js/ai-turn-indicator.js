// Prominent AI turn focus with a countdown ring and thinking progress.
(() => {
  "use strict";

  if (typeof window.render !== "function") return;

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const originalRender = window.render;
  let frameId = 0;
  let activeKey = "";
  let startedAt = 0;
  let durationMs = 0;

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
      seat.style.removeProperty("--ai-turn-progress");
      seat.querySelector(".ai-turn-ring")?.remove();
      seat.querySelector(".ai-turn-progress-track")?.remove();
      seat.querySelector(".ai-turn-time")?.remove();
    });
  }

  function ensureVisuals(player) {
    const seat = seatFor(player);
    if (!seat) return null;

    seat.classList.add("ai-turn-active");

    const avatar = seat.querySelector(".player-emoji");
    if (avatar && !avatar.querySelector(".ai-turn-ring")) {
      avatar.insertAdjacentHTML("beforeend", `
        <svg class="ai-turn-ring" viewBox="0 0 40 40" aria-hidden="true">
          <circle class="ai-turn-ring-track" cx="20" cy="20" r="17"></circle>
          <circle class="ai-turn-ring-value" cx="20" cy="20" r="17" pathLength="100"></circle>
        </svg>
      `);
    }

    const header = seat.querySelector(".seat-header");
    if (header && !header.querySelector(".ai-turn-progress-track")) {
      header.insertAdjacentHTML("beforeend", '<span class="ai-turn-progress-track" aria-hidden="true"><i></i></span>');
    }

    const status = seat.querySelector(".seat-status");
    if (status && !status.querySelector(".ai-turn-time")) {
      status.insertAdjacentHTML("beforeend", '<em class="ai-turn-time" aria-label="AI 剩餘思考時間">--</em>');
    }

    return seat;
  }

  function startFor(player) {
    const key = `${state.handNumber}:${player.position}`;
    if (key !== activeKey) {
      activeKey = key;
      startedAt = performance.now();
      durationMs = Math.max(560, Number(player.aiThinkingMs) || 1200);
    }
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(updateFrame);
  }

  function updateFrame(now) {
    const player = currentThinkingPlayer();
    if (!player) {
      activeKey = "";
      cancelAnimationFrame(frameId);
      frameId = 0;
      removeTurnVisuals();
      return;
    }

    const key = `${state.handNumber}:${player.position}`;
    if (key !== activeKey) {
      activeKey = key;
      startedAt = now;
      durationMs = Math.max(560, Number(player.aiThinkingMs) || 1200);
    }

    const seat = ensureVisuals(player);
    if (!seat) {
      frameId = requestAnimationFrame(updateFrame);
      return;
    }

    const elapsed = Math.max(0, now - startedAt);
    const remaining = Math.max(0, durationMs - elapsed);
    const fraction = Math.max(0, Math.min(1, remaining / durationMs));
    const percent = fraction * 100;

    seat.style.setProperty("--ai-turn-progress", String(fraction));

    const ring = seat.querySelector(".ai-turn-ring-value");
    if (ring) ring.style.strokeDashoffset = String(100 - percent);

    const progress = seat.querySelector(".ai-turn-progress-track i");
    if (progress) progress.style.transform = `scaleX(${fraction})`;

    const time = seat.querySelector(".ai-turn-time");
    if (time) time.textContent = `${(remaining / 1000).toFixed(1)}s`;

    if (remaining > 0 && currentThinkingPlayer() === player) {
      frameId = requestAnimationFrame(updateFrame);
    } else {
      frameId = 0;
    }
  }

  function syncTurnIndicator() {
    const player = currentThinkingPlayer();
    document.querySelectorAll(".seat.ai-turn-active").forEach(seat => {
      if (!player || Number(seat.dataset.profilePosition) !== player.position) {
        seat.classList.remove("ai-turn-active");
        seat.querySelector(".ai-turn-ring")?.remove();
        seat.querySelector(".ai-turn-progress-track")?.remove();
        seat.querySelector(".ai-turn-time")?.remove();
      }
    });

    if (!player) {
      activeKey = "";
      cancelAnimationFrame(frameId);
      frameId = 0;
      return;
    }

    ensureVisuals(player);
    startFor(player);
  }

  function installStyles() {
    if (document.querySelector("#aiTurnIndicatorStyles")) return;
    const style = document.createElement("style");
    style.id = "aiTurnIndicatorStyles";
    style.textContent = `
      html body .seat.ai-turn-active {
        z-index: 12 !important;
      }
      html body .seat.ai-turn-active .seat-header {
        grid-template-columns: minmax(0, 1fr) 66px !important;
        overflow: visible !important;
        border-color: rgba(255,211,102,.92) !important;
        background:
          radial-gradient(circle at 16% 0%, rgba(255,211,102,.18), transparent 52%),
          linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,.045)),
          rgba(5,13,16,.74) !important;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.2),
          0 0 0 2px rgba(255,211,102,.13),
          0 0 24px rgba(255,194,70,.34),
          0 16px 30px rgba(0,0,0,.28) !important;
        animation: aiTurnCardPulse 760ms ease-in-out infinite alternate;
      }
      html body .seat.ai-turn-active .player-emoji {
        isolation: isolate;
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,.18),
          0 0 13px rgba(255,211,102,.34) !important;
      }
      .ai-turn-ring {
        position: absolute;
        z-index: -1;
        left: 50%;
        top: 50%;
        width: 41px;
        height: 41px;
        overflow: visible;
        pointer-events: none;
        transform: translate(-50%, -50%) rotate(-90deg);
      }
      .ai-turn-ring circle {
        fill: none;
        stroke-width: 3;
      }
      .ai-turn-ring-track {
        stroke: rgba(255,255,255,.14);
      }
      .ai-turn-ring-value {
        stroke: #ffd166;
        stroke-linecap: round;
        stroke-dasharray: 100;
        stroke-dashoffset: 0;
        filter: drop-shadow(0 0 3px rgba(255,205,88,.78));
      }
      html body .seat.ai-turn-active .seat-status.is-thinking {
        display: grid !important;
        grid-template-columns: minmax(0, 1fr) auto !important;
        align-items: center !important;
        gap: 3px !important;
        width: 66px !important;
        min-width: 66px !important;
        max-width: 66px !important;
        padding: 2px 5px !important;
        border-color: rgba(255,211,102,.45) !important;
        background: rgba(255,211,102,.12) !important;
        color: #ffe7a3 !important;
        overflow: visible !important;
      }
      html body .seat.ai-turn-active .seat-status.is-thinking::after {
        display: none !important;
      }
      .ai-turn-time {
        display: inline !important;
        margin: 0;
        color: #fff3c7;
        font-size: .54rem;
        font-style: normal;
        font-weight: 950;
        font-variant-numeric: tabular-nums;
        letter-spacing: -.02em;
      }
      .ai-turn-progress-track {
        position: absolute;
        z-index: 7;
        left: 6px;
        right: 6px;
        bottom: -2px;
        height: 4px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,.13);
        box-shadow: 0 0 0 1px rgba(0,0,0,.28);
        pointer-events: none;
      }
      .ai-turn-progress-track i {
        display: block;
        width: 100%;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #70d8c9, #ffd166 62%, #ff8b5f);
        box-shadow: 0 0 8px rgba(255,205,88,.62);
        transform: scaleX(1);
        transform-origin: left center;
        will-change: transform;
      }
      @keyframes aiTurnCardPulse {
        from { filter: brightness(1); }
        to { filter: brightness(1.08); }
      }
      @media (prefers-reduced-motion: reduce) {
        html body .seat.ai-turn-active .seat-header { animation: none !important; }
        .ai-turn-progress-track i { will-change: auto; }
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
    if (document.visibilityState === "hidden") {
      cancelAnimationFrame(frameId);
      frameId = 0;
    } else {
      syncTurnIndicator();
    }
  });
  reducedMotion.addEventListener?.("change", syncTurnIndicator);

  window.AiTurnIndicator = {
    refresh: syncTurnIndicator,
    clear: removeTurnVisuals,
  };
})();
