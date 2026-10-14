// 冒煙測試腳本本身的測試（需要瀏覽器，所以不放進 `npm run test:scripts`；CI 的 smoke job 會跑）。
// 用法：node --test scripts/smoke-storybook.browser.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { smokeStorybook } from './smoke-storybook.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'smoke');

test('每頁都畫出內容、沒有錯誤 → 通過', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'ok'));
  assert.equal(result.visited, 2);
  assert.deepEqual(result.failures, []);
});

test('有一頁丟錯 → 失敗並指出哪一頁', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'bad'), { timeout: 3000 });
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /demo--bad/);
});

test('一頁都沒有 → 失敗', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'empty'));
  assert.equal(result.visited, 0);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /0 頁/);
});
