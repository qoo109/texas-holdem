# Codex / AI 開發規則

## 專案來源

- Repository: `qoo109/texas-holdem`
- Canonical development source: repository root
- GitHub Pages source: `Deploy from a branch / main / (root)`
- Pages setting confirmed by user on 2026-07-22

## 每次開始前

1. 讀取 `PROJECT_STATUS.md`、`README.md`、`versions/README.md`。
2. 執行 `git status`。
3. 確認目前 branch 為 `main`，並確認遠端是否有更新。
4. 以最新 GitHub 內容為準，不依聊天記憶重做功能。

## 允許修改

- `index.html`
- `styles.css`
- `app.js`
- `js/`
- 專案文件與必要測試

## 不應修改

- 不要在 `docs/` 開發新功能；它是歷史副本。
- 完成線上 root 版本與核心功能驗證前不要刪除 `docs/`。
- 不要建立另一份完整網站副本。
- 不要刪除最近穩定快照。
- 不要提交 `.DS_Store`、下載圖片、臨時檔或編輯器快取。
- 不要 force push。
- 不要讓 AI 教練看穿對手底牌。

## 修改原則

- 延續既有 HTML、CSS 與 JavaScript 架構。
- 維持目前命名與程式風格。
- 只修改完成需求所需的最小範圍。
- 不覆蓋已驗證的 AI 表情、行動發光、牌組收藏與版面編輯成果。
- 修改後至少執行 `node scripts/validate-static-site.mjs`。

## 完成條件

- 靜態網站檢查通過。
- `git diff` 僅包含預期修改。
- 沒有新增不必要的副本。
- 線上發布後需檢查 Console 404 與 JavaScript error。
- 不得在沒有證據時宣稱線上部署與功能驗證已完成。