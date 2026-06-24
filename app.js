// ── Audio Engine ──────────────────────────────────────────────────────────────
const Audio = (() => {
  let ctx = null;
  const activeNodes = new Set(); // 追踪所有活躍的音效節點

  function cleanupNode(node) {
    if (node) {
      node.disconnect();
      activeNodes.delete(node);
    }
  }

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      // 處理 iOS 自動暫停的問題
      const resume = () => {
        if (ctx.state === "suspended") ctx.resume();
        document.removeEventListener("touchstart", resume);
        document.removeEventListener("click", resume);
      };
      document.addEventListener("touchstart", resume, { once: true });
      document.addEventListener("click", resume, { once: true });
    }
    if (ctx.state === "suspended") ctx.resume();
    return ctx;
  }

  function playTone({ freq = 440, type = "sine", vol = 0.18, attack = 0.01, duration = 0.18 } = {}) {
    try {
      const c = getCtx();
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.connect(gain);
      gain.connect(c.destination);

      activeNodes.add(osc);
      activeNodes.add(gain);

      osc.type = type;
      osc.frequency.setValueAtTime(freq, c.currentTime);
      gain.gain.setValueAtTime(0, c.currentTime);
      gain.gain.linearRampToValueAtTime(vol, c.currentTime + attack);
      gain.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration);

      osc.start(c.currentTime);
      osc.stop(c.currentTime + duration + 0.05);

      // 在音效結束後清理節點
      setTimeout(() => {
        cleanupNode(osc);
        cleanupNode(gain);
      }, (duration + 0.05 + attack) * 1000 + 50);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  function playChord(freqs, opts = {}) {
    freqs.forEach((freq, i) => setTimeout(() => playTone({ ...opts, freq }), i * 60));
  }

  return {
    deal() { playTone({ freq: 900, type: "triangle", vol: 0.09, attack: 0.002, duration: 0.1 }); },
    chip() { playTone({ freq: 1200, type: "triangle", vol: 0.08, duration: 0.06 }); setTimeout(() => playTone({ freq: 800, type: "triangle", vol: 0.05, duration: 0.05 }), 30); },
    fold() { playTone({ freq: 320, type: "sawtooth", vol: 0.07, attack: 0.01, duration: 0.22 }); },
    win() { playChord([523, 659, 784, 1047], { type: "triangle", vol: 0.12, attack: 0.01, duration: 0.45 }); },
    check() { playTone({ freq: 660, type: "triangle", vol: 0.07, duration: 0.1 }); },
    raise() { playTone({ freq: 520, type: "triangle", vol: 0.1, duration: 0.12 }); setTimeout(() => playTone({ freq: 700, type: "triangle", vol: 0.1, duration: 0.12 }), 90); },
    streetDeal() { [0, 80, 160].forEach(d => setTimeout(() => Audio.deal(), d)); },
    // 清理所有音效（新牌局時呼叫）
    cleanup() {
      activeNodes.forEach(node => cleanupNode(node));
      activeNodes.clear();
    }
  };
})();

const suits = [
  { key: "s", symbol: "♠" }, { key: "h", symbol: "♥" },
  { key: "d", symbol: "♦" }, { key: "c", symbol: "♣" },
];
const ranks = [
  { label: "2", value: 2 }, { label: "3", value: 3 }, { label: "4", value: 4 },
  { label: "5", value: 5 }, { label: "6", value: 6 }, { label: "7", value: 7 },
  { label: "8", value: 8 }, { label: "9", value: 9 }, { label: "10", value: 10 },
  { label: "J", value: 11 }, { label: "Q", value: 12 }, { label: "K", value: 13 }, { label: "A", value: 14 },
];
const handNames = ["高牌", "一對", "兩對", "三條", "順子", "同花", "葫蘆", "四條", "同花順", "同花大順"];

const PERSONALITIES = [
  { name: "Mina", emoji: "🦊", bluffRate: 0.08, aggression: 0.55 },
  { name: "Leo",  emoji: "🦁", bluffRate: 0.22, aggression: 0.72 },
  { name: "Rae",  emoji: "🐍", bluffRate: 0.15, aggression: 0.62 },
];

const state = {
  deck: [], board: [], pot: 0, currentBet: 0,
  street: "翻牌前", handOver: false, players: [], lastEvent: "新牌局開始",
  isMuted: false, // 新增靜音狀態
};

const els = {
  table: document.querySelector(".table"),
  arena: document.querySelector("#arena"),
  actionToast: document.querySelector("#actionToast"),
  opponents: document.querySelector("#opponents"),
  boardCards: document.querySelector("#boardCards"),
  potChips: document.querySelector("#potChips"),
  playerCards: document.querySelector("#playerCards"),
  potValue: document.querySelector("#potValue"),
  tablePotValue: document.querySelector("#tablePotValue"),
  currentBetValue: document.querySelector("#currentBetValue"),
  streetValue: document.querySelector("#streetValue"),
  playerStack: document.querySelector("#playerStack"),
  playerHandRank: document.querySelector("#playerHandRank"),
  foldButton: document.querySelector("#foldButton"),
  callButton: document.querySelector("#callButton"),
  raiseButton: document.querySelector("#raiseButton"),
  raiseAmount: document.querySelector("#raiseAmount"),
  raiseAmountValue: document.querySelector("#raiseAmountValue"),
  newHandButton: document.querySelector("#newHandButton"),
  gameLog: document.querySelector("#gameLog"),
  muteButton: document.querySelector("#muteButton"), // 新增靜音按鈕
};

function createDeck() {
  return suits.flatMap(suit => ranks.map(rank => ({ ...rank, suit: suit.key, suitSymbol: suit.symbol })));
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startHand() {
  Audio.cleanup(); // 清理音效

  const prev = state.players.length ? state.players.map(p => Math.max(p.stack, 200)) : [1000, 1000, 1000, 1000];
  state.deck = shuffle(createDeck());
  state.board = [];
  state.pot = 0;
  state.currentBet = 20;
  state.street = "翻牌前";
  state.handOver = false;

  state.players = [
    { name: "你", isHuman: true, emoji: "🎯", cards: [state.deck.pop(), state.deck.pop()],
      stack: prev[0], bet: 0, folded: false, allIn: false, status: "等待行動", position: 0,
      wins: (state.players[0]?.wins || 0) },
    ...PERSONALITIES.map((p, i) => ({
      ...p, isHuman: false, cards: [state.deck.pop(), state.deck.pop()],
      stack: prev[i + 1], bet: 0, folded: false, allIn: false, status: "思考中", position: i + 1,
      wins: (state.players[i + 1]?.wins || 0),
    })),
  ];

  // 檢查是否有玩家破產
  if (state.players.some(p => p.stack <= 0)) {
    const winners = state.players.filter(p => p.stack > 0);
    if (winners.length === 1) {
      log(`🏆 ${winners[0].emoji} ${winners[0].name} 贏得整個遊戲！`);
      announce(`遊戲結束 - ${winners[0].name} 勝利！`);
      state.handOver = true;
      render();
      return;
    }
  }

  state.players.forEach((_, i) => setTimeout(() => !state.isMuted && Audio.deal(), i * 120));
  postBlind(state.players[1], 10, "小盲");
  postBlind(state.players[2], 20, "大盲");
  log("🃏 新牌局開始，盲注 10 / 20。");
  announce("新牌局開始");
  render();
}

function postBlind(player, amount, label) {
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.bet += paid;
  state.pot += paid;
  player.status = label + " " + paid;
}

function activePlayers() { return state.players.filter(p => !p.folded); }
function human() { return state.players[0]; }
function amountToCall(player) { return Math.max(0, state.currentBet - player.bet); }

function playerAction(action) {
  if (state.handOver || human().folded || human().allIn) return;

  if (action === "fold") {
    human().folded = true;
    human().status = "棄牌";
    !state.isMuted && Audio.fold();
    log("你棄牌。");
    announce("你棄牌");
    finishByFoldIfNeeded();
  }

  if (action === "call") {
    const callAmount = amountToCall(human());
    callAmount === 0 ? !state.isMuted && Audio.check() : !state.isMuted && Audio.chip();
    callPlayer(human(), "你");
  }

  if (action === "raise") {
    const raiseBy = Number(els.raiseAmount.value);
    const contribution = Math.max(0, (state.currentBet + raiseBy) - human().bet);
    pay(human(), contribution);
    state.currentBet = human().bet;
    human().status = "加注到 " + state.currentBet;
    !state.isMuted && Audio.raise();
    log("你加注到 " + state.currentBet + "。");
    announce("你加注到 " + state.currentBet);
  }

  if (!state.handOver) botRound();
  render();
}

function callPlayer(player, label) {
  const paid = pay(player, amountToCall(player));
  player.status = paid === 0 ? "過牌" : "跟注 " + paid;
  log(label + (paid === 0 ? "過牌。" : "跟注 " + paid + "。"));
  announce(paid === 0 ? "過牌" : "跟注 " + paid);
}

function pay(player, amount) {
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.bet += paid;
  state.pot += paid;
  if (player.stack === 0) player.allIn = true;
  return paid;
}

function botRound() {
  for (const player of state.players.slice(1)) {
    if (player.folded || player.allIn) continue;

    const strength = estimateStrength(player);
    const needed = amountToCall(player);
    const potOdds = needed / Math.max(1, state.pot + needed);
    const eff = strength + (Math.random() - 0.5) * 0.1;
    const isBluffing = Math.random() < player.bluffRate && needed <= player.stack * 0.25;
    const posBonus = player.position * 0.04;

    // 改進的 AI 邏輯
    const shouldCall = eff + posBonus > potOdds - 0.05;
    const shouldRaise = (eff + posBonus > 0.68 || isBluffing) && Math.random() < player.aggression && player.stack > needed + 30;

    if (!shouldCall && !isBluffing) {
      player.folded = true;
      player.status = "棄牌";
      !state.isMuted && Audio.fold();
      log(player.emoji + " " + player.name + " 棄牌。");
      announce(player.name + " 棄牌");
      if (finishByFoldIfNeeded()) return;
      continue;
    }

    if (shouldRaise) {
      const raiseBy = Math.min(
        player.stack - needed,
        Math.floor(20 + (isBluffing ? 0.4 : strength) * 100)
      );
      pay(player, needed + raiseBy);
      state.currentBet = Math.max(state.currentBet, player.bet);
      player.status = "加注到 " + player.bet;
      !state.isMuted && Audio.raise();
      log(player.emoji + " " + player.name + " 加注到 " + player.bet + (isBluffing ? " 💭" : "") + "。");
      announce(player.name + " 加注");
      continue;
    }

    const paid = pay(player, needed);
    player.status = paid === 0 ? "過牌" : "跟注 " + paid;
    paid === 0 ? !state.isMuted && Audio.check() : !state.isMuted && Audio.chip();
    log(player.emoji + " " + player.name + (paid === 0 ? "過牌。" : "跟注 " + paid + "。"));
    announce(player.name + (paid === 0 ? "過牌" : "跟注"));
  }

  if (!finishByFoldIfNeeded()) {
    const humanCall = amountToCall(human());
    if (humanCall > 0 && !human().allIn) {
      human().status = "需跟注 " + humanCall;
      log("輪到你，需跟注 " + humanCall + "。");
      announce("輪到你：跟注 " + humanCall);
      return;
    }
    advanceStreet();
  }
}

// 改進的牌力評分
function estimateStrength(player) {
  if (state.board.length >= 3) {
    return evaluateBestHand([...player.cards, ...state.board]).score / 9; // 因為現在有 9 種牌型
  }

  const [a, b] = [...player.cards].sort((x, y) => y.value - x.value);
  let score = 0;

  // 對子
  if (a.value === b.value) {
    score = 0.5 + (a.value / 14) * 0.3;
    // 大對子 (JJ, QQ, KK, AA)
    if (a.value >= 11) score += 0.2;
    // 中對子 (77-10)
    else if (a.value >= 7) score += 0.1;
  }
  // 同花
  else if (a.suit === b.suit) {
    score = 0.3 + (a.value / 14) * 0.15 + (b.value / 14) * 0.1;
    // 同花連牌
    if (Math.abs(a.value - b.value) <= 1) score += 0.15;
    // 同花間隔 1 (如 KQ 同花)
    else if (Math.abs(a.value - b.value) <= 2) score += 0.08;
  }
  // 連牌
  else if (Math.abs(a.value - b.value) <= 1) {
    score = 0.25 + (a.value / 14) * 0.12;
    // 高牌連牌 (如 AK, KQ)
    if (a.value >= 12) score += 0.1;
  }
  // 高牌
  else {
    score = (a.value / 14) * 0.18 + (b.value / 14) * 0.1;
    // 高牌 (A, K, Q)
    if (a.value >= 12) score += 0.08;
  }

  // 同花大順的潛力 (AKQJ 同花)
  if (a.suit === b.suit && a.value >= 12 && b.value >= 11) {
    score += 0.1;
  }

  return Math.min(1, score);
}

function finishByFoldIfNeeded() {
  const c = activePlayers();
  if (c.length === 1) {
    awardPot(c[0], c[0].emoji + " " + c[0].name + " 贏得底池 " + state.pot + "！");
    return true;
  }
  return false;
}

function advanceStreet() {
  for (const p of state.players) {
    p.bet = 0;
    if (!p.folded) p.status = p.isHuman ? "等待行動" : "準備下一輪";
  }
  state.currentBet = 0;

  if (state.board.length === 0) {
    state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
    state.street = "翻牌";
    !state.isMuted && Audio.streetDeal();
    log("翻牌發出。");
    announce("翻牌");
    render();
    return;
  }
  if (state.board.length === 3) {
    state.board.push(state.deck.pop());
    state.street = "轉牌";
    !state.isMuted && Audio.deal();
    log("轉牌發出。");
    announce("轉牌");
    render();
    return;
  }
  if (state.board.length === 4) {
    state.board.push(state.deck.pop());
    state.street = "河牌";
    !state.isMuted && Audio.deal();
    log("河牌發出。");
    announce("河牌");
    render();
    return;
  }
  showdown();
}

function showdown() {
  const contenders = activePlayers().map(player => ({
    player,
    result: evaluateBestHand([...player.cards, ...state.board])
  }));

  contenders.sort((a, b) => compareResults(b.result, a.result));
  const best = contenders[0];
  const winners = contenders.filter(e => compareResults(e.result, best.result) === 0);

  if (winners.length > 1) {
    awardSplitPot(winners, winners.map(e => e.player.name).join("、") + " 以" + best.result.name + "平分底池！");
    return;
  }
  awardPot(best.player, best.player.emoji + " " + best.player.name + " 以" + best.result.name + "贏得底池 " + state.pot + "！");
}

function awardPot(player, message) {
  player.stack += state.pot;
  player.wins = (player.wins || 0) + 1;
  state.pot = 0;
  state.handOver = true;
  state.street = "結算";
  for (const seat of state.players) {
    if (!seat.folded) {
      seat.status = evaluateBestHand([...seat.cards, ...state.board]).name;
    }
  }
  !state.isMuted && Audio.win();
  log(message);
  render();
}

function awardSplitPot(winners, message) {
  const share = Math.floor(state.pot / winners.length);
  const rem = state.pot % winners.length;
  winners.forEach((e, i) => {
    // 公平分配餘數
    e.player.stack += share + (i < rem ? 1 : 0);
    e.player.wins = (e.player.wins || 0) + 1;
  });
  state.pot = 0;
  state.handOver = true;
  state.street = "結算";
  for (const seat of state.players) {
    if (!seat.folded) {
      seat.status = evaluateBestHand([...seat.cards, ...state.board]).name;
    }
  }
  !state.isMuted && Audio.win();
  log(message);
  render();
}

function evaluateBestHand(cards) {
  return combinations(cards, 5).map(evaluateFive).sort(compareResults).at(-1);
}

function evaluateFive(cards) {
  const values = cards.map(c => c.value).sort((a, b) => b - a);
  const vc = new Map();
  for (const v of values) vc.set(v, (vc.get(v) || 0) + 1);
  const groups = [...vc.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => b.count - a.count || b.value - a.value);
  const flush = cards.every(c => c.suit === cards[0].suit);
  const sh = getStraightHigh(values);

  // 同花大順 (A-K-Q-J-10 同花)
  if (flush && sh === 14) {
    const hasRoyal = values.includes(14) && values.includes(13) && values.includes(12) && values.includes(11) && values.includes(10);
    if (hasRoyal) return result(9, [14]);
  }

  if (flush && sh) return result(8, [sh]);
  if (groups[0].count === 4) return result(7, [groups[0].value, kicker(values, [groups[0].value])[0]]);
  if (groups[0].count === 3 && groups[1]?.count === 2) return result(6, [groups[0].value, groups[1].value]);
  if (flush) return result(5, values);
  if (sh) return result(4, [sh]);
  if (groups[0].count === 3) return result(3, [groups[0].value, ...kicker(values, [groups[0].value])]);
  if (groups[0].count === 2 && groups[1]?.count === 2) {
    const pairs = groups.filter(g => g.count === 2).map(g => g.value).sort((a, b) => b - a);
    return result(2, [...pairs, ...kicker(values, pairs)]);
  }
  if (groups[0].count === 2) return result(1, [groups[0].value, ...kicker(values, [groups[0].value])]);
  return result(0, values);
}

function result(score, tiebreakers) { return { score, tiebreakers, name: handNames[score] }; }
function kicker(values, excluded) { return values.filter(v => !excluded.includes(v)); }

function getStraightHigh(values) {
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.includes(14)) unique.push(1); // A 可以當 1 用（A-2-3-4-5 順子）
  for (let i = 0; i <= unique.length - 5; i++) {
    const run = unique.slice(i, i + 5);
    if (run[0] - run[4] === 4) return run[0] === 1 ? 5 : run[0]; // A-2-3-4-5 算 5 高
  }
  return 0;
}

function compareResults(a, b) {
  if (a.score !== b.score) return a.score - b.score;
  for (let i = 0; i < Math.max(a.tiebreakers.length, b.tiebreakers.length); i++) {
    if ((a.tiebreakers[i] || 0) !== (b.tiebreakers[i] || 0)) {
      return (a.tiebreakers[i] || 0) - (b.tiebreakers[i] || 0);
    }
  }
  return 0;
}

function combinations(items, size) {
  const output = [];
  function walk(start, combo) {
    if (combo.length === size) { output.push(combo); return; }
    for (let i = start; i < items.length; i++) walk(i + 1, [...combo, items[i]]);
  }
  walk(0, []);
  return output;
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function render() {
  els.table.classList.toggle("is-showdown", state.handOver);
  els.potValue.textContent = state.pot;
  els.tablePotValue.textContent = state.pot;
  els.potChips.innerHTML = renderPotChips(state.pot);
  els.currentBetValue.textContent = state.currentBet;
  els.streetValue.textContent = state.street;
  els.playerStack.textContent = human().stack;

  // 玩家手牌
  els.playerCards.innerHTML = human().cards.map((c, i) => renderCard(c, i)).join("");

  // 公共牌
  els.boardCards.innerHTML = state.board.length
    ? state.board.map((c, i) => renderCard(c, i)).join("")
    : Array.from({ length: 5 }, (_, i) => renderCard(null, i)).join("");

  // 牌型顯示
  if (state.board.length >= 3 && !human().folded) {
    const best = evaluateBestHand([...human().cards, ...state.board]);
    els.playerHandRank.textContent = best.name;
    els.playerHandRank.className = "hand-rank rank-" + best.score;
  } else {
    els.playerHandRank.textContent = state.handOver ? (human().folded ? "棄牌" : "等待下一局") : "翻牌後顯示牌型";
    els.playerHandRank.className = "hand-rank";
  }

  // 對手
  els.opponents.innerHTML = state.players.slice(1).map(player => {
    const reveal = state.handOver && !player.folded;
    const handLabel = reveal && state.board.length >= 3 ? evaluateBestHand([...player.cards, ...state.board]).name : "";
    const isActive = !player.folded && (player.status.includes("需") || player.status.includes("加注") || player.status.includes("思考"));
    return `
      <article class="seat ${player.folded ? "is-folded" : ""} ${isActive ? "is-active" : ""}">
        <div class="seat-header">
          <div class="seat-identity">
            <span class="player-emoji">${player.emoji}</span>
            <div>
              <h2>${player.name}</h2>
              <div class="seat-meta">籌碼 ${player.stack} · 下注 ${player.bet}</div>
            </div>
          </div>
          <div class="seat-status">${player.status}</div>
        </div>
        ${handLabel ? `<div class="reveal-hand-label">${handLabel}</div>` : ""}
        <div class="cards">${player.cards.map((c, i) => renderCard(reveal ? c : null, i)).join("")}</div>
      </article>
    `;
  }).join("");

  // 按鈕狀態
  const canAct = !state.handOver && !human().folded && !human().allIn;
  const callAmount = amountToCall(human());
  els.foldButton.disabled = !canAct;
  els.callButton.disabled = !canAct;
  els.raiseButton.disabled = !canAct || human().stack <= callAmount + 10;
  els.callButton.textContent = callAmount === 0 ? "過牌" : "跟注 " + callAmount;

  // 加注滑桿
  els.raiseAmount.max = Math.max(20, human().stack - callAmount);
  if (human().stack - callAmount < 20) {
    els.raiseAmount.disabled = true;
  } else {
    els.raiseAmount.disabled = false;
  }

  // 靜音按鈕狀態
  if (els.muteButton) {
    els.muteButton.textContent = state.isMuted ? "🔊 開啟音效" : "🔇 關閉音效";
    els.muteButton.classList.toggle("is-muted", state.isMuted);
  }
}

function renderCard(card, index = 0) {
  const delay = `style="--card-index: ${index}"`;
  if (!card) return `<div class="card back" ${delay}><div class="card-back-pattern"></div></div>`;
  const red = card.suit === "h" || card.suit === "d";
  return `
    <div class="card ${red ? "red" : ""}" ${delay}>
      <span class="card-corner top"><span class="rank">${card.label}</span><span class="corner-suit">${card.suitSymbol}</span></span>
      <span class="center-suit">${card.suitSymbol}</span>
      <span class="card-corner bottom"><span class="rank">${card.label}</span><span class="corner-suit">${card.suitSymbol}</span></span>
    </div>`;
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

function log(message) {
  const item = document.createElement("div");
  item.className = "log-entry";
  item.textContent = message;
  els.gameLog.prepend(item);
  // 自動滾動到最新日誌（最上面）
  els.gameLog.scrollTop = 0;
}

// 事件監聽
els.foldButton.addEventListener("click", () => playerAction("fold"));
els.callButton.addEventListener("click", () => playerAction("call"));
els.raiseButton.addEventListener("click", () => playerAction("raise"));
els.newHandButton.addEventListener("click", startHand);
els.raiseAmount.addEventListener("input", () => {
  els.raiseAmountValue.textContent = els.raiseAmount.value;
});

// 新增靜音按鈕事件
if (els.muteButton) {
  els.muteButton.addEventListener("click", () => {
    state.isMuted = !state.isMuted;
    render();
  });
}

// 頁面載入時啟動
startHand();