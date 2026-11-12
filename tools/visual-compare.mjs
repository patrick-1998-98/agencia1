#!/usr/bin/env node
/**
 * Visual regression against the reference captures in reference/screenshots.
 *
 *   node tools/visual-compare.mjs [baseUrl] [path,path,...] [--viewport=desktop|mobile]
 *
 * For every page × viewport it saves to compare/<slug>.<viewport>/:
 *   new.png   full-page capture of the local build
 *   diff.png  pixelmatch diff (red = different)
 *   side.png  reference | new, side by side (cropped to the shorter height)
 * and prints the mismatch ratio, height delta and any console/CSP errors.
 */
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from '@playwright/test';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const args = process.argv.slice(2);
const flags = Object.fromEntries(
  args.filter((a) => a.startsWith('--')).map((a) => a.slice(2).split('=')),
);
const [baseUrl = 'http://localhost:4321', only] = args.filter((a) => !a.startsWith('--'));

const ROOT = path.resolve(import.meta.dirname, '..');
const REF = path.join(ROOT, 'reference', 'screenshots');
const OUT = path.join(ROOT, 'compare');

const VIEWPORTS = {
  desktop: { width: 1440, height: 900, isMobile: false },
  mobile: { width: 390, height: 844, isMobile: true },
};

const slug = (p) => (p === '/' ? 'home' : p.replace(/^\//, '').replace(/\//g, '__'));
const unslug = (s) => (s === 'home' ? '/' : `/${s.replace(/__/g, '/')}`);

const pages = only
  ? only.split(',')
  : [...new Set(fs.readdirSync(REF).map((f) => unslug(f.split('.')[0])))];

const viewports = flags.viewport ? [flags.viewport] : Object.keys(VIEWPORTS);

function crop(png, width, height) {
  const out = new PNG({ width, height });
  PNG.bitblt(png, out, 0, 0, Math.min(width, png.width), Math.min(height, png.height), 0, 0);
  return out;
}

const browser = await chromium.launch();
const results = [];

for (const pagePath of pages) {
  for (const vpName of viewports) {
    const refFile = path.join(REF, `${slug(pagePath)}.${vpName}.png`);
    if (!fs.existsSync(refFile)) continue;
    const vp = VIEWPORTS[vpName];
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    const page = await context.newPage();
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(e.message));

    await page.goto(baseUrl + pagePath, { waitUntil: 'networkidle', timeout: 90_000 });
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo(0, y);
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 400));
    });
    await page.waitForTimeout(1500);
    await page.evaluate(() =>
      document.querySelectorAll('video').forEach((v) => {
        v.pause();
        v.currentTime = 0;
      }),
    );

    const dir = path.join(OUT, `${slug(pagePath)}.${vpName}`);
    fs.mkdirSync(dir, { recursive: true });
    const newFile = path.join(dir, 'new.png');
    await page.screenshot({ path: newFile, fullPage: true, animations: 'disabled' });
    await context.close();

    const ref = PNG.sync.read(fs.readFileSync(refFile));
    const cur = PNG.sync.read(fs.readFileSync(newFile));
    const width = Math.min(ref.width, cur.width);
    const height = Math.min(ref.height, cur.height);
    const a = crop(ref, width, height);
    const b = crop(cur, width, height);
    const diff = new PNG({ width, height });
    const mismatched = pixelmatch(a.data, b.data, diff.data, width, height, { threshold: 0.15 });
    fs.writeFileSync(path.join(dir, 'diff.png'), PNG.sync.write(diff));

    const side = new PNG({ width: width * 2 + 16, height });
    side.data.fill(255);
    PNG.bitblt(a, side, 0, 0, width, height, 0, 0);
    PNG.bitblt(b, side, 0, 0, width, height, width + 16, 0);
    fs.writeFileSync(path.join(dir, 'side.png'), PNG.sync.write(side));

    const result = {
      page: pagePath,
      viewport: vpName,
      mismatch: `${((mismatched / (width * height)) * 100).toFixed(2)}%`,
      refSize: `${ref.width}x${ref.height}`,
      newSize: `${cur.width}x${cur.height}`,
      errors: errors.length ? errors : undefined,
    };
    results.push(result);
    console.log(JSON.stringify(result));
  }
}

await browser.close();
fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
