# 德州撲克專案狀態

## 專案資訊

- Repository: `qoo109/texas-holdem`
- 線上網站: `https://qoo109.github.io/texas-holdem/`
- 線上診斷: `https://qoo109.github.io/texas-holdem/diagnostics.html`
- 正式分支: `main`
- 唯一正式開發來源: Repository root
- GitHub Pages 發布來源: `Deploy from a branch / main / (root)`
- Pages 設定確認: 使用者已於 2026-07-22 在 `Settings → Pages` 完成確認

## 正式維護範圍

以下是唯一正式來源，所有功能修改都應在這裡完成：

- `index.html`
- `styles.css`
- `app.js`
- `js/`

`docs/` 是過去留下的副本，不再用於新功能開發。GitHub 歷史可還原舊內容；正式刪除前仍需完成最後的 Console 驗證。

## 目前已完成

- AI 表情只在有反應時顯示，位於頭像左右上角。
- AI 表情可浮在頭像框外。
- AI 思考進度條已移除，改用座位發光表示思考與行動。
- 已修正 AI 行動提示藍光／黃光瞬間跳動。
- AI 連續行動間的額外空白已調整為 `80–100ms`，不影響角色原本的思考時間。
- 收藏牌組精簡為 `童趣手繪牌組` 與 `午夜牌組`。
- 版面編輯器、新手教學、本輪結算均已保留。
- 已建立 `scripts/validate-static-site.mjs` 靜態網站檢查器。
- 已建立 `Static site check` GitHub Actions，自動檢查 root 缺檔、路徑與 JavaScript 語法。
- `Static site check` 已由使用者確認多次通過。
- 已建立 `diagnostics.html`，可從線上網站直接檢查 root 部署與關鍵檔案。
- 線上診斷頁已由使用者確認全部通過。
- 新牌局、AI 表情、音效/BGM、編輯版面、牌組收藏、新手教學與本輪結算已完成手動驗證。
- root 已定為 Codex 與人工開發的唯一正式來源。
- GitHub Pages 已設定為 `main / (root)`。

## 尚未完成

- 使用瀏覽器 Console 確認遊戲頁面沒有 404 或 JavaScript error。
- 建立真正操作瀏覽器的 E2E 測試。
- 完成最後 Console 驗證後，移除過期的 `docs/` 副本。

## 已知風險

- 本機若開啟 `/Users/qoo/Desktop/德州`，可能修改到 GitHub 工作副本以外的第三份檔案。
- Codex 不會自動把 root 修改同步到 `docs/`；`docs/` 也不再是開發來源。
- GitHub Desktop 只會提交實際變更的檔案，不會替專案同步副本。
- GitHub Pages 或瀏覽器快取可能暫時顯示舊版。
- 靜態與線上資源檢查不能完全取代真實遊戲互動與 Console 驗證。

## 開發規則

1. Codex 與編輯器應直接開啟 `/Users/qoo/Documents/GitHub/texas-holdem`。
2. 新功能只修改 root 正式來源。
3. 每次修改前先執行 `git status` 並讀取本文件。
4. 不要在未核對最新 `main` 前覆蓋既有成果。
5. 不要 force push，除非使用者明確同意。
6. 不要提交 `.DS_Store`、臨時檔或下載素材原檔。
7. AI 教練不得讀取或洩露對手底牌。
8. 提交前必須執行 `node scripts/validate-static-site.mjs`。
9. 完成最後 Console 驗證前，不得刪除 `docs/`。

## 不可重做或刪除

- AI 表情與 AI 行動發光提示。
- 思考進度條移除成果。
- 牌組收藏精簡成果。
- 版面編輯器。
- `v75-smaller-table-2026-07-18`
- `v76-ux-readability-tuning-2026-07-18`
- `v77-pixel-card-theme-2026-07-19`

## 下一步

使用 Safari Web Inspector 開啟遊戲頁面的 Console 與 Network，確認沒有紅色 JavaScript error 或 404。確認通過後即可移除 `docs/` 歷史副本，完成單一來源整理。
