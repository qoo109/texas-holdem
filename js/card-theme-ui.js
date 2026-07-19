// Original pixel card face and card back selector.
(() => {
  "use strict";

  const root = document.documentElement;
  const THEME_KEY = "texasHoldemCardThemeV1";
  const BACK_KEY = "texasHoldemCardBackV1";
  const themes = [
    ["light-1color", "單色像素", "統一深藍墨色"],
    ["light-2color", "經典雙色", "傳統黑色與紅色"],
    ["light-4color", "四色像素", "藍、紅、橘、綠花色"],
    ["dark", "夜間牌面", "深色高對比牌面"],
    ["sepia", "復古棕色", "老紙張像素風格"],
  ];
  const backs = [
    ["navy", "午夜黑桃", "♠"],
    ["ruby", "紅寶石", "♥"],
    ["emerald", "翡翠梅花", "♣"],
    ["violet", "紫晶方塊", "♦"],
    ["sunset", "夕陽徽章", "✦"],
    ["black-gold", "黑金皇冠", "♛"],
  ];
  const themeIds = new Set(themes.map(([id]) => id));
  const backIds = new Set(backs.map(([id]) => id));

  const load = (key, fallback, valid) => {
    try {
      const value = localStorage.getItem(key);
      return valid.has(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  };
  const save = (key, value) => {
    try { localStorage.setItem(key, value); } catch (_) { /* session-only fallback */ }
  };
  const themeName = id => themes.find(([value]) => value === id)?.[1] || id;
  const backName = id => backs.find(([value]) => value === id)?.[1] || id;

  function toast(message) {
    if (typeof window.announce === "function") return window.announce(message);
    const node = document.querySelector("#actionToast");
    if (!node) return;
    node.textContent = message;
    node.classList.remove("is-visible");
    void node.offsetWidth;
    node.classList.add("is-visible");
  }

  function refresh() {
    document.querySelectorAll("[data-card-theme-option]").forEach(button => {
      const active = button.dataset.cardThemeOption === root.dataset.cardTheme;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
    document.querySelectorAll("[data-card-back-option]").forEach(button => {
      const active = button.dataset.cardBackOption === root.dataset.cardBack;
      button.classList.toggle("is-selected", active);
      button.setAttribute("aria-pressed", String(active));
    });
  }

  function setTheme(value, announce = false) {
    const next = themeIds.has(value) ? value : "light-4color";
    root.dataset.cardTheme = next;
    save(THEME_KEY, next);
    refresh();
    if (announce) toast(`牌面已切換：${themeName(next)}`);
  }

  function setBack(value, announce = false) {
    const next = backIds.has(value) ? value : "navy";
    root.dataset.cardBack = next;
    save(BACK_KEY, next);
    refresh();
    if (announce) toast(`牌背已切換：${backName(next)}`);
  }

  function injectStyles() {
    if (document.querySelector("#pixelCardThemeStyles")) return;
    const style = document.createElement("style");
    style.id = "pixelCardThemeStyles";
    style.textContent = `
#cardStyleButton{min-width:76px}#cardStyleButton[aria-expanded=true]{border-color:rgba(112,216,201,.55);background:rgba(112,216,201,.13);color:var(--cyan)}
.card-style-panel{position:absolute;z-index:24;top:12px;right:12px;width:min(430px,calc(100% - 24px));max-height:calc(100% - 24px);overflow:auto;padding:14px;border:1px solid rgba(112,216,201,.32);border-radius:14px;background:radial-gradient(circle at 14% 0,rgba(112,216,201,.16),transparent 38%),rgba(5,13,17,.96);color:var(--ink);box-shadow:0 24px 60px rgba(0,0,0,.48),inset 0 1px 0 rgba(255,255,255,.13);backdrop-filter:blur(18px) saturate(132%)}.card-style-panel[hidden]{display:none}:root[data-theme=light] .card-style-panel{background:linear-gradient(180deg,rgba(255,255,255,.97),rgba(246,237,219,.96));border-color:rgba(81,63,40,.2)}
.card-style-head{display:flex;justify-content:space-between;gap:12px;margin-bottom:12px}.card-style-head p,.card-style-head h2,.card-style-head span{margin:0}.card-style-head p{color:var(--gold);font-size:.64rem;font-weight:950;letter-spacing:.08em;text-transform:uppercase}.card-style-head h2{margin-top:2px;font-size:1.05rem}.card-style-head span{display:block;margin-top:3px;color:var(--muted);font-size:.72rem}.card-style-close{width:30px;min-width:30px;min-height:30px;padding:0;border-radius:999px;background:rgba(255,255,255,.08);color:var(--ink);box-shadow:none}
.card-style-section+.card-style-section{margin-top:14px}.card-style-title{display:flex;justify-content:space-between;margin-bottom:7px}.card-style-title strong{font-size:.8rem}.card-style-title span{color:var(--muted);font-size:.66rem}.card-theme-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px}.card-theme-option,.card-back-option{min-height:0;padding:8px;border:1px solid rgba(255,255,255,.12);border-radius:9px;background:rgba(255,255,255,.045);color:var(--ink);text-align:left;box-shadow:none}:root[data-theme=light] .card-theme-option,:root[data-theme=light] .card-back-option{border-color:rgba(69,49,27,.16);background:rgba(255,255,255,.66)}.card-theme-option.is-selected,.card-back-option.is-selected{border-color:rgba(112,216,201,.68);background:rgba(112,216,201,.12);box-shadow:inset 0 0 0 1px rgba(112,216,201,.18),0 0 18px rgba(112,216,201,.1)}
.card-theme-preview{--s:#1e2844;--h:#d12e3c;--d:#d12e3c;--c:#1e2844;--bg:#f8fbff;--edge:#28324e;display:grid;grid-template-columns:repeat(4,1fr);gap:3px}.card-theme-preview[data-preview-theme=light-1color]{--s:#25304f;--h:#25304f;--d:#25304f;--c:#25304f}.card-theme-preview[data-preview-theme=light-4color]{--d:#e55c25;--c:#1f7f55}.card-theme-preview[data-preview-theme=dark]{--bg:#151a23;--edge:#56627a;--s:#c6d0e1;--h:#ff5f68;--d:#ff8b39;--c:#79bc62}.card-theme-preview[data-preview-theme=sepia]{--bg:#f1d4a1;--edge:#8a522c;--s:#61351f;--h:#773a25;--d:#8c4b28;--c:#623923}.card-theme-preview i{display:grid;place-items:center;aspect-ratio:5/7;border:1px solid var(--edge);border-radius:2px;background:var(--bg);font-style:normal;font:950 .72rem 'Courier New',monospace}.card-theme-preview i:nth-child(1){color:var(--s)}.card-theme-preview i:nth-child(2){color:var(--h)}.card-theme-preview i:nth-child(3){color:var(--d)}.card-theme-preview i:nth-child(4){color:var(--c)}.card-theme-copy{display:block;margin-top:6px}.card-theme-copy strong,.card-theme-copy small{display:block}.card-theme-copy strong{font-size:.76rem}.card-theme-copy small{margin-top:2px;color:var(--muted);font-size:.61rem;line-height:1.3}
.card-back-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}.card-back-option{display:grid;place-items:center;padding:5px}.card-back-swatch{--main:#273e78;--edge:#dce6f5;position:relative;width:100%;max-width:48px;aspect-ratio:5/7;border:2px solid var(--edge);border-radius:4px;background:linear-gradient(45deg,transparent 36%,rgba(255,255,255,.22) 37% 41%,transparent 42%),linear-gradient(-45deg,transparent 36%,rgba(255,255,255,.16) 37% 41%,transparent 42%),var(--main);box-shadow:inset 0 0 0 2px rgba(0,0,0,.24)}.card-back-swatch:after{content:attr(data-symbol);position:absolute;left:50%;top:50%;display:grid;place-items:center;width:52%;aspect-ratio:1;border:1px solid rgba(255,255,255,.6);border-radius:50%;background:rgba(0,0,0,.12);color:#fff;transform:translate(-50%,-50%)}.card-back-swatch[data-back=ruby]{--main:#a72435;--edge:#f5c5bf}.card-back-swatch[data-back=emerald]{--main:#207447;--edge:#bfe7c9}.card-back-swatch[data-back=violet]{--main:#663c85;--edge:#e0caef}.card-back-swatch[data-back=sunset]{--main:#d66b2d;--edge:#ffe0a8}.card-back-swatch[data-back=black-gold]{--main:#17191f;--edge:#d5ad4e;color:#f3cf69}
.card-style-footer{display:flex;justify-content:flex-end;margin-top:12px}.card-style-reset{min-height:32px;padding:0 10px;background:rgba(255,255,255,.07);color:var(--muted);box-shadow:none;font-size:.7rem}
html[data-card-theme] .card:not(.back){border-color:var(--ct-edge);background:linear-gradient(135deg,var(--ct-mark) 0 5px,transparent 5px 12px),linear-gradient(180deg,var(--ct-top),var(--ct-bottom));color:var(--ct-s);box-shadow:0 9px 14px rgba(0,0,0,.28),inset 0 0 0 2px var(--ct-inner),inset 0 -2px 0 var(--ct-shadow)}html[data-card-theme] .card:not(.back):before{border-color:var(--ct-line)}html[data-card-theme] .card.suit-s{color:var(--ct-s)}html[data-card-theme] .card.suit-h{color:var(--ct-h);border-color:var(--ct-he,var(--ct-edge))}html[data-card-theme] .card.suit-d{color:var(--ct-d);border-color:var(--ct-de,var(--ct-edge))}html[data-card-theme] .card.suit-c{color:var(--ct-c);border-color:var(--ct-ce,var(--ct-edge))}html[data-card-theme] .rank,html[data-card-theme] .corner-suit,html[data-card-theme] .pip,html[data-card-theme] .face-rank,html[data-card-theme] .face-suit{font-family:'Courier New',ui-monospace,monospace;font-weight:950;text-shadow:1px 1px 0 var(--ct-text)}html[data-card-theme] .card .pixel-head,html[data-card-theme] .card .pixel-body,html[data-card-theme] .card .pixel-prop{border-radius:1px;image-rendering:pixelated}html[data-card-theme] .card .pixel-head{border-color:var(--ct-outline);background:var(--ct-skin)}html[data-card-theme] .card .pixel-body{border-color:var(--ct-outline);background:linear-gradient(135deg,currentColor 0 48%,var(--ct-secondary) 49% 72%,var(--ct-gold) 73% 100%)}html[data-card-theme] .card .pixel-prop{border-color:var(--ct-outline);background:currentColor}html[data-card-theme] .face-k .pixel-portrait:before,html[data-card-theme] .face-q .pixel-portrait:before{content:'';position:absolute;z-index:3;left:27%;top:-2%;width:44%;height:13%;background:var(--ct-crown);clip-path:polygon(0 100%,0 36%,18% 68%,34% 8%,52% 67%,70% 3%,100% 68%,100% 100%);filter:drop-shadow(1px 1px 0 var(--ct-outline))}
html[data-card-theme=light-1color]{--ct-edge:#25304f;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-mark:rgba(37,48,79,.06);--ct-inner:rgba(255,255,255,.82);--ct-shadow:rgba(37,48,79,.08);--ct-line:rgba(37,48,79,.2);--ct-text:rgba(255,255,255,.36);--ct-s:#25304f;--ct-h:#25304f;--ct-d:#25304f;--ct-c:#25304f;--ct-outline:#25304f;--ct-skin:#d39a64;--ct-secondary:#59657c;--ct-gold:#d6b775;--ct-crown:#e3ad39}
html[data-card-theme=light-2color]{--ct-edge:#26304c;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-mark:rgba(38,48,79,.05);--ct-inner:rgba(255,255,255,.82);--ct-shadow:rgba(37,48,79,.08);--ct-line:rgba(37,48,79,.2);--ct-text:rgba(255,255,255,.36);--ct-s:#1e2844;--ct-h:#d12e3c;--ct-d:#d12e3c;--ct-c:#1e2844;--ct-he:#c7484e;--ct-de:#c7484e;--ct-outline:#25304f;--ct-skin:#d39a64;--ct-secondary:#314e83;--ct-gold:#ead7b8;--ct-crown:#e3ad39}
html[data-card-theme=light-4color]{--ct-edge:#26304c;--ct-top:#fbfcff;--ct-bottom:#eef3fb;--ct-mark:rgba(38,48,79,.05);--ct-inner:rgba(255,255,255,.82);--ct-shadow:rgba(37,48,79,.08);--ct-line:rgba(37,48,79,.2);--ct-text:rgba(255,255,255,.36);--ct-s:#1e2844;--ct-h:#d12e3c;--ct-d:#e55c25;--ct-c:#1f7f55;--ct-he:#c7484e;--ct-de:#cf6a36;--ct-ce:#34775d;--ct-outline:#25304f;--ct-skin:#d39a64;--ct-secondary:#314e83;--ct-gold:#ead7b8;--ct-crown:#e3ad39}
html[data-card-theme=dark]{--ct-edge:#56627a;--ct-top:#1c222d;--ct-bottom:#10141c;--ct-mark:rgba(255,255,255,.035);--ct-inner:rgba(255,255,255,.08);--ct-shadow:rgba(0,0,0,.36);--ct-line:rgba(206,218,236,.16);--ct-text:rgba(0,0,0,.42);--ct-s:#c6d0e1;--ct-h:#ff5f68;--ct-d:#ff8b39;--ct-c:#79bc62;--ct-he:#9d343d;--ct-de:#a95625;--ct-ce:#4e7b43;--ct-outline:#0a0d13;--ct-skin:#d8a06c;--ct-secondary:#324b78;--ct-gold:#c89944;--ct-crown:#e3ad39}
html[data-card-theme=sepia]{--ct-edge:#8a522c;--ct-top:#f4dba9;--ct-bottom:#e5bd7d;--ct-mark:rgba(104,58,28,.08);--ct-inner:rgba(255,244,204,.62);--ct-shadow:rgba(91,49,23,.18);--ct-line:rgba(108,59,31,.28);--ct-text:rgba(255,235,188,.34);--ct-s:#60351f;--ct-h:#773a25;--ct-d:#8c4b28;--ct-c:#623923;--ct-he:#8a4a2b;--ct-de:#9a5b31;--ct-ce:#704428;--ct-outline:#60351f;--ct-skin:#b87943;--ct-secondary:#88502b;--ct-gold:#d3a55f;--ct-crown:#b97b2e}
html[data-card-back] .card.back{border-color:var(--cb-edge);background:var(--cb-outer)}html[data-card-back] .card-back-pattern{border-color:var(--cb-edge);background:linear-gradient(45deg,transparent 35%,var(--cb-grid) 36% 40%,transparent 41%),linear-gradient(-45deg,transparent 35%,var(--cb-grid) 36% 40%,transparent 41%),repeating-linear-gradient(0deg,rgba(0,0,0,.08) 0 2px,transparent 2px 8px),var(--cb-main)}html[data-card-back] .card-back-pattern:after{content:var(--cb-symbol);position:absolute;left:50%;top:50%;display:grid;place-items:center;width:52%;aspect-ratio:1;border:1px solid var(--cb-symbol-line);border-radius:50%;background:rgba(0,0,0,.12);color:var(--cb-symbol-color);font-family:Georgia,serif;font-size:clamp(.8rem,1.8vw,1.35rem);transform:translate(-50%,-50%)}
html[data-card-back=navy]{--cb-main:#273e78;--cb-edge:#c9d5e9;--cb-outer:#1d294f;--cb-grid:rgba(255,255,255,.24);--cb-symbol:'♠';--cb-symbol-color:#fff;--cb-symbol-line:rgba(255,255,255,.64)}html[data-card-back=ruby]{--cb-main:#a72435;--cb-edge:#f1b7b3;--cb-outer:#6e1724;--cb-grid:rgba(255,255,255,.22);--cb-symbol:'♥';--cb-symbol-color:#fff;--cb-symbol-line:rgba(255,255,255,.64)}html[data-card-back=emerald]{--cb-main:#207447;--cb-edge:#b9dfc4;--cb-outer:#135333;--cb-grid:rgba(255,255,255,.22);--cb-symbol:'♣';--cb-symbol-color:#fff;--cb-symbol-line:rgba(255,255,255,.64)}html[data-card-back=violet]{--cb-main:#663c85;--cb-edge:#ddc5ea;--cb-outer:#45265e;--cb-grid:rgba(255,255,255,.22);--cb-symbol:'♦';--cb-symbol-color:#fff;--cb-symbol-line:rgba(255,255,255,.64)}html[data-card-back=sunset]{--cb-main:#d66b2d;--cb-edge:#f4d59e;--cb-outer:#9b451d;--cb-grid:rgba(255,255,255,.22);--cb-symbol:'✦';--cb-symbol-color:#fff;--cb-symbol-line:rgba(255,255,255,.64)}html[data-card-back=black-gold]{--cb-main:#17191f;--cb-edge:#d5ad4e;--cb-outer:#090a0d;--cb-grid:rgba(213,173,78,.28);--cb-symbol:'♛';--cb-symbol-color:#f3cf69;--cb-symbol-line:rgba(213,173,78,.7)}
@media(max-width:1240px){#cardStyleButton{min-width:42px;width:42px;padding:0;font-size:0}#cardStyleButton:before{content:'🃏';font-size:1rem}}@media(max-width:760px) and (orientation:landscape){.card-style-panel{top:7px;right:7px;width:min(390px,calc(100% - 14px));max-height:calc(100% - 14px);padding:10px}.card-theme-copy small{display:none}}
`;
    document.head.appendChild(style);
  }

  const preview = id => `<span class="card-theme-preview" data-preview-theme="${id}"><i>A</i><i>K</i><i>Q</i><i>J</i></span>`;

  function closePanel() {
    const panel = document.querySelector("#cardStylePanel");
    const button = document.querySelector("#cardStyleButton");
    if (!panel || !button) return;
    panel.hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  function build() {
    const actions = document.querySelector(".top-bar-actions");
    const arena = document.querySelector("#arena");
    if (!actions || !arena || document.querySelector("#cardStyleButton")) return;

    const trigger = document.createElement("button");
    trigger.id = "cardStyleButton";
    trigger.className = "ghost-button tool-button";
    trigger.type = "button";
    trigger.textContent = "🃏 牌面";
    trigger.setAttribute("aria-expanded", "false");
    trigger.setAttribute("aria-controls", "cardStylePanel");
    actions.insertBefore(trigger, document.querySelector("#layoutButton"));

    const panel = document.createElement("section");
    panel.id = "cardStylePanel";
    panel.className = "card-style-panel";
    panel.hidden = true;
    panel.setAttribute("role", "dialog");
    panel.setAttribute("aria-label", "選擇撲克牌面與牌背");
    panel.innerHTML = `
<header class="card-style-head"><div><p>Pixel Card Studio</p><h2>撲克牌面</h2><span>選擇會自動保存在這台裝置。</span></div><button class="card-style-close" data-card-close type="button" aria-label="關閉">×</button></header>
<section class="card-style-section"><div class="card-style-title"><strong>牌面主題</strong><span>花色與人物牌</span></div><div class="card-theme-grid">${themes.map(([id,label,detail]) => `<button class="card-theme-option" data-card-theme-option="${id}" type="button" aria-pressed="false">${preview(id)}<span class="card-theme-copy"><strong>${label}</strong><small>${detail}</small></span></button>`).join("")}</div></section>
<section class="card-style-section"><div class="card-style-title"><strong>牌背樣式</strong><span>未翻開的牌</span></div><div class="card-back-grid">${backs.map(([id,label,symbol]) => `<button class="card-back-option" data-card-back-option="${id}" type="button" title="${label}" aria-label="${label}" aria-pressed="false"><span class="card-back-swatch" data-back="${id}" data-symbol="${symbol}"></span></button>`).join("")}</div></section>
<footer class="card-style-footer"><button class="card-style-reset" data-card-reset type="button">還原預設</button></footer>`;
    arena.appendChild(panel);

    trigger.addEventListener("click", () => {
      panel.hidden = !panel.hidden;
      trigger.setAttribute("aria-expanded", String(!panel.hidden));
    });
    panel.addEventListener("click", event => {
      const themeButton = event.target.closest("[data-card-theme-option]");
      const backButton = event.target.closest("[data-card-back-option]");
      if (themeButton) setTheme(themeButton.dataset.cardThemeOption, true);
      else if (backButton) setBack(backButton.dataset.cardBackOption, true);
      else if (event.target.closest("[data-card-reset]")) {
        setTheme("light-4color"); setBack("navy"); toast("牌面與牌背已還原預設");
      } else if (event.target.closest("[data-card-close]")) closePanel();
    });
    document.addEventListener("pointerdown", event => {
      if (!panel.hidden && !panel.contains(event.target) && !trigger.contains(event.target)) closePanel();
    });
    document.addEventListener("keydown", event => {
      if (event.key === "Escape" && !panel.hidden) closePanel();
    });
  }

  function init() {
    injectStyles();
    root.dataset.cardTheme = themeIds.has(root.dataset.cardTheme) ? root.dataset.cardTheme : load(THEME_KEY, "light-4color", themeIds);
    root.dataset.cardBack = backIds.has(root.dataset.cardBack) ? root.dataset.cardBack : load(BACK_KEY, "navy", backIds);
    build();
    refresh();
  }

  window.CardThemeUI = Object.freeze({ init, setTheme, setBack, close: closePanel });
  document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", init, { once: true }) : init();
})();
