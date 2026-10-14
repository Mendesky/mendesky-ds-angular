// 指南冒煙測試腳本本身的測試（需要瀏覽器，CI 的 smoke job 會跑）。
// 用法：node --test scripts/smoke-guides.browser.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { smokeGuides } from './smoke-guides.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'smoke-guides');

test('每頁都畫出內容、沒有錯誤 → 通過；components 與 404 不檢查', async () => {
  const result = await smokeGuides(path.join(fixtures, 'ok'), '/main/');
  assert.equal(result.visited, 2);
  assert.deepEqual(result.failures, []);
});

test('頁面有「找不到」的資料元件或丟錯 → 失敗並指出哪一頁', async () => {
  const result = await smokeGuides(path.join(fixtures, 'bad'), '/main/', { timeout: 3000 });
  assert.equal(result.failures.length, 2);
  assert.match(result.failures.join('\n'), /guide\/missing/);
  assert.match(result.failures.join('\n'), /guide\/throws/);
});

test('一頁都沒有 → 失敗', async () => {
  const result = await smokeGuides(path.join(fixtures, 'empty'), '/main/');
  assert.equal(result.visited, 0);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /0 頁/);
});
