// Main table rendering and card/chip UI helpers

function render() {
  if (!state.players.length) return;
  const animateCards = shouldAnimateCards();

  els.table.classList.toggle("is-showdown", state.handOver);
  els.table.classList.toggle("is-human-turn", state.waitingForHuman && !state.handOver);
  els.table.dataset.action = state.actionPulse || "";
  els.handNumber.textContent = "第 " + state.handNumber + " 局";
  const dealer = state.players[state.dealerIndex];
  if (els.cornerHandValue) els.cornerHandValue.textContent = "第 " + state.handNumber + " 局";
  if (els.cornerDealerValue) els.cornerDealerValue.textContent = dealer ? `${dealer.emoji} ${dealer.name}` : "--";
  if (els.cornerBlindsValue) els.cornerBlindsValue.textContent = `${SMALL_BLIND} / ${BIG_BLIND}`;
  if (els.potValue) els.potValue.textContent = state.pot;
  els.tablePotValue.textContent = state.pot;
  els.potChips.innerHTML = renderPotChips(state.pot);
  els.potDelta.textContent = state.potDelta ? "+" + state.potDelta : "";
  els.potDelta.classList.toggle("is-visible", state.potDelta > 0);
  if (els.potChip) els.potChip.classList.toggle("is-pulsing", state.potDelta > 0);
  if (els.currentBetValue) els.currentBetValue.textContent = state.currentBet;
  if (els.streetValue) els.streetValue.textContent = state.street;
  els.boardStageLabel.textContent = streetLabel();
  const heroPosition = positionLabel(human());
  els.playerName.innerHTML = `${human().emoji} ${human().name} <span class="position-chip player-position-chip position-${positionClass(heroPosition)}">${heroPosition}</span>`;
  els.playerStack.textContent = human().stack;
  if (els.playerStackChips) els.playerStackChips.innerHTML = renderMiniChipStack(human().stack);
  els.playerPanel.classList.toggle("is-winner", state.winners.includes(human().name));
  if (els.heroTableStack) els.heroTableStack.classList.toggle("is-winner", state.winners.includes(human().name));
  els.playerTurnMarker.classList.toggle("is-visible", state.waitingForHuman && !state.handOver);

  const player = human();
  const playerCards = player?.cards || [];
  els.playerCards.innerHTML = playerCards.length === 2
    ? playerCards.map((c, i) => renderCard(c, i, { animate: animateCards })).join("")
    : Array.from({ length: 2 }, (_, i) => renderCard(null, i, { animate: animateCards })).join("");

  els.boardCards.innerHTML = state.board.length
    ? state.board.map((c, i) => renderCard(c, i, { animate: animateCards })).join("")
    : Array.from({ length: 5 }, (_, i) => renderCard(null, i, { animate: animateCards })).join("");

  if (state.board.length >= 3 && !human().folded) {
    const best = evaluateBestHand([...human().cards, ...state.board]);
    els.playerHandRank.textContent = state.handOver && state.winners.includes(human().name)
      ? "勝利 · " + best.name
      : best.name;
    els.playerHandRank.className = "hand-rank rank-" + best.score;
  } else {
    els.playerHandRank.textContent = state.handOver ? (human().folded ? "棄牌" : "等待下一局") : "翻牌後顯示牌型";
    els.playerHandRank.className = "hand-rank";
  }

  els.opponents.innerHTML = state.players.slice(1).map(player => {
    const reveal = state.handOver && !player.folded;
    const handLabel = reveal && state.board.length >= 3 ? evaluateBestHand([...player.cards, ...state.board]).name : "";
    const isWinner = state.winners.includes(player.name);
    const isThinking = player.status.includes("Thinking");
    const isCurrentActor = player.position === state.currentActorIndex && !state.handOver;
    const isActive = !player.folded && (isCurrentActor || player.status.includes("需") || player.status.includes("加注") || isThinking);
    const actionClass = player.lastAction ? "action-" + player.lastAction : "";
    const position = positionLabel(player);
    const statusMeta = seatActionMeta(player);
    const betLabel = player.bet > 0 ? `<div class="seat-street-bet"><span>本輪</span><strong>${player.bet}</strong></div>` : "";
    const dialogueText = player.dialogue || (state.layout.editing ? "對話" : "");
    const dialogueKey = `dialogue${player.position}`;
    const dialogueArrow = state.layout.arrows[dialogueKey] || DEFAULT_DIALOGUE_ARROWS[dialogueKey] || "down";
    const dialogue = dialogueText
      ? `<div class="seat-dialogue dialogue-bubble dialogue-pos-${player.position} tone-${player.dialogueTone || "talk"} ${player.dialogue ? "" : "is-placeholder"}" data-layout-key="${dialogueKey}" data-layout-label="${escapeHtml(player.emoji + " 對話")}" data-arrow="${dialogueArrow}">${escapeHtml(dialogueText)}</div>`
      : "";
    const cards = `
      <div class="seat-card-zone seat-cards-pos-${player.position} ${player.folded ? "is-folded" : ""} ${isWinner ? "is-winner" : ""}" data-layout-key="seatCards${player.position}" data-layout-label="${escapeHtml(player.emoji + " 手牌")}">
        <div class="cards">${player.cards.map((c, i) => renderCard(reveal ? c : null, i, { animate: animateCards })).join("")}</div>
        ${player.folded ? '<div class="fold-banner">FOLD</div>' : ""}
      </div>
    `;
    return `
      <article class="seat seat-pos-${player.position} ${player.folded ? "is-folded" : ""} ${isActive ? "is-active" : ""} ${isWinner ? "is-winner" : ""} ${actionClass}" data-layout-key="seat${player.position}" data-layout-label="${escapeHtml(player.emoji + " " + player.name)}">
        <div class="seat-header">
          <span class="position-chip position-${positionClass(position)}">${position}</span>
          <div class="seat-identity">
            <span class="player-emoji">${player.emoji}</span>
            <div>
              <h2>${player.name}</h2>
              <div class="seat-meta">
                <strong>${player.stack}</strong>
                <span class="mini-chip-stack" aria-hidden="true">${renderMiniChipStack(player.stack)}</span>
              </div>
            </div>
          </div>
          <div class="seat-status status-${statusMeta.type} ${isThinking ? "is-thinking" : ""}">
            <span>${statusMeta.label}</span>
            ${statusMeta.amount ? `<strong>${statusMeta.amount}</strong>` : ""}
          </div>
        </div>
        ${betLabel}
        ${handLabel ? `<div class="reveal-hand-label ${isWinner ? "is-winning-hand" : ""}">${isWinner ? "勝利 · " : ""}${handLabel}</div>` : ""}
      </article>
      ${cards}
      ${dialogue}
    `;
  }).join("");

  const canAct = !state.handOver && state.waitingForHuman && state.currentActorIndex === 0 && !human().folded && !human().allIn;
  const { canRaise, callAmount } = syncRaiseControl();
  els.foldButton.disabled = !canAct;
  els.callButton.disabled = !canAct;
  els.raiseButton.disabled = !canAct || !canRaise;
  const canAllIn = canAct && human().stack > 0 && (!human().raiseLocked || human().stack <= callAmount);
  els.allInButton.disabled = !canAllIn;
  els.callButton.textContent = callAmount === 0 ? "過牌" : "跟注 " + callAmount;
  els.quickBets.querySelectorAll("button").forEach(button => {
    button.disabled = !canAct || (button.dataset.bet === "allin" ? !canAllIn : !canRaise);
  });

  if (els.muteButton) {
    els.muteButton.textContent = state.isMuted ? "🔇 音效" : "🔊 音效";
    els.muteButton.setAttribute("aria-pressed", String(!state.isMuted));
    els.muteButton.classList.toggle("is-muted", state.isMuted);
  }

  if (els.autoNewHandButton) {
    els.autoNewHandButton.textContent = state.autoNewHand ? "⏸ 自動牌局" : "▶ 自動牌局";
    els.autoNewHandButton.setAttribute("aria-pressed", String(state.autoNewHand));
    els.autoNewHandButton.classList.toggle("is-auto-on", state.autoNewHand);
  }

  renderCoach();
  updateLayoutEditorUI();
}

function renderCard(card, index = 0, { animate = false } = {}) {
  const delay = `style="--card-index: ${index}"`;
  const motionClass = animate ? "" : " is-static";
  if (!card) return `<div class="card back${motionClass}" ${delay}><div class="card-back-pattern"></div></div>`;
  const red = card.suit === "h" || card.suit === "d";
  const rankClass = String(card.label).toLowerCase();
  return `
    <div class="card ${red ? "red" : ""} rank-${rankClass} suit-${card.suit}${motionClass}" ${delay}>
      <span class="card-corner top"><span class="rank">${card.label}</span><span class="corner-suit">${card.suitSymbol}</span></span>
      ${renderCardCenter(card)}
      <span class="card-corner bottom"><span class="rank">${card.label}</span><span class="corner-suit">${card.suitSymbol}</span></span>
    </div>`;
}

function renderCardCenter(card) {
  if (card.label === "A") {
    return `<span class="ace-emblem"><span>${card.suitSymbol}</span></span>`;
  }

  if (["J", "Q", "K"].includes(card.label)) {
    return `
      <span class="face-emblem">
        <span class="face-rank">${card.label}</span>
        <span class="face-suit">${card.suitSymbol}</span>
        <span class="face-band"></span>
      </span>
    `;
  }

  return renderPipLayout(card);
}

function renderPipLayout(card) {
  const layouts = {
    "2": [[50, 24], [50, 76, true]],
    "3": [[50, 23], [50, 50], [50, 77, true]],
    "4": [[34, 24], [66, 24], [34, 76, true], [66, 76, true]],
    "5": [[34, 24], [66, 24], [50, 50], [34, 76, true], [66, 76, true]],
    "6": [[34, 22], [66, 22], [34, 50], [66, 50], [34, 78, true], [66, 78, true]],
    "7": [[34, 21], [66, 21], [50, 36], [34, 53], [66, 53], [34, 79, true], [66, 79, true]],
    "8": [[34, 20], [66, 20], [34, 39], [66, 39], [34, 61, true], [66, 61, true], [34, 80, true], [66, 80, true]],
    "9": [[34, 19], [66, 19], [34, 38], [66, 38], [50, 50], [34, 62, true], [66, 62, true], [34, 81, true], [66, 81, true]],
    "10": [[34, 18], [66, 18], [34, 35], [66, 35], [50, 42], [50, 58, true], [34, 65, true], [66, 65, true], [34, 82, true], [66, 82, true]],
  };

  const pips = layouts[card.label] || [[50, 50]];
  return `
    <span class="pip-layout pips-${card.label}">
      ${pips.map(([x, y, flip]) => `<span class="pip ${flip ? "is-flipped" : ""}" style="--pip-x:${x}%;--pip-y:${y}%">${card.suitSymbol}</span>`).join("")}
    </span>
  `;
}

function renderMiniChipStack(stack) {
  const safeStack = Math.max(0, Number(stack) || 0);
  const columns = [
    { color: "chip-red", count: Math.min(5, Math.max(1, Math.ceil(safeStack / 900))) },
    { color: "chip-gold", count: Math.min(6, Math.max(2, Math.ceil(safeStack / 700))) },
    { color: "chip-cyan", count: Math.min(5, Math.max(1, Math.ceil(safeStack / 1100))) },
  ];

  return columns.map((column, columnIndex) => `
    <span class="mini-chip-column ${column.color}" style="--column-index:${columnIndex}">
      ${Array.from({ length: column.count }, (_, chipIndex) => `<i style="--chip-index:${chipIndex}"></i>`).join("")}
    </span>
  `).join("");
}

function renderPotChips(pot) {
  const count = Math.min(10, Math.max(1, Math.ceil(pot / 70)));
  const colors = ["chip-gold", "chip-red", "chip-cyan", "chip-blue"];
  return Array.from({ length: count }, (_, i) => {
    const left = 3 + (i % 4) * 7, bottom = Math.floor(i / 4) * 6;
    return `<span class="chip ${colors[i % colors.length]}" style="left:${left}px;bottom:${bottom}px;animation-delay:${i * 34}ms"></span>`;
  }).join("");
}

function announce(message) {
  state.lastEvent = message;
  if (!els.actionToast) return;
  els.actionToast.textContent = message;
  els.actionToast.classList.remove("is-visible");
  void els.actionToast.offsetWidth;
  els.actionToast.classList.add("is-visible");
}

function escapeHtml(text) {
  return String(text).replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[char]));
}

function log(message) {
  const item = document.createElement("div");
  const className = logClass(message);
  item.className = "log-entry " + className;
  if (className === "is-win") {
    item.innerHTML = escapeHtml(message).replace(/(\d[\d,]*)/g, "<strong>$1</strong>");
  } else {
    item.textContent = message;
  }
  els.gameLog.prepend(item);
  while (els.gameLog.children.length > MAX_LOG_ENTRIES) {
    els.gameLog.lastElementChild.remove();
  }
  els.gameLog.scrollTop = 0;
}

function logClass(message) {
  if (/贏得|平分|勝利|WINNER/.test(message)) return "is-win";
  if (/All-in|ALL-IN/.test(message)) return "is-allin";
  if (/Raise|加注/.test(message)) return "is-raise";
  if (/Call|跟注/.test(message)) return "is-call";
  if (/Fold|棄牌/.test(message)) return "is-fold";
  return "";
}
