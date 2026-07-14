# v47-beginner-guide-2026-07-10

## 版本註解

新增遊戲內新手教學面板。

## 改動

- 上方工具列新增「新手教學」按鈕。
- 將 `cyberpoker_beginner_manual_v4_table_visual.html` 的內容整合成遊戲內 modal。
- 新手教學包含 7 個章節：
  - 快速入門
  - 遊戲流程
  - 牌型大小
  - 位置與盲注
  - 下注與加注
  - All-in 與邊池
  - 常見術語
- 教學介面使用遊戲原本的暗色玻璃、金色邊線、牌桌綠與籌碼視覺，避免與遊戲畫面脫節。
- 支援明亮模式的教學面板配色。
- 同步更新 `docs/` 部署用檔案。
- 保持三個主檔結構，沒有新增額外 `js/` 資料夾。

## 驗證

- `node --check app.js`
- `node --check docs/app.js`
- 根目錄與 `docs/` 的 `index.html`、`styles.css`、`app.js` 已同步。
- 本機瀏覽器預覽通過：
  - 新手教學按鈕可開啟
  - 7 個章節可渲染
  - 牌型大小顯示 10 種牌型
  - 關閉按鈕可關閉 modal
