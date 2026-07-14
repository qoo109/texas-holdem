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
const CASH_GAME_REBUY_STACK = STARTING_STACK;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const MIN_RAISE = 20;
const AUTO_NEW_HAND_DELAY = 3000;
const MAX_LOG_ENTRIES = 36;
const DIALOGUE_DISPLAY_MS = 3300;
const DIALOGUE_COOLDOWN_MS = 8000;
const MAX_DIALOGUE_PER_STREET = 2;
const CARD_MOTION_MS = 620;
const THEME_STORAGE_KEY = "texasHoldemTheme";
const STREET_LABELS = {
  "翻牌前": "PREFLOP",
  "翻牌": "FLOP",
  "轉牌": "TURN",
  "河牌": "RIVER",
  "結算": "SHOWDOWN",
};

function readSavedTheme() {
  const preset = document.documentElement.dataset.theme;
  if (preset === "light" || preset === "dark") return preset;
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
  } catch (error) {
    return "dark";
  }
}

const state = {
  deck: [], board: [], pot: 0, currentBet: 0,
  street: "翻牌前", handOver: false, players: [], lastEvent: "新牌局開始",
  isMuted: false,
  theme: readSavedTheme(),
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
  currentActorIndex: 0,
  lastAggressor: null,
  lastRaiseSize: BIG_BLIND,
  cardMotionUntil: 0,
  coach: {
    enabled: true,
    odds: true,
    advice: true,
    lastBoardKey: "",
    previousWinRate: null,
    lastWinRate: null,
    analysisCache: { key: "", data: null },
  },
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
  potChip: document.querySelector(".pot-chip"),
  potDelta: document.querySelector("#potDelta"),
  playerCards: document.querySelector("#playerCards"),
  potValue: document.querySelector("#potValue"),
  tablePotValue: document.querySelector("#tablePotValue"),
  currentBetValue: document.querySelector("#currentBetValue"),
  streetValue: document.querySelector("#streetValue"),
  cornerHandValue: document.querySelector("#cornerHandValue"),
  cornerDealerValue: document.querySelector("#cornerDealerValue"),
  cornerBlindsValue: document.querySelector("#cornerBlindsValue"),
  handNumber: document.querySelector("#handNumber"),
  playerName: document.querySelector("#playerName"),
  playerPanel: document.querySelector(".player-panel"),
  heroTableStack: document.querySelector("#heroTableStack"),
  playerStackChips: document.querySelector("#playerStackChips"),
  playerContributionValue: document.querySelector("#playerContributionValue"),
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
  themeButton: document.querySelector("#themeButton"),
  gameLog: document.querySelector("#gameLog"),
  muteButton: document.querySelector("#muteButton"),
  autoNewHandButton: document.querySelector("#autoNewHandButton"),
  coachPanel: document.querySelector("#coachPanel"),
  coachEnabled: document.querySelector("#coachEnabled"),
  coachToggleText: document.querySelector(".coach-main-toggle span"),
  coachOddsToggle: document.querySelector("#coachOddsToggle"),
  coachAdviceToggle: document.querySelector("#coachAdviceToggle"),
  coachContent: document.querySelector("#coachContent"),
  coachOddsCard: document.querySelector('[data-coach-card="odds"]'),
  coachAdviceCard: document.querySelector('[data-coach-card="advice"]'),
  coachWinRate: document.querySelector("#coachWinRate"),
  coachWinMeter: document.querySelector("#coachWinMeter"),
  coachOuts: document.querySelector("#coachOuts"),
  coachPotOdds: document.querySelector("#coachPotOdds"),
  coachTrend: document.querySelector("#coachTrend"),
  coachBestAction: document.querySelector("#coachBestAction"),
  coachStars: document.querySelector("#coachStars"),
  coachAdviceText: document.querySelector("#coachAdviceText"),
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
    ? state.players.map(p => p.stack > 0 ? p.stack : CASH_GAME_REBUY_STACK)
    : Array(seatCount).fill(STARTING_STACK);
  state.deck = shuffle(createDeck());
  state.board = [];
  state.pot = 0;
  state.currentBet = 0;
  state.street = "翻牌前";
  state.handOver = false;
  state.winners = [];
  state.waitingForHuman = false;
  state.potDelta = 0;
  state.actionPulse = null;
  state.winAmount = 0;
  state.streetDialogueCount = 0;
  state.currentActorIndex = 0;
  state.lastAggressor = null;
  state.lastRaiseSize = BIG_BLIND;
  markCardsForMotion();
  state.coach.lastBoardKey = "";
  state.coach.previousWinRate = null;
  state.coach.lastWinRate = null;
  state.coach.analysisCache = { key: "", data: null };
  if (els.showdownBanner) els.showdownBanner.classList.remove("is-visible");

  state.players = [
    { name: "Owl", isHuman: true, emoji: "🦉", cards: [state.deck.pop(), state.deck.pop()],
      stack: prev[0], bet: 0, totalContribution: 0, folded: false, allIn: false, hasActed: false, raiseLocked: false, status: "等待行動", position: 0,
      wins: (state.players[0]?.wins || 0), dialogue: "", dialogueTone: "", lastDialogueAt: 0 },
    ...PERSONALITIES.map((p, i) => ({
      ...p, isHuman: false, cards: [state.deck.pop(), state.deck.pop()],
      stack: prev[i + 1], bet: 0, totalContribution: 0, folded: false, allIn: false, hasActed: false, raiseLocked: false, status: "準備行動", position: i + 1,
      wins: (state.players[i + 1]?.wins || 0), dialogue: "", dialogueTone: "", lastDialogueAt: 0,
    })),
  ];

  state.players.forEach((_, i) => setTimeout(() => !state.isMuted && Audio.deal(), i * 120));
  const smallBlind = state.players[(state.dealerIndex + 1) % state.players.length];
  const bigBlind = state.players[(state.dealerIndex + 2) % state.players.length];
  postBlind(smallBlind, SMALL_BLIND, "小盲");
  postBlind(bigBlind, BIG_BLIND, "大盲");
  state.currentBet = Math.max(smallBlind.bet, bigBlind.bet);
  state.lastRaiseSize = BIG_BLIND;
  state.lastAggressor = bigBlind.position;
  log(`🃏 新牌局開始，盲注 ${SMALL_BLIND} / ${BIG_BLIND}。`);
  announce("新牌局開始");
  beginBettingRound((state.dealerIndex + 3) % state.players.length);
  continueBetting();
}

function postBlind(player, amount, label) {
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.bet += paid;
  player.totalContribution += paid;
  state.pot += paid;
  pulsePot(paid);
  if (player.stack === 0) player.allIn = true;
  player.status = label + " " + paid;
  player.lastAction = label;
}

function activePlayers() { return state.players.filter(p => !p.folded); }
function human() { return state.players[0]; }
function amountToCall(player) { return Math.max(0, state.currentBet - player.bet); }
function minimumRaiseBy() { return state.currentBet === 0 ? BIG_BLIND : Math.max(MIN_RAISE, state.lastRaiseSize); }
function minRaiseTo() { return state.currentBet + minimumRaiseBy(); }

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
  const player = human();
  if (state.handOver || !state.waitingForHuman || state.currentActorIndex !== 0 || player.folded || player.allIn) return;
  state.waitingForHuman = false;

  if (action === "fold") {
    player.folded = true;
    player.hasActed = true;
    player.raiseLocked = false;
    player.status = "棄牌";
    player.lastAction = "fold";
    !state.isMuted && Audio.fold();
    logAction(player, "Fold");
    announceAction("FOLD", "fold");
    tableTalk("playerFold", { chance: 0.78 });
  }

  if (action === "call") {
    const callAmount = amountToCall(player);
    callAmount === 0 ? !state.isMuted && Audio.check() : !state.isMuted && Audio.chip();
    callPlayer(player);
  }

  if (action === "raise") {
    syncRaiseControl();
    const raiseBy = Number(els.raiseAmount.value);
    raisePlayer(player, raiseBy);
    !state.isMuted && Audio.raise();
    logAction(player, player.allIn ? "All-in Raise" : "Raise", player.bet);
    announceAction(player.allIn ? "ALL-IN" : "RAISE", player.allIn ? "allin" : "raise");
    tableTalk(player.allIn ? "humanAllin" : "humanRaise", { chance: 0.82 });
  }

  if (action === "allin") {
    if (player.raiseLocked && player.stack > amountToCall(player)) {
      state.waitingForHuman = true;
      render();
      return;
    }
    const previousBet = state.currentBet;
    pay(player, player.stack);
    player.hasActed = true;
    const isRaise = applyBetIncrease(player, previousBet);
    player.status = "ALL-IN " + player.bet;
    player.lastAction = "allin";
    !state.isMuted && Audio.raise();
    logAction(player, isRaise ? "All-in Raise" : "All-in", player.bet);
    announceAction("ALL-IN", "allin");
    tableTalk("humanAllin", { force: true });
  }

  continueBetting();
}

function callPlayer(player) {
  const paid = pay(player, amountToCall(player));
  player.hasActed = true;
  player.raiseLocked = false;
  player.status = player.allIn && paid > 0 ? "ALL-IN " + player.bet : (paid === 0 ? "過牌" : "跟注 " + paid);
  player.lastAction = player.allIn && paid > 0 ? "allin" : (paid === 0 ? "check" : "call");
  logAction(player, player.allIn && paid > 0 ? "All-in Call" : (paid === 0 ? "Check" : "Call"), paid);
  announceAction(player.allIn && paid > 0 ? "ALL-IN" : (paid === 0 ? "CHECK" : "CALL"), player.lastAction);
}

function raisePlayer(player, raiseBy) {
  const previousBet = state.currentBet;
  const legalRaiseBy = Math.max(minimumRaiseBy(), raiseBy);
  const targetBet = state.currentBet + legalRaiseBy;
  const contribution = Math.max(0, targetBet - player.bet);
  pay(player, contribution);
  player.hasActed = true;
  applyBetIncrease(player, previousBet);
  player.status = player.allIn ? "ALL-IN " + player.bet : "加注到 " + player.bet;
  player.lastAction = player.allIn ? "allin" : "raise";
}

function applyBetIncrease(player, previousBet) {
  if (player.bet <= previousBet) {
    player.raiseLocked = false;
    return false;
  }

  const raiseSize = player.bet - previousBet;
  const fullRaise = player.bet >= previousBet + state.lastRaiseSize;
  state.currentBet = player.bet;

  if (fullRaise) {
    state.lastRaiseSize = Math.max(MIN_RAISE, raiseSize);
    state.lastAggressor = player.position;
    for (const other of state.players) {
      other.raiseLocked = false;
      if (!other.folded && !other.allIn && other !== player) {
        other.hasActed = false;
        if (other.status !== "棄牌") other.status = other.isHuman ? "等待行動" : "準備行動";
      }
    }
  } else {
    for (const other of state.players) {
      if (!other.folded && !other.allIn && other !== player && other.hasActed && other.bet < state.currentBet) {
        other.raiseLocked = true;
      }
    }
  }

  player.hasActed = true;
  player.raiseLocked = false;
  return fullRaise;
}

function pay(player, amount) {
  const paid = Math.min(player.stack, amount);
  player.stack -= paid;
  player.bet += paid;
  player.totalContribution += paid;
  state.pot += paid;
  if (paid > 0) {
    pulsePot(paid);
    animateChips(player, paid);
  }
  if (player.stack === 0) player.allIn = true;
  return paid;
}

function beginBettingRound(firstIndex) {
  state.players.forEach(player => {
    player.hasActed = player.folded || player.allIn;
    player.raiseLocked = false;
    if (!player.folded && !player.allIn) player.status = player.isHuman ? "等待行動" : "準備行動";
  });
  state.currentActorIndex = nextPendingActor(firstIndex - 1);
}

function nextPendingActor(startIndex) {
  const count = state.players.length;
  for (let offset = 1; offset <= count; offset++) {
    const index = (startIndex + offset + count) % count;
    const player = state.players[index];
    if (needsAction(player)) return index;
  }
  return -1;
}

function needsAction(player) {
  return Boolean(player && !player.folded && !player.allIn && (!player.hasActed || player.bet < state.currentBet));
}

function isBettingRoundComplete() {
  const actionable = state.players.filter(player => !player.folded && !player.allIn);
  if (!actionable.length) return true;
  return actionable.every(player => player.hasActed && player.bet >= state.currentBet);
}

function shouldRunOutAllIn() {
  const active = activePlayers();
  if (active.length <= 1) return false;
  const notAllIn = active.filter(player => !player.allIn);
  if (notAllIn.length > 1) return false;
  return active.every(player => player.allIn || player.bet >= state.currentBet);
}

function markCardsForMotion(duration = CARD_MOTION_MS) {
  state.cardMotionUntil = Date.now() + duration;
}

function shouldAnimateCards() {
  return Date.now() < state.cardMotionUntil;
}

function promptHumanAction(player) {
  const callAmount = amountToCall(player);
  player.status = callAmount > 0 ? "需跟注 " + callAmount : "等待行動";
  state.waitingForHuman = true;
  announce(callAmount > 0 ? "輪到你：跟注 " + callAmount : "輪到你");
}

function continueBetting() {
  let guard = 0;
  state.waitingForHuman = false;

  while (!state.handOver && guard < 140) {
    if (finishByFoldIfNeeded()) break;
    if (shouldRunOutAllIn()) {
      runOutAllInBoard();
      break;
    }
    if (isBettingRoundComplete()) {
      advanceStreet();
      guard += 1;
      continue;
    }

    if (state.currentActorIndex < 0 || !needsAction(state.players[state.currentActorIndex])) {
      state.currentActorIndex = nextPendingActor(state.currentActorIndex);
    }

    const actor = state.players[state.currentActorIndex];
    if (!actor) break;
    if (actor.isHuman) {
      promptHumanAction(actor);
      break;
    }

    botAction(actor);
    state.currentActorIndex = nextPendingActor(actor.position);
    guard += 1;
  }

  if (!state.handOver && guard >= 140) {
    log("系統：下注輪推進中止，請開新牌局。");
    state.waitingForHuman = !human().folded && !human().allIn;
  }

  render();
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function cardKey(card) {
  return `${card.value}${card.suit}`;
}

function positionLabel(player) {
  if (!player || !state.players.length) return "--";
  const labels = ["BTN", "SB", "BB", "UTG", "MP", "HJ", "CO", "Seat"];
  const offset = (player.position - state.dealerIndex + state.players.length) % state.players.length;
  return labels[offset] || "Seat " + (offset + 1);
}

function positionClass(label) {
  return String(label || "seat").toLowerCase().replace(/[^a-z0-9]+/g, "-");
}

function botAction(player) {
  player.status = "Thinking...";

  const strength = estimateStrength(player);
  const needed = amountToCall(player);
  const potOdds = needed / Math.max(1, state.pot + needed);
  const eff = strength + (Math.random() - 0.5) * 0.1;
  const isBluffing = Math.random() < player.bluffRate && needed <= player.stack * 0.25;
  const posBonus = player.position * 0.04;
  const shouldCall = needed === 0 || eff + posBonus + (1 - player.patience) * 0.08 > potOdds - 0.05;
  const availableRaise = Math.max(0, player.stack - needed);
  const canRaise = !player.raiseLocked && availableRaise >= minimumRaiseBy();
  const shouldRaise = canRaise && (eff + posBonus > 0.68 || isBluffing) && Math.random() < player.aggression;

  if (needed > 0 && !shouldCall && !isBluffing) {
    player.folded = true;
    player.hasActed = true;
    player.raiseLocked = false;
    player.status = "棄牌";
    player.lastAction = "fold";
    !state.isMuted && Audio.fold();
    logAction(player, "Fold");
    announceAction("FOLD", "fold");
    say(player, "fold", { chance: 0.22 });
    return;
  }

  if (shouldRaise) {
    const desiredRaiseBy = Math.floor((minimumRaiseBy() + 20 + (isBluffing ? 0.4 : strength) * 100) / 10) * 10;
    const raiseBy = Math.min(availableRaise, Math.max(minimumRaiseBy(), desiredRaiseBy));
    raisePlayer(player, raiseBy);
    !state.isMuted && Audio.raise();
    logAction(player, player.allIn ? "All-in Raise" : "Raise", player.bet);
    announceAction(player.allIn ? "ALL-IN" : "RAISE", player.lastAction);
    say(player, player.allIn ? "allin" : "raise", {
      force: player.allIn,
      chance: 0.38,
    });
    return;
  }

  const paid = pay(player, needed);
  player.hasActed = true;
  player.raiseLocked = false;
  player.status = player.allIn && paid > 0 ? "ALL-IN " + player.bet : (paid === 0 ? "過牌" : "跟注 " + paid);
  paid === 0 ? !state.isMuted && Audio.check() : !state.isMuted && Audio.chip();
  player.lastAction = player.allIn && paid > 0 ? "allin" : (paid === 0 ? "check" : "call");
  logAction(player, player.allIn && paid > 0 ? "All-in Call" : (paid === 0 ? "Check" : "Call"), paid);
  announceAction(player.allIn && paid > 0 ? "ALL-IN" : (paid === 0 ? "CHECK" : "CALL"), player.lastAction);
  say(player, player.allIn && paid > 0 ? "allin" : (paid === 0 ? "check" : "call"), {
    chance: player.allIn && paid > 0 ? 0.28 : (paid === 0 ? 0.14 : 0.18),
  });
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
    p.hasActed = p.folded || p.allIn;
    p.raiseLocked = false;
    if (!p.folded) p.status = p.isHuman ? "等待行動" : "準備下一輪";
  }
  state.currentBet = 0;
  state.lastAggressor = null;
  state.lastRaiseSize = BIG_BLIND;

  if (state.board.length === 0) {
    state.streetDialogueCount = 0;
    state.board.push(state.deck.pop(), state.deck.pop(), state.deck.pop());
    state.street = "翻牌";
    markCardsForMotion();
    !state.isMuted && Audio.streetDeal();
    log("翻牌發出。");
    announce("翻牌");
    tableTalk("flop", { chance: 0.82 });
    beginBettingRound((state.dealerIndex + 1) % state.players.length);
    return;
  }
  if (state.board.length === 3) {
    state.streetDialogueCount = 0;
    state.board.push(state.deck.pop());
    state.street = "轉牌";
    markCardsForMotion();
    !state.isMuted && Audio.deal();
    log("轉牌發出。");
    announce("轉牌");
    tableTalk("turn", { chance: 0.55 });
    beginBettingRound((state.dealerIndex + 1) % state.players.length);
    return;
  }
  if (state.board.length === 4) {
    state.streetDialogueCount = 0;
    state.board.push(state.deck.pop());
    state.street = "河牌";
    markCardsForMotion();
    !state.isMuted && Audio.deal();
    log("河牌發出。");
    announce("河牌");
    tableTalk("river", { chance: 0.9 });
    beginBettingRound((state.dealerIndex + 1) % state.players.length);
    return;
  }
  showdown();
}

function runOutAllInBoard() {
  if (activePlayers().length <= 1) return;
  state.currentBet = 0;
  state.players.forEach(player => { player.bet = 0; });
  markCardsForMotion(CARD_MOTION_MS + 260);

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
  const pots = buildPots();
  const winningPlayers = new Map();
  const messages = [];
  let totalAwarded = 0;

  pots.forEach((pot, index) => {
    const contenders = pot.eligiblePlayerIds
      .map(id => state.players[id])
      .filter(Boolean)
      .map(player => ({
        player,
        result: evaluateBestHand([...player.cards, ...state.board])
      }));

    contenders.sort((a, b) => compareResults(b.result, a.result));
    const best = contenders[0];
    const winners = contenders.filter(e => compareResults(e.result, best.result) === 0);
    const share = Math.floor(pot.amount / winners.length);
    const remainder = pot.amount % winners.length;
    const potLabel = pots.length > 1 ? (index === 0 ? "主池" : "邊池 " + index) : "底池";

    winners.forEach((entry, winnerIndex) => {
      const amount = share + (winnerIndex < remainder ? 1 : 0);
      entry.player.stack += amount;
      winningPlayers.set(entry.player.position, entry.player);
      totalAwarded += amount;
    });

    const names = winners.map(entry => `${entry.player.emoji} ${entry.player.name}`).join("、");
    messages.push(`${names} 以${best.result.name}${winners.length > 1 ? "平分" : "贏得"}${potLabel} ${pot.amount}。`);
  });

  finishShowdown([...winningPlayers.values()], totalAwarded, messages);
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

function buildPots() {
  const levels = [...new Set(state.players
    .map(player => player.totalContribution || 0)
    .filter(amount => amount > 0))]
    .sort((a, b) => a - b);
  const pots = [];
  let previous = 0;

  for (const level of levels) {
    const contributors = state.players.filter(player => (player.totalContribution || 0) >= level);
    const amount = (level - previous) * contributors.length;
    const eligiblePlayerIds = contributors
      .filter(player => !player.folded)
      .map(player => player.position);

    if (amount > 0 && eligiblePlayerIds.length) {
      pots.push({ amount, eligiblePlayerIds });
    }
    previous = level;
  }

  if (!pots.length && state.pot > 0) {
    pots.push({ amount: state.pot, eligiblePlayerIds: activePlayers().map(player => player.position) });
  }

  return pots;
}

function finishShowdown(winners, won, messages) {
  winners.forEach(player => {
    player.wins = (player.wins || 0) + 1;
  });
  state.pot = 0;
  state.handOver = true;
  state.street = "結算";
  state.winners = winners.map(player => player.name);
  state.waitingForHuman = false;
  state.actionPulse = "win";
  state.winAmount = won;
  for (const seat of state.players) {
    if (!seat.folded) {
      seat.status = getVisibleHandRank(seat);
    }
  }

  const talker = winners.find(player => !player.isHuman);
  if (talker) {
    say(talker, "win", { force: true });
  } else {
    tableTalk("lose", { chance: 0.82 });
  }

  !state.isMuted && Audio.win();
  showWinBanner(winners, won);
  winners.forEach(player => animateWinChips(player, Math.floor(won / Math.max(1, winners.length))));
  messages.forEach(message => log(message));
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
  const minRaiseBy = minimumRaiseBy();
  const maxRaise = Math.max(minRaiseBy, Math.floor(availableRaise / 10) * 10);
  const canRaise = !player.raiseLocked && availableRaise >= minRaiseBy;

  els.raiseAmount.min = minRaiseBy;
  els.raiseAmount.max = maxRaise;
  els.raiseAmount.disabled = !canRaise;

  if (!canRaise) {
    els.raiseAmount.value = minRaiseBy;
  } else {
    const current = Number(els.raiseAmount.value);
    els.raiseAmount.value = Math.min(maxRaise, Math.max(minRaiseBy, current));
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
    els.raiseAmount.value = Math.max(minimumRaiseBy(), Math.floor(availableRaise / 10) * 10);
    syncRaiseControl();
    playerAction("allin");
    return;
  }

  const potSized = {
    third: state.pot / 3,
    half: state.pot / 2,
    pot: state.pot,
  }[mode] || minimumRaiseBy();
  const raiseBy = Math.max(minimumRaiseBy(), Math.round(potSized / 10) * 10);
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
  const source = player.isHuman ? "from-human" : `from-seat-${Math.max(1, player.position)}`;
  const chipCount = Math.min(7, Math.max(2, Math.ceil(amount / 120)));
  const chipColors = ["chip-gold", "chip-red", "chip-cyan", "chip-blue"];

  for (let i = 0; i < chipCount; i++) {
    const chip = document.createElement("span");
    const spread = i - (chipCount - 1) / 2;
    chip.className = `flying-chip ${source} ${chipColors[i % chipColors.length]}`;
    chip.textContent = i === 0 ? "+" + amount : "";
    chip.style.animationDelay = `${i * 38}ms`;
    chip.style.setProperty("--chip-jitter-x", `${spread * 8}px`);
    chip.style.setProperty("--chip-jitter-y", `${(i % 2 ? -1 : 1) * 7}px`);
    chip.style.setProperty("--chip-pot-x", `${spread * 3}px`);
    els.fxLayer.appendChild(chip);
    window.setTimeout(() => chip.remove(), 980 + i * 38);
  }
}

function animateWinChips(player, amount) {
  if (!els.fxLayer || !amount) return;
  const target = player.isHuman ? "to-human" : `to-seat-${Math.max(1, player.position)}`;
  const chipCount = Math.min(14, Math.max(7, Math.ceil(amount / 180)));
  const chipColors = ["chip-gold", "chip-red", "chip-cyan", "chip-blue"];

  for (let i = 0; i < chipCount; i++) {
    const chip = document.createElement("span");
    const spread = i - (chipCount - 1) / 2;
    chip.className = `win-chip ${target} ${chipColors[i % chipColors.length]}`;
    chip.style.animationDelay = `${i * 42}ms`;
    chip.style.setProperty("--win-jitter-x", `${spread * 7}px`);
    chip.style.setProperty("--win-jitter-y", `${(i % 3 - 1) * 9}px`);
    els.fxLayer.appendChild(chip);
    window.setTimeout(() => chip.remove(), 1300 + i * 42);
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

function seatActionMeta(player) {
  const status = player?.status || "";
  const amount = status.match(/\d+/)?.[0] || "";
  if (!player || status.includes("Thinking")) return { type: "thinking", label: "思考", amount: "" };
  if (player.folded || status === "棄牌") return { type: "fold", label: "棄牌", amount: "" };
  if (status.startsWith("ALL-IN")) return { type: "allin", label: "All-in", amount: amount || player.bet || "" };
  if (status.startsWith("加注")) return { type: "raise", label: "加注", amount };
  if (status.startsWith("跟注")) return { type: "call", label: "跟注", amount };
  if (status.startsWith("小盲")) return { type: "blind", label: "小盲", amount };
  if (status.startsWith("大盲")) return { type: "blind", label: "大盲", amount };
  if (status.startsWith("需跟注")) return { type: "pending", label: "待跟", amount };
  if (status.startsWith("贏得")) return { type: "win", label: "勝利", amount: "" };
  if (status.startsWith("準備下一輪")) return { type: "ready", label: "下一輪", amount: "" };
  if (status === "過牌") return { type: "check", label: "過牌", amount: "" };
  if (status === "等待行動") return { type: "waiting", label: "待行動", amount: "" };
  if (status === "準備行動") return { type: "ready", label: "準備", amount: "" };
  return { type: "neutral", label: compactSeatStatus(status), amount: "" };
}

function scheduleAutoNewHand() {
  clearAutoNewHandTimer();
  if (!state.autoNewHand) return;
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

function coachBoardKey() {
  return state.board.length ? state.board.map(cardKey).join("|") : "preflop";
}

function coachCardsKey(cards = []) {
  return cards.map(cardKey).join("|");
}

function coachAnalysisKey(player) {
  if (!player) return "no-player";
  const opponentState = state.players
    .filter(p => !p.isHuman)
    .map(p => `${p.name}:${p.folded ? 1 : 0}:${p.allIn ? 1 : 0}`)
    .join(",");

  return [
    state.handNumber,
    state.street,
    coachCardsKey(player.cards),
    coachBoardKey(),
    state.handOver ? 1 : 0,
    player.folded ? 1 : 0,
    player.bet,
    player.stack,
    state.pot,
    state.currentBet,
    opponentState,
  ].join(";");
}

function calculateOuts(player) {
  if (!player || player.folded || state.board.length < 3 || state.board.length >= 5) return 0;
  const known = new Set([...player.cards, ...state.board].map(cardKey));
  const current = evaluateBestHand([...player.cards, ...state.board]);
  return createDeck()
    .filter(card => !known.has(cardKey(card)))
    .reduce((count, card) => {
      const next = evaluateBestHand([...player.cards, ...state.board, card]);
      return count + (next.score > current.score ? 1 : 0);
    }, 0);
}

function calculatePotOdds(player) {
  if (!player || player.folded || state.handOver) return 0;
  const callAmount = amountToCall(player);
  if (callAmount <= 0) return 0;
  return (callAmount / Math.max(1, state.pot + callAmount)) * 100;
}

function estimateHeroWinRate(outsOverride = null) {
  const player = human();
  if (!player || player.folded) return 0;
  const opponents = activePlayers().filter(p => !p.isHuman).length;
  if (opponents === 0 && activePlayers().includes(player)) return 100;

  if (state.board.length < 3) {
    const preflop = estimateStrength(player);
    return Math.round(clamp((0.24 + preflop * 0.64 - opponents * 0.025) * 100, 7, 84));
  }

  const result = evaluateBestHand([...player.cards, ...state.board]);
  const outs = outsOverride ?? calculateOuts(player);
  const cardsToCome = 5 - state.board.length;
  const madeHandBase = [24, 42, 58, 68, 73, 78, 88, 94, 98, 99];
  const drawBoost = cardsToCome >= 2 ? outs * 2.5 : (cardsToCome === 1 ? outs * 1.25 : 0);
  const topCardBoost = result.tiebreakers[0] ? (result.tiebreakers[0] - 10) * 1.1 : 0;
  const opponentPressure = Math.min(24, opponents * 3.4);
  return Math.round(clamp(madeHandBase[result.score] + drawBoost + topCardBoost - opponentPressure, 2, 99));
}

function getCoachAnalysis(player) {
  const key = coachAnalysisKey(player);
  const cached = state.coach.analysisCache;
  if (cached?.key === key && cached.data) return cached.data;

  const outs = calculateOuts(player);
  const data = {
    winRate: estimateHeroWinRate(outs),
    outs,
    potOdds: calculatePotOdds(player),
  };
  state.coach.analysisCache = { key, data };
  return data;
}

function updateCoachTrend(winRate) {
  const key = coachBoardKey();
  if (state.coach.lastBoardKey !== key) {
    state.coach.previousWinRate = state.coach.lastWinRate;
    state.coach.lastWinRate = winRate;
    state.coach.lastBoardKey = key;
  } else if (state.coach.lastWinRate == null) {
    state.coach.lastWinRate = winRate;
  }

  if (state.coach.previousWinRate == null) {
    return state.board.length ? "新街道估算" : "翻牌前估算";
  }

  const diff = Math.round(state.coach.lastWinRate - state.coach.previousWinRate);
  if (Math.abs(diff) < 1) return "勝率持平";
  return diff > 0 ? "勝率 +" + diff + "%" : "勝率 " + diff + "%";
}

function coachStarsFor(edge) {
  const count = clamp(Math.round(2 + Math.abs(edge) / 12), 1, 5);
  return "★".repeat(count) + "☆".repeat(5 - count);
}

function buildCoachAdvice(winRate, potOdds, outs) {
  const player = human();
  if (!player) return { action: "--", stars: "☆☆☆☆☆", text: "等待新牌局開始。" };
  if (player.folded) {
    return { action: "觀察", stars: "★★☆☆☆", text: "你已經棄牌。現在最值得看的是誰在壓力下繼續下注，下一手可以記住這些節奏。" };
  }
  if (state.handOver) {
    const result = state.board.length >= 3 ? evaluateBestHand([...player.cards, ...state.board]).name : "未攤牌";
    const won = state.winners.includes(player.name);
    return {
      action: won ? "Review" : "復盤",
      stars: won ? "★★★★☆" : "★★★☆☆",
      text: won ? `這手以 ${result} 收下結果。下一步可以回看哪一次下注讓對手付出最多。` : `這手最後是 ${result}。先看 Pot Odds 和下注壓力，找出是否有太貴的跟注。`,
    };
  }

  const callAmount = amountToCall(player);
  const availableRaise = Math.max(0, player.stack - callAmount);
  const canRaise = !player.raiseLocked && availableRaise >= minimumRaiseBy();
  const canAct = state.waitingForHuman && state.currentActorIndex === 0;
  const edge = winRate - potOdds;

  if (!canAct) {
    return {
      action: "觀察",
      stars: "★★★☆☆",
      text: `目前估計勝率 ${winRate}%。先看對手下注大小，若面對大注，Pot Odds 會是關鍵。`,
    };
  }

  if (callAmount > 0) {
    if (edge < 8 && outs < 8) {
      return {
        action: "Fold",
        stars: coachStarsFor(edge),
        text: `跟注 ${callAmount} 需要約 ${Math.round(potOdds)}% 勝率；目前估計 ${winRate}%，Outs ${outs}。這價格偏貴，Fold 比較乾淨。`,
      };
    }
    if (edge >= 24 && canRaise) {
      return {
        action: "Raise",
        stars: coachStarsFor(edge),
        text: `目前勝率 ${winRate}% 明顯高於 Pot Odds ${Math.round(potOdds)}%。可以加注拿價值，也讓聽牌對手付費。`,
      };
    }
    return {
      action: "Call",
      stars: coachStarsFor(edge),
      text: `跟注 ${callAmount} 的價格可接受。估計勝率 ${winRate}%、Pot Odds ${Math.round(potOdds)}%、Outs ${outs}，先跟住比較穩。`,
    };
  }

  if (winRate >= 67 && canRaise) {
    return {
      action: "Raise",
      stars: "★★★★☆",
      text: `不用補注，但目前牌力偏強。可以主動加注，把弱牌和聽牌的價格拉高。`,
    };
  }

  return {
    action: "Check",
    stars: "★★★☆☆",
    text: `現在可以免費看下一張。估計勝率 ${winRate}%，沒有必要硬把底池做大。`,
  };
}

function renderCoach() {
  if (!els.coachPanel || !state.players.length) return;
  const coach = state.coach;
  els.coachEnabled.checked = coach.enabled;
  els.coachOddsToggle.checked = coach.odds;
  els.coachAdviceToggle.checked = coach.advice;
  if (els.coachToggleText) els.coachToggleText.textContent = coach.enabled ? "ON" : "OFF";
  const hasAnyCoachModule = coach.odds || coach.advice;
  els.coachPanel.classList.toggle("is-disabled", !coach.enabled);
  els.coachPanel.classList.toggle("is-empty", coach.enabled && !hasAnyCoachModule);
  els.coachContent.hidden = !coach.enabled || !hasAnyCoachModule;
  if (!coach.enabled) return;

  els.coachOddsCard.hidden = !coach.odds;
  els.coachAdviceCard.hidden = !coach.advice;
  if (!hasAnyCoachModule) return;

  const player = human();
  const { winRate, outs, potOdds } = getCoachAnalysis(player);
  const trend = updateCoachTrend(winRate);
  const advice = buildCoachAdvice(winRate, potOdds, outs);

  els.coachWinRate.textContent = winRate + "%";
  els.coachWinMeter.style.width = winRate + "%";
  els.coachOuts.textContent = outs;
  els.coachPotOdds.textContent = Math.round(potOdds) + "%";
  els.coachTrend.textContent = trend;

  els.coachBestAction.textContent = advice.action;
  els.coachStars.textContent = advice.stars;
  els.coachAdviceText.innerHTML = formatCoachAdviceText(advice.text);
}

function formatCoachAdviceText(text) {
  const escaped = escapeHtml(text || "");
  const sentences = escaped.match(/[^。；]+[。；]?/g) || [escaped];
  return sentences
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .map(sentence => `<span class="coach-sentence">${highlightCoachKeywords(sentence)}</span>`)
    .join("");
}

function highlightCoachKeywords(text) {
  return text.replace(
    /(\d+(?:\.\d+)?%?|Pot Odds|Outs|Fold|Call|Raise|Check|All-in|勝率|跟注|加注|棄牌|底池|免費|價格偏貴|可接受|牌力偏強|壓力|聽牌)/g,
    '<strong class="coach-key">$1</strong>'
  );
}

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
  const heroContribution = human().totalContribution || 0;
  els.playerName.innerHTML = `${human().emoji} ${human().name} <span class="position-chip player-position-chip position-${positionClass(heroPosition)}">${heroPosition}</span>`;
  if (els.playerStackChips) els.playerStackChips.innerHTML = heroContribution > 0 ? renderMiniChipStack(heroContribution) : "";
  if (els.playerContributionValue) els.playerContributionValue.textContent = heroContribution;
  if (els.heroTableStack) els.heroTableStack.classList.toggle("is-empty", heroContribution <= 0);
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
    return `
      <article class="seat seat-pos-${player.position} ${player.folded ? "is-folded" : ""} ${isActive ? "is-active" : ""} ${isWinner ? "is-winner" : ""} ${actionClass}">
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
        ${player.dialogue ? `<div class="seat-dialogue tone-${player.dialogueTone || "talk"}">${escapeHtml(player.dialogue)}</div>` : ""}
        ${handLabel ? `<div class="reveal-hand-label ${isWinner ? "is-winning-hand" : ""}">${isWinner ? "勝利 · " : ""}${handLabel}</div>` : ""}
        <div class="cards">${player.cards.map((c, i) => renderCard(reveal ? c : null, i, { animate: animateCards })).join("")}</div>
        ${player.folded ? '<div class="fold-banner">FOLD</div>' : ""}
      </article>
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

function updateThemeButton() {
  if (!els.themeButton) return;
  const isLight = state.theme === "light";
  els.themeButton.textContent = isLight ? "🌙 明暗" : "☀ 明暗";
  els.themeButton.setAttribute("aria-pressed", String(isLight));
}

function applyTheme(theme, { persist = true } = {}) {
  state.theme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = state.theme;
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, state.theme);
    } catch (error) {
      console.warn("Theme preference was not saved:", error);
    }
  }
  updateThemeButton();
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

if (els.themeButton) {
  els.themeButton.addEventListener("click", () => {
    applyTheme(state.theme === "light" ? "dark" : "light");
  });
}

function syncCoachSettings() {
  if (!els.coachPanel) return;
  state.coach.enabled = els.coachEnabled.checked;
  state.coach.odds = els.coachOddsToggle.checked;
  state.coach.advice = els.coachAdviceToggle.checked;
  renderCoach();
}

[els.coachEnabled, els.coachOddsToggle, els.coachAdviceToggle].forEach(input => {
  if (input) input.addEventListener("change", syncCoachSettings);
});

const desktopOnlyMedia = window.matchMedia("(max-width: 900px)");

function applyDesktopOnlyMode() {
  const blocked = desktopOnlyMedia.matches;
  document.body.classList.toggle("is-desktop-only-blocked", blocked);

  if (blocked) {
    Audio.cleanup();
    clearAutoNewHandTimer();
    clearDialogueTimers();
    state.waitingForHuman = false;
  }

  return blocked;
}

function handleDesktopOnlyChange() {
  if (applyDesktopOnlyMode()) return;
  if (!state.players.length) {
    startHand();
    return;
  }
  render();
}

if (desktopOnlyMedia.addEventListener) {
  desktopOnlyMedia.addEventListener("change", handleDesktopOnlyChange);
} else {
  desktopOnlyMedia.addListener(handleDesktopOnlyChange);
}

applyTheme(state.theme, { persist: false });
if (!applyDesktopOnlyMode()) startHand();
