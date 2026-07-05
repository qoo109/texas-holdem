// ── Audio Engine ──────────────────────────────────────────────────────────────
const Audio = (() => {
  let ctx = null;
  const activeNodes = new Set();

  function cleanupNode(node) {
    if (node) {
      node.disconnect();
      activeNodes.delete(node);
    }
  }

  function getCtx() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
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
  { name: "Leo", emoji: "🦁", style: "Aggro", quote: "我要全部吃下來！", bluffRate: 0.24, aggression: 0.86, patience: 0.42 },
  { name: "Toto", emoji: "🐢", style: "Nit", quote: "再等等。", bluffRate: 0.03, aggression: 0.36, patience: 0.92 },
  { name: "Foxy", emoji: "🦊", style: "Bluff", quote: "你真的相信我嗎？", bluffRate: 0.28, aggression: 0.68, patience: 0.5 },
  { name: "Wolf", emoji: "🐺", style: "TAG", quote: "現在就是機會。", bluffRate: 0.12, aggression: 0.72, patience: 0.62 },
  { name: "Pao", emoji: "🐼", style: "Call", quote: "先跟著看看。", bluffRate: 0.04, aggression: 0.32, patience: 0.45 },
  { name: "Shark", emoji: "🦈", style: "Pro", quote: "每一分都算過。", bluffRate: 0.14, aggression: 0.66, patience: 0.78 },
];

const DIALOGUE_BANK = {
  Leo: {
    raise: ["壓力給滿，懂？", "這桌我開團。", "弱者才免費看牌。"],
    bluff: ["我這波很有料吧。", "別問，問就是價值下注。"],
    allin: ["要嘛稱王，要嘛回家。", "全推啦，別在那邊小劇場。"],
    call: ["跟一下，看你演到哪。"],
    fold: ["這手不接，下一把再咬。"],
    playerFold: ["笑死，牌還沒熱你就跑。", "你退半步的動作認真的嗎？"],
    win: ["這就是壓制。", "獅王上桌，籌碼下跪。"],
    lose: ["這把算你會呼吸。"],
    river: ["最後一張，來點大的。"],
    flop: ["牌面有火藥味了。"],
  },
  Toto: {
    raise: ["我都出手了，你自己想。", "這不是衝動，這是忍很久。"],
    allin: ["慢慢等，就是等這一刻。", "我推了，世界安靜。"],
    call: ["先跟，別急。", "我看一下，不代表我怕。"],
    check: ["先不急，讓子彈飛一下。"],
    fold: ["這手牌不值得我開機。", "我選擇保護本金。"],
    playerFold: ["活下來也是一種技術。", "嗯，這次你沒有上頭。"],
    win: ["穩，是最強的梗。", "龜速進場，光速收錢。"],
    lose: ["資料不足，下把再龜。"],
    river: ["河牌到了，別亂呼吸。"],
    flop: ["牌面開始講故事了。"],
  },
  Foxy: {
    raise: ["我只是輕輕點一下壓力。", "你猜我有沒有？猜錯很貴。"],
    bluff: ["這不是偷雞，這是內容創作。", "我這表情像沒牌嗎？"],
    allin: ["不裝了，我攤牌，我很會裝。", "梭哈是一種語言。"],
    call: ["我跟，因為劇本還沒演完。"],
    check: ["我不動，才是最可疑的。"],
    fold: ["這段我先跳過，廣告後回來。"],
    playerFold: ["我還沒開始演欸。", "你是不是看穿空氣了？"],
    win: ["你以為是運氣？真可愛。", "這叫心理學，不叫亂玩。"],
    lose: ["好吧，這集你是主角。"],
    river: ["最後一張牌，最適合說謊。"],
    flop: ["陷阱剛剛開門了。"],
  },
  Wolf: {
    raise: ["看到破綻就咬。", "別滑手機，壓力來了。"],
    allin: ["狼群不會只咬一口。", "這波直接開戰。"],
    call: ["跟，讓你繼續表演。"],
    check: ["先蹲一下，等等再撲。"],
    fold: ["這口肉不新鮮。"],
    playerFold: ["你聞到危險了？不錯。"],
    win: ["獵物到手。", "這桌開始有血味了。"],
    lose: ["這局被反咬，記下了。"],
    river: ["河牌別裝無辜。"],
    flop: ["牌面連起來了，刺激。"],
  },
  Pao: {
    raise: ["我平常很佛，但這手不佛。", "熊貓也會站起來。"],
    allin: ["我全推，奶茶先放旁邊。", "舒服不了，這把要認真。"],
    call: ["跟一下，當買門票。", "先 Call，不要問為什麼。"],
    check: ["我先躺平觀察。"],
    fold: ["這把我去旁邊吃竹子。"],
    playerFold: ["別怕，輸贏都是浮雲。", "你這 fold 很養生。"],
    win: ["慢慢 Call，也能 Call 到家。", "舒服，今天竹子加餐。"],
    lose: ["沒事，我情緒很穩。"],
    river: ["河牌到了，先深呼吸。"],
    flop: ["這牌面有點像連續劇。"],
  },
  Shark: {
    raise: ["短碼注意，我在巡邏。", "你的籌碼看起來很脆。"],
    bluff: ["別怕，我只是剛好像很強。"],
    allin: ["把籌碼推過來，別眨眼。", "深水區，請勿嬉戲。"],
    call: ["價格合理，我收。"],
    check: ["先讓市場報價。"],
    fold: ["這口不咬，太乾。"],
    playerFold: ["你退得太快了。", "這壓力測試通過了嗎？"],
    win: ["你的籌碼現在歸我。", "水面很安靜，錢包很危險。"],
    lose: ["這波我記帳了。"],
    river: ["河牌會揭穿每個人。"],
    flop: ["牌面濕了，水裡我說了算。"],
  },
  default: {
    turn: ["這把有點東西。", "有人要上頭了嗎？"],
    humanRaise: ["哇，Owl 開麥了。", "這加注有聲音。"],
    humanAllin: ["全場安靜，Owl 開大。", "這不是按鈕，這是核彈。"],
  },
};

const STARTING_STACK = 1000;
const MIN_STACK_RESET = 200;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const MIN_RAISE = 20;
const AUTO_NEW_HAND_DELAY = 3000;
const MAX_LOG_ENTRIES = 18;
const DIALOGUE_DISPLAY_MS = 3300;
const DIALOGUE_COOLDOWN_MS = 8000;
const MAX_DIALOGUE_PER_STREET = 2;
const STREET_LABELS = {
  "翻牌前": "PREFLOP",
  "翻牌": "FLOP",
  "轉牌": "TURN",
  "河牌": "RIVER",
  "結算": "SHOWDOWN",
};

const state = {
  deck: [], board: [], pot: 0, currentBet: 0,
  street: "翻牌前", handOver: false, players: [], lastEvent: "新牌局開始",
  isMuted: false,
  autoNewHand: false,
  autoNewHandTimer: null,
  winners: [],
  handNumber: 0,
  dealerIndex: 0,
  waitingForHuman: false,
  potDelta: 0,
  actionPulse: null,
  winAmount: 0,
  dialogueTimers: [],
  streetDialogueCount: 0,
};

const els = {
  table: document.querySelector(".table"),
  arena: document.querySelector("#arena"),
  fxLayer: document.querySelector("#fxLayer"),
  showdownBanner: document.querySelector("#showdownBanner"),
  actionToast: document.querySelector("#actionToast"),
  opponents: document.querySelector("#opponents"),
  boardCards: document.querySelector("#boardCards"),
  boardStageLabel: document.querySelector("#boardStageLabel"),
  potChips: document.querySelector("#potChips"),
  potDelta: document.querySelector("#potDelta"),
  playerCards: document.querySelector("#playerCards"),
  potValue: document.querySelector("#potValue"),
  tablePotValue: document.querySelector("#tablePotValue"),
  currentBetValue: document.querySelector("#currentBetValue"),
  streetValue: document.querySelector("#streetValue"),
  handNumber: document.querySelector("#handNumber"),
  playerName: document.querySelector("#playerName"),
  playerPanel: document.querySelector(".player-panel"),
  playerStack: document.querySelector("#playerStack"),
  playerHandRank: document.querySelector("#playerHandRank"),
  playerTurnMarker: document.querySelector("#playerTurnMarker"),
  foldButton: document.querySelector("#foldButton"),
  callButton: document.querySelector("#callButton"),
  raiseButton: document.querySelector("#raiseButton"),
  allInButton: document.querySelector("#allInButton"),
  raiseAmount: document.querySelector("#raiseAmount"),
  raiseAmountValue: document.querySelector("#raiseAmountValue"),
  quickBets: document.querySelector(".quick-bets"),
  newHandButton: document.querySelector("#newHandButton"),
  gameLog: document.querySelector("#gameLog"),
  muteButton: document.querySelector("#muteButton"),
  autoNewHandButton: document.querySelector("#autoNewHandButton"),
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
  Audio.cleanup();
  clearAutoNewHandTimer();
  clearDialogueTimers();

  state.handNumber += 1;
  const seatCount = PERSONALITIES.length + 1;
  state.dealerIndex = (state.handNumber - 1) % seatCount;
  const prev = state.players.length
    ? state.players.map(p => Math.max(p.stack, MIN_STACK_RESET))
    : Array(seatCount).fill(STARTING_STACK);
  state.deck = shuffle(createDeck());
  state.board = [];
  state.pot = 0;
  state.currentBet = BIG_BLIND;
  state.street = "翻牌前";
  state.handOver = false;
  state.winners = [];
  state.waitingForHuman = true;
  state.potDelta = 0;
  state.actionPulse = null;
  state.winAmount = 0;
  state.streetDialogueCount = 0;
  if (els.showdownBanner) els.showdownBanner.classList.remove("is-visible");

  state.players = [
    { name: "Owl", isHuman: true, emoji: "🦉", cards: [state.deck.pop(), state.deck.pop()],
      stack: prev[0], bet: 0, folded: false, allIn: false, status: "等待行動", position: 0,
      wins: (state.players[0]?.wins || 0), dialogue: "", dialogueTone: "", lastDialogueAt: 0 },
    ...PERSONALITIES.map((p, i) => ({
      ...p, isHuman: false, cards: [state.deck.pop(), state.deck.pop()],
      stack: prev[i + 1], bet: 0, folded: false, allIn: false, status: "Thinking...", position: i + 1,
      wins: (state.players[i + 1]?.wins || 0), dialogue: "", dialogueTone: "", lastDialogueAt: 0,
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
  const smallBlind = state.players[(state.dealerIndex + 1) % state.players.length];
  const bigBlind = state.players[(state.dealerIndex + 2) % state.players.length];
  postBlind(smallBlind, SMALL_BLIND, "小盲");
  postBlind(bigBlind, BIG_BLIND, "大盲");
  log(`🃏 新牌局開始，盲注 ${SMALL_BLIND} / ${BIG_BLIND}。`);
  announce("新牌局開始");
  render();
}

function postBlind(player, amount, label) {
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.bet += paid;
  state.pot += paid;
  pulsePot(paid);
  player.status = label + " " + paid;
  player.lastAction = label;
}

function activePlayers() { return state.players.filter(p => !p.folded); }
function human() { return state.players[0]; }
function amountToCall(player) { return Math.max(0, state.currentBet - player.bet); }

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function clearDialogueTimers() {
  state.dialogueTimers.forEach(timer => window.clearTimeout(timer));
  state.dialogueTimers = [];
}

function dialogueLinesFor(player, event) {
  return DIALOGUE_BANK[player.name]?.[event] || DIALOGUE_BANK.default?.[event] || [];
}

function say(player, event, { force = false, chance = 1 } = {}) {
  if (!player || player.isHuman) return false;
  const lines = dialogueLinesFor(player, event);
  if (!lines.length) return false;
  const now = Date.now();
  if (!force && Math.random() > chance) return false;
  if (!force && player.lastDialogueAt && now - player.lastDialogueAt < DIALOGUE_COOLDOWN_MS) return false;
  if (!force && state.streetDialogueCount >= MAX_DIALOGUE_PER_STREET) return false;

  const line = randomItem(lines);
  player.dialogue = line;
  player.dialogueTone = event;
  player.lastDialogueAt = now;
  if (!force) state.streetDialogueCount += 1;

  const timer = window.setTimeout(() => {
    if (player.dialogue === line) {
      player.dialogue = "";
      player.dialogueTone = "";
      render();
    }
  }, DIALOGUE_DISPLAY_MS);
  state.dialogueTimers.push(timer);
  return true;
}

function tableTalk(event, { actor = null, force = false, chance = 0.35, exclude = [] } = {}) {
  if (actor && !actor.isHuman) return say(actor, event, { force, chance });
  if (!force && Math.random() > chance) return false;

  const excluded = new Set(exclude);
  const candidates = state.players
    .slice(1)
    .filter(player => !player.folded && !excluded.has(player))
    .sort(() => Math.random() - 0.5);

  for (const player of candidates) {
    if (say(player, event, { force, chance: 1 })) return true;
  }
  return false;
}

function playerAction(action) {
  if (state.handOver || human().folded || human().allIn) return;
  state.waitingForHuman = false;

  if (action === "fold") {
    human().folded = true;
    human().status = "棄牌";
    human().lastAction = "fold";
    !state.isMuted && Audio.fold();
    logAction(human(), "Fold");
    announceAction("FOLD", "fold");
    tableTalk("playerFold", { chance: 0.78 });
    finishByFoldIfNeeded();
  }

  if (action === "call") {
    const callAmount = amountToCall(human());
    callAmount === 0 ? !state.isMuted && Audio.check() : !state.isMuted && Audio.chip();
    callPlayer(human(), "你");
  }

  if (action === "raise") {
    syncRaiseControl();
    const raiseBy = Number(els.raiseAmount.value);
    const contribution = Math.max(0, (state.currentBet + raiseBy) - human().bet);
    pay(human(), contribution);
    state.currentBet = human().bet;
    human().status = human().allIn ? "ALL-IN " + state.currentBet : "加注到 " + state.currentBet;
    human().lastAction = human().allIn ? "allin" : "raise";
    !state.isMuted && Audio.raise();
    logAction(human(), human().allIn ? "All-in" : "Raise", state.currentBet);
    announceAction(human().allIn ? "ALL-IN" : "RAISE", human().allIn ? "allin" : "raise");
    tableTalk(human().allIn ? "humanAllin" : "humanRaise", { chance: 0.82 });
  }

  if (action === "allin") {
    pay(human(), human().stack);
    const isRaise = human().bet > state.currentBet;
    if (isRaise) state.currentBet = human().bet;
    human().status = "ALL-IN " + human().bet;
    human().lastAction = "allin";
    !state.isMuted && Audio.raise();
    logAction(human(), isRaise ? "All-in Raise" : "All-in", human().bet);
    announceAction("ALL-IN", "allin");
    tableTalk("humanAllin", { force: true });
  }

  if (!state.handOver) botRound();
  if (!state.handOver && human().folded) continueFoldedHand();
  if (!state.handOver && human().allIn) runOutAllInBoard();
  render();
}

function callPlayer(player, label) {
  const paid = pay(player, amountToCall(player));
  player.status = player.allIn && paid > 0 ? "ALL-IN " + player.bet : (paid === 0 ? "過牌" : "跟注 " + paid);
  player.lastAction = player.allIn && paid > 0 ? "allin" : (paid === 0 ? "check" : "call");
  logAction(player, player.allIn && paid > 0 ? "All-in Call" : (paid === 0 ? "Check" : "Call"), paid);
  announceAction(player.allIn && paid > 0 ? "ALL-IN" : (paid === 0 ? "CHECK" : "CALL"), player.lastAction);
}

function pay(player, amount) {
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.bet += paid;
  state.pot += paid;
  if (paid > 0) {
    pulsePot(paid);
    animateChips(player, paid);
  }
  if (player.stack === 0) player.allIn = true;
  return paid;
}

function botRound() {
  for (const player of state.players.slice(1)) {
    if (player.folded || player.allIn) continue;
    player.status = "Thinking...";

    const strength = estimateStrength(player);
    const needed = amountToCall(player);
    const potOdds = needed / Math.max(1, state.pot + needed);
    const eff = strength + (Math.random() - 0.5) * 0.1;
    const isBluffing = Math.random() < player.bluffRate && needed <= player.stack * 0.25;
    const posBonus = player.position * 0.04;

    const shouldCall = eff + posBonus + (1 - player.patience) * 0.08 > potOdds - 0.05;
    const shouldRaise = (eff + posBonus > 0.68 || isBluffing) && Math.random() < player.aggression && player.stack > needed + 30;

    if (!shouldCall && !isBluffing) {
      player.folded = true;
      player.status = "棄牌";
      player.lastAction = "fold";
      !state.isMuted && Audio.fold();
      logAction(player, "Fold");
      announceAction("FOLD", "fold");
      say(player, "fold", { chance: 0.22 });
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
      player.status = player.allIn ? "ALL-IN " + player.bet : "加注到 " + player.bet;
      player.lastAction = player.allIn ? "allin" : "raise";
      !state.isMuted && Audio.raise();
      logAction(player, player.allIn ? "All-in Raise" : "Raise", player.bet, isBluffing ? "bluff" : "");
      announceAction(player.allIn ? "ALL-IN" : "RAISE", player.lastAction);
      say(player, player.allIn ? "allin" : (isBluffing ? "bluff" : "raise"), {
        force: player.allIn,
        chance: isBluffing ? 0.62 : 0.38,
      });
      continue;
    }

    const paid = pay(player, needed);
    player.status = paid === 0 ? "過牌" : "跟注 " + paid;
    paid === 0 ? !state.isMuted && Audio.check() : !state.isMuted && Audio.chip();
    player.lastAction = player.allIn && paid > 0 ? "allin" : (paid === 0 ? "check" : "call");
    logAction(player, player.allIn && paid > 0 ? "All-in Call" : (paid === 0 ? "Check" : "Call"), paid);
    announceAction(player.allIn && paid > 0 ? "ALL-IN" : (paid === 0 ? "CHECK" : "CALL"), player.lastAction);
    say(player, player.allIn && paid > 0 ? "allin" : (paid === 0 ? "check" : "call"), {
      chance: player.allIn && paid > 0 ? 0.28 : (paid === 0 ? 0.14 : 0.18),
    });
  }

  if (!finishByFoldIfNeeded()) {
    const humanCall = amountToCall(human());
    if (!human().folded && humanCall > 0 && !human().allIn) {
      human().status = "需跟注 " + humanCall;
      state.waitingForHuman = true;
      log(`${playerLogIcon(human())} ${playerLabel(human())} 待行動，需要補 ${humanCall}。`);
      announce("輪到你：跟注 " + humanCall);
      return;
    }
    state.waitingForHuman = !human().folded && !human().allIn;
    advanceStreet();
  }
}

function continueFoldedHand() {
  state.waitingForHuman = false;
  let guard = 0;
  while (!state.handOver && human().folded && activePlayers().length > 1 && guard < 12) {
    botRound();
    guard += 1;
  }
  if (!state.handOver && guard >= 12) {
    log("系統：牌局自動推進中止，請開新牌局。");
  }
}

function estimateStrength(player) {
  if (state.board.length >= 3) {
    return evaluateBestHand([...player.cards, ...state.board]).score / 9;
  }

  const [a, b] = [...player.cards].sort((x, y) => y.value - x.value);
  let score = 0;

  if (a.value === b.value) {
    score = 0.5 + (a.value / 14) * 0.3;
    if (a.value >= 11) score += 0.2;
    else if (a.value >= 7) score += 0.1;
  }
  else if (a.suit === b.suit) {
    score = 0.3 + (a.value / 14) * 0.15 + (b.value / 14) * 0.1;
    if (Math.abs(a.value - b.value) <= 1) score += 0.15;
    else if (Math.abs(a.value - b.value) <= 2) score += 0.08;
  }
  else if (Math.abs(a.value - b.value) <= 1) {
    score = 0.25 + (a.value / 14) * 0.12;
    if (a.value >= 12) score += 0.1;
  }
  else {
    score = (a.value / 14) * 0.18 + (b.value / 14) * 0.1;
    if (a.value >= 12) score += 0.08;
  }

  if (a.suit === b.suit && a.value >= 12 && b.value >= 11) {
    score += 0.1;
  }

  return Math.min(1, score);
}

function finishByFoldIfNeeded() {
  const c = activePlayers();
  if (c.length === 1) {
    awardPot([c[0]], c[0].emoji + " " + c[0].name + " 贏得底池 " + state.pot + "！");
    return true;
  }
  return false;
}

function advanceStreet() {
  state.actionPulse = null;
  for (const p of state.players) {
    p.bet = 0;
    if (!p.folded) p.status = p.isHuman ? "等待行動" : "準備下一輪";
  }
  state.currentBet = 0;

  if (state.board.length === 0) {
    state.streetDialogueCount = 0;
    state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
    state.street = "翻牌";
    !state.isMuted && Audio.streetDeal();
    log("翻牌發出。");
    announce("翻牌");
    tableTalk("flop", { chance: 0.82 });
    render();
    return;
  }
  if (state.board.length === 3) {
    state.streetDialogueCount = 0;
    state.board.push(state.deck.pop());
    state.street = "轉牌";
    !state.isMuted && Audio.deal();
    log("轉牌發出。");
    announce("轉牌");
    tableTalk("turn", { chance: 0.55 });
    render();
    return;
  }
  if (state.board.length === 4) {
    state.streetDialogueCount = 0;
    state.board.push(state.deck.pop());
    state.street = "河牌";
    !state.isMuted && Audio.deal();
    log("河牌發出。");
    announce("河牌");
    tableTalk("river", { chance: 0.9 });
    render();
    return;
  }
  showdown();
}

function runOutAllInBoard() {
  if (activePlayers().length <= 1) return;
  state.currentBet = 0;
  state.players.forEach(player => { player.bet = 0; });

  while (state.board.length < 5) {
    if (state.board.length === 0) {
      state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
      state.street = "翻牌";
      log("All-in runout：翻牌發出。");
      continue;
    }
    if (state.board.length === 3) {
      state.board.push(state.deck.pop());
      state.street = "轉牌";
      log("All-in runout：轉牌發出。");
      continue;
    }
    if (state.board.length === 4) {
      state.board.push(state.deck.pop());
      state.street = "河牌";
      log("All-in runout：河牌發出。");
    }
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
  awardPot([best.player], best.player.emoji + " " + best.player.name + " 以" + best.result.name + "贏得底池 " + state.pot + "！");
}

function awardPot(winners, message) {
  const player = winners[0];
  const won = state.pot;
  player.stack += state.pot;
  player.wins = (player.wins || 0) + 1;
  state.pot = 0;
  state.handOver = true;
  state.street = "結算";
  state.winners = winners.map(w => w.name);
  state.waitingForHuman = false;
  state.actionPulse = "win";
  state.winAmount = won;
  for (const seat of state.players) {
    if (!seat.folded) {
      seat.status = getVisibleHandRank(seat);
    }
  }
  if (player.isHuman) {
    tableTalk("lose", { chance: 0.82 });
  } else {
    say(player, "win", { force: true });
  }
  !state.isMuted && Audio.win();
  showWinBanner(winners, won);
  animateWinChips(player, won);
  log(message);
  logScoreboard();
  render();

  scheduleAutoNewHand();
}

function awardSplitPot(winners, message) {
  const share = Math.floor(state.pot / winners.length);
  const rem = state.pot % winners.length;
  const won = state.pot;
  winners.forEach((e, i) => {
    e.player.stack += share + (i < rem ? 1 : 0);
    e.player.wins = (e.player.wins || 0) + 1;
  });
  state.pot = 0;
  state.handOver = true;
  state.street = "結算";
  state.winners = winners.map(e => e.player.name);
  state.waitingForHuman = false;
  state.actionPulse = "win";
  state.winAmount = won;
  for (const seat of state.players) {
    if (!seat.folded) {
      seat.status = getVisibleHandRank(seat);
    }
  }
  const talker = winners.map(e => e.player).find(player => !player.isHuman);
  if (talker) {
    say(talker, "win", { force: true });
  } else {
    tableTalk("lose", { chance: 0.82 });
  }
  !state.isMuted && Audio.win();
  showWinBanner(winners.map(e => e.player), won);
  winners.forEach(e => animateWinChips(e.player, Math.floor(won / winners.length)));
  log(message);
  logScoreboard();
  render();

  scheduleAutoNewHand();
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
  if (unique.includes(14)) unique.push(1);
  for (let i = 0; i <= unique.length - 5; i++) {
    const run = unique.slice(i, i + 5);
    if (run[0] - run[4] === 4) return run[0] === 1 ? 5 : run[0];
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

function getVisibleHandRank(player) {
  if (state.board.length < 3) return player.folded ? "棄牌" : "贏得底池";
  return evaluateBestHand([...player.cards, ...state.board]).name;
}

function syncRaiseControl() {
  const player = human();
  if (!player) return;

  const callAmount = amountToCall(player);
  const availableRaise = Math.max(0, player.stack - callAmount);
  const maxRaise = Math.max(MIN_RAISE, Math.floor(availableRaise / 10) * 10);
  const canRaise = availableRaise >= MIN_RAISE;

  els.raiseAmount.min = MIN_RAISE;
  els.raiseAmount.max = maxRaise;
  els.raiseAmount.disabled = !canRaise;

  if (!canRaise) {
    els.raiseAmount.value = MIN_RAISE;
  } else {
    const current = Number(els.raiseAmount.value);
    els.raiseAmount.value = Math.min(maxRaise, Math.max(MIN_RAISE, current));
  }

  els.raiseAmountValue.textContent = canRaise ? els.raiseAmount.value : "—";
  return { canRaise, callAmount };
}

function setQuickBet(mode) {
  const player = human();
  if (!player || player.folded || player.allIn || state.handOver) return;

  const callAmount = amountToCall(player);
  const availableRaise = Math.max(0, player.stack - callAmount);
  if (mode === "allin") {
    els.raiseAmount.value = Math.max(MIN_RAISE, Math.floor(availableRaise / 10) * 10);
    syncRaiseControl();
    playerAction("allin");
    return;
  }

  const potSized = {
    third: state.pot / 3,
    half: state.pot / 2,
    pot: state.pot,
  }[mode] || MIN_RAISE;
  const raiseBy = Math.max(MIN_RAISE, Math.round(potSized / 10) * 10);
  els.raiseAmount.value = Math.min(availableRaise, raiseBy);
  syncRaiseControl();
}

function pulsePot(amount) {
  if (!amount) return;
  state.potDelta = amount;
  window.clearTimeout(pulsePot.timer);
  pulsePot.timer = window.setTimeout(() => {
    state.potDelta = 0;
    render();
  }, 850);
}

function animateChips(player, amount) {
  if (!els.fxLayer || !amount) return;
  const chip = document.createElement("span");
  const source = player.isHuman ? "from-human" : `from-seat-${Math.max(1, player.position)}`;
  chip.className = `flying-chip ${source}`;
  chip.textContent = amount >= 100 ? "+100" : "+";
  els.fxLayer.appendChild(chip);
  window.setTimeout(() => chip.remove(), 900);
}

function animateWinChips(player, amount) {
  if (!els.fxLayer || !amount) return;
  const target = player.isHuman ? "to-human" : `to-seat-${Math.max(1, player.position)}`;
  for (let i = 0; i < 8; i++) {
    const chip = document.createElement("span");
    chip.className = `win-chip ${target}`;
    chip.style.animationDelay = `${i * 55}ms`;
    els.fxLayer.appendChild(chip);
    window.setTimeout(() => chip.remove(), 1250 + i * 55);
  }
}

function showWinBanner(winners, amount) {
  if (!els.showdownBanner || !winners.length) return;
  const label = winners.map(player => `${player.emoji} ${player.name}`).join("、");
  const hand = getVisibleHandRank(winners[0]);
  els.showdownBanner.innerHTML = `
    <span>WINNER</span>
    <strong>${label}</strong>
    <em>${hand} · +${amount}</em>
  `;
  els.showdownBanner.classList.remove("is-visible");
  void els.showdownBanner.offsetWidth;
  els.showdownBanner.classList.add("is-visible");
  window.clearTimeout(showWinBanner.timer);
  showWinBanner.timer = window.setTimeout(() => {
    els.showdownBanner.classList.remove("is-visible");
  }, 2400);
}

function announceAction(label, type = "call") {
  state.actionPulse = type;
  announce(label);
  window.clearTimeout(announceAction.timer);
  announceAction.timer = window.setTimeout(() => {
    if (state.actionPulse === type) {
      state.actionPulse = null;
      render();
    }
  }, 900);
}

function playerLabel(player) {
  return player.name;
}

function playerLogIcon(player) {
  return player.emoji || "";
}

function actionLogLabel(action) {
  const labels = {
    Fold: "棄牌",
    Check: "過牌",
    Call: "跟注",
    Raise: "加注",
    "All-in": "All-in",
    "All-in Call": "All-in 跟注",
    "All-in Raise": "All-in 加注",
  };
  return labels[action] || action;
}

function logAction(player, action, amount = 0, note = "") {
  const value = amount ? " " + amount : "";
  const suffix = note ? " (" + note + ")" : "";
  log(`${playerLogIcon(player)} ${playerLabel(player)} ${actionLogLabel(action)}${value}${suffix}`);
}

function streetLabel() {
  return STREET_LABELS[state.street] || state.street.toUpperCase();
}

function compactSeatStatus(status) {
  if (!status) return "";
  if (status.includes("Thinking")) return "思考";
  if (status.startsWith("小盲")) return status.replace("小盲", "SB");
  if (status.startsWith("大盲")) return status.replace("大盲", "BB");
  if (status.startsWith("加注到")) return status.replace("加注到", "加注");
  if (status.startsWith("需跟注")) return status.replace("需跟注", "補");
  if (status.startsWith("ALL-IN")) return status.replace("ALL-IN", "All-in");
  return status;
}

function scheduleAutoNewHand() {
  clearAutoNewHandTimer();
  if (!state.autoNewHand || state.players.some(p => p.stack <= 0)) return;
  state.autoNewHandTimer = window.setTimeout(startHand, AUTO_NEW_HAND_DELAY);
}

function clearAutoNewHandTimer() {
  if (!state.autoNewHandTimer) return;
  window.clearTimeout(state.autoNewHandTimer);
  state.autoNewHandTimer = null;
}

function logScoreboard() {
  const standings = [...state.players]
    .sort((a, b) => b.stack - a.stack)
    .map(p => `${p.name} ${p.stack}`)
    .join(" · ");
  log("籌碼排行：" + standings);
}

function render() {
  if (!state.players.length) return;

  els.table.classList.toggle("is-showdown", state.handOver);
  els.table.classList.toggle("is-human-turn", state.waitingForHuman && !state.handOver);
  els.table.dataset.action = state.actionPulse || "";
  els.handNumber.textContent = "Hand #" + state.handNumber;
  els.potValue.textContent = state.pot;
  els.tablePotValue.textContent = state.pot;
  els.potChips.innerHTML = renderPotChips(state.pot);
  els.potDelta.textContent = state.potDelta ? "+" + state.potDelta : "";
  els.potDelta.classList.toggle("is-visible", state.potDelta > 0);
  els.currentBetValue.textContent = state.currentBet;
  els.streetValue.textContent = state.street;
  els.boardStageLabel.textContent = streetLabel();
  els.playerName.innerHTML = `${human().emoji} ${human().name} ${state.dealerIndex === 0 ? '<span class="dealer-button">BTN</span>' : ""}`;
  els.playerStack.textContent = human().stack;
  els.playerPanel.classList.toggle("is-winner", state.winners.includes(human().name));
  els.playerTurnMarker.classList.toggle("is-visible", state.waitingForHuman && !state.handOver);

  const player = human();
  const playerCards = player?.cards || [];
  els.playerCards.innerHTML = playerCards.length === 2
    ? playerCards.map((c, i) => renderCard(c, i)).join("")
    : Array.from({ length: 2 }, (_, i) => renderCard(null, i)).join("");

  els.boardCards.innerHTML = state.board.length
    ? state.board.map((c, i) => renderCard(c, i)).join("")
    : Array.from({ length: 5 }, (_, i) => renderCard(null, i)).join("");

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
    const isActive = !player.folded && (player.status.includes("需") || player.status.includes("加注") || isThinking);
    const isDealer = player.position === state.dealerIndex;
    const actionClass = player.lastAction ? "action-" + player.lastAction : "";
    const statusLabel = compactSeatStatus(player.status);
    return `
      <article class="seat seat-pos-${player.position} ${player.folded ? "is-folded" : ""} ${isActive ? "is-active" : ""} ${isWinner ? "is-winner" : ""} ${actionClass}">
        <div class="seat-header">
          <div class="seat-identity">
            <span class="player-emoji">${player.emoji}</span>
            <div>
              <h2>${player.name} ${isDealer ? '<span class="dealer-button">BTN</span>' : ""}</h2>
              <div class="seat-meta"><strong>${player.stack}</strong><span>${player.style || "AI"}</span></div>
            </div>
          </div>
          <div class="seat-status ${isThinking ? "is-thinking" : ""}">${statusLabel}</div>
        </div>
        ${player.dialogue ? `<div class="seat-dialogue tone-${player.dialogueTone || "talk"}">${escapeHtml(player.dialogue)}</div>` : ""}
        ${handLabel ? `<div class="reveal-hand-label">${isWinner ? "勝利 · " : ""}${handLabel}</div>` : ""}
        <div class="cards">${player.cards.map((c, i) => renderCard(reveal ? c : null, i)).join("")}</div>
        ${player.folded ? '<div class="fold-banner">FOLD</div>' : ""}
      </article>
    `;
  }).join("");

  const canAct = !state.handOver && !human().folded && !human().allIn;
  const { canRaise, callAmount } = syncRaiseControl();
  els.foldButton.disabled = !canAct;
  els.callButton.disabled = !canAct;
  els.raiseButton.disabled = !canAct || !canRaise;
  els.allInButton.disabled = !canAct || human().stack <= 0;
  els.callButton.textContent = callAmount === 0 ? "過牌" : "跟注 " + callAmount;
  els.quickBets.querySelectorAll("button").forEach(button => {
    button.disabled = !canAct || (button.dataset.bet !== "allin" && !canRaise);
  });

  if (els.muteButton) {
    els.muteButton.textContent = state.isMuted ? "🔊 開啟音效" : "🔇 關閉音效";
    els.muteButton.classList.toggle("is-muted", state.isMuted);
  }

  if (els.autoNewHandButton) {
    els.autoNewHandButton.textContent = state.autoNewHand ? "⏸ 停止自動" : "▶ 自動新牌局";
    els.autoNewHandButton.classList.toggle("is-auto-on", state.autoNewHand);
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

els.foldButton.addEventListener("click", () => playerAction("fold"));
els.callButton.addEventListener("click", () => playerAction("call"));
els.raiseButton.addEventListener("click", () => playerAction("raise"));
els.allInButton.addEventListener("click", () => playerAction("allin"));
els.newHandButton.addEventListener("click", startHand);
els.raiseAmount.addEventListener("input", () => {
  syncRaiseControl();
});
els.quickBets.addEventListener("click", event => {
  const button = event.target.closest("button[data-bet]");
  if (!button) return;
  setQuickBet(button.dataset.bet);
});

if (els.muteButton) {
  els.muteButton.addEventListener("click", () => {
    state.isMuted = !state.isMuted;
    render();
  });
}

if (els.autoNewHandButton) {
  els.autoNewHandButton.addEventListener("click", () => {
    state.autoNewHand = !state.autoNewHand;
    if (!state.autoNewHand) clearAutoNewHandTimer();
    if (state.autoNewHand && state.handOver) scheduleAutoNewHand();
    render();
  });
}

startHand();
