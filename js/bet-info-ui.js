// Clear, read-only betting guidance for the human action controls.
(() => {
  "use strict";

  if (window.BetInfoUI?.version || typeof window.render !== "function") return;

  function heroPlayer() {
    return typeof human === "function" ? human() : state.players?.[0] || null;
  }

  function ensureSummary() {
    let summary = document.querySelector("#betInfoSummary");
    if (summary) return summary;

    const controls = document.querySelector(".controls");
    if (!controls) return null;

    summary = document.createElement("div");
    summary.id = "betInfoSummary";
    summary.className = "bet-info-summary";
    summary.setAttribute("aria-live", "polite");
    summary.innerHTML = `
      <span><em>最低加注至</em><strong id="betInfoMinimum">—</strong></span>
      <span><em>加注後剩餘</em><strong id="betInfoRemaining">—</strong></span>
      <span><em>預估底池</em><strong id="betInfoPotAfter">—</strong></span>`;
    controls.appendChild(summary);
    return summary;
  }

  function installStyles() {
    if (document.querySelector("#betInfoStyles")) return;
    const style = document.createElement("style");
    style.id = "betInfoStyles";
    style.textContent = `
      .bet-info-summary {
        grid-column: 1 / -1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        min-width: 0;
      }
      .bet-info-summary > span {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 5px;
        min-width: 0;
        min-height: 27px;
        padding: 4px 7px;
        border: 1px solid rgba(255,255,255,.1);
        border-radius: 7px;
        background: rgba(5,12,17,.34);
      }
      .bet-info-summary em {
        min-width: 0;
        overflow: hidden;
        color: var(--muted);
        font-size: .58rem;
        font-style: normal;
        font-weight: 800;
        line-height: 1.1;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .bet-info-summary strong {
        color: var(--gold);
        font-size: .68rem;
        font-weight: 950;
        font-variant-numeric: tabular-nums;
        white-space: nowrap;
      }
      .controls.is-bet-info-idle .bet-info-summary {
        opacity: .58;
      }
      @media (max-width: 1050px) {
        .bet-info-summary {
          grid-template-columns: repeat(3, minmax(86px, 1fr));
        }
        .bet-info-summary > span {
          display: block;
          text-align: center;
        }
        .bet-info-summary strong {
          display: block;
          margin-top: 2px;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function bettingSnapshot() {
    const hero = heroPlayer();
    if (!hero) return null;

    const callAmount = typeof amountToCall === "function" ? Math.max(0, amountToCall(hero)) : 0;
    const minimumBy = typeof minimumRaiseBy === "function" ? Math.max(0, minimumRaiseBy()) : 0;
    const selectedBy = Math.max(minimumBy, Number(document.querySelector("#raiseAmount")?.value || minimumBy));
    const minimumTo = Math.max(0, Number(state.currentBet || 0) + minimumBy);
    const selectedTarget = Math.max(0, Number(state.currentBet || 0) + selectedBy);
    const requestedContribution = Math.max(0, selectedTarget - Number(hero.bet || 0));
    const paidContribution = Math.min(Math.max(0, Number(hero.stack || 0)), requestedContribution);
    const effectiveTarget = Number(hero.bet || 0) + paidContribution;
    const remaining = Math.max(0, Number(hero.stack || 0) - paidContribution);
    const potAfter = Math.max(0, Number(state.pot || 0) + paidContribution);
    const canAct = Boolean(!state.handOver && state.waitingForHuman && state.currentActorIndex === 0 && !hero.folded && !hero.allIn);

    return {
      hero,
      callAmount,
      minimumTo,
      effectiveTarget,
      remaining,
      potAfter,
      canAct,
    };
  }

  function setText(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.textContent = String(value);
  }

  function updateBetInfo() {
    ensureSummary();
    const snapshot = bettingSnapshot();
    if (!snapshot) return;

    const callButton = document.querySelector("#callButton");
    const raiseButton = document.querySelector("#raiseButton");
    const allInButton = document.querySelector("#allInButton");
    const controls = document.querySelector(".controls");

    if (callButton) callButton.textContent = snapshot.callAmount > 0 ? `跟注 ${snapshot.callAmount}` : "過牌";
    if (raiseButton) raiseButton.textContent = `加注至 ${snapshot.effectiveTarget}`;
    if (allInButton) allInButton.textContent = snapshot.hero.stack > 0 ? `All-in ${snapshot.hero.stack}` : "All-in";

    setText("#betInfoMinimum", snapshot.minimumTo || "—");
    setText("#betInfoRemaining", snapshot.remaining);
    setText("#betInfoPotAfter", snapshot.potAfter);
    controls?.classList.toggle("is-bet-info-idle", !snapshot.canAct);
  }

  function scheduleUpdate() {
    queueMicrotask(updateBetInfo);
  }

  const originalRender = window.render;
  window.render = function renderWithBetInfo(...args) {
    const result = originalRender.apply(this, args);
    updateBetInfo();
    return result;
  };

  installStyles();
  ensureSummary();
  document.querySelector("#raiseAmount")?.addEventListener("input", scheduleUpdate);
  document.querySelector(".quick-bets")?.addEventListener("click", scheduleUpdate);
  document.querySelector(".controls")?.addEventListener("click", scheduleUpdate);
  updateBetInfo();

  window.BetInfoUI = {
    version: "1.0.0",
    refresh: updateBetInfo,
    snapshot: bettingSnapshot,
  };
})();
