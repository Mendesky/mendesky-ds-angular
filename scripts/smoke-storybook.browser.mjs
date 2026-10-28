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

test('說明頁有沒換掉的 #元件id → 失敗並指出是哪個；程式碼、色碼、網址裡的 # 不算', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'refs'), { refIds: ['button', 'select'] });
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /demo--docs/);
  assert.match(result.failures[0], /#button/);
  assert.doesNotMatch(result.failures[0], /#select|#fff/);
});

test('說明頁的 #元件id 都換掉了 → 通過', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'ok'), { refIds: ['button'] });
  assert.deepEqual(result.failures, []);
});

test('要檢查 #元件id 卻拿不到任何元件 id → 失敗，不能當成沒有殘留', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'ok'), { refIds: [] });
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /元件 id/);
});

// ── 規格第 2 版欄位（部位、狀態、可以／不要這樣做、無障礙） ──────────
// 規格由參數傳入（fixture 沒有安裝本體套件）；fixture 的說明頁照 demoSpec 畫
const demoSpec = {
  id: 'demo',
  anatomy: [
    { name: '外框', description: '可以點的範圍' },
    { name: '文字', description: '說明這個操作' },
  ],
  states: [{ name: '停用', description: '灰底灰字' }],
  dos: [{ text: '需要撐滿寬度時用 fullWidth', story: 'full-width' }],
  donts: [{ text: '不要在裡面放另一個可以點的東西' }],
  a11y: { keyboard: ['Tab 移到元件'], aria: ['用原生 button 元素'] },
};
// 沒有第 2 版欄位的元件
const plainSpec = { id: 'plain', notes: [] };

test('「可以／不要這樣做」嵌入的範例在窄視窗出現橫向捲軸 → 失敗，指出範例；沒有被嵌入的範例不查', async () => {
  // 本體文件網站把這些範例嵌在半欄寬的框裡，最窄約 240px
  const result = await smokeStorybook(path.join(fixtures, 'narrow-overflow'), { specs: [demoSpec] });
  assert.equal(result.visited, 3);
  assert.equal(result.failures.length, 1, result.failures.join('\n'));
  assert.match(result.failures[0], /^demo--full-width：.*240px.*橫向捲軸/);
  // 規格引用的範例（full-width）要真的量過
  assert.equal(result.narrowChecked, 1);
});

test('「可以／不要這樣做」引用的範例一個都對不上範例網站 → 失敗，不能當成窄視窗都沒問題', async () => {
  const spec = { ...demoSpec, dos: [{ text: '需要撐滿寬度時用 fullWidth', story: 'gone' }] };
  const result = await smokeStorybook(path.join(fixtures, 'narrow-overflow'), { specs: [spec] });
  assert.equal(result.narrowChecked, 0);
  // 一個範例都沒量到，但說明頁的範例連結檢查會指出規格的範例在範例網站找不到，整體不會通過
  assert.ok(result.failures.some((f) => /demo--gone/.test(f)), result.failures.join('\n'));
});

test('第 2 版欄位每一區的標題、項數、順序、無障礙分類都跟規格一樣，範例連結掛在對的項目、連到範例網站裡的範例 → 通過', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-ok'), { specs: [demoSpec, plainSpec], refIds: ['button'] });
  assert.equal(result.visited, 2);
  assert.deepEqual(result.failures, []);
});

test('說明頁少畫一項、範例連到範例網站沒有的範例、第 2 版區塊留下沒換的 #元件id → 失敗並指出哪一頁哪一區', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-bad'), { specs: [demoSpec], refIds: ['button'] });
  assert.equal(result.failures.length, 1, result.failures.join('\n'));
  const [failure] = result.failures;
  assert.match(failure, /^demo--docs：/);
  assert.match(failure, /「部位」規格有 2 項，頁面畫出 1 項/);
  assert.match(failure, /「可以這樣做、不要這樣做」連到範例網站沒有的範例 demo--full-width/);
  // 未翻譯檢查掃整頁文字，第 2 版區塊也在內
  assert.match(failure, /沒換掉的元件代號：#button/);
  // 畫對的區塊不列
  assert.doesNotMatch(failure, /「(狀態|可以這樣做|不要這樣做|無障礙)」/);
});

test('規格的範例代號在說明頁沒有畫出連結 → 失敗並指出哪一欄第幾項、該連到哪個範例', async () => {
  const spec = { ...demoSpec, donts: [{ text: '不要在裡面放另一個可以點的東西', story: 'nested' }] };
  const result = await smokeStorybook(path.join(fixtures, 'v2-ok'), { specs: [spec] });
  assert.equal(result.failures.length, 1, result.failures.join('\n'));
  assert.match(result.failures[0], /^demo--docs：「不要這樣做」第 1 項應連到範例 demo--nested，頁面沒有範例連結$/);
});

test('範例連結掛錯項（規格的範例在「不要這樣做」，頁面掛在「可以這樣做」）→ 失敗並指出兩邊各是哪一項', async () => {
  // 頁面照 demoSpec 畫（連結在「可以這樣做」第 1 項）；這裡的規格把範例移到「不要這樣做」第 1 項，範例 id 還在範例網站裡
  const spec = { ...demoSpec, dos: [{ text: '需要撐滿寬度時用 fullWidth' }], donts: [{ text: '不要在裡面放另一個可以點的東西', story: 'full-width' }] };
  const result = await smokeStorybook(path.join(fixtures, 'v2-ok'), { specs: [spec] });
  assert.equal(result.failures.length, 1, result.failures.join('\n'));
  const [failure] = result.failures;
  assert.match(failure, /「可以這樣做」第 1 項規格沒有範例，頁面卻連到 demo--full-width/);
  assert.match(failure, /「不要這樣做」第 1 項應連到範例 demo--full-width，頁面沒有範例連結/);
});

test('項數都對但內容畫錯（標題不見或文字不對、項目沒有文字、連結網址跟範例對不上、區塊順序不對、無障礙放錯分類）→ 失敗並逐一指出', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-wrong-page'), { specs: [demoSpec] });
  assert.equal(result.failures.length, 1, result.failures.join('\n'));
  const [failure] = result.failures;
  assert.match(failure, /^demo--docs：/);
  assert.match(failure, /規格有「狀態」，說明頁卻沒有這一區的標題（h2 data-testid="ds-doc-states"）/);
  assert.match(failure, /「可以這樣做、不要這樣做」的標題文字是「可以、不要」/);
  assert.match(failure, /「部位」第 2 項沒有文字/);
  assert.match(failure, /範例 demo--full-width 的連結網址是 \/story\/nope--nope，跟 data-story-id 對不上/);
  assert.match(failure, /區塊順序不對：說明頁是 部位 → 可以、不要 → 無障礙 → 範例，應該是 部位 → 可以、不要 → 範例 → 無障礙/);
  assert.match(failure, /「無障礙」的分類跟規格不同：規格是 網頁和 APP 都要做到／鍵盤 1 項、網頁專屬／ARIA 與 HTML 語意 1 項，頁面是 網頁和 APP 都要做到／鍵盤 2 項/);
  // 項數、連結的位置都對，不列
  assert.doesNotMatch(failure, /規格有 \d+ 項，頁面畫出|應連到範例|規格沒有範例/);
});

test('沒有第 2 版欄位的元件，說明頁畫了第 2 版區塊 → 失敗（不畫空標題）', async () => {
  // demo 的規格沒有第 2 版欄位，頁面卻畫了；other 只是讓「有第 2 版欄位的元件數」不是 0，它找不到說明頁另外報
  const result = await smokeStorybook(path.join(fixtures, 'v2-ok'), { specs: [{ id: 'demo', notes: [] }, { ...demoSpec, id: 'other' }] });
  const failure = result.failures.find((f) => f.startsWith('demo--docs：'));
  assert.ok(failure, result.failures.join('\n'));
  assert.match(failure, /規格沒有「部位」，說明頁卻畫了這一區的標題/);
  assert.match(failure, /「部位」規格有 0 項，頁面畫出 2 項/);
});

test('有第 2 版欄位的元件找不到說明頁（頁面沒有 data-ds-id）→ 失敗，不能當成沒問題', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-no-ds-id'), { specs: [demoSpec] });
  assert.equal(result.failures.length, 1, result.failures.join('\n'));
  assert.match(result.failures[0], /^demo：.*找不到 data-ds-id="demo" 的說明頁/);
});

test('範例網站只有範例、一個說明頁都沒有 → 失敗，不能當成沒問題', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-no-docs'), { specs: [demoSpec] });
  assert.equal(result.visited, 1);
  assert.equal(result.failures.length, 1, result.failures.join('\n'));
  assert.match(result.failures[0], /^demo：.*找不到 data-ds-id="demo" 的說明頁/);
});

test('說明頁的 data-ds-id 在規格裡找不到 → 失敗，不能當成沒問題', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-ok'), { specs: [{ ...demoSpec, id: 'other' }] });
  // demo 的說明頁對不到規格；規格的 other 也找不到說明頁
  assert.equal(result.failures.length, 2, result.failures.join('\n'));
  assert.match(result.failures[0], /^demo--docs：說明頁標的元件 demo（data-ds-id）在規格裡找不到，無法檢查第 2 版欄位$/);
  assert.match(result.failures[1], /^other：/);
});

test('要檢查第 2 版欄位卻拿不到任何元件規格 → 失敗，不能當成通過', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-ok'), { specs: [] });
  assert.equal(result.visited, 0);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /沒有拿到任何元件規格/);
});

test('規格裡沒有任何元件有第 2 版欄位 → 失敗，不能當成通過', async () => {
  const result = await smokeStorybook(path.join(fixtures, 'v2-ok'), { specs: [plainSpec] });
  assert.equal(result.visited, 0);
  assert.equal(result.failures.length, 1);
  assert.match(result.failures[0], /沒有任何元件有第 2 版欄位/);
});
