#!/usr/bin/env node
/**
 * Regenerates public/og-image.jpg (1200×630 social card) and public/favicon.ico
 * from the brand font and public/favicon.svg.   node tools/generate-brand-assets.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';

const ROOT = path.resolve(import.meta.dirname, '..');
const pub = (f) => path.join(ROOT, 'public', f);
const font = (w) =>
  `data:font/woff2;base64,${fs.readFileSync(pub(`fonts/neue-haas-grotesk-display-${w}.woff2`)).toString('base64')}`;

const ogHtml = `<!doctype html><html><head><style>
@font-face{font-family:NHG;src:url(${font(400)});font-weight:400}
@font-face{font-family:NHG;src:url(${font(500)});font-weight:500}
@font-face{font-family:NHG;src:url(${font(700)});font-weight:700}
*{margin:0;box-sizing:border-box}
body{width:1200px;height:630px;background:#f4f6fb;font-family:NHG;padding:24px}
.card{position:relative;height:100%;border-radius:40px;background:#0a0a0a;color:#f4f6fb;padding:64px 72px;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between}
.card:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,#ffffff1f,#0000 60%),radial-gradient(circle at 75% 70%,#ffc8b41a,#0000 60%)}
.eyebrow{position:relative;display:flex;gap:10px;align-items:center;font-size:18px;letter-spacing:.18em;text-transform:uppercase;color:#f4f6fbb3}
.dot{width:8px;height:8px;border-radius:50%;background:#f4f6fbcc}
h1{position:relative;font-weight:500;font-size:76px;line-height:1.02;letter-spacing:-.025em;max-width:820px}
.word{position:relative;font-weight:700;font-size:180px;line-height:.8;letter-spacing:-.025em}
.word span{color:#f4f6fb66}
</style></head><body><div class="card">
<div class="eyebrow"><span class="dot"></span>Digital Design &amp; Development</div>
<h1>Marketing sites, web apps &amp; brand systems</h1>
<div class="word">ZYPHER<span>®</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(ogHtml, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: pub('og-image.jpg'), type: 'jpeg', quality: 88 });

// favicon.ico = ICO container with 32×32 and 16×16 PNGs rendered from favicon.svg
const svg = fs.readFileSync(pub('favicon.svg'), 'utf8');
const pngs = [];
for (const size of [32, 16]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(
    `<style>*{margin:0}html,body{background:transparent}</style><img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}">`,
  );
  pngs.push({ size, data: await page.screenshot({ omitBackground: true }) });
}
await browser.close();

const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach(({ size, data }, i) => {
  const e = 6 + i * 16;
  header.writeUInt8(size, e);
  header.writeUInt8(size, e + 1);
  header.writeUInt16LE(1, e + 4);
  header.writeUInt16LE(32, e + 6);
  header.writeUInt32LE(data.length, e + 8);
  header.writeUInt32LE(offset, e + 12);
  offset += data.length;
});
fs.writeFileSync(pub('favicon.ico'), Buffer.concat([header, ...pngs.map((p) => p.data)]));
console.warn('Wrote public/og-image.jpg and public/favicon.ico');
