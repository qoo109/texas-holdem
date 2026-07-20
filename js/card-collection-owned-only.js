// Show only decks the player has already unlocked.
(() => {
  "use strict";

  const styleId = "ownedDecksOnlyStyles";

  function installStyles() {
    if (document.querySelector(`#${styleId}`)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .deck-collection-item.is-locked {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
  }

  function updateCollectionCopy() {
    const subtitle = document.querySelector("#cardStylePanel .card-style-head span");
    if (subtitle) subtitle.textContent = "只顯示目前已取得的牌組；新的牌組解鎖後才會出現在收藏中。";

    const summaryNote = document.querySelector("#cardStylePanel .deck-collection-summary small");
    if (summaryNote) summaryNote.textContent = "解鎖後自動加入";

    const footer = document.querySelector("#cardStylePanel .card-style-footer");
    if (footer) footer.textContent = "未取得與隱藏牌組不會提前顯示。";
  }

  function refreshOwnedOnlyView() {
    installStyles();
    updateCollectionCopy();
  }

  const observer = new MutationObserver(refreshOwnedOnlyView);

  function init() {
    refreshOwnedOnlyView();
    observer.observe(document.body, { childList: true, subtree: true });
  }

  document.readyState === "loading"
    ? document.addEventListener("DOMContentLoaded", init, { once: true })
    : init();
})();
