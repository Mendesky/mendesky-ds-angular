import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDocs } from './check-docs.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'check-docs');
// 本體規格的 id 由參數傳入（fixture 沒有安裝本體套件）；預設只有 demo
const run = (name, options = {}) => checkDocs(path.join(fixtures, name), { internal: [], specIds: new Set(['demo']), ...options });

test('說明屬性與程式碼一致 → 通過', () => {
  const result = run('ok');
  assert.equal(result.checked, 1);
  assert.deepEqual(result.errors, []);
});

test('程式碼有、說明沒有 → 失敗，訊息含元件名與屬性名', () => {
  const { errors } = run('code-only');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /app-demo/);
  assert.match(errors[0], /foo/);
});

test('說明有、程式碼沒有 → 失敗', () => {
  const { errors } = run('docs-only');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /app-demo/);
  assert.match(errors[0], /bar/);
});

test('公開元件沒有說明檔 → 失敗', () => {
  const { errors } = run('missing-docs', { specIds: new Set() });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /demo\.component\.ts/);
});

test('內部子元件沒有說明檔 → 通過', () => {
  const { errors } = run('internal-no-docs', { internal: ['demo-panel'], specIds: new Set() });
  assert.deepEqual(errors, []);
});

test('一個元件都沒掃到 → 失敗（防空集合假綠）', () => {
  const { errors, checked } = run('empty', { specIds: new Set() });
  assert.equal(checked, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /0 個/);
});

test('說明檔語法錯誤 → 失敗，不得略過', () => {
  const { errors } = run('syntax-error', { specIds: new Set() });
  assert.equal(errors.length, 1);
  assert.match(errors[0], /demo\.docs\.ts/);
});

test('Angular 各種屬性與事件寫法都認得', () => {
  const result = run('syntaxes');
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 1);
});

// ── 與本體元件規格的分工 ───────────────────────────────────

test('說明檔放了規格欄位（when、notes）→ 失敗，應該放在本體', () => {
  const { errors } = run('spec-fields-in-docs');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /when, notes/);
});

test('說明的 id 在本體沒有規格 → 失敗', () => {
  const { errors } = run('ok', { specIds: new Set(['other']) });
  assert.match(errors.join('\n'), /本體沒有對應元件規格的說明：demo/);
  assert.match(errors.join('\n'), /本體有元件規格、但 Angular 沒有說明：other/);
});
