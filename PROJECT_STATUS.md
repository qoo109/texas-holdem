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
- 版面編輯開啟時，右側欄只顯示完整編輯器；撲克教練與牌局紀錄暫時隱藏，完成編輯後自動恢復。
- 已建立 `scripts/validate-static-site.mjs` 靜態網站檢查器。
- 已建立 `Static site check` GitHub Actions，自動檢查 root 缺檔、路徑與 JavaScript 語法。
- `Static site check` 已由使用者確認多次通過。
- 線上診斷頁已由使用者確認全部通過。
- 新牌局、AI 表情、音效/BGM、編輯版面、牌組收藏、新手教學與本輪結算已完成手動驗證。
- Safari Console 與 Network 已由使用者確認沒有紅色 JavaScript error 或 404。
- GitHub Pages 已設定並驗證使用 `main / (root)`。
- `docs/` 歷史副本已移除，專案完成單一網站來源整理。
- 已建立 Playwright Chromium 最小瀏覽器 E2E 測試與 `Browser E2E` GitHub Actions workflow。
- `Browser E2E` 第一次 GitHub Actions 執行已由使用者於 2026-07-22 確認通過。
- 版面編輯器不受牌局紀錄遮擋、五個大小調整滑桿可操作、關閉後側欄恢復，均已納入 E2E。
- 玩家加注與 All-in 的籌碼變化、牌局紀錄及執行階段錯誤檢查已納入 E2E，並由使用者於 2026-07-22 確認通過。
- 固定牌面攤牌 E2E 已驗證五張公共牌、順子勝者、底池分配、底池歸零與牌局進入結算狀態。
- 玩家籌碼歸零的本輪結算 E2E 已驗證統計面板、七邊形風格圖、七項行為圖表及回到第 1 局流程。
- 攤牌與本輪結算相關 `Browser E2E` 已由使用者於 2026-07-23 確認通過。
- `Browser E2E` 已升級為 Chromium 與 WebKit 獨立矩陣，兩個瀏覽器各自完整執行六項測試。
- Chromium 與 WebKit 共 12 次瀏覽器測試已由使用者於 2026-07-23 確認全部通過。

## 尚未完成

- 後續功能改動需持續進行 Chromium 與 WebKit 線上回歸測試。

## 已知風險

- 本機若開啟 `/Users/qoo/Desktop/德州`，可能修改到 GitHub 工作副本以外的舊檔案。
- GitHub Desktop 只會提交實際變更的檔案，不會替專案同步其他資料夾。
- GitHub Pages 或瀏覽器快取可能暫時顯示舊版。
- 現有 E2E 已在 Chromium 與 WebKit 覆蓋核心 smoke、版面編輯、加注、All-in、固定攤牌與本輪結算，但仍不能取代所有隨機牌局與長時間壓力測試。

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

基礎發布、靜態檢查、Chromium 與 WebKit 雙瀏覽器六項 E2E、版面編輯、加注／All-in、固定牌面攤牌與本輪結算路徑均已通過。測試強化階段完成，下一步回到遊戲功能與 UI 迭代。
