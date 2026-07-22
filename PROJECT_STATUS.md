# 德州撲克專案狀態

## 專案資訊

- Repository: `qoo109/texas-holdem`
- 線上網站: `https://qoo109.github.io/texas-holdem/`
- 線上診斷: `https://qoo109.github.io/texas-holdem/diagnostics.html`
- 正式分支: `main`
- 唯一正式開發與發布來源: Repository root
- GitHub Pages 發布來源: `Deploy from a branch / main / (root)`
- Pages 設定確認: 使用者已於 2026-07-22 在 `Settings → Pages` 完成確認

## 正式維護範圍

所有功能修改只在以下位置完成：

- `index.html`
- `styles.css`
- `app.js`
- `js/`

過去的 `docs/` 重複網站副本已於 2026-07-22 移除。需要時可從 Git history 還原，但不得重新建立第二套正式網站。

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
- 線上診斷頁已由使用者確認全部通過。
- 新牌局、AI 表情、音效/BGM、編輯版面、牌組收藏、新手教學與本輪結算已完成手動驗證。
- Safari Console 與 Network 已由使用者確認沒有紅色 JavaScript error 或 404。
- GitHub Pages 已設定並驗證使用 `main / (root)`。
- `docs/` 歷史副本已移除，專案完成單一網站來源整理。
- 已建立 Playwright Chromium 最小瀏覽器 E2E 測試與 `Browser E2E` GitHub Actions workflow。

## 尚未完成

- 確認 `Browser E2E` workflow 第一次執行並通過。
- 後續可視需要增加 WebKit 與更多下注／結算路徑測試。
- 後續功能改動需持續進行線上回歸測試。

## 已知風險

- 本機若開啟 `/Users/qoo/Desktop/德州`，可能修改到 GitHub 工作副本以外的舊檔案。
- GitHub Desktop 只會提交實際變更的檔案，不會替專案同步其他資料夾。
- GitHub Pages 或瀏覽器快取可能暫時顯示舊版。
- 最小 E2E 只能覆蓋主要 smoke flow，不能取代所有隨機牌局與長時間壓力測試。

## 開發規則

1. Codex 與編輯器應直接開啟 `/Users/qoo/Documents/GitHub/texas-holdem`。
2. 新功能只修改 Repository root 正式來源。
3. 每次修改前先執行 `git status` 並讀取本文件。
4. 不要在未核對最新 `main` 前覆蓋既有成果。
5. 不要 force push，除非使用者明確同意。
6. 不要提交 `.DS_Store`、臨時檔或下載素材原檔。
7. AI 教練不得讀取或洩露對手底牌。
8. 提交前必須執行 `node scripts/validate-static-site.mjs`。
9. 涉及遊戲流程或 UI 互動時必須執行 `npm run test:e2e`。
10. 不得重新建立 `docs/` 或其他完整網站副本。

## 不可重做或刪除

- AI 表情與 AI 行動發光提示。
- 思考進度條移除成果。
- 牌組收藏精簡成果。
- 版面編輯器。
- `v75-smaller-table-2026-07-18`
- `v76-ux-readability-tuning-2026-07-18`
- `v77-pixel-card-theme-2026-07-19`

## 下一步

確認最新 `Browser E2E` workflow 是否通過。若失敗，下載 `playwright-report` artifact 查看 trace、截圖與影片；若通過，再把首次 E2E 驗證記錄為完成。
