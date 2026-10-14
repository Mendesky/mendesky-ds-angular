// 指南冒煙測試：逐一打開建好的指南網站（VitePress）每一頁，確認畫出內容、沒有頁面錯誤、
// 也沒有「找不到元件說明／互動原則」的資料元件（代表文章引用了不存在的 id）。
//
// 用法：npm run site:build（或 scripts/build-site.sh main）之後
//       node scripts/smoke-guides.mjs <網站目錄，預設 site/.vitepress/dist> <網站 base，預設 /main/>
// components/（元件頁）與 404.html 不在這裡檢查；元件頁由 smoke-storybook.mjs 負責。
import { createServer } from 'node:http';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};

function listPages(dir, rel = '') {
  const out = [];
  for (const name of readdirSync(path.join(dir, rel))) {
    const r = path.posix.join(rel, name);
    if (r === 'components' || r === 'assets' || r === '404.html') continue;
    if (statSync(path.join(dir, r)).isDirectory()) out.push(...listPages(dir, r));
    else if (name.endsWith('.html')) out.push(r);
  }
  return out.sort();
}

function serve(dir, base) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!url.pathname.startsWith(base)) {
      res.writeHead(404).end();
      return;
    }
    let file = path.join(dir, decodeURIComponent(url.pathname.slice(base.length)));
    if (!file.startsWith(dir)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
    if (!existsSync(file) && existsSync(`${file}.html`)) file = `${file}.html`;
    if (!existsSync(file)) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
    res.end(readFileSync(file));
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve(server)));
}

/** 逐頁檢查；回傳 { visited, failures } */
export async function smokeGuides(dir, base = '/main/', { timeout = 15000 } = {}) {
  const root = path.resolve(dir);
  const pages = listPages(root);
  if (pages.length === 0) return { visited: 0, failures: [`${root} 裡有 0 頁指南，網站沒有內容`] };

  const server = await serve(root, base);
  const origin = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const failures = [];
  let visited = 0;
  try {
    const page = await browser.newPage();
    for (const rel of pages) {
      const errors = [];
      const onError = (e) => errors.push(e.message);
      const onConsole = (msg) => {
        // 外部字型或網路資源載入失敗不算頁面錯誤（CI 可能沒有網路）
        if (msg.type() === 'error' && !/Failed to load resource|net::ERR_/.test(msg.text())) errors.push(msg.text());
      };
      page.on('pageerror', onError);
      page.on('console', onConsole);
      try {
        await page.goto(`${origin}${base}${rel}`);
        await page.waitForSelector('.VPContent', { state: 'attached', timeout });
        await page.waitForTimeout(150);
        const missing = await page.locator('.ds-missing').allTextContents();
        for (const m of missing) errors.push(`資料元件找不到對象：${m.trim()}`);
      } catch (e) {
        errors.push(`沒有畫出內容（等不到 .VPContent）`);
      }
      page.off('pageerror', onError);
      page.off('console', onConsole);
      visited++;
      if (errors.length) failures.push(`${rel}：${[...new Set(errors)].join('；')}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { visited, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const dir = process.argv[2] ?? path.join(here, '..', 'site', '.vitepress', 'dist');
  const base = process.argv[3] ?? '/main/';
  const { visited, failures } = await smokeGuides(dir, base);
  if (failures.length) {
    console.error(`指南冒煙測試失敗（${failures.length} / ${visited} 頁）：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`指南冒煙測試通過：${visited} 頁都畫出內容、沒有錯誤`);
}
