# 德州撲克版本快照

這個資料夾用來保存每次大改前或穩定後的版本。

固定命名格式：

```text
v版本號-改動註解-日期
```

例如：

```text
v41-winner-glow-2026-07-06
v44-hero-card-slim-2026-07-06
```

`改動註解` 要用簡短描述，讓檔案列表一眼看得出這版做了什麼。

每個版本資料夾至少保存：

```text
index.html
styles.css
app.js
VERSION.md
```

若要回到某一版，將該版本資料夾內的 `index.html`、`styles.css`、`app.js` 還原到專案根目錄即可。

最新穩定版：`v55-readable-hand-guide-2026-07-14`，放大教學文字並補回完整牌型示例牌。
