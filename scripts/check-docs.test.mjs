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

// ── 預設值與範例綁定 ───────────────────────────────────────

test('說明寫的預設值跟程式的初值不同 → 失敗，列出屬性與兩邊的值', () => {
  const { errors } = run('wrong-default');
  assert.equal(errors.length, 2);
  assert.match(errors[0], /app-demo/);
  assert.match(errors[0], /size：說明 'L'、程式 'M'/);
  assert.match(errors[0], /on：說明 true、程式 false/);
  // 一致的（含 signal input）與不是字面值的說明不列
  assert.doesNotMatch(errors[0], /label|count|tone/);
});

test('範例網站屬性表標的預設值跟程式不同 → 失敗；引號寫法不同不算', () => {
  const { errors } = run('wrong-default');
  const story = errors.find((e) => e.includes('demo.stories.ts'));
  assert.ok(story, errors.join('\n'));
  assert.match(story, /屬性表標的預設值跟程式不同：size：屬性表 L、程式 'M'/);
  // on（false）、label（'' 與 ''）、count（3）都一致
  assert.doesNotMatch(story, /on：|label：|count：/);
});

test('範例綁了元件沒有的屬性 → 失敗；元件屬性、指令屬性、class／ngClass 綁定不算', () => {
  const { errors } = run('unknown-binding');
  assert.equal(errors.length, 2);
  const all = errors.join('\n');
  assert.match(all, /demo\.stories\.ts：<app-demo> 綁了元件沒有的屬性 \[bogus\]/);
  assert.match(all, /demo\.docs\.ts（用法「寫錯的屬性」）：<app-demo> 綁了元件沒有的屬性 \[ghost\]/);
  assert.doesNotMatch(all, /\[(text|appDemoTip|ngClass|class)\]/);
});

test('預設值一筆都沒比對到（檢查本身失效）→ 失敗，不得當成通過', () => {
  const { errors } = run('defaults-unreadable');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /預設值一筆都沒比對到/);
});

test('範例裡的 <app-xxx> 一個都認不出來（檢查本身失效）→ 失敗，不得當成通過', () => {
  const { errors } = run('bindings-unreadable');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /一個都認不出來/);
});
