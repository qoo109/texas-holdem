# v50-movable-layout-panel-2026-07-12

## 版本註解

讓版面編輯器面板可以拖曳移動，避免擋住座位、對話泡泡與手牌調整區。

## 改動

- 編輯面板新增「拖曳視窗」把手。
- 面板可在牌桌範圍內自由移動。
- 拖曳時會限制在 arena 內，不會跑出畫面。
- 面板位置會自動儲存到 `texasHoldemLayoutPanelPositionV1`。
- 按「儲存版面」也會保存面板位置。
- 按「還原預設」會把面板位置回復到右上角。
- 加入全域 pointerup / pointercancel 保護，避免拖曳放開時卡在拖曳狀態。
- 明亮模式也補上拖曳把手樣式。
- 同步更新 `docs/` 部署用檔案。
- 保持三個主檔結構，沒有拆出新的 JS/CSS 子檔。

## 驗證

- `node --check app.js`
- `node --check docs/app.js`
- 根目錄與 `docs/` 的 `index.html`、`styles.css`、`app.js` 已同步。
- 本機瀏覽器預覽通過：
  - 編輯版面面板可開啟。
  - 面板把手顯示「拖曳視窗」。
  - 面板可從右上拖到較左下位置。
  - 拖曳結束後不會殘留 `is-panel-dragging`。
  - Console 無 error/warning。
