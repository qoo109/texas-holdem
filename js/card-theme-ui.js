// Unlockable pixel card deck collection.
(() => {
  "use strict";

  const root = document.documentElement;
  const EQUIPPED_KEY = "texasHoldemEquippedDeckV2";
  const UNLOCKED_KEY = "texasHoldemUnlockedDecksV2";
  const SEEN_KEY = "texasHoldemSeenDeckUnlocksV2";
  const STARTER_DECKS = ["classic", "midnight"];

  const decks = [
    { id: "classic", name: "經典牌組", rarity: "初始", theme: "light-2color", back: "navy", symbol: "♠", description: "清楚易讀的經典紅黑像素牌。", condition: "初始擁有", starter: true },
    { id: "midnight", name: "午夜牌組", rarity: "初始", theme: "dark", back: "violet", symbol: "☾", description: "適合深色牌桌的高對比夜間牌。", condition: "初始擁有", starter: true },
    { id: "sepia", name: "老派賭場", rarity: "成就", theme: "sepia", back: "sunset", symbol: "✦", description: "帶有老紙張質感的復古棕色牌組。", condition: "完成 5 局牌局", progress: stats => [Math.min(stats.hands, 5), 5], unlock: stats => stats.hands >= 5 },
    { id: "four-color", name: "四色戰術", rarity: "成就", theme: "light-4color", back: "emerald", symbol: "♣", description: "四種花色各自配色，快速辨識牌力。", condition: "累積贏得 3 局", progress: stats => [Math.min(stats.wins, 3), 3], unlock: stats => stats.wins >= 3 },
    { id: "boss-crown", name: "王冠霸主", rarity: "Boss", theme: "boss-crown", back: "black-gold", symbol: "♛", description: "只有擊敗牌桌 Boss 才能取得的黑金牌組。", condition: "打倒第一位 Boss", progress: stats => [Math.min(stats.bossWins, 1), 1], unlock: stats => stats.bossWins >= 1 },
    { id: "hidden-monochrome", name: "???", revealedName: "逆轉黑桃", rarity: "隱藏", theme: "light-1color", back: "ruby", symbol: "?", revealedSymbol: "♠", description: "達成特殊逆轉條件後才會現身。", revealedDescription: "從高壓底池中逆轉而生的隱藏單色牌組。", condition: "隱藏條件", hidden: true, unlock: stats => stats.allIns >= 1 && stats.wins >= 1 && stats.biggestPot >= 1000 },
  ];

  const deckMap = new Map(decks.map(deck => [deck.id, deck]));

  function readJson(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function readText(key, fallback) {
    try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; }
  }

  function writeText(key, value) {
    try { localStorage.setItem(key, value); } catch (_) {}
  }

  function normalizeUnlocked(value) {
    const result = new Set(STARTER_DECKS);
    if (Array.isArray(value)) {
      value.forEach(id => {
        if (deckMap.has(id)) result.add(id);
      });
    }
    return result;
  }

  let unlocked = normalizeUnlocked(readJson(UNLOCKED_KEY, STARTER_DECKS));
  let seenUnlocks = new Set(readJson(SEEN_KEY, STARTER_DECKS));
  let equippedId = readText(EQUIPPED_KEY, "classic");
  if (!deckMap.has(equippedId) || !unlocked.has(equippedId)) equippedId = "classic";

  function gameStats() {
    let hero = {};
    try {
      if (typeof state !== "undefined" && state?.heroStyle) hero = state.heroStyle;
    } catch (_) {}

    let bossWins = 0;
    try { bossWins = Number(localStorage.getItem("texasHoldemBossWinsV1")) || 0; } catch (_) {}

    return {
      hands: Number(hero.hands) || 0,
      wins: Number(hero.wins) || 0,
      allIns: Number(hero.allIns) || 0,
      biggestPot: Number(hero.biggestPot) || 0,
      bossWins,
    };
  }

  function toast(message) {
    try {
      if (typeof announce === "function") {
        announce(message);
        return;
      }
    } catch (_) {}

    const node = document.querySelector("#actionToast");
    if (!node) return;
    node.textContent = message;
    node.classList.remove("is-visible");
    void node.offsetWidth;
    node.classList.add("is-visible");
  }

  function applyDeck(id, { notify = false } = {}) {
    const deck = deckMap.get(id);
    if (!deck || !unlocked.has(id)) return false;

    equippedId = id;
    root.dataset.cardTheme = deck.theme;
    root.dataset.cardBack = deck.back;
    root.dataset.cardDeck = deck.id;
    writeText(EQUIPPED_KEY, id);
    refreshCollection();

    if (notify) toast(`已裝備：${deck.hidden ? deck.revealedName : deck.name}`);
    return true;
  }

  function evaluateUnlocks({ announceUnlocks = true } = {}) {
    const stats = gameStats();
    const newlyUnlocked = [];

    decks.forEach(deck => {
      if (unlocked.has(deck.id) || deck.starter || typeof deck.unlock !== "function") return;
      if (!deck.unlock(stats)) return;
      unlocked.add(deck.id);
      newlyUnlocked.push(deck);
    });

    if (newlyUnlocked.length) {
      writeJson(UNLOCKED_KEY, [...unlocked]);
      newlyUnlocked.forEach(deck => {
        if (!announceUnlocks || seenUnlocks.has(deck.id)) return;
        toast(`🎉 新牌組解鎖：${deck.hidden ? deck.revealedName : deck.name}`);
        seenUnlocks.add(deck.id);
      });
      writeJson(SEEN_KEY, [...seenUnlocks]);
    }

    refreshCollection();
    return newlyUnlocked;
  }

  function deckDisplay(deck, locked) {
    return {
      name: locked && deck.hidden ? "???" : (deck.hidden ? deck.revealedName : deck.name),
      description: locked && deck.hidden ? deck.description : (deck.hidden ? deck.revealedDescription : deck.description),
      symbol: locked && deck.hidden ? "?" : (deck.hidden ? deck.revealedSymbol : deck.symbol),
    };
  }

  function progressMarkup(deck, stats, locked) {
    if (!locked) return '<span class="deck-status is-owned">已擁有</span>';
    if (deck.hidden) return '<span class="deck-status is-hidden">條件未知</span>';
    if (typeof deck.progress !== "function") return `<span class="deck-status is-locked">${deck.condition}</span>`;

    const [value, max] = deck.progress(stats);
    const percent = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return `<div class="deck-progress"><span><b>${deck.condition}</b><em>${value} / ${max}</em></span><i><u style="width:${percent}%"></u></i></div>`;
  }

  function deckCard(deck, stats) {
    const locked = !unlocked.has(deck.id);
    const equipped = equippedId === deck.id;
    const display = deckDisplay(deck, locked);
    const labels = locked && deck.hidden ? ["?", "?", "?", "?"] : ["A♠", "K♥", "Q♦", "J♣"];

    return `
      <article class="deck-collection-item ${locked ? "is-locked" : "is-unlocked"} ${equipped ? "is-equipped" : ""}">
        <div class="deck-showcase">
          <div class="deck-card-preview" data-preview-theme="${deck.theme}" aria-hidden="true">${labels.map(label => `<i>${label}</i>`).join("")}</div>
          <span class="deck-back-mini" data-back="${locked && deck.hidden ? "mystery" : deck.back}" data-symbol="${display.symbol}"></span>
          ${locked ? '<span class="deck-lock">🔒</span>' : ""}
        </div>
        <div class="deck-item-copy">
          <div class="deck-item-title"><div><small>${locked && deck.hidden ? "SECRET" : deck.rarity}</small><h3>${display.name}</h3></div>${equipped ? "<span>使用中</span>" : ""}</div>
          <p>${display.description}</p>
          ${progressMarkup(deck, stats, locked)}
          ${locked ? "" : `<button type="button" class="deck-equip-button" data-equip-deck="${deck.id}" ${equipped ? "disabled" : ""}>${equipped ? "目前使用" : "裝備牌組"}</button>`}
        </div>
      </article>`;
  }

  function refreshCollection() {
    const grid = document.querySelector("#deckCollectionGrid");
    if (grid) grid.innerHTML = decks.map(deck => deckCard(deck, gameStats())).join("");

    const owned = document.querySelector("#deckOwnedCount");
    if (owned) owned.textContent = `${unlocked.size} 套`;

    const trigger = document.querySelector("#cardStyleButton");
    if (trigger) trigger.textContent = "🎴 收藏";
  }

  function closePanel() {
    const panel = document.querySelector("#cardStylePanel");
    const trigger = document.querySelector("#cardStyleButton");
    if (!panel || !trigger) return;
    panel.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function openPanel() {
    evaluateUnlocks({ announceUnlocks: true });
    const panel = document.querySelector("#cardStylePanel");
    const trigger = document.querySelector("#cardStyleButton");
    if (!panel || !trigger) return;
    panel.hidden = false;
    trigger.setAttribute("aria-expanded", "true");
    panel.querySelector(".card-style-close")?.focus();
  }

  function build() {
    const actions = document.querySelector(".top-bar-actions");
    const arena = document.querySelector("#arena");
    if (!actions || !arena || document.querySelector("#cardStyleButton")) return;

    const trigger = document.createElement("button");
    trigger.id = "cardStyleButton";
    trigger.className = "ghost-button tool-button";
    trigger.type = "button";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "cardStylePanel");
    trigger.textContent = "🎴 收藏";
    actions.insertBefore(trigger, document.querySelector("#layoutButton"));

    const panel = document.createElement("section");
    panel.id = "cardStylePanel";
    panel.className = "card-style-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "牌組收藏");
    panel.innerHTML = `
      <header class="card-style-head">
        <div><p>Deck Collection</p><h2>牌組收藏</h2><span>初始擁有兩套，其餘透過成就、Boss 與隱藏條件解鎖。</span></div>
        <button class="card-style-close" type="button" aria-label="關閉牌組收藏">×</button>
      </header>
      <div class="deck-collection-summary"><span>已收集</span><strong id="deckOwnedCount">${unlocked.size} 套</strong><small>收藏會持續追加</small></div>
      <div id="deckCollectionGrid" class="deck-collection-grid"></div>
      <footer class="card-style-footer">未來提供的牌面圖片可以直接加入收藏，不限制固定總數。</footer>`;
    arena.appendChild(panel);

    trigger.addEventListener("click", () => panel.hidden ? openPanel() : closePanel());
    panel.querySelector(".card-style-close")?.addEventListener("click", closePanel);
    panel.addEventListener("click", event => {
      const button = event.target.closest("[data-equip-deck]");
      if (button) applyDeck(button.dataset.equipDeck, { notify: true });
    });
    document.addEventListener("click", event => {
      if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) closePanel();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) closePanel();
    });
  }

  function injectStyles() {
    if (document.querySelector("#pixelCardThemeStyles")) return;
    const style = document.createElement("style");
    style.id = "pixelCardThemeStyles";
    style.textContent = `
      #cardStyleButton{min-width:82px}#cardStyleButton[aria-expanded=true]{border-color:rgba(112,216,201,.55);background:rgba(112,216,201,.13);color:var(--cyan)}
      .card-style-panel{position:absolute;z-index:24;top:12px;right:12px;width:min(560px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;padding:14px;border:1px solid rgba(112,216,201,.32);border-radius:14px;background:rgba(5,13,17,.97);color:var(--ink);box-shadow:0 24px 60px rgba(0,0,0,.48);backdrop-filter:blur(18px)}.card-style-panel[hidden]{display:none}:root[data-theme=light] .card-style-panel{background:rgba(252,246,234,.98);border-color:rgba(81,63,40,.2)}
      .card-style-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:11px}.card-style-head p,.card-style-head h2,.card-style-head span{margin:0}.card-style-head p{color:var(--gold);font-size:.64rem;font-weight:950}.card-style-head h2{margin-top:2px;font-size:1.08rem}.card-style-head span{display:block;margin-top:4px;color:var(--muted);font-size:.7rem}.card-style-close{width:30px;min-width:30px;min-height:30px;padding:0;border-radius:999px;background:rgba(255,255,255,.08);color:var(--ink);box-shadow:none}
      .deck-collection-summary{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:7px;margin-bottom:9px;padding:8px 10px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:rgba(255,255,255,.045)}.deck-collection-summary span,.deck-collection-summary small{color:var(--muted);font-size:.67rem}.deck-collection-summary strong{color:var(--cyan);font-size:.84rem}.deck-collection-summary small{text-align:right}
      .deck-collection-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.deck-collection-item{display:grid;grid-template-columns:104px minmax(0,1fr);gap:9px;padding:9px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:rgba(255,255,255,.04)}.deck-collection-item.is-equipped{border-color:rgba(112,216,201,.66);box-shadow:inset 0 0 0 1px rgba(112,216,201,.16)}.deck-collection-item.is-locked{filter:saturate(.6)}
      .deck-showcase{position:relative;display:grid;grid-template-columns:1fr 31px;align-items:center;gap:5px}.deck-card-preview{--s:#1e2844;--h:#d12e3c;--d:#d12e3c;--c:#1e2844;--bg:#f8fbff;--edge:#28324e;display:grid;grid-template-columns:repeat(4,1fr);gap:2px}.deck-card-preview[data-preview-theme=light-1color]{--s:#25304f;--h:#25304f;--d:#25304f;--c:#25304f}.deck-card-preview[data-preview-theme=light-4color]{--d:#e55c25;--c:#1f7f55}.deck-card-preview[data-preview-theme=dark]{--bg:#151a23;--edge:#56627a;--s:#c6d0e1;--h:#ff5f68;--d:#ff8b39;--c:#79bc62}.deck-card-preview[data-preview-theme=sepia]{--bg:#f1d4a1;--edge:#8a522c;--s:#61351f;--h:#773a25;--d:#8c4b28;--c:#623923}.deck-card-preview[data-preview-theme=boss-crown]{--bg:#17191f;--edge:#d5ad4e;--s:#f3cf69;--h:#f08b69;--d:#e4b24b;--c:#85c987}.deck-card-preview i{display:grid;place-items:center;aspect-ratio:5/7;border:1px solid var(--edge);border-radius:2px;background:var(--bg);color:var(--s);font:950 .48rem 'Courier New',monospace;font-style:normal}.deck-card-preview i:nth-child(2){color:var(--h)}.deck-card-preview i:nth-child(3){color:var(--d)}.deck-card-preview i:nth-child(4){color:var(--c)}
      .deck-back-mini{--main:#273e78;--edge:#dce6f5;position:relative;width:31px;aspect-ratio:5/7;border:2px solid var(--edge);border-radius:3px;background:var(--main)}.deck-back-mini:after{content:attr(data-symbol);position:absolute;inset:50% auto auto 50%;color:#fff;transform:translate(-50%,-50%)}.deck-back-mini[data-back=ruby]{--main:#a72435}.deck-back-mini[data-back=emerald]{--main:#207447}.deck-back-mini[data-back=violet]{--main:#663c85}.deck-back-mini[data-back=sunset]{--main:#d66b2d}.deck-back-mini[data-back=black-gold]{--main:#17191f;--edge:#d5ad4e}.deck-back-mini[data-back=mystery]{--main:#30343c;filter:grayscale(1)}.deck-lock{position:absolute;left:43%;top:50%;transform:translate(-50%,-50%)}
      .deck-item-title{display:flex;justify-content:space-between;gap:6px}.deck-item-title small{color:var(--gold);font-size:.55rem;font-weight:950}.deck-item-title h3{margin:2px 0 0;font-size:.82rem}.deck-item-title>span{color:var(--cyan);font-size:.55rem}.deck-item-copy p{margin:5px 0;color:var(--muted);font-size:.61rem;line-height:1.35}.deck-status{display:block;color:var(--muted);font-size:.59rem}.deck-status.is-owned{color:var(--cyan)}.deck-status.is-hidden{color:var(--gold)}.deck-progress span{display:flex;justify-content:space-between;color:var(--muted);font-size:.56rem}.deck-progress em{font-style:normal}.deck-progress>i{display:block;height:4px;margin-top:4px;border-radius:999px;background:rgba(255,255,255,.09)}.deck-progress u{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--cyan),var(--gold))}.deck-equip-button{width:100%;min-height:28px;margin-top:7px;font-size:.63rem}.card-style-footer{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.09);color:var(--muted);font-size:.62rem;text-align:center}
      html[data-card-theme] .card:not(.back){border-color:var(--ct-edge);background:linear-gradient(180deg,var(--ct-top),var(--ct-bottom));color:var(--ct-s)}html[data-card-theme] .card.suit-s{color:var(--ct-s)}html[data-card-theme] .card.suit-h{color:var(--ct-h)}html[data-card-theme] .card.suit-d{color:var(--ct-d)}html[data-card-theme] .card.suit-c{color:var(--ct-c)}html[data-card-theme] .rank,html[data-card-theme] .corner-suit,html[data-card-theme] .pip,html[data-card-theme] .face-rank,html[data-card-theme] .face-suit{font-family:'Courier New',monospace;font-weight:950}
      html[data-card-theme=light-1color]{--ct-edge:#25304f;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-s:#25304f;--ct-h:#25304f;--ct-d:#25304f;--ct-c:#25304f}html[data-card-theme=light-2color]{--ct-edge:#26304c;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-s:#1e2844;--ct-h:#d12e3c;--ct-d:#d12e3c;--ct-c:#1e2844}html[data-card-theme=light-4color]{--ct-edge:#26304c;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-s:#1e2844;--ct-h:#d12e3c;--ct-d:#e55c25;--ct-c:#1f7f55}html[data-card-theme=dark]{--ct-edge:#56627a;--ct-top:#171c25;--ct-bottom:#10141c;--ct-s:#c6d0e1;--ct-h:#ff5f68;--ct-d:#ff8b39;--ct-c:#79bc62}html[data-card-theme=sepia]{--ct-edge:#8a522c;--ct-top:#f6ddb0;--ct-bottom:#e9c58c;--ct-s:#61351f;--ct-h:#773a25;--ct-d:#8c4b28;--ct-c:#623923}html[data-card-theme=boss-crown]{--ct-edge:#d5ad4e;--ct-top:#1d2028;--ct-bottom:#111319;--ct-s:#f3cf69;--ct-h:#f08b69;--ct-d:#e4b24b;--ct-c:#85c987}
      html[data-card-back] .card.back{border-color:var(--cb-edge);background:var(--cb-main)}html[data-card-back] .card-back-pattern{border-color:var(--cb-edge);background:repeating-linear-gradient(45deg,rgba(255,255,255,.16) 0 3px,transparent 3px 8px),var(--cb-main)}html[data-card-back=navy]{--cb-main:#273e78;--cb-edge:#dce6f5}html[data-card-back=ruby]{--cb-main:#a72435;--cb-edge:#f5c5bf}html[data-card-back=emerald]{--cb-main:#207447;--cb-edge:#bfe7c9}html[data-card-back=violet]{--cb-main:#663c85;--cb-edge:#e0caef}html[data-card-back=sunset]{--cb-main:#d66b2d;--cb-edge:#ffe0a8}html[data-card-back=black-gold]{--cb-main:#17191f;--cb-edge:#d5ad4e}
      @media(max-width:900px){.card-style-panel{width:calc(100% - 16px);right:8px;top:8px;max-height:calc(100% - 16px)}.deck-collection-grid{grid-template-columns:1fr}}
    `;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    build();
    evaluateUnlocks({ announceUnlocks: false });
    applyDeck(equippedId);
  }

  window.CardThemeUI = Object.freeze({ init, applyDeck, evaluateUnlocks, close: closePanel });
  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init();
})();