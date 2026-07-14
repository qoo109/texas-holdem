# v46-layout-editor-2026-07-07

## 版本註解

新增第一版牌桌版面編輯器。

## 改動

- 上方工具列新增「編輯版面」按鈕。
- 編輯模式可拖曳：
  - AI 座位
  - 公共牌
  - Pot
  - 階段提示
  - 玩家手牌區
- 新增版面控制：
  - 儲存版面
  - 自動排列
  - 還原預設
  - 鎖定版面
- 版面座標以百分比儲存到 `localStorage` 的 `texasHoldemTableLayoutV1`。
- 同步更新 `docs/` 部署用檔案。
- 保留 `.nojekyll` 與 `docs/.nojekyll`。

## 驗證

- `node --check app.js`
- `node --check docs/app.js`
- 根目錄與 `docs/` 的 `index.html`、`styles.css`、`app.js` 已同步。
- 本機瀏覽器預覽通過：編輯模式開啟、儲存、拖曳 Pot、還原預設。
