# 離線 reveal.js 簡報範本（做法 B：內容／版型分離）

```bash
SKILL="$HOME/.codex/skills/html-slide-deck"       # 依實際安裝路徑調整
cp -R "$SKILL/references/offline-build-template" my-deck && cd my-deck
npm ci && npx playwright install chromium       # 已有 Chromium 可改設 CHROMIUM_PATH
# 編輯 content.js（一頁一個物件），底圖放 assets/、工具截圖放 shots/<key>.png
npm run export -- --skill-dir "$SKILL"
```

`npm run export` 從同一份 `content.js` 產出 `dist/exports/<版本>/index.html`、`editable.pptx` 和 `qa/`。HTML 檢查與 PPTX 版型轉換通過後才建立該批交付目錄。留在 skill 內執行，或已裝到 Codex 的預設 skill 目錄時，可省略 `--skill-dir`。只要 HTML 時用 `npm run all`，輸出位置仍為 `dist/index.html` 和 `check-output/`。

兩邊都有內建版型的 `type` 包含 title、question、three、section、flow、steps、compare、decision、tool、end。其他 HTML 版型可用 `npm run export -- --renderers my-renderers.mjs` 補上對應的原生 PPTX 版型。交付前再用簡報軟體逐頁查看 PPTX。

- 版型（type）：title、about、question、three、section、agents、flow、ladder、prompt、platform、terms、fork、steps、autodeploy、domains、backend、compare、decision、catoverview、cat、tool、demosteps、risk、resources、end（渲染函式在 build.js）。
- 50 頁完整實例：repo 的 `examples/workshop-2026/content.js`，複製過來取代 content.js 即可 build（截圖與底圖需自備）。
- `content.js` 的文字欄位視為可信 HTML；網址與標籤會跳脫。
- 講義 PPTX／PDF：用 html-slide-deck 的 `render-slides.mjs`、`build-handout.mjs`、`print-pdf.mjs` 對 `dist/index.html` 跑。
