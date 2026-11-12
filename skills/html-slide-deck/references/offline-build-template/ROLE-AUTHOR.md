# 主筆規則（誰當主筆，就讀這份）

若專案有 PLAN.md 先讀它；沒有就依本檔。

## 可以改
- `content.js`：所有文字、網址、講者備註（改內容只改這裡）
- `build.js`：版型渲染
- `styles/deck.css`：新增樣式

## 不要改
- `styles/base.css`（沿用的視覺，要一致）
- `REVIEW.md`（稽核紀錄，只能讀）
- `dist/`（由 build 產生）

## 規則
- 使用繁體中文、全形標點（依 PLAN.md 調整）
- 遵守使用者與 PLAN.md 指定的頁數限制
- 必須可離線：不得引用 CDN、Google Fonts 或任何外部資源（`npm run check` 會擋對外請求）
- 依交付格式執行 `npm run export` 或 `npm run all`，通過後逐頁檢查
- 不確定的事實（價格、免費額度、功能）不要寫數字，寫「以官網為準」
- 不放可識別個人的資訊；醫療敘述不做療效保證
- 處理 REVIEW.md 時，只修改使用者已勾選的項目
