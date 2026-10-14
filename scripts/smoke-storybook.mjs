// 冒煙測試：逐一打開文件網站（Storybook 靜態建置）的每一頁，確認有畫出內容、沒有頁面錯誤。
//
// 用法：npm run build-storybook && node scripts/smoke-storybook.mjs [storybook-static 目錄]
// 自己起一個只綁 127.0.0.1、port 由系統分配的靜態伺服器，跑完就關。
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
};

function serve(dir) {
  const server = createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    let file = path.join(dir, decodeURIComponent(url.pathname));
    if (!file.startsWith(dir)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, 'index.html');
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
export async function smokeStorybook(dir, { timeout = 15000 } = {}) {
  const root = path.resolve(dir);
  const index = JSON.parse(readFileSync(path.join(root, 'index.json'), 'utf8'));
  const entries = Object.values(index.entries);
  if (entries.length === 0) return { visited: 0, failures: [`index.json 裡有 0 頁，文件網站沒有內容`] };

  const server = await serve(root);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const failures = [];
  let visited = 0;
  try {
    const page = await browser.newPage();
    for (const entry of entries) {
      const errors = [];
      const onError = (e) => errors.push(e.message);
      const onConsole = (msg) => {
        if (msg.type() === 'error') errors.push(msg.text());
      };
      page.on('pageerror', onError);
      page.on('console', onConsole);
      const docs = entry.type === 'docs';
      const target = docs ? '#storybook-docs .sbdocs' : '#storybook-root > *';
      try {
        await page.goto(`${base}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=${docs ? 'docs' : 'story'}`);
        await page.waitForSelector(target, { state: 'attached', timeout });
        // 給元件一點時間跑完初始化（延遲丟出的錯誤也要抓到）
        await page.waitForTimeout(150);
      } catch (e) {
        errors.push(`沒有畫出內容（等不到 ${target}）`);
      }
      page.off('pageerror', onError);
      page.off('console', onConsole);
      visited++;
      if (errors.length) failures.push(`${entry.id}：${[...new Set(errors)].join('；')}`);
    }
  } finally {
    await browser.close();
    server.close();
  }
  return { visited, failures };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'storybook-static');
  const { visited, failures } = await smokeStorybook(dir);
  if (failures.length) {
    console.error(`冒煙測試失敗（${failures.length} / ${visited} 頁）：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`冒煙測試通過：${visited} 頁都畫出內容、沒有錯誤`);
}
