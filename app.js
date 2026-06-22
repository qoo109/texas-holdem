const suits = [
  { key: "s", symbol: "♠" },
  { key: "h", symbol: "♥" },
  { key: "d", symbol: "♦" },
  { key: "c", symbol: "♣" },
];
const ranks = [
  { label: "2", value: 2 },
  { label: "3", value: 3 },
  { label: "4", value: 4 },
  { label: "5", value: 5 },
  { label: "6", value: 6 },
  { label: "7", value: 7 },
  { label: "8", value: 8 },
  { label: "9", value: 9 },
  { label: "10", value: 10 },
  { label: "J", value: 11 },
  { label: "Q", value: 12 },
  { label: "K", value: 13 },
  { label: "A", value: 14 },
];

const handNames = [
  "高牌",
  "一對",
  "兩對",
  "三條",
  "順子",
  "同花",
  "葫蘆",
  "四條",
  "同花順",
];

const state = {
  deck: [],
  board: [],
  pot: 0,
  currentBet: 0,
  street: "翻牌前",
  handOver: false,
  players: [],
};

const els = {
  opponents: document.querySelector("#opponents"),
  boardCards: document.querySelector("#boardCards"),
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
};

function createDeck() {
  return suits.flatMap((suit) => ranks.map((rank) => ({ ...rank, suit: suit.key, suitSymbol: suit.symbol })));
}

function shuffle(deck) {
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function startHand() {
  const previousStacks = state.players.length
    ? state.players.map((player) => Math.max(player.stack, 200))
    : [1000, 1000, 1000, 1000];

  state.deck = shuffle(createDeck());
  state.board = [];
  state.pot = 0;
  state.currentBet = 20;
  state.street = "翻牌前";
  state.handOver = false;
  state.players = ["你", "Mina", "Leo", "Rae"].map((name, index) => ({
    name,
    isHuman: index === 0,
    cards: [state.deck.pop(), state.deck.pop()],
    stack: previousStacks[index],
    bet: 0,
    folded: false,
    allIn: false,
    status: index === 0 ? "等待行動" : "思考中",
  }));

  postBlind(state.players[1], 10, "小盲");
  postBlind(state.players[2], 20, "大盲");
  log("新牌局開始，盲注 10 / 20。");
  render();
}

function postBlind(player, amount, label) {
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.bet += paid;
  state.pot += paid;
  player.status = `${label} ${paid}`;
}

function activePlayers() {
  return state.players.filter((player) => !player.folded);
}

function human() {
  return state.players[0];
}

function amountToCall(player) {
  return Math.max(0, state.currentBet - player.bet);
}

function playerAction(action) {
  if (state.handOver || human().folded) return;

  if (action === "fold") {
    human().folded = true;
    human().status = "棄牌";
    log("你棄牌。");
    finishByFoldIfNeeded();
  }

  if (action === "call") {
    callPlayer(human(), "你跟注");
  }

  if (action === "raise") {
    const raiseBy = Number(els.raiseAmount.value);
    const totalBet = state.currentBet + raiseBy;
    const contribution = Math.max(0, totalBet - human().bet);
    pay(human(), contribution);
    state.currentBet = human().bet;
    human().status = `加注到 ${state.currentBet}`;
    log(`你加注到 ${state.currentBet}。`);
  }

  if (!state.handOver) {
    botRound();
  }
  render();
}

function callPlayer(player, messagePrefix) {
  const needed = amountToCall(player);
  const paid = pay(player, needed);
  player.status = paid === 0 ? "過牌" : `跟注 ${paid}`;
  log(`${messagePrefix}${paid === 0 ? "，過牌。" : ` ${paid}。`}`);
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
    const pressure = needed / Math.max(1, player.stack + player.bet);
    const random = Math.random();

    if (needed > 0 && strength + random * 0.28 < pressure + 0.18) {
      player.folded = true;
      player.status = "棄牌";
      log(`${player.name} 棄牌。`);
      if (finishByFoldIfNeeded()) return;
      continue;
    }

    if (strength > 0.72 && random > 0.42 && player.stack > needed + 30) {
      const raiseBy = Math.min(player.stack, 30 + Math.floor(strength * 80));
      pay(player, needed + raiseBy);
      state.currentBet = Math.max(state.currentBet, player.bet);
      player.status = `加注到 ${player.bet}`;
      log(`${player.name} 加注到 ${player.bet}。`);
      continue;
    }

    const paid = pay(player, needed);
    player.status = paid === 0 ? "過牌" : `跟注 ${paid}`;
    log(`${player.name}${paid === 0 ? "過牌" : `跟注 ${paid}`}。`);
  }

  if (!finishByFoldIfNeeded()) {
    const humanCall = amountToCall(human());
    if (humanCall > 0 && !human().allIn) {
      human().status = `需跟注 ${humanCall}`;
      log(`行動回到你，需跟注 ${humanCall}。`);
      return;
    }
    advanceStreet();
  }
}

function estimateStrength(player) {
  if (state.board.length >= 3) {
    return evaluateBestHand([...player.cards, ...state.board]).score / 8;
  }

  const [a, b] = player.cards;
  let score = Math.max(a.value, b.value) / 14;
  if (a.value === b.value) score += 0.35;
  if (a.suit === b.suit) score += 0.08;
  if (Math.abs(a.value - b.value) <= 2) score += 0.08;
  return Math.min(1, score);
}

function finishByFoldIfNeeded() {
  const contenders = activePlayers();
  if (contenders.length === 1) {
    awardPot(contenders[0], `${contenders[0].name} 贏得底池 ${state.pot}。`);
    return true;
  }
  return false;
}

function advanceStreet() {
  for (const player of state.players) {
    player.bet = 0;
    if (!player.folded) player.status = player.isHuman ? "等待行動" : "準備下一輪";
  }
  state.currentBet = 0;

  if (state.board.length === 0) {
    state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
    state.street = "翻牌";
    log("翻牌發出。");
    render();
    return;
  }

  if (state.board.length === 3) {
    state.board.push(state.deck.pop());
    state.street = "轉牌";
    log("轉牌發出。");
    render();
    return;
  }

  if (state.board.length === 4) {
    state.board.push(state.deck.pop());
    state.street = "河牌";
    log("河牌發出。");
    render();
    return;
  }

  showdown();
}

function showdown() {
  const contenders = activePlayers().map((player) => ({
    player,
    result: evaluateBestHand([...player.cards, ...state.board]),
  }));
  contenders.sort((a, b) => compareResults(b.result, a.result));
  const best = contenders[0];
  const winners = contenders.filter((entry) => compareResults(entry.result, best.result) === 0);
  if (winners.length > 1) {
    awardSplitPot(winners, `${winners.map((entry) => entry.player.name).join("、")} 以${best.result.name}平分底池。`);
    return;
  }
  awardPot(best.player, `${best.player.name} 以${best.result.name}贏得底池 ${state.pot}。`);
}

function awardPot(player, message) {
  player.stack += state.pot;
  state.pot = 0;
  state.handOver = true;
  state.street = "結算";
  for (const seat of state.players) {
    if (!seat.folded) {
      const result = evaluateBestHand([...seat.cards, ...state.board]);
      seat.status = result.name;
    }
  }
  log(message);
  render();
}

function awardSplitPot(winners, message) {
  const share = Math.floor(state.pot / winners.length);
  const remainder = state.pot % winners.length;
  winners.forEach((entry, index) => {
    entry.player.stack += share + (index === 0 ? remainder : 0);
  });
  state.pot = 0;
  state.handOver = true;
  state.street = "結算";
  for (const seat of state.players) {
    if (!seat.folded) {
      const result = evaluateBestHand([...seat.cards, ...state.board]);
      seat.status = result.name;
    }
  }
  log(message);
  render();
}

function evaluateBestHand(cards) {
  const combos = combinations(cards, 5);
  return combos.map(evaluateFive).sort(compareResults).at(-1);
}

function evaluateFive(cards) {
  const values = cards.map((card) => card.value).sort((a, b) => b - a);
  const valueCounts = new Map();
  for (const value of values) valueCounts.set(value, (valueCounts.get(value) || 0) + 1);

  const groups = [...valueCounts.entries()]
    .map(([value, count]) => ({ value, count }))
    .sort((a, b) => b.count - a.count || b.value - a.value);

  const flush = cards.every((card) => card.suit === cards[0].suit);
  const straightHigh = getStraightHigh(values);

  if (flush && straightHigh) return result(8, [straightHigh]);
  if (groups[0].count === 4) return result(7, [groups[0].value, kicker(values, [groups[0].value])[0]]);
  if (groups[0].count === 3 && groups[1]?.count === 2) return result(6, [groups[0].value, groups[1].value]);
  if (flush) return result(5, values);
  if (straightHigh) return result(4, [straightHigh]);
  if (groups[0].count === 3) return result(3, [groups[0].value, ...kicker(values, [groups[0].value])]);
  if (groups[0].count === 2 && groups[1]?.count === 2) {
    const pairs = groups.filter((group) => group.count === 2).map((group) => group.value).sort((a, b) => b - a);
    return result(2, [...pairs, ...kicker(values, pairs)]);
  }
  if (groups[0].count === 2) return result(1, [groups[0].value, ...kicker(values, [groups[0].value])]);
  return result(0, values);
}

function result(score, tiebreakers) {
  return { score, tiebreakers, name: handNames[score] };
}

function kicker(values, excluded) {
  return values.filter((value) => !excluded.includes(value));
}

function getStraightHigh(values) {
  const unique = [...new Set(values)].sort((a, b) => b - a);
  if (unique.includes(14)) unique.push(1);
  for (let i = 0; i <= unique.length - 5; i += 1) {
    const run = unique.slice(i, i + 5);
    if (run[0] - run[4] === 4) return run[0] === 1 ? 5 : run[0];
  }
  return 0;
}

function compareResults(a, b) {
  if (a.score !== b.score) return a.score - b.score;
  const length = Math.max(a.tiebreakers.length, b.tiebreakers.length);
  for (let i = 0; i < length; i += 1) {
    if ((a.tiebreakers[i] || 0) !== (b.tiebreakers[i] || 0)) {
      return (a.tiebreakers[i] || 0) - (b.tiebreakers[i] || 0);
    }
  }
  return 0;
}

function combinations(items, size) {
  const output = [];
  function walk(start, combo) {
    if (combo.length === size) {
      output.push(combo);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      walk(i + 1, [...combo, items[i]]);
    }
  }
  walk(0, []);
  return output;
}

function render() {
  els.potValue.textContent = state.pot;
  els.tablePotValue.textContent = state.pot;
  els.currentBetValue.textContent = state.currentBet;
  els.streetValue.textContent = state.street;
  els.playerStack.textContent = human().stack;
  els.playerCards.innerHTML = human().cards.map(renderCard).join("");
  els.boardCards.innerHTML = state.board.length
    ? state.board.map(renderCard).join("")
    : Array.from({ length: 5 }, () => renderCard(null)).join("");
  els.playerHandRank.textContent =
    state.board.length >= 3 ? evaluateBestHand([...human().cards, ...state.board]).name : "翻牌後會顯示目前牌型";

  els.opponents.innerHTML = state.players
    .slice(1)
    .map((player) => {
      const reveal = state.handOver && !player.folded;
      return `
        <article class="seat ${player.folded ? "is-folded" : ""} ${player.status.includes("需") || player.status.includes("加注") ? "is-active" : ""}">
          <div class="seat-header">
            <div>
              <h2>${player.name}</h2>
              <div class="seat-meta">籌碼 ${player.stack} · 下注 ${player.bet}</div>
            </div>
            <div class="seat-status">${player.status}</div>
          </div>
          <div class="cards">${player.cards.map((card) => renderCard(reveal ? card : null)).join("")}</div>
        </article>
      `;
    })
    .join("");

  const canAct = !state.handOver && !human().folded && !human().allIn;
  els.foldButton.disabled = !canAct;
  els.callButton.disabled = !canAct;
  els.raiseButton.disabled = !canAct || human().stack <= amountToCall(human()) + 10;
  els.callButton.textContent = amountToCall(human()) ? `跟注 ${amountToCall(human())}` : "過牌";
}

function renderCard(card) {
  if (!card) return '<div class="card back"><span class="rank">?</span></div>';
  const red = card.suit === "h" || card.suit === "d";
  return `
    <div class="card ${red ? "red" : ""}">
      <span class="rank">${card.label}</span>
      <span class="suit">${card.suitSymbol}</span>
    </div>
  `;
}

function log(message) {
  const item = document.createElement("div");
  item.className = "log-entry";
  item.textContent = message;
  els.gameLog.prepend(item);
}

els.foldButton.addEventListener("click", () => playerAction("fold"));
els.callButton.addEventListener("click", () => playerAction("call"));
els.raiseButton.addEventListener("click", () => playerAction("raise"));
els.newHandButton.addEventListener("click", startHand);
els.raiseAmount.addEventListener("input", () => {
  els.raiseAmountValue.textContent = els.raiseAmount.value;
});

startHand();
