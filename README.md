# 德州撲克網頁遊戲

純 HTML、CSS、JavaScript 製作的德州撲克網頁遊戲。

## 線上網站

`https://qoo109.github.io/texas-holdem/`

## 正式來源

GitHub Pages 使用：

- Branch: `main`
- Folder: `/ (root)`

唯一正式程式來源：

- `index.html`
- `styles.css`
- `app.js`
- `js/`

`docs/` 是歷史副本，不應用於新功能開發。

## 本機開發

請直接使用 GitHub 工作副本：

```text
/Users/qoo/Documents/GitHub/texas-holdem
```

不要把 `/Users/qoo/Desktop/德州` 當成另一份正式版本，避免修改後沒有進入 Git。

## 開始工作前

```bash
git status
git pull --ff-only
```

並先閱讀：

- `PROJECT_STATUS.md`
- `AGENTS.md`
- `versions/README.md`

## 基本檢查

```bash
node scripts/validate-static-site.mjs
```

檢查內容包括：

- root 必要檔案是否存在
- HTML、CSS 與動態 JavaScript 引用是否缺檔
- 是否誤用不適合 GitHub Project Pages 的 `/` 絕對路徑
- root JavaScript 語法是否正確

每次 push 到 `main` 或建立 Pull Request 時，GitHub Actions 都會自動執行相同檢查。

## 發布流程

1. 在 Repository root 修改與測試。
2. 執行 `node scripts/validate-static-site.mjs`。
3. 使用 GitHub Desktop 或 Git 提交至 `main`。
4. 確認 `Static site check` 通過。
5. 等待 GitHub Pages 更新。
6. 強制重新整理網站並查看瀏覽器 Console。

詳細狀態請看 `PROJECT_STATUS.md`。
