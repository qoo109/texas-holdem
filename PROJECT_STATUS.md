# 德州撲克專案狀態

## 專案資訊

- Repository: `qoo109/texas-holdem`
- 線上網站: `https://qoo109.github.io/texas-holdem/`
- 正式分支: `main`
- GitHub Pages 發布來源: `main / (root)`
- 正式程式來源: Repository root
- 核對基準 commit: `cc7d763427873fa6c44dc8b831e07b19161e4956`

## 正式維護範圍

以下是唯一正式來源，所有功能修改都應在這裡完成：

- `index.html`
- `styles.css`
- `app.js`
- `js/`

`docs/` 是過去留下的副本，不是正式發布來源。不得在 `docs/` 內進行新功能開發，也不得只修改 `docs/` 後宣稱線上版本已更新。

## 目前已完成

- AI 表情只在有反應時顯示，位於頭像左右上角。
- AI 表情可浮在頭像框外。
- AI 思考進度條已移除，改用座位發光表示思考與行動。
- 已修正 AI 行動提示藍光／黃光瞬間跳動。
- 收藏牌組精簡為 `童趣手繪牌組` 與 `午夜牌組`。
- 版面編輯器、新手教學、本輪結算均已保留。
- 最近一次 JavaScript 語法檢查已通過。

## 尚未完成

- 使用瀏覽器 Console 驗證線上頁面沒有 404 或 JavaScript error。
- 完整驗證新牌局、AI 表情、音效/BGM、編輯版面、牌組收藏、新手教學與本輪結算。
- 建立瀏覽器 E2E 測試。
- 待線上 root 發布驗證穩定後，評估移除過期的 `docs/` 副本。

## 已知風險

- 本機若開啟 `/Users/qoo/Desktop/德州`，可能修改到 GitHub 工作副本以外的第三份檔案。
- Codex 不會自動把 root 修改同步到 `docs/`。
- GitHub Desktop 只會提交實際變更的檔案，不會替專案同步副本。
- GitHub Pages 或瀏覽器快取可能暫時顯示舊版。
- 目前沒有自動化瀏覽器 E2E 測試。

## 開發規則

1. Codex 與編輯器應直接開啟 `/Users/qoo/Documents/GitHub/texas-holdem`。
2. 新功能只修改 root 正式來源。
3. 每次修改前先執行 `git status` 並讀取本文件。
4. 不要在未核對最新 `main` 前覆蓋既有成果。
5. 不要 force push，除非使用者明確同意。
6. 不要提交 `.DS_Store`、臨時檔或下載素材原檔。
7. AI 教練不得讀取或洩露對手底牌。

## 不可重做或刪除

- AI 表情與 AI 行動發光提示。
- 思考進度條移除成果。
- 牌組收藏精簡成果。
- 版面編輯器。
- `v75-smaller-table-2026-07-18`
- `v76-ux-readability-tuning-2026-07-18`
- `v77-pixel-card-theme-2026-07-19`

## 下一步

打開線上網站並使用瀏覽器開發者工具，確認 root 發布版本沒有 404 或 JavaScript error，接著逐項完成核心功能驗證。
