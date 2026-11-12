// 產生單一離線 HTML：reveal.js、圖片、QR code 全部內嵌
const fs = require('fs');
const path = require('path');
const QR = require('qrcode');
const { slides, tools = {}, cats = [], meta = {} } = require('./content.js');
const out = path.resolve(process.argv[2] || path.join(__dirname, 'dist'));

// 主題：content.js 的 meta.theme（或環境變數 DECK_THEME）。不填＝原版深藍綠。主題檔 styles/themes/<name>.css，登記在 styles/themes/themes.json。
const themeName = process.env.DECK_THEME || meta.theme || '';
const THEMES = JSON.parse(fs.readFileSync(path.join(__dirname, 'styles/themes/themes.json'), 'utf8'));
if (themeName && (!THEMES[themeName] || themeName.startsWith('_'))) throw new Error(`沒有主題 ${themeName}（可用：${Object.keys(THEMES).filter((k) => !k.startsWith('_')).join('、')}）`);
const THEME = themeName ? THEMES[themeName] : { qr: '#0B1F2A', dark: [] };

// 主題字型內嵌：只取簡報實際用到的字，轉成 woff2 寫進單檔，換電腦播放字體才不會跑掉。
// 字型檔依 themes.json 的 fonts[].files 找；找不到檔或沒裝 subset-font 就略過（退回系統字）。DECK_FONTS=0 可關閉。
async function fontCss(markup) {
  const fonts = THEME.fonts || [];
  if (!fonts.length || process.env.DECK_FONTS === '0') return '';
  let subsetFont;
  try { subsetFont = require('subset-font'); } catch { console.warn('字型未內嵌：沒有安裝 subset-font（npm ci 後再 build）'); return ''; }
  const dirs = [process.env.DECK_FONT_DIR, path.join(__dirname, 'fonts'), path.join(__dirname, '..', '_fonts'), path.join(__dirname, '..', 'fonts')].filter(Boolean);
  // HTML 實體先解碼再取字（&hellip;、&ldquo; 這類也要進子集）；不認得的實體當空白
  const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’',
    middot: '·', bull: '•', times: '×', divide: '÷', plusmn: '±', deg: '°', le: '≤', ge: '≥', ne: '≠', rarr: '→', larr: '←', uarr: '↑', darr: '↓', copy: '©', reg: '®', trade: '™' };
  const decode = (t) => t.replace(/&(#x[0-9a-f]+|#[0-9]+|[a-z]+);/gi, (m, e) => {
    if (e[0] !== '#') return ENT[e.toLowerCase()] ?? ' ';
    const code = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
    return code > 0 && code <= 0x10FFFF ? String.fromCodePoint(code) : ' ';
  });
  const visible = decode(markup.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<[^>]+>/g, ''));
  const ascii = Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)).join('');
  const text = [...new Set(visible + ascii + '，。、；：？！「」『』（）｜—…％→↓①②③④⑤⑥・／＋')].join('');
  const faces = [], missing = [];
  for (const f of fonts) {
    const file = dirs.flatMap((d) => f.files.map((n) => path.join(d, n))).find((p) => fs.existsSync(p));
    if (!file) { missing.push(`${f.family} ${f.weight}`); continue; }
    const woff2 = await subsetFont(fs.readFileSync(file), text, { targetFormat: 'woff2' });
    faces.push(`@font-face{font-family:'${f.family}';font-weight:${f.weight};font-style:normal;font-display:block;src:url(data:font/woff2;base64,${woff2.toString('base64')}) format('woff2');}`);
  }
  if (missing.length) console.warn(`字型未內嵌（找不到檔，搜尋 ${dirs.join('、')}）：${missing.join('、')}`);
  if (faces.length) console.log(`內嵌字型 ${faces.length} 個，共 ${Math.round(faces.join('').length / 1024)} KB（${[...text].length} 個字）`);
  return faces.length ? `\n<style>/* embedded fonts */\n${faces.join('\n')}</style>` : '';
}

const rv = (p) => fs.readFileSync(path.join(__dirname, 'node_modules/reveal.js', p), 'utf8');
const img = (name) => {
  for (const dir of ['shots', 'assets']) for (const ext of ['jpg', 'png']) {
    const f = path.join(__dirname, dir, `${name}.${ext}`);
    if (fs.existsSync(f)) return `data:image/${ext === 'jpg' ? 'jpeg' : 'png'};base64,${fs.readFileSync(f).toString('base64')}`;
  }
  return null;
};
// 沒有該圖片就不輸出背景屬性（新專案先不放 assets 也能 build）
const bgAttr = (name, opacity) => { const src = img(name); return src ? `data-background-image="${src}" data-background-size="cover" data-background-opacity="${opacity}"` : ''; };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// 注意：content.js 的文字欄位視為可信 HTML（可寫 <b>、<br>）；只有網址與標籤經 esc()。不要把不可信的外部文字直接貼進 content.js。
const host = (u) => u.replace(/^https?:\/\//, '').replace(/\/$/, '');
const COLORS = ['teal', 'teal', 'amber', 'coral', 'green', 'teal', 'amber'];
const HEX = { teal: '#3FC1B7', amber: '#F2B84B', coral: '#E8846B', green: '#6FCF97' };
const CIRC = ['', '①', '②', '③', '④', '⑤', '⑥'];

async function qr(url) {
  const svg = await QR.toString(url, { type: 'svg', margin: 1, errorCorrectionLevel: 'M', color: { dark: THEME.qr || '#0B1F2A', light: '#FFFFFF' } });
  return svg.replace('<svg ', '<svg class="qrsvg" ');
}
const qrCard = async (url, label, size = 'm') =>
  `<div class="qrcard ${size}" data-url="${esc(url)}">${await qr(url)}<div class="qrl">${esc(label || host(url))}</div></div>`;

const dots = `<span class="dot" style="background:#E8846B"></span><span class="dot" style="background:#F2B84B"></span><span class="dot" style="background:#6FCF97"></span>&nbsp; `;
const mock = (src, url) => !src ? '' : `<div class="mock" style="background:#fff;"><div class="top">${dots}${esc(url)}</div><img src="${src}" alt="${esc(url)}" style="display:block;width:100%;height:auto;margin:0;" /></div>`;
const notes = (n) => (n ? `<aside class="notes">${n}</aside>` : '');

let part = '';
const R = {
  async title(s) {
    const veil = img('bg-cover') || !themeName ? 'var(--veil, rgba(11,31,42,0.66))' : 'transparent';  // 主題模式且沒有封面底圖時不畫暗色罩
    return `<section ${bgAttr('bg-cover', 0.9)}>
      <div style="padding:30px 38px; max-width:${themeName ? 980 : 820}px; background:${veil}; border-radius:18px;">
        <div class="chip amber">${s.kicker}</div>
        <h1>${s.title}</h1>
        <p class="lead" style="font-size:0.8em;">${s.sub}</p>
        <p style="font-size:0.6em;color:var(--teal);font-weight:700;margin-top:1.4em;">${s.who}</p>
      </div>${notes(s.notes)}</section>`;
  },
  async about(s) {
    return `<section><div class="chip">開場</div><h2>${s.title}</h2>
      <div class="grid" style="grid-template-columns:1fr 1fr 250px;align-items:center;">
        <div class="card bar amber"><div class="t" style="color:var(--amber)">臨床</div><ul>${s.lines.map((l) => `<li>${l}</li>`).join('')}</ul></div>
        <div class="card bar"><div class="t" style="color:var(--teal)">教學與工具</div><ul>${s.side.map((l) => `<li>${l}</li>`).join('')}</ul></div>
        ${await qrCard(s.qr, s.qrLabel)}
      </div>${notes(s.notes)}</section>`;
  },
  async question(s) {
    return `<section><div class="chip amber">先想一個問題</div><p class="big" style="font-size:1.45em;line-height:1.5;">${s.q}</p>${notes(s.notes)}</section>`;
  },
  async three(s) {
    const cs = ['amber', 'teal', 'green'];
    return `<section><div class="chip">${part || '開場'}</div><h2>${s.title}</h2>
      <div class="grid g3">${s.items.map((it, i) => `<div class="card center ${cs[i]}"><span class="k">${it.h}</span><div class="d">${it.p}</div><div class="pill ${cs[i]}">${it.tag}</div></div>`).join('')}</div>
      ${s.foot ? `<div class="note">${s.foot}</div>` : ''}${notes(s.notes)}</section>`;
  },
  async section(s) {
    part = `${s.num} ${s.title}`;
    const bg = s.bg || null;  // content.js 指定底圖名稱（assets/<bg>.jpg），沒有就純色
    return `<section class="chapter" ${bg ? bgAttr(bg, 0.95) : ''}>
      <div style="padding-left:30px;"><div class="num">${s.num}</div><h1>${s.title}</h1><p class="sub">${s.sub}</p></div>${notes(s.notes)}</section>`;
  },
  async agents(s) {
    const cs = ['amber', 'teal'];
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="grid g2">${s.cols.map((c, i) => `<div class="card bar ${cs[i]}"><div class="t" style="color:var(--${cs[i]})">${c.h}</div>
        <div class="tags">${c.items.map((x) => `<span class="tagx">${x}</span>`).join('')}</div><div class="d" style="margin-top:12px">${c.p}</div></div>`).join('')}</div>
      <div class="note">${s.foot}</div>${notes(s.notes)}</section>`;
  },
  async flow(s) {
    const cs = ['amber', 'amber', 'amber', 'teal', 'teal', 'green'];
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="flow6">${s.steps.map((st, i) => `${i ? '<div class="arrow">→</div>' : ''}<div class="card center ${cs[i]}"><span class="n">${i + 1}</span><div class="t">${st.h}</div><div class="d">${st.p}</div></div>`).join('')}</div>
      ${s.brace ? `<div class="brace"><span class="amber">${s.brace[0]}</span><span class="teal">${s.brace[1]}</span></div>` : ''}
      <div class="note">${s.foot}</div>${notes(s.notes)}</section>`;
  },
  async ladder(s) {
    const cs = ['coral', 'amber', 'teal', 'green'];
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="ladder">${s.steps.map((st, i) => `<div class="rung ${cs[i]}" style="margin-top:${(3 - i) * 44}px"><span class="lv">${st.lv}</span><div class="t">${st.h}</div><div class="d">${st.p}</div><div class="when">${st.when}</div></div>`).join('')}</div>
      ${notes(s.notes)}</section>`;
  },
  async prompt(s) {
    return `<section><div class="chip ${s.chip === '現場示範' ? 'amber' : ''}">${s.chip || part}</div><h2>${s.title}</h2>
      <div class="grid" style="grid-template-columns:1.55fr 1fr;align-items:start;">
        <div class="promptbox"><div class="pl">Prompt</div><pre>${esc(s.prompt)}</pre></div>
        <div class="card"><div class="t" style="color:var(--amber)">為什麼這樣寫</div><ul>${s.tips.map((t) => `<li>${t}</li>`).join('')}</ul></div>
      </div>${notes(s.notes)}</section>`;
  },
  async platform(s) {
    const src = s.shot && img(s.shot);
    return `<section><div class="chip">${part}</div><h2><span class="lvtag">${s.lv}</span>${s.title}</h2>
      <p class="lead">${s.sub}</p>
      <div class="grid" style="grid-template-columns:1fr 1.15fr;align-items:start;">
        <div><div class="card bar green ok" style="margin-bottom:14px"><div class="t" style="color:var(--ok, var(--green))">優點</div><ul>${s.pros.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        <div class="card bar coral warn"><div class="t" style="color:var(--warn, var(--coral))">注意</div><ul>${s.cons.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        ${s.example ? `<div class="note" style="display:flex;gap:16px;align-items:center;margin-top:14px"><div style="flex:1"><b>${s.example.name}</b><br>${s.example.p}</div>${await qrCard(s.example.url, host(s.example.url), 's')}</div>` : ''}</div>
        <div>${src ? mock(src, s.shotUrl) : ''}</div>
      </div>${notes(s.notes)}</section>`;
  },
  async terms(s) {
    const cs = ['amber', 'teal', 'coral', 'green'];
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="grid g4">${s.items.map((it, i) => `<div class="card center ${cs[i]}"><span class="k">${it.t}</span><div class="t">${it.z}</div><div class="d">${it.p}</div></div>`).join('')}</div>
      ${s.shot ? `<div class="short" style="margin-top:18px">${mock(img(s.shot), s.shotUrl || '')}</div>` : ''}
      ${notes(s.notes)}</section>`;
  },
  async fork(s) {
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="grid" style="grid-template-columns:1fr 260px;align-items:center;">
        <div><p class="big" style="font-size:0.85em">${s.p}</p>
        <div class="card"><div class="t" style="color:var(--teal)">可以改成</div><ul>${s.ideas.map((x) => `<li>${x}</li>`).join('')}</ul></div></div>
        ${await qrCard(s.qr, s.qrLabel)}
      </div>${notes(s.notes)}</section>`;
  },
  async steps(s) {
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <ol class="steps">${s.steps.map((st) => `<li><b>${st.h}</b><span>${st.p}</span></li>`).join('')}</ol>
      ${s.foot ? `<div class="note">${s.foot}</div>` : ''}${notes(s.notes)}</section>`;
  },
  async autodeploy(s) {
    const cs = ['amber', 'amber', 'teal', 'green'];
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="flow4">${s.steps.map((st, i) => `${i ? '<div class="arrow">→</div>' : ''}<div class="card center ${cs[i]}"><span class="k">${i + 1}</span><div class="t">${st}</div></div>`).join('')}</div>
      <p class="big" style="margin-top:1em;font-size:0.95em">${s.foot}</p>${notes(s.notes)}</section>`;
  },
  async domains(s) {
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="domains"><div class="root">${s.root}</div><div class="subs">${s.subs.map((x) => `<span>${x}<i>.${s.root}</i></span>`).join('')}</div></div>
      <div class="note">${s.foot}</div>${notes(s.notes)}</section>`;
  },
  async backend(s) {
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="grid g2">
        <div class="card bar teal"><div class="t" style="color:var(--teal)">不需要後端</div><ul>${s.no.map((x) => `<li>${x}</li>`).join('')}</ul></div>
        <div class="card bar green"><div class="t" style="color:var(--green)">需要後端</div><ul>${s.yes.map((x) => `<li>${x}</li>`).join('')}</ul></div>
      </div>${notes(s.notes)}</section>`;
  },
  async compare(s) {
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <table class="cmp"><thead><tr>${s.head.map((h, i) => `<th class="${['', 'green', 'teal', 'amber'][i]}">${h}</th>`).join('')}</tr></thead>
      <tbody>${s.rows.map((r) => `<tr>${r.map((c, i) => (i ? `<td>${c}</td>` : `<th>${c}</th>`)).join('')}</tr>`).join('')}</tbody></table>
      ${s.foot ? `<div class="note">${s.foot}</div>` : ''}${notes(s.notes)}</section>`;
  },
  async decision(s) {
    const q = (t) => `<div class="dq">${t}</div>`;
    const o = (c, lv, t) => `<div class="do ${c}"><b>${lv}</b> ${t}</div>`;
    const yes = (l) => `<div class="da">${l}　→</div>`;
    const down = (l) => `<div class="dd">↓ ${l}</div><div></div><div></div>`;
    const rows = (s.rows || []).map((r) => q(r.q) + yes(r.yes) + o(r.to.c, r.to.lv, r.to.t) + (r.down ? down(r.down) : '')).join('');
    const last = s.last ? o(s.last.c, s.last.lv, s.last.t) + '<div></div><div></div>' : '';
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2><div class="dgrid">${rows}${last}</div>${notes(s.notes)}</section>`;
  },
  async catoverview(s) {
    part = s.chip || '工具';
    return `<section ${s.bg ? bgAttr(s.bg, 0.35) : ''}>
      <div class="chip">${part}</div><h2>${s.title}</h2>
      <div class="grid g3">${cats.slice(1).map((c, i) => `<div class="card ${COLORS[i + 1]}"><span class="k">${CIRC[i + 1]} ${c.name}</span><div class="d">${c.pain}</div><div class="cnt">${c.keys.length} 個工具</div></div>`).join('')}</div>
      ${notes(s.notes)}</section>`;
  },
  async cat(s) {
    const c = cats[s.c], col = COLORS[s.c];
    return `<section class="chapter">
      <div style="padding-left:30px;"><div class="num" style="color:var(--${col})">${CIRC[s.c]}</div><h1>${c.name}</h1>
      <p class="sub">教學痛點：${c.pain}</p>
      <p class="tools" style="color:var(--${col})">${c.keys.map((k) => tools[k].name).join('・')}</p></div>${notes(s.notes)}</section>`;
  },
  async tool(s) {
    const t = tools[s.key], col = COLORS[t.cat], shot = img(s.key);
    return `<section><div class="chip" style="color:var(--${col})">${CIRC[t.cat]} ${cats[t.cat].name}</div><h2>${t.name}</h2>
      <div class="grid" style="grid-template-columns:1fr 270px;align-items:start;gap:34px;">
        <div><p class="lead" style="font-size:0.82em;color:var(--text);line-height:1.6">${t.one}</p>
          ${shot ? `<div class="toolshot">${mock(shot, host(t.url))}</div>` : ''}
          <div class="t" style="font-weight:700;font-size:0.6em;color:var(--${col});margin:1em 0 0.4em">教學用法</div>
          <ol class="steps sm c-${col}">${t.use.map((u) => `<li><b>${u}</b></li>`).join('')}</ol></div>
        ${await qrCard(t.url, host(t.url), 'l')}
      </div>${notes(s.notes)}</section>`;
  },
  async demosteps(s) {
    return `<section><div class="chip amber">現場示範</div><h2>${s.title}</h2>
      <div class="demo">${s.steps.map((st, i) => `<div class="card center"><div class="time">${st.t}</div><span class="k">${i + 1}. ${st.h}</span><div class="d">${st.p}</div></div>`).join('<div class="arrow">→</div>')}</div>
      <div class="note"><b>${s.foot}</b></div>${notes(s.notes)}</section>`;
  },
  async risk(s) {
    part = s.chip || part;
    const cs = ['coral', 'amber', 'teal'];
    return `<section><div class="chip">${part}</div><h2>${s.title}</h2>
      <ol class="steps">${s.items.map((it) => `<li><b>${it.h}</b><span>${it.p}</span></li>`).join('')}</ol>${notes(s.notes)}</section>`;
  },
  async resources(s) {
    return `<section><div class="chip">收尾</div><h2>${s.title}</h2>
      <div class="grid g4 res">${(await Promise.all(s.items.map(async (it) => `<div class="card center"><div class="t" style="color:var(--teal)">${it.h}</div>${await qrCard(it.url, it.label, 's')}</div>`))).join('')}</div>
      ${notes(s.notes)}</section>`;
  },
  async end(s) {
    return `<section ${bgAttr('bg-closing', 0.85)}>
      <div style="display:flex;align-items:center;gap:50px;padding-left:30px;">
        <div style="flex:1"><h1>${s.title}</h1><p class="lead" style="font-size:0.85em">${s.sub}</p>
        <p style="font-size:0.6em;color:var(--teal);font-weight:700;">${s.who || ''}</p></div>
        ${await qrCard(s.qr, s.qrLabel)}
      </div>${notes(s.notes)}</section>`;
  },
};

const EXTRA_CSS = fs.readFileSync(path.join(__dirname, 'styles/deck.css'), 'utf8');

(async () => {
  const refCss = fs.readFileSync(path.join(__dirname, 'styles/base.css'), 'utf8');
  const secs = [];
  for (const [i, s] of slides.entries()) {
    if (!R[s.type]) throw new Error('no renderer ' + s.type);
    let markup = await R[s.type](s);
    // 主題的深色頁：依版型（themes.json 的 dark）或單頁 mode:'dark'／'light' 決定
    const dark = s.mode ? s.mode === 'dark' : (THEME.dark || []).includes(s.type);
    if (themeName && dark) {
      const glow = THEME.darkGradient && !/^<section[^>]*data-background-image/.test(markup) ? ` data-background-gradient="${THEME.darkGradient}"` : '';  // 沒有底圖才畫「光」
      markup = markup.replace(/^<section/, `<section data-mode="dark" data-background-color="${THEME.darkBg}"${glow}`);
    }
    secs.push(`\n<!-- ${i + 1} ${s.type} -->\n` + markup.replace('<section', `<section data-slide-type="${esc(s.type)}"`));
  }
  const strip = (css) => css.replace(/@import[^;]+;/g, '');
  const fontStyle = await fontCss(secs.join('\n'));
  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${esc(meta.title || (slides[0] && slides[0].title) || 'Slides')}</title>
<style>${strip(rv('dist/reset.css'))}</style>
<style>${strip(rv('dist/reveal.css'))}</style>
<style>${strip(rv('dist/theme/night.css'))}</style>
<style>${refCss}${EXTRA_CSS}</style>${themeName ? `\n<style>/* theme: ${themeName} */\n${fs.readFileSync(path.join(__dirname, 'styles/themes', themeName + '.css'), 'utf8')}</style>` : ''}${fontStyle}
</head>
<body>
<div class="reveal"><div class="slides">${secs.join('\n')}
</div></div>
<script>${rv('dist/reveal.js')}</script>
<script>${rv('plugin/notes/notes.js')}</script>
<script>
Reveal.initialize({ width: 1280, height: 720, margin: 0.06, hash: true, transition: 'slide', backgroundTransition: 'fade',
  center: true, progress: true, controls: true, slideNumber: 'c/t', pdfSeparateFragments: false, plugins: [ RevealNotes ] });
</script>
</body></html>`;
  fs.mkdirSync(out, { recursive: true });
  fs.writeFileSync(path.join(out, 'index.html'), html);
  console.log('slides', slides.length, 'bytes', html.length, themeName ? 'theme ' + themeName : '');
})();
