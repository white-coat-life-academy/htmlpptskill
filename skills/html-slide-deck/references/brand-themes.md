# 品牌主題：白袍人生學院 CIS／張益豪醫師個人

本 fork 在上游的深藍綠版型之外，多了兩套主題。HTML 與原生 PPTX 兩端各有一份色票，改色要兩邊一起改。

| 主題 | 名義 | 外觀 |
|---|---|---|
| `whitecoat` | 白袍人生學院 | 內容頁白袍白底、標題學院藍；封面／章節／提問／收尾頁學院藍底反白；曙光金點睛（60／30／10） |
| `drhao` | 張益豪醫師個人 | 全份沉靜藍底、白袍白字、曙光金重點；內容頁標題黑體，封面與章節等情緒頁換宋體（本人 2026-11-12 確認） |
| （不指定） | 其他 | 上游原版深藍綠 |

個人品牌目前沒有另立視覺識別，`drhao` 沿用學院 CIS 的七個顏色。

## 色票（白袍人生學院 CIS，2026-05 現行版；線上手冊 cis.drhao33.com）

| 名稱 | HEX | 用途 |
|---|---|---|
| 學院藍 | `#1A3D63` | 標題、主結構、深色頁底 |
| 沉靜藍 | `#0E2A45` | 深色背景、QR 深色 |
| 晨曦藍 | `#5E8CB5` | 色條、圖形、層次；不做小字 |
| 曙光金 | `#E0A235` | 關鍵詞、關鍵數字、短線、色塊 |
| 白袍白 | `#FBF9F3` | 主要背景、深底文字 |
| 石墨灰 | `#2E343A` | 淺底內文 |
| 雲灰 | `#E9E7E0` | 卡片底、分隔線 |

七色以外出現在主題檔裡的值，都是「色票色疊在底色上的實色換算」（例如深底上的晨曦藍淺階 `#A9C3DB`、卡片底 `#F3F1EA`），行尾有註明。舊版色 `#1E3A6B`、`#1E3357`、`#C9A961` 不得再用。

金色規則：金色文字只放深藍底。淺底上金色只做色塊、線條與底線；唯一例外是 h1 大標的重點詞（沿用 CIS 版型的寫法）。

上游的四個語意色槽（amber／teal／coral／green）在主題裡都收斂到色票內，當分類與裝飾用：重點＝金、次要＝晨曦藍、其餘用雲灰與白。

**判斷訊號色**（本人 2026-11-12 同意保留紅綠）：只用在「注意／優點、迷思／實證、退回／通過、正解」這類判斷，不當裝飾色。色票外的四個值：淺底 `ok` `#2C7A4B`、`warn` `#B4452C`；深底 `ok` `#6FCF97`、`warn` `#E8846B`。用法：content.js 裡決策樹結果或卡片的顏色欄填 `'ok'` 或 `'warn'`；`platform` 版型的優點／注意、PPTX 的 flips（迷思／實證）、quiz 正解、實證強度標籤會自動使用。HTML 端只在主題模式有效；PPTX 端不套主題時，這些版型退回上游原本的綠與珊瑚色。

## 字體

- HTML：標題 `Noto Serif TC`（思源宋體）、內文 `Noto Sans TC`（思源黑體）、英數 `Montserrat`。**套主題時字型會內嵌進單檔**：build.js 只取簡報實際用到的字、轉成 woff2 寫進 HTML（思源宋體 700／900、思源黑體 300–500／700／900 共五個字重，其中 300–500 用同一個 Medium 檔，一份十頁的簡報約多 0.5 MB），換電腦播放字體不會跑掉。字型檔依 `themes.json` 的 `fonts` 找，搜尋目錄：環境變數 `DECK_FONT_DIR`、專案的 `fonts/`、專案上一層的 `_fonts/` 或 `fonts/`。找不到檔或沒裝 `subset-font` 會印出提醒並退回系統字（macOS：宋體-繁／蘋方；Windows：新細明體／微軟正黑體）。`DECK_FONTS=0` 可關閉。Montserrat 沒有內嵌，英數會用思源黑體。build 之後才加進頁面的字（例如現場輸入）不在內嵌範圍。
- PPTX：維持 `Microsoft JhengHei`（Mac 與 Windows 的 PowerPoint 都有，自動縮字的字寬估算也是依它校準）。要宋體標題請在 PowerPoint 或 Canva 裡手動換。
- 主題把整體字級從上游的 30px 放大到 36px。上游 50 頁範例那種高密度頁面套主題後可能溢出，QA 會報。

## 做法 B（content.js＋build.js）

```js
const meta = { title: '…', author: '張益豪醫師｜耳鼻喉頭頸外科專科醫師｜沐橙診所院長｜白袍人生學院創辦人', theme: 'whitecoat' };
```

- `npm run export` 一次產出網頁簡報與可編輯 PPTX（`dist/exports/<版本>/`），兩者都會套主題；只要 HTML 用 `npm run all`。也可以不改檔，用環境變數 `DECK_THEME=drhao` 臨時切換（環境變數優先於 `meta.theme`，用完記得清掉）。
- 哪些版型是深色頁登記在 `styles/themes/themes.json` 的 `dark`（預設 title、section、question、cat、end）。單頁要覆寫：在該頁物件加 `mode: 'dark'` 或 `mode: 'light'`。
- 深色頁沒有底圖時，右上角會有一處金色「光」放射圖形（`darkGradient`）；有底圖就不畫。
- 標題裡用 `<b>` 標重點詞：深色頁與 h1 會變金色；淺色頁的 h2 是金色底線。
- 單獨轉原生 PPTX：`node $SKILL/scripts/content-to-pptx.mjs content.js out.pptx`，會讀同一個 `meta.theme`；也可加 `--theme whitecoat`。PPTX 端的色票在 `scripts/pptx-themes.mjs`。
- 圖片型講義與 PDF 是從 HTML 截圖，不用另外設定。

## 做法 A（單檔手寫 reveal-template.html）

把 `references/offline-build-template/styles/themes/<主題>.css` 的內容貼在範本 `<style>` 的最後面；深色頁的 `<section>` 自己加 `data-mode="dark" data-background-color="#1A3D63"`（`drhao` 用 `#0E2A45`）。這條路沒有逐一驗過範本裡的每個範例頁，套完一定要跑 QA 截圖。

## 新增主題

1. `styles/themes/` 加一個 `<名稱>.css`（照 `whitecoat.css` 的結構：`:root` 變數、深色頁變數、覆寫）。
2. 在 `styles/themes/themes.json` 登記（qr 深色、dark 版型、darkBg、darkGradient）。
3. `scripts/pptx-themes.mjs` 加同名主題（light／dark 兩份色票）。
4. 兩個主題各 build 一次、跑 QA、轉一次 PPTX 看過。

沐橙診所有自己的品牌色，不要直接拿學院藍金代用；需要時另開主題。

## 這台機器怎麼跑（給 agent）

使用者不在終端機手動下指令。相依由 agent 在專案資料夾內裝：`npm ci`（範本已含 Playwright 與 PptxGenJS）。截圖用的 Chromium 不必另外下載，設 `CHROMIUM_PATH` 指向已安裝的 Google Chrome 執行檔即可。沒有 PowerPoint 與 LibreOffice 的機器無法用 `pptx-to-pdf.sh` 驗 PPTX，要明講「PPTX 版面未在 PowerPoint 實機驗過」。
