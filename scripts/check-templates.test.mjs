import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkTemplates, listDeclarations } from './check-templates.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixtures = path.join(here, '__fixtures__', 'check-templates');
const repo = path.join(here, '..');
const run = (name) => checkTemplates(path.join(fixtures, name));
const text = (result) => result.problems.join('\n');

test('template 都正確 → 通過，數量是元件與指令的檔案數', async () => {
  const result = await run('ok');
  assert.deepEqual(result.problems, []);
  assert.equal(result.ok, true);
  assert.equal(result.checked, 2);
});

test('template 用了不存在的屬性 → 失敗，訊息含 html 檔名與屬性名', async () => {
  const result = await run('template-error');
  assert.equal(result.ok, false);
  assert.match(text(result), /demo\.component\.html/);
  assert.match(text(result), /missingProperty/);
});

test('數字傳給字串 input（只有嚴格模式抓得到）→ 失敗', async () => {
  const result = await run('strict-input');
  assert.equal(result.ok, false);
  assert.match(text(result), /TS2322/);
});

test('嚴格選項被關掉 → 失敗，不得當成通過', async () => {
  const result = await run('loosened');
  assert.equal(result.ok, false);
  assert.match(text(result), /放寬/);
  assert.match(text(result), /strictTemplates/);
});

test('有元件沒被納入檢查 → 失敗，列出該檔', async () => {
  const result = await run('not-covered');
  assert.equal(result.ok, false);
  assert.match(text(result), /other\.component\.ts/);
});

test('src 找不到任何元件 → 失敗（防空集合假綠）', async () => {
  const result = await run('no-declarations');
  assert.equal(result.ok, false);
  assert.match(text(result), /找不到任何元件/);
});

test('本 repo：全部元件與指令都通過', async () => {
  const result = await checkTemplates(repo);
  assert.deepEqual(result.problems, []);
  const expected = listDeclarations(path.join(repo, 'src')).length;
  assert.ok(expected > 50, `元件與指令只有 ${expected} 個，listDeclarations 可能壞了`);
  assert.equal(result.checked, expected);
});
