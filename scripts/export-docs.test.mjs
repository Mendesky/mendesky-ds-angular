// 說明匯出（export-docs.mjs）的測試：本體文字裡的 #元件id 要換成 Angular selector，
// 使用端（dashboard-app 的 AI 協作索引）讀到的才是 app-xxx。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderRefs, findRefs } from '@mendesky/ds/scripts/component-refs.mjs';
import { exportDocs, renderCoreRefs, angularNames, mergeDoc, loadCoreRefs } from './export-docs.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

test('#元件id 換成 selector；色碼、網址、id 與相關元件欄位不換；Angular 沒有的元件保留原樣', () => {
  const nameOf = angularNames([
    { id: 'button', selector: 'app-button' },
    { id: 'tooltip-directive', selector: '[appTooltip]' },
  ]);
  const input = {
    id: 'demo',
    name: '#button 示範',
    when: '選項一律用 #button，提示用 #tooltip-directive。',
    notes: [{ type: 'info', content: '底色 #fff；見 https://example.com/a#button；#not-in-angular 保留' }, '#button 純字串'],
    customTables: [{ title: '對照', columns: ['元件'], rows: [['#button']] }],
    relatedComponents: ['#button'],
    url: 'https://example.com/#button',
  };
  assert.deepEqual(renderCoreRefs(input, nameOf, renderRefs), {
    id: 'demo',
    name: '#button 示範',
    when: '選項一律用 app-button，提示用 [appTooltip]。',
    notes: [{ type: 'info', content: '底色 #fff；見 https://example.com/a#button；#not-in-angular 保留' }, 'app-button 純字串'],
    customTables: [{ title: '對照', columns: ['元件'], rows: [['app-button']] }],
    relatedComponents: ['#button'],
    url: 'https://example.com/#button',
  });
});

test('部位與狀態的名稱是顯示在頁面上的文字，也換 #元件id；元件本身的 name 等識別字照舊不換', () => {
  const nameOf = angularNames([{ id: 'button', selector: 'app-button' }]);
  const input = {
    id: 'demo',
    name: '#button 示範',
    anatomy: [{ name: '#button 的圖示', description: '跟 #button 一樣' }],
    states: [{ name: '像 #button 停用', description: '灰底' }],
    relatedComponents: ['#button'],
  };
  assert.deepEqual(renderCoreRefs(input, nameOf, renderRefs), {
    id: 'demo',
    name: '#button 示範',
    anatomy: [{ name: 'app-button 的圖示', description: '跟 app-button 一樣' }],
    states: [{ name: '像 app-button 停用', description: '灰底' }],
    relatedComponents: ['#button'],
  });
});

test('合併後的說明：元件規格、互動原則、token 說明裡沒有留下 Angular 有的 #元件id', async () => {
  const docs = await exportDocs(root);
  const known = new Set(docs.components.map((c) => c.doc.id));
  const action = docs.components.find((c) => c.doc.id === 'action-menu').doc;
  assert.match(action.when, /app-button/);
  assert.doesNotMatch(action.when, /#button/);

  // 部位與狀態的 name 是顯示文字，照樣掃（同 export-docs.mjs 的 DISPLAYED_NAME_AT）
  const skip = new Set(['id', 'name', 'url', 'references', 'relatedComponents', 'relatedPatterns']);
  const displayedNameAt = /\.(?:anatomy|states)\[\d+\]$/;
  const leftovers = [];
  let scanned = 0;
  let displayedNames = 0; // 靠例外掃到的部位、狀態名稱
  const walk = (value, at) => {
    if (typeof value === 'string') {
      scanned++;
      for (const id of findRefs(value)) if (known.has(id)) leftovers.push(`${at}：#${id}`);
    } else if (Array.isArray(value)) value.forEach((v, i) => walk(v, `${at}[${i}]`));
    else if (value && typeof value === 'object') {
      for (const [k, v] of Object.entries(value)) {
        const displayedName = k === 'name' && displayedNameAt.test(at);
        if (displayedName) displayedNames++;
        if (!skip.has(k) || displayedName) walk(v, `${at}.${k}`);
      }
    }
  };
  docs.components.forEach((c) => walk(c.doc, c.doc.id));
  walk(docs.patterns, 'patterns');
  walk(docs.tokens, 'tokens');
  walk(docs.typography, 'typography');
  walk(docs.motion, 'motion');
  // 掃描本身要有讀到東西，避免「什麼都沒讀到所以沒有殘留」
  assert.ok(scanned > 1000, `只掃到 ${scanned} 段文字，匯出可能壞了`);
  // 部位、狀態的名稱要真的掃到（例外的位置寫錯就一個都掃不到），而且每一個都掃到
  const names = docs.components.reduce((n, c) => n + (c.doc.anatomy?.length ?? 0) + (c.doc.states?.length ?? 0), 0);
  assert.ok(names > 0, '規格裡沒有任何部位、狀態，這段檢查沒有執行');
  assert.equal(displayedNames, names, `部位、狀態的名稱共 ${names} 個，只掃到 ${displayedNames} 個`);
  assert.deepEqual(leftovers, []);
});

test('合併時只換本體的文字：Angular 寫的範例程式碼與注意事項保留 #name 範本變數', () => {
  const nameOf = angularNames([{ id: 'select', selector: 'app-select' }]);
  const render = (value) => renderCoreRefs(value, nameOf, renderRefs);
  const spec = { id: 'demo', when: '改用 #select。', notes: ['見 #select'] };
  const api = {
    id: 'demo',
    selector: 'app-demo',
    usage: [{ label: '取參照', code: '<app-select #select></app-select>' }],
    usageNotes: ['範本變數 #select 可以拿到元件實體'],
  };
  const doc = mergeDoc(spec, api, render);
  assert.equal(doc.when, '改用 app-select。');
  assert.deepEqual(doc.notes, ['見 app-select']);
  assert.equal(doc.usage[0].code, '<app-select #select></app-select>');
  assert.deepEqual(doc.usageNotes, ['範本變數 #select 可以拿到元件實體']);
});

test('本體沒有 #元件id 解析（版本太舊或沒裝好）→ 匯出失敗並說明，不能把沒換的 #元件id 交出去', async () => {
  const fakeCore = mkdtempSync(path.join(tmpdir(), 'core-no-refs-'));
  await assert.rejects(() => loadCoreRefs(fakeCore), /component-refs\.mjs[\s\S]*@mendesky\/ds/);
});
