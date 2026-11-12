// 品牌主題（PPTX 端）。content-to-pptx.mjs 依 --theme、環境變數 DECK_THEME 或 content.js 的 meta.theme 套用；不指定＝pptx-kit.mjs 的原版色票。
// 每個主題有 light／dark 兩份色票（覆寫 pptx-kit 的 C）與 darkTypes（哪些版型用深色頁；單頁可用 mode:'dark'／'light' 覆寫）。
// HTML 端對應檔：references/offline-build-template/styles/themes/<name>.css，兩邊色票要一起改。
//
// 色票來源：白袍人生學院 CIS（2026-05 現行版）。七色之外的值都是「色票色疊在底色上的實色換算」，註明在行尾。
// amber／teal／coral／green 是上游的四個語意槽，這裡放「可當文字」的顏色；*Fill 給色塊與線條用（淺底不寫金色字）。
const CIS = { navy: '1A3D63', ink: '0E2A45', sky: '5E8CB5', gold: 'E0A235', coat: 'FBF9F3', graphite: '2E343A', cloud: 'E9E7E0' };

const light = {            // 白袍白底：內文石墨灰、標題學院藍、金色只做短線與色條
  bg: CIS.coat, card: 'F3F1EA' /* 白袍白與雲灰的中間值 */, card2: CIS.cloud, line: 'D9D6CC',
  text: CIS.graphite, muted: '565D64', dim: '767B80', ink: CIS.ink, white: 'FFFFFF',
  amber: CIS.navy, teal: CIS.navy, coral: CIS.graphite, green: CIS.ink,
  amberFill: CIS.gold, tealFill: CIS.sky, coralFill: CIS.graphite, greenFill: CIS.navy,
  heading: CIS.navy, rule: CIS.gold, onFill: CIS.coat, rightBg: 'E6F0E9' /* 正解底：綠 12% */, qr: CIS.ink,
  ok: '2C7A4B', warn: 'B4452C', okFill: '2C7A4B', warnFill: 'B4452C',   // 判斷訊號色（色票外）：只用在注意／優點、迷思／實證、正解
};
const darkOn = (bg, card, card2, line, muted, dim) => ({   // 深藍底反白：金色點關鍵詞，晨曦藍做層次
  bg, card, card2, line, text: CIS.coat, muted, dim, ink: CIS.ink, white: 'FFFFFF',
  amber: CIS.gold, teal: 'A9C3DB' /* 晨曦藍 50% 淺階，深底小字才讀得到 */, coral: CIS.cloud, green: CIS.coat,
  amberFill: CIS.gold, tealFill: CIS.sky, coralFill: CIS.cloud, greenFill: '7FA6C9' /* 晨曦藍 75%，只做色塊與線條 */,
  heading: CIS.coat, rule: CIS.gold, onFill: CIS.ink, rightBg: card2, qr: CIS.ink,
  ok: '6FCF97', warn: 'E8846B', okFill: '6FCF97', warnFill: 'E8846B',
});
const onNavy = darkOn(CIS.navy, CIS.ink, '2A5077', '3C6590', 'D3D7D9', 'A1AEB9');   // 學院藍底
const onInk = darkOn(CIS.ink, CIS.navy, '294E75', '3A6189', 'C7CBCD', '909CA5');    // 沉靜藍底

const DARK_TYPES = ['title', 'section', 'ask', 'question', 'cat', 'end'];

export const THEMES = {
  // 白袍人生學院名義：白袍白 60／學院藍 30／曙光金 10
  whitecoat: { label: '白袍人生學院 CIS', light, dark: onNavy, darkTypes: DARK_TYPES },
  // 張益豪醫師個人名義：全份沉靜藍底＋曙光金
  drhao: { label: '張益豪醫師個人名義（深藍金）', light: onInk, dark: onInk, darkTypes: DARK_TYPES },
};

export function getTheme(name) {
  if (!name) return null;
  if (!THEMES[name]) { console.error(`沒有主題 ${name}（可用：${Object.keys(THEMES).join('、')}）`); process.exit(2); }
  return THEMES[name];
}
