import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkDocs } from './check-docs.mjs';

const fixtures = path.join(path.dirname(fileURLToPath(import.meta.url)), '__fixtures__', 'check-docs');
const run = (name, options = {}) => checkDocs(path.join(fixtures, name), { internal: [], ...options });

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
  const { errors } = run('missing-docs');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /demo\.component\.ts/);
});

test('內部子元件沒有說明檔 → 通過', () => {
  const { errors } = run('internal-no-docs', { internal: ['demo-panel'] });
  assert.deepEqual(errors, []);
});

test('一個元件都沒掃到 → 失敗（防空集合假綠）', () => {
  const { errors, checked } = run('empty');
  assert.equal(checked, 0);
  assert.equal(errors.length, 1);
  assert.match(errors[0], /0 個/);
});

test('說明檔語法錯誤 → 失敗，不得略過', () => {
  const { errors } = run('syntax-error');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /demo\.docs\.ts/);
});

test('Angular 各種屬性與事件寫法都認得', () => {
  const result = run('syntaxes');
  assert.deepEqual(result.errors, []);
  assert.equal(result.checked, 1);
});

// ── 基礎與互動原則（有 src/docs/ 的 repo 才檢查）─────────────────────────────

test('token、字型、互動原則都一致 → 通過', () => {
  const result = run('fnd-ok');
  assert.deepEqual(result.errors, []);
});

test('說明裡有、core.scss 沒有的 token → 失敗', () => {
  const { errors } = run('fnd-token-stale');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /--text\\\/gone/);
});

test('core.scss 有、說明沒有的 token → 失敗', () => {
  const { errors } = run('fnd-token-undocumented');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /--ease-enter/);
});

test('說明裡有、core.scss 沒有的字型 class → 失敗', () => {
  const { errors } = run('fnd-type-stale');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /\.noto-99-gone/);
});

test('互動原則的相關元件或相關原則不存在 → 失敗', () => {
  const { errors } = run('fnd-pattern-dangling');
  assert.equal(errors.length, 2);
  assert.match(errors.join('\n'), /#no-such-component/);
  assert.match(errors.join('\n'), /other\.missing/);
});

test('說明裡的 token 值跟 core.scss 不同 → 失敗', () => {
  const { errors } = run('fnd-token-value-drift');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /--text\\\/body/);
  assert.match(errors[0], /#000000/);
});
