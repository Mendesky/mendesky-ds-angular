// 冒煙測試：逐一打開文件網站（Storybook 靜態建置）的每一頁，確認有畫出內容、沒有頁面錯誤。
// 說明頁另外檢查：本體文字的 #元件id 都換成了 Angular selector（程式碼區塊裡的 #name 是範本變數，不算）。
//
// 用法：npm run build-storybook && node scripts/smoke-storybook.mjs [storybook-static 目錄]
// 自己起一個只綁 127.0.0.1、port 由系統分配的靜態伺服器，跑完就關。
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from '@playwright/test';
import { findRefs } from '@mendesky/ds/scripts/component-refs.mjs';
import { exportDocs } from './export-docs.mjs';

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

/** 說明頁裡、程式碼區塊以外的每一段文字 */
function docsTexts() {
  const root = document.querySelector('#storybook-docs');
  if (!root) return [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.parentElement?.closest('pre, code') ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode.textContent);
  return texts;
}

/**
 * 逐頁檢查；回傳 { visited, failures }。
 * refIds：Angular 有的元件 id；有給就檢查說明頁沒有留下這些 #元件id。給空陣列算失敗（拿不到 id 不等於沒有殘留）。
 */
export async function smokeStorybook(dir, { timeout = 15000, refIds } = {}) {
  const root = path.resolve(dir);
  const index = JSON.parse(readFileSync(path.join(root, 'index.json'), 'utf8'));
  const entries = Object.values(index.entries);
  if (entries.length === 0) return { visited: 0, failures: [`index.json 裡有 0 頁，文件網站沒有內容`] };
  if (refIds && refIds.length === 0) return { visited: 0, failures: ['沒有拿到任何元件 id，無法檢查說明頁的 #元件id'] };
  const known = new Set(refIds ?? []);

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
      let rendered = false;
      try {
        await page.goto(`${base}/iframe.html?id=${encodeURIComponent(entry.id)}&viewMode=${docs ? 'docs' : 'story'}`);
        await page.waitForSelector(target, { state: 'attached', timeout });
        // 給元件一點時間跑完初始化（延遲丟出的錯誤也要抓到）
        await page.waitForTimeout(150);
        rendered = true;
      } catch (e) {
        errors.push(`沒有畫出內容（等不到 ${target}）`);
      }
      if (rendered && docs && known.size) {
        try {
          const left = (await page.evaluate(docsTexts)).flatMap((t) => findRefs(t)).filter((id) => known.has(id));
          if (left.length) errors.push(`說明頁有沒換掉的元件代號：${[...new Set(left)].map((id) => '#' + id).join('、')}`);
        } catch (e) {
          errors.push(`檢查元件代號時出錯：${e.message}`);
        }
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
  const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = process.argv[2] ?? path.join(repo, 'storybook-static');
  const refIds = (await exportDocs(repo)).components.map((c) => c.doc.id);
  const { visited, failures } = await smokeStorybook(dir, { refIds });
  if (failures.length) {
    console.error(`冒煙測試失敗（${failures.length} / ${visited} 頁）：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`冒煙測試通過：${visited} 頁都畫出內容、沒有錯誤`);
}
