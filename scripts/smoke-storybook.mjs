// 冒煙測試：逐一打開文件網站（Storybook 靜態建置）的每一頁，確認有畫出內容、沒有頁面錯誤。
// 說明頁另外檢查：
//   - 本體文字的 #元件id 都換成了 Angular selector（程式碼區塊裡的 #name 是範本變數，不算）。掃整頁文字，第 2 版欄位的區塊也在內。
//   - 說明頁最外層的 data-ds-id 指出這頁是哪個元件，逐頁對照它的規格檢查第 2 版欄位（部位、狀態、可以／不要這樣做、無障礙）：
//     規格有內容的區塊要有標題、文字照共同規格，沒內容的不能有（不畫空標題）；各區標題的先後順序跟共同規格一樣；
//     每一區畫出的項數跟規格一樣、每一項都有文字；無障礙每個分類畫在對的組、條目數對；
//     「看範例」逐項對規格：規格有範例的那一項才有連結，連到範例網站裡有的範例，網址也連到同一個範例。
//   - 有第 2 版欄位的元件都要找得到說明頁，不然等於沒檢查。
// 「可以／不要這樣做」連到的範例，本體文件網站會嵌在半欄寬的框裡（最窄約 240px）：
// 這些範例再用 240px 寬的視窗打開一次，出現橫向捲軸就算失敗（範例外框寫死寬度，在本體網站會被切掉）。
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

/** 規格的第 2 版欄位 → 說明頁上的區塊名稱、每一項的 data-testid、應有的項數（同本體 smoke-guides 的 V2_SECTIONS） */
const V2_SECTIONS = [
  ['部位', 'ds-doc-anatomy-item', (s) => s.anatomy?.length ?? 0],
  ['狀態', 'ds-doc-state-item', (s) => s.states?.length ?? 0],
  ['可以這樣做', 'ds-doc-do-item', (s) => s.dos?.length ?? 0],
  ['不要這樣做', 'ds-doc-dont-item', (s) => s.donts?.length ?? 0],
  ['無障礙', 'ds-doc-a11y-item', (s) => Object.values(s.a11y ?? {}).reduce((n, items) => n + (items?.length ?? 0), 0)],
];
const DODONT = '「可以這樣做、不要這樣做」';

/** 第 2 版欄位每一區的標題：h2 的 data-testid、標題文字（共同規格逐字照抄）、算在這一區的項目。這一區規格是 0 項就不能有標題 */
const V2_HEADINGS = [
  ['ds-doc-anatomy', '部位', ['ds-doc-anatomy-item']],
  ['ds-doc-states', '狀態', ['ds-doc-state-item']],
  ['ds-doc-dodont', '可以這樣做、不要這樣做', ['ds-doc-do-item', 'ds-doc-dont-item']],
  ['ds-doc-a11y', '無障礙', ['ds-doc-a11y-item']],
];

/** 說明頁各區標題（h2 的 data-testid）的先後順序，兩個框架的說明頁一樣；沒畫的區塊略過 */
const SECTION_ORDER = [
  'ds-doc-anatomy', 'ds-doc-states', 'ds-doc-dodont', 'ds-doc-example', 'ds-doc-props', 'ds-doc-usage', 'ds-doc-usage-notes', 'ds-doc-a11y', 'ds-doc-notes',
];

/** 無障礙的分組與分類小標籤（同 .storybook/ds-docs-page.ts 的 A11Y_GROUPS、A11Y_LABEL） */
const A11Y_GROUPS = [
  ['網頁和 APP 都要做到', [['keyboard', '鍵盤'], ['focus', '焦點'], ['screenReader', '報讀軟體'], ['motion', '動態'], ['touch', '觸控']]],
  ['網頁專屬', [['aria', 'ARIA 與 HTML 語意']]],
];

const hasV2 = (spec) => V2_SECTIONS.some(([, , count]) => count(spec) > 0);

/**
 * 在瀏覽器裡讀說明頁；沒有 data-ds-id 回傳 null。
 * 讀出：哪個元件（data-ds-id）、各區 h2 標題（照頁面順序）、每個 data-testid 的每一項（有沒有文字、掛了哪些範例連結）、
 * 無障礙每個分類（所在組的 h3、小標籤、條目數）
 */
function docsPageFacts(testids) {
  const page = document.querySelector('#storybook-docs [data-ds-id]');
  if (!page) return null;
  // 項目本身的文字，不算「看範例」連結
  const textOf = (el) => {
    const copy = el.cloneNode(true);
    copy.querySelectorAll('[data-story-id]').forEach((a) => a.remove());
    return copy.textContent.trim();
  };
  const item = (el) => ({
    empty: textOf(el) === '',
    links: [...el.querySelectorAll('[data-story-id]')].map((a) => ({
      id: a.getAttribute('data-story-id'),
      path: new URL(a.getAttribute('href') ?? '', location.href).searchParams.get('path'),
    })),
  });
  return {
    id: page.getAttribute('data-ds-id'),
    headings: [...page.querySelectorAll('h2[data-testid]')].map((h) => ({ testid: h.getAttribute('data-testid'), text: h.textContent.trim() })),
    items: Object.fromEntries(testids.map((t) => [t, [...page.querySelectorAll(`[data-testid="${t}"]`)].map(item)])),
    a11y: [...page.querySelectorAll('.ds-doc-a11y__label')].map((label) => {
      const group = label.closest('.ds-doc-a11y')?.previousElementSibling;
      return {
        group: group?.tagName === 'H3' ? group.textContent.trim() : '',
        label: label.textContent.trim(),
        count: label.nextElementSibling?.querySelectorAll('[data-testid="ds-doc-a11y-item"]').length ?? 0,
      };
    }),
  };
}

/** 規格「可以／不要這樣做」其中一項的範例，在範例網站的 story id；這一項沒有範例時回傳 null */
const exampleStoryId = (spec, e) => (e.story ? `${spec.id}--${e.story}` : null);

/** 說明頁跟規格的第 2 版欄位對不上的地方。storyIds：範例網站裡有的範例 id */
function v2Problems(spec, facts, storyIds) {
  const out = [];
  const want = Object.fromEntries(V2_SECTIONS.map(([, testid, count]) => [testid, count(spec)]));
  // 標題：規格有內容的區塊要有一個、文字照共同規格；沒內容的不能有（不畫空標題）
  for (const [testid, title, itemTestids] of V2_HEADINGS) {
    const needed = itemTestids.some((t) => want[t] > 0);
    const texts = facts.headings.filter((h) => h.testid === testid).map((h) => h.text);
    if (needed && !texts.length) out.push(`規格有「${title}」，說明頁卻沒有這一區的標題（h2 data-testid="${testid}"）`);
    else if (!needed && texts.length) out.push(`規格沒有「${title}」，說明頁卻畫了這一區的標題`);
    else if (texts.length > 1) out.push(`「${title}」的標題畫了 ${texts.length} 個`);
    else if (needed && texts[0] !== title) out.push(`「${title}」的標題文字是「${texts[0]}」`);
  }
  // 區塊順序
  const shown = facts.headings.filter((h) => SECTION_ORDER.includes(h.testid));
  const sorted = [...shown].sort((a, b) => SECTION_ORDER.indexOf(a.testid) - SECTION_ORDER.indexOf(b.testid));
  if (shown.some((h, i) => h !== sorted[i])) {
    out.push(`區塊順序不對：說明頁是 ${shown.map((h) => h.text).join(' → ')}，應該是 ${sorted.map((h) => h.text).join(' → ')}`);
  }
  // 每一區的項數，以及每一項都有文字
  for (const [label, testid] of V2_SECTIONS) {
    const items = facts.items[testid];
    if (items.length !== want[testid]) out.push(`「${label}」規格有 ${want[testid]} 項，頁面畫出 ${items.length} 項`);
    const empty = items.flatMap((x, i) => (x.empty ? [i + 1] : []));
    if (empty.length) out.push(`「${label}」第 ${empty.join('、')} 項沒有文字`);
  }
  // 可以／不要這樣做：逐項對規格。規格寫了範例代號的那一項，要有一個連到「<元件id>--<代號>」的「看範例」，沒寫的項目不能有；
  // 每個連結都要在範例網站裡（index.json 有這個範例），網址也要連到同一個範例
  for (const [key, label, testid] of [['dos', '可以這樣做', 'ds-doc-do-item'], ['donts', '不要這樣做', 'ds-doc-dont-item']]) {
    const items = facts.items[testid];
    // 少畫的項目上面已經報了項數，這裡只對有畫出來的
    (spec[key] ?? []).slice(0, items.length).forEach((e, i) => {
      const expected = exampleStoryId(spec, e);
      const got = items[i].links.map((l) => l.id);
      if (expected && !(got.length === 1 && got[0] === expected)) {
        out.push(`「${label}」第 ${i + 1} 項應連到範例 ${expected}，頁面${got.length ? `連到 ${got.join('、')}` : '沒有範例連結'}`);
      }
      if (!expected && got.length) out.push(`「${label}」第 ${i + 1} 項規格沒有範例，頁面卻連到 ${got.join('、')}`);
    });
    for (const link of items.flatMap((x) => x.links)) {
      if (!storyIds.has(link.id)) out.push(`${DODONT}連到範例網站沒有的範例 ${link.id}`);
      if (link.path !== `/story/${link.id}`) out.push(`${DODONT}範例 ${link.id} 的連結網址是 ${link.path ?? '（沒有 path）'}，跟 data-story-id 對不上`);
    }
  }
  // 無障礙：每個分類畫在對的組、小標籤對、條目數跟規格一樣（只數總數抓不到放錯分類）
  const a11yWant = A11Y_GROUPS.flatMap(([group, cats]) =>
    cats.filter(([key]) => spec.a11y?.[key]?.length).map(([key, label]) => `${group}／${label} ${spec.a11y[key].length} 項`),
  );
  const a11yGot = facts.a11y.map((c) => `${c.group}／${c.label} ${c.count} 項`);
  if (a11yWant.join('、') !== a11yGot.join('、')) {
    out.push(`「無障礙」的分類跟規格不同：規格是 ${a11yWant.join('、') || '（沒有）'}，頁面是 ${a11yGot.join('、') || '（沒有）'}`);
  }
  return out;
}

const VIEWPORT = { width: 1280, height: 720 };
/** 本體文件網站「可以／不要這樣做」裡嵌入範例的最窄寬度 */
const EMBED_WIDTH = 240;

/** 範例在目前視窗寬度下有沒有橫向捲軸 */
async function horizontalOverflow(page) {
  // 等兩個畫面更新，讓改過的視窗寬度排版完
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  return page.evaluate(() => {
    const { scrollWidth, clientWidth } = document.documentElement;
    return scrollWidth > clientWidth ? scrollWidth : 0;
  });
}

/**
 * 逐頁檢查；回傳 { visited, failures, narrowChecked }（narrowChecked：用窄視窗量過幾個範例）。
 * refIds：Angular 有的元件 id；有給就檢查說明頁沒有留下這些 #元件id。給空陣列算失敗（拿不到 id 不等於沒有殘留）。
 * specs：元件規格（exportDocs 的 components[].doc）；有給就逐頁對照說明頁 data-ds-id 的規格檢查第 2 版欄位
 *        （沒有第 2 版欄位的元件也查：不能畫出第 2 版的標題與項目）。
 *        給空陣列、沒有任何元件有第 2 版欄位、說明頁的 data-ds-id 對不到規格，都算失敗（檢查沒有執行不等於通過）。
 */
export async function smokeStorybook(dir, { timeout = 15000, refIds, specs } = {}) {
  const root = path.resolve(dir);
  const index = JSON.parse(readFileSync(path.join(root, 'index.json'), 'utf8'));
  const entries = Object.values(index.entries);
  if (entries.length === 0) return { visited: 0, failures: [`index.json 裡有 0 頁，文件網站沒有內容`] };
  if (refIds && refIds.length === 0) return { visited: 0, failures: ['沒有拿到任何元件 id，無法檢查說明頁的 #元件id'] };
  if (specs && specs.length === 0) return { visited: 0, failures: ['沒有拿到任何元件規格，無法檢查說明頁的第 2 版欄位'] };
  const v2Specs = (specs ?? []).filter(hasV2);
  if (specs && v2Specs.length === 0) {
    return { visited: 0, failures: ['規格裡沒有任何元件有第 2 版欄位（部位、狀態、可以／不要這樣做、無障礙），第 2 版欄位檢查沒有執行'] };
  }
  const known = new Set(refIds ?? []);
  const specById = new Map((specs ?? []).map((s) => [s.id, s]));
  const storyIds = new Set(entries.filter((e) => e.type === 'story').map((e) => e.id));
  // 本體文件網站在「可以／不要這樣做」裡嵌入的範例。代號跟說明頁「看範例」用同一個換算：
  // 換算寫錯時，說明頁的範例連結檢查會先失敗，不會變成一個都沒量卻通過
  const embedded = new Set(
    (specs ?? []).flatMap((s) => [...(s.dos ?? []), ...(s.donts ?? [])].map((e) => exampleStoryId(s, e)).filter(Boolean)),
  );
  const narrowChecked = new Set(); // 真的用窄視窗量過的範例
  const testids = V2_SECTIONS.map(([, testid]) => testid);
  const seen = new Set(); // 找得到說明頁的元件 id（data-ds-id）

  const server = await serve(root);
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const failures = [];
  let visited = 0;
  try {
    const page = await browser.newPage({ viewport: VIEWPORT });
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
      if (rendered && !docs && embedded.has(entry.id)) {
        try {
          await page.setViewportSize({ width: EMBED_WIDTH, height: VIEWPORT.height });
          const width = await horizontalOverflow(page);
          narrowChecked.add(entry.id);
          if (width) {
            errors.push(
              `「可以／不要這樣做」會嵌入這個範例，在 ${EMBED_WIDTH}px 寬的視窗出現橫向捲軸（內容寬 ${width}px）：範例外框不要寫死寬度，改用 max-width`,
            );
          }
        } catch (e) {
          errors.push(`檢查窄視窗時出錯：${e.message}`);
        } finally {
          await page.setViewportSize(VIEWPORT);
        }
      }
      if (rendered && docs && known.size) {
        try {
          const left = (await page.evaluate(docsTexts)).flatMap((t) => findRefs(t)).filter((id) => known.has(id));
          if (left.length) errors.push(`說明頁有沒換掉的元件代號：${[...new Set(left)].map((id) => '#' + id).join('、')}`);
        } catch (e) {
          errors.push(`檢查元件代號時出錯：${e.message}`);
        }
      }
      if (rendered && docs && specs) {
        try {
          const facts = await page.evaluate(docsPageFacts, testids);
          if (facts) {
            seen.add(facts.id);
            const spec = specById.get(facts.id);
            if (spec) errors.push(...v2Problems(spec, facts, storyIds));
            else errors.push(`說明頁標的元件 ${facts.id}（data-ds-id）在規格裡找不到，無法檢查第 2 版欄位`);
          }
        } catch (e) {
          errors.push(`檢查第 2 版欄位時出錯：${e.message}`);
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
  for (const spec of v2Specs) {
    if (!seen.has(spec.id)) failures.push(`${spec.id}：規格有第 2 版欄位，但範例網站找不到 data-ds-id="${spec.id}" 的說明頁，第 2 版欄位沒有檢查到`);
  }
  return { visited, failures, narrowChecked: narrowChecked.size };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const repo = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
  const dir = process.argv[2] ?? path.join(repo, 'storybook-static');
  const specs = (await exportDocs(repo)).components.map((c) => c.doc);
  const refIds = specs.map((s) => s.id);
  const { visited, failures, narrowChecked } = await smokeStorybook(dir, { refIds, specs });
  if (failures.length) {
    console.error(`冒煙測試失敗（${failures.length} 項，共 ${visited} 頁）：`);
    for (const f of failures) console.error(`  - ${f}`);
    process.exit(1);
  }
  console.log(`冒煙測試通過：${visited} 頁都畫出內容、沒有錯誤；${specs.filter(hasV2).length} 個元件的第 2 版欄位都跟規格一致；${narrowChecked} 個嵌入的範例在 ${EMBED_WIDTH}px 寬沒有橫向捲軸`);
}
