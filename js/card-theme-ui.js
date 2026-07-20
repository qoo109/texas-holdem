// Unlockable pixel card deck collection.
(() => {
  "use strict";

  const root = document.documentElement;
  const EQUIPPED_KEY = "texasHoldemEquippedDeckV2";
  const UNLOCKED_KEY = "texasHoldemUnlockedDecksV2";
  const SEEN_KEY = "texasHoldemSeenDeckUnlocksV2";
  const LEGACY_THEME_KEY = "texasHoldemCardThemeV1";
  const LEGACY_BACK_KEY = "texasHoldemCardBackV1";
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
    try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; }
    catch (_) { return fallback; }
  }
  function writeJson(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function readText(key, fallback) { try { return localStorage.getItem(key) || fallback; } catch (_) { return fallback; } }
  function writeText(key, value) { try { localStorage.setItem(key, value); } catch (_) {} }

  function normalizeUnlocked(value) {
    const result = new Set(STARTER_DECKS);
    if (Array.isArray(value)) value.forEach(id => { if (deckMap.has(id)) result.add(id); });
    return result;
  }

  let unlocked = normalizeUnlocked(readJson(UNLOCKED_KEY, STARTER_DECKS));
  let seenUnlocks = new Set(readJson(SEEN_KEY, STARTER_DECKS));
  let equippedId = readText(EQUIPPED_KEY, "classic");
  if (!deckMap.has(equippedId) || !unlocked.has(equippedId)) equippedId = "classic";

  function gameStats() {
    let hero = {};
    try { if (typeof state !== "undefined" && state?.heroStyle) hero = state.heroStyle; } catch (_) {}
    let bossWins = 0;
    try { bossWins = Number(localStorage.getItem("texasHoldemBossWinsV1")) || 0; } catch (_) {}
    return { hands: Number(hero.hands) || 0, wins: Number(hero.wins) || 0, allIns: Number(hero.allIns) || 0, biggestPot: Number(hero.biggestPot) || 0, bossWins };
  }

  function toast(message) {
    try { if (typeof announce === "function") { announce(message); return; } } catch (_) {}
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
    try { localStorage.removeItem(LEGACY_THEME_KEY); localStorage.removeItem(LEGACY_BACK_KEY); } catch (_) {}
    refreshCollection();
    if (notify) toast(`已裝備：${deck.hidden ? deck.revealedName : deck.name}`);
    return true;
  }

  function evaluateUnlocks({ announceUnlocks = true } = {}) {
    const stats = gameStats();
    const newlyUnlocked = [];
    decks.forEach(deck => {
      if (unlocked.has(deck.id) || deck.starter || typeof deck.unlock !== "function") return;
      if (deck.unlock(stats)) { unlocked.add(deck.id); newlyUnlocked.push(deck); }
    });
    if (newlyUnlocked.length) {
      writeJson(UNLOCKED_KEY, [...unlocked]);
      newlyUnlocked.forEach(deck => {
        if (announceUnlocks && !seenUnlocks.has(deck.id)) {
          toast(`🎉 新牌組解鎖：${deck.hidden ? deck.revealedName : deck.name}`);
          seenUnlocks.add(deck.id);
        }
      });
      writeJson(SEEN_KEY, [...seenUnlocks]);
    }
    refreshCollection();
    return newlyUnlocked;
  }

  function cardPreview(deck, locked) {
    const labels = locked && deck.hidden ? ["?", "?", "?", "?"] : ["A♠", "K♥", "Q♦", "J♣"];
    return `<div class="deck-card-preview" data-preview-theme="${deck.theme}" aria-hidden="true">${labels.map(label => `<i>${label}</i>`).join("")}</div>`;
  }

  function deckDisplay(deck, locked) {
    return {
      name: locked && deck.hidden ? deck.name : (deck.hidden ? deck.revealedName : deck.name),
      description: locked && deck.hidden ? deck.description : (deck.hidden ? deck.revealedDescription : deck.description),
      symbol: locked && deck.hidden ? deck.symbol : (deck.hidden ? deck.revealedSymbol : deck.symbol),
    };
  }

  function progressMarkup(deck, stats, locked) {
    if (!locked) return `<span class="deck-status is-owned">已擁有</span>`;
    if (deck.hidden) return `<span class="deck-status is-hidden">條件未知</span>`;
    if (typeof deck.progress !== "function") return `<span class="deck-status is-locked">${deck.condition}</span>`;
    const [value, max] = deck.progress(stats);
    const percent = max ? Math.min(100, Math.round((value / max) * 100)) : 0;
    return `<div class="deck-progress"><span><b>${deck.condition}</b><em>${value} / ${max}</em></span><i><u style="width:${percent}%"></u></i></div>`;
  }

  function deckButton(deck, stats) {
    const locked = !unlocked.has(deck.id);
    const equipped = equippedId === deck.id;
    const display = deckDisplay(deck, locked);
    return `<article class="deck-collection-item ${locked ? "is-locked" : "is-unlocked"} ${equipped ? "is-equipped" : ""}" data-deck-card="${deck.id}">
      <div class="deck-showcase">${cardPreview(deck, locked)}<span class="deck-back-mini" data-back="${locked && deck.hidden ? "mystery" : deck.back}" data-symbol="${display.symbol}"></span>${locked ? `<span class="deck-lock">🔒</span>` : ""}</div>
      <div class="deck-item-copy"><div class="deck-item-title"><div><small>${locked && deck.hidden ? "SECRET" : deck.rarity}</small><h3>${display.name}</h3></div>${equipped ? `<span>使用中</span>` : ""}</div><p>${display.description}</p>${progressMarkup(deck, stats, locked)}${locked ? "" : `<button type="button" class="deck-equip-button" data-equip-deck="${deck.id}" ${equipped ? "disabled" : ""}>${equipped ? "目前使用" : "裝備牌組"}</button>`}</div>
    </article>`;
  }

  function refreshCollection() {
    const grid = document.querySelector("#deckCollectionGrid");
    if (!grid) return;
    const stats = gameStats();
    grid.innerHTML = decks.map(deck => deckButton(deck, stats)).join("");
    const owned = document.querySelector("#deckOwnedCount");
    if (owned) owned.textContent = `${unlocked.size} / ${decks.length}`;
    const trigger = document.querySelector("#cardStyleButton");
    if (trigger) trigger.textContent = `🎴 收藏 ${unlocked.size}/${decks.length}`;
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
    panel.innerHTML = `<header class="card-style-head"><div><p>Deck Collection</p><h2>牌組收藏</h2><span>初始擁有兩套，其餘透過成就、Boss 與隱藏條件解鎖。</span></div><button class="card-style-close" type="button" aria-label="關閉牌組收藏">×</button></header><div class="deck-collection-summary"><span>已收集</span><strong id="deckOwnedCount">0 / ${decks.length}</strong><small>鎖定牌組無法直接使用</small></div><div id="deckCollectionGrid" class="deck-collection-grid"></div><footer class="card-style-footer"><span>目前為試玩版，未來圖片可直接替換每套牌組美術。</span></footer>`;
    arena.appendChild(panel);
    trigger.addEventListener("click", () => panel.hidden ? openPanel() : closePanel());
    panel.querySelector(".card-style-close")?.addEventListener("click", closePanel);
    panel.addEventListener("click", event => { const equip = event.target.closest("[data-equip-deck]"); if (equip) applyDeck(equip.dataset.equipDeck, { notify: true }); });
    document.addEventListener("click", event => { if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) closePanel(); });
    document.addEventListener("keydown", event => { if (event.key === "Escape" && !panel.hidden) closePanel(); });
  }

  function injectStyles() {
    if (document.querySelector("#pixelCardThemeStyles")) return;
    const style = document.createElement("style");
    style.id = "pixelCardThemeStyles";
    style.textContent = `
#cardStyleButton{min-width:92px}#cardStyleButton[aria-expanded=true]{border-color:rgba(112,216,201,.55);background:rgba(112,216,201,.13);color:var(--cyan)}
.card-style-panel{position:absolute;z-index:24;top:12px;right:12px;width:min(560px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;padding:14px;border:1px solid rgba(112,216,201,.32);border-radius:14px;background:radial-gradient(circle at 14% 0,rgba(112,216,201,.16),transparent 38%),rgba(5,13,17,.97);color:var(--ink);box-shadow:0 24px 60px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.13);backdrop-filter:blur(18px) saturate(132%)}.card-style-panel[hidden]{display:none}:root[data-theme=light] .card-style-panel{background:linear-gradient(180deg,rgba(255,255,255,.98),rgba(246,237,219,.97));border-color:rgba(81,63,40,.2)}
.card-style-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:11px}.card-style-head p,.card-style-head h2,.card-style-head span{margin:0}.card-style-head p{color:var(--gold);font-size:.64rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.card-style-head h2{margin-top:2px;font-size:1.08rem}.card-style-head span{display:block;margin-top:4px;color:var(--muted);font-size:.7rem;line-height:1.4}.card-style-close{width:30px;min-width:30px;min-height:30px;padding:0;border-radius:999px;background:rgba(255,255,255,.08);color:var(--ink);box-shadow:none}
.deck-collection-summary{display:grid;grid-template-columns:auto auto 1fr;align-items:center;gap:7px;margin-bottom:9px;padding:8px 10px;border:1px solid rgba(255,255,255,.1);border-radius:9px;background:rgba(255,255,255,.045)}.deck-collection-summary span,.deck-collection-summary small{color:var(--muted);font-size:.67rem}.deck-collection-summary strong{color:var(--cyan);font-size:.84rem}.deck-collection-summary small{text-align:right}
.deck-collection-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}.deck-collection-item{display:grid;grid-template-columns:104px minmax(0,1fr);gap:9px;min-width:0;padding:9px;border:1px solid rgba(255,255,255,.11);border-radius:11px;background:linear-gradient(180deg,rgba(255,255,255,.065),rgba(255,255,255,.025))}.deck-collection-item.is-equipped{border-color:rgba(112,216,201,.66);box-shadow:inset 0 0 0 1px rgba(112,216,201,.16),0 0 20px rgba(112,216,201,.09)}.deck-collection-item.is-locked{filter:saturate(.6)}:root[data-theme=light] .deck-collection-item{border-color:rgba(69,49,27,.16);background:rgba(255,255,255,.64)}
.deck-showcase{position:relative;display:grid;grid-template-columns:1fr 31px;align-items:center;gap:5px;min-width:0}.deck-card-preview{--s:#1e2844;--h:#d12e3c;--d:#d12e3c;--c:#1e2844;--bg:#f8fbff;--edge:#28324e;display:grid;grid-template-columns:repeat(4,1fr);gap:2px}.deck-card-preview[data-preview-theme=light-1color]{--s:#25304f;--h:#25304f;--d:#25304f;--c:#25304f}.deck-card-preview[data-preview-theme=light-4color]{--d:#e55c25;--c:#1f7f55}.deck-card-preview[data-preview-theme=dark]{--bg:#151a23;--edge:#56627a;--s:#c6d0e1;--h:#ff5f68;--d:#ff8b39;--c:#79bc62}.deck-card-preview[data-preview-theme=sepia]{--bg:#f1d4a1;--edge:#8a522c;--s:#61351f;--h:#773a25;--d:#8c4b28;--c:#623923}.deck-card-preview[data-preview-theme=boss-crown]{--bg:#17191f;--edge:#d5ad4e;--s:#f3cf69;--h:#f08b69;--d:#e4b24b;--c:#85c987}.deck-card-preview i{display:grid;place-items:center;aspect-ratio:5/7;border:1px solid var(--edge);border-radius:2px;background:var(--bg);font-style:normal;font:950 .48rem 'Courier New',monospace}.deck-card-preview i:nth-child(1){color:var(--s)}.deck-card-preview i:nth-child(2){color:var(--h)}.deck-card-preview i:nth-child(3){color:var(--d)}.deck-card-preview i:nth-child(4){color:var(--c)}
.deck-back-mini{--main:#273e78;--edge:#dce6f5;position:relative;display:block;width:31px;aspect-ratio:5/7;border:2px solid var(--edge);border-radius:3px;background:linear-gradient(45deg,transparent 36%,rgba(255,255,255,.22) 37% 41%,transparent 42%),linear-gradient(-45deg,transparent 36%,rgba(255,255,255,.16) 37% 41%,transparent 42%),var(--main);box-shadow:inset 0 0 0 2px rgba(0,0,0,.24)}.deck-back-mini:after{content:attr(data-symbol);position:absolute;left:50%;top:50%;display:grid;place-items:center;width:60%;aspect-ratio:1;border:1px solid rgba(255,255,255,.62);border-radius:50%;background:rgba(0,0,0,.12);color:#fff;font-size:.68rem;transform:translate(-50%,-50%)}.deck-back-mini[data-back=ruby]{--main:#a72435;--edge:#f5c5bf}.deck-back-mini[data-back=emerald]{--main:#207447;--edge:#bfe7c9}.deck-back-mini[data-back=violet]{--main:#663c85;--edge:#e0caef}.deck-back-mini[data-back=sunset]{--main:#d66b2d;--edge:#ffe0a8}.deck-back-mini[data-back=black-gold]{--main:#17191f;--edge:#d5ad4e}.deck-back-mini[data-back=mystery]{--main:#30343c;--edge:#777e8d;filter:grayscale(1)}.deck-lock{position:absolute;inset:50% auto auto 43%;display:grid;place-items:center;width:29px;aspect-ratio:1;border:1px solid rgba(255,255,255,.24);border-radius:999px;background:rgba(7,10,14,.84);font-size:.74rem;transform:translate(-50%,-50%)}
.deck-item-copy{min-width:0}.deck-item-title{display:flex;justify-content:space-between;align-items:start;gap:6px}.deck-item-title small{display:block;color:var(--gold);font-size:.55rem;font-weight:950;letter-spacing:.06em}.deck-item-title h3{margin:2px 0 0;font-size:.82rem;line-height:1.1}.deck-item-title>span{padding:2px 6px;border-radius:999px;background:rgba(112,216,201,.13);color:var(--cyan);font-size:.55rem;font-weight:900}.deck-item-copy p{min-height:2.5em;margin:5px 0;color:var(--muted);font-size:.61rem;line-height:1.35}.deck-status{display:block;color:var(--muted);font-size:.59rem;font-weight:850}.deck-status.is-owned{color:var(--cyan)}.deck-status.is-hidden{color:var(--gold)}.deck-progress span{display:flex;justify-content:space-between;gap:5px;color:var(--muted);font-size:.56rem}.deck-progress b{font-weight:800}.deck-progress em{font-style:normal}.deck-progress>i{display:block;height:4px;margin-top:4px;overflow:hidden;border-radius:999px;background:rgba(255,255,255,.09)}.deck-progress u{display:block;height:100%;border-radius:inherit;background:linear-gradient(90deg,var(--cyan),var(--gold));text-decoration:none}.deck-equip-button{width:100%;min-height:28px;margin-top:7px;padding:0 8px;border-radius:6px;font-size:.63rem}.deck-equip-button:disabled{background:rgba(112,216,201,.09);color:var(--cyan);opacity:1}.card-style-footer{margin-top:10px;padding-top:9px;border-top:1px solid rgba(255,255,255,.09);color:var(--muted);font-size:.62rem;text-align:center}
html[data-card-theme] .card:not(.back){border-color:var(--ct-edge);background:linear-gradient(135deg,var(--ct-mark) 0 5px,transparent 5px 12px),linear-gradient(180deg,var(--ct-top),var(--ct-bottom));color:var(--ct-s);box-shadow:0 9px 14px rgba(0,0,0,.28),inset 0 0 0 2px var(--ct-inner),inset 0 -2px 0 var(--ct-shadow)}html[data-card-theme] .card:not(.back):before{border-color:var(--ct-line)}html[data-card-theme] .card.suit-s{color:var(--ct-s)}html[data-card-theme] .card.suit-h{color:var(--ct-h);border-color:var(--ct-he,var(--ct-edge))}html[data-card-theme] .card.suit-d{color:var(--ct-d);border-color:var(--ct-de,var(--ct-edge))}html[data-card-theme] .card.suit-c{color:var(--ct-c);border-color:var(--ct-ce,var(--ct-edge))}html[data-card-theme] .rank,html[data-card-theme] .corner-suit,html[data-card-theme] .pip,html[data-card-theme] .face-rank,html[data-card-theme] .face-suit{font-family:'Courier New',ui-monospace,monospace;font-weight:950;text-shadow:1px 1px 0 var(--ct-text)}html[data-card-theme] .card .pixel-head,html[data-card-theme] .card .pixel-body,html[data-card-theme] .card .pixel-prop{border-radius:1px;image-rendering:pixelated}html[data-card-theme] .card .pixel-head{border-color:var(--ct-outline);background:var(--ct-skin)}html[data-card-theme] .card .pixel-body{border-color:var(--ct-outline);background:linear-gradient(135deg,currentColor 0 48%,var(--ct-secondary) 49% 72%,var(--ct-gold) 73% 100%)}html[data-card-theme] .card .pixel-prop{border-color:var(--ct-outline);background:currentColor}html[data-card-theme] .face-k .pixel-portrait:before,html[data-card-theme] .face-q .pixel-portrait:before{content:'';position:absolute;z-index:3;left:27%;top:-2%;width:44%;height:13%;background:var(--ct-crown);clip-path:polygon(0 100%,0 36%,18% 68%,34% 8%,52% 67%,70% 3%,100% 68%,100% 100%);filter:drop-shadow(1px 1px 0 var(--ct-outline))}
html[data-card-theme=light-1color]{--ct-edge:#25304f;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-mark:rgba(37,48,79,.06);--ct-inner:rgba(255,255,255,.82);--ct-shadow:rgba(37,48,79,.08);--ct-line:rgba(37,48,79,.2);--ct-text:rgba(255,255,255,.36);--ct-s:#25304f;--ct-h:#25304f;--ct-d:#25304f;--ct-c:#25304f;--ct-outline:#25304f;--ct-skin:#d39a64;--ct-secondary:#59657c;--ct-gold:#d6b775;--ct-crown:#e3ad39}
html[data-card-theme=light-2color]{--ct-edge:#26304c;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-mark:rgba(38,48,79,.05);--ct-inner:rgba(255,255,255,.82);--ct-shadow:rgba(37,48,79,.08);--ct-line:rgba(37,48,79,.2);--ct-text:rgba(255,255,255,.36);--ct-s:#1e2844;--ct-h:#d12e3c;--ct-d:#d12e3c;--ct-c:#1e2844;--ct-he:#c7484e;--ct-de:#c7484e;--ct-outline:#25304f;--ct-skin:#d39a64;--ct-secondary:#314e83;--ct-gold:#ead7b8;--ct-crown:#e3ad39}
html[data-card-theme=light-4color]{--ct-edge:#26304c;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-mark:rgba(38,48,79,.05);--ct-inner:rgba(255,255,255,.82);--ct-shadow:rgba(37,48,79,.08);--ct-line:rgba(37,48,79,.2);--ct-text:rgba(255,255,255,.36);--ct-s:#1e2844;--ct-h:#d12e3c;--ct-d:#e55c25;--ct-c:#1f7f55;--ct-he:#c7484e;--ct-de:#cf6a36;--ct-ce:#34775d;--ct-outline:#25304f;--ct-skin:#d39a64;--ct-secondary:#314e83;--ct-gold:#ead7b8;--ct-crown:#e3ad39}
html[data-card-theme=dark]{--ct-edge:#56627a;--ct-top:#171c25;--ct-bottom:#10141c;--ct-mark:rgba(255,255,255,.025);--ct-inner:rgba(255,255,255,.055);--ct-shadow:rgba(0,0,0,.3);--ct-line:rgba(194,207,226,.18);--ct-text:rgba(0,0,0,.5);--ct-s:#c6d0e1;--ct-h:#ff5f68;--ct-d:#ff8b39;--ct-c:#79bc62;--ct-he:#a83d47;--ct-de:#a85a30;--ct-ce:#4f7745;--ct-outline:#8792a8;--ct-skin:#d39a64;--ct-secondary:#59657c;--ct-gold:#d7b875;--ct-crown:#e3ad39}
html[data-card-theme=sepia]{--ct-edge:#8a522c;--ct-top:#f6ddb0;--ct-bottom:#e9c58c;--ct-mark:rgba(98,57,35,.07);--ct-inner:rgba(255,244,214,.58);--ct-shadow:rgba(94,52,29,.14);--ct-line:rgba(98,57,35,.28);--ct-text:rgba(255,235,195,.32);--ct-s:#61351f;--ct-h:#773a25;--ct-d:#8c4b28;--ct-c:#623923;--ct-outline:#704127;--ct-skin:#bc7d4f;--ct-secondary:#8c5533;--ct-gold:#d7a760;--ct-crown:#a9692e}
html[data-card-theme=boss-crown]{--ct-edge:#d5ad4e;--ct-top:#1d2028;--ct-bottom:#111319;--ct-mark:rgba(213,173,78,.075);--ct-inner:rgba(243,207,105,.09);--ct-shadow:rgba(0,0,0,.4);--ct-line:rgba(213,173,78,.34);--ct-text:rgba(0,0,0,.65);--ct-s:#f3cf69;--ct-h:#f08b69;--ct-d:#e4b24b;--ct-c:#85c987;--ct-he:#c86a55;--ct-de:#b98a39;--ct-ce:#56895b;--ct-outline:#d5ad4e;--ct-skin:#c98c62;--ct-secondary:#6e2730;--ct-gold:#e5c25f;--ct-crown:#f1ce69}
html[data-card-back=navy] .card.back{--cb-main:#273e78;--cb-edge:#dce6f5;--cb-symbol:'♠'}html[data-card-back=ruby] .card.back{--cb-main:#a72435;--cb-edge:#f5c5bf;--cb-symbol:'♥'}html[data-card-back=emerald] .card.back{--cb-main:#207447;--cb-edge:#bfe7c9;--cb-symbol:'♣'}html[data-card-back=violet] .card.back{--cb-main:#663c85;--cb-edge:#e0caef;--cb-symbol:'♦'}html[data-card-back=sunset] .card.back{--cb-main:#d66b2d;--cb-edge:#ffe0a8;--cb-symbol:'✦'}html[data-card-back=black-gold] .card.back{--cb-main:#17191f;--cb-edge:#d5ad4e;--cb-symbol:'♛'}html[data-card-back] .card.back{border-color:var(--cb-edge);background:linear-gradient(180deg,rgba(255,255,255,.16),rgba(0,0,0,.13)),var(--cb-main)}html[data-card-back] .card.back:after{content:var(--cb-symbol);inset:29%;z-index:2;display:grid;place-items:center;border:1px solid color-mix(in srgb,var(--cb-edge) 66%,transparent);border-radius:50%;background:rgba(0,0,0,.13);color:var(--cb-edge);font-size:clamp(1rem,2.4vw,1.7rem);opacity:1}html[data-card-back] .card-back-pattern{border-color:color-mix(in srgb,var(--cb-edge) 64%,transparent);background:linear-gradient(45deg,transparent 35%,color-mix(in srgb,var(--cb-edge) 38%,transparent) 36% 40%,transparent 41%),linear-gradient(-45deg,transparent 35%,color-mix(in srgb,var(--cb-edge) 28%,transparent) 36% 40%,transparent 41%),repeating-linear-gradient(0deg,rgba(255,255,255,.07) 0 2px,transparent 2px 8px),repeating-linear-gradient(90deg,rgba(255,255,255,.07) 0 2px,transparent 2px 8px)}
@media(max-width:1100px){.deck-collection-grid{grid-template-columns:1fr}.card-style-panel{width:min(470px,calc(100% - 18px));top:9px;right:9px;max-height:calc(100% - 18px)}}@media(max-width:760px){.deck-collection-item{grid-template-columns:90px minmax(0,1fr)}.deck-collection-summary{grid-template-columns:auto auto}.deck-collection-summary small{grid-column:1/-1;text-align:left}.card-style-panel{padding:11px}.card-style-head span{font-size:.64rem}}
`;
    document.head.appendChild(style);
  }

  function init() {
    injectStyles();
    build();
    evaluateUnlocks({ announceUnlocks: false });
    applyDeck(equippedId);
    window.setInterval(() => evaluateUnlocks({ announceUnlocks: true }), 1400);
  }

  window.CardDeckCollection = Object.freeze({ init, equip: id => applyDeck(id, { notify: true }), evaluate: evaluateUnlocks, getUnlocked: () => [...unlocked], getEquipped: () => equippedId });
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init, { once: true }) : init();
})();
