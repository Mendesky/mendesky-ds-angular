// 元件說明頁版型：由各元件的 *.docs.ts 畫出。
// 順序（工程師先確認能不能用、怎麼用）：
//   名稱與 selector → 用途與禁止事項 → 部位 → 狀態 → 可以這樣做、不要這樣做 → 真範例（可調整）→ 屬性表 → 程式碼範例
//   → Angular 注意事項 → 無障礙 → 說明與注意事項 → 其他變體
// 部位、狀態、可以／不要這樣做、無障礙是本體規格的第 2 版欄位（選填）：沒寫就整區不畫，寫了每一項都要畫出來。
// 冒煙測試（scripts/smoke-storybook.mjs）用最外層的 data-ds-id 認出是哪個元件，用每一項的 data-testid 數項數、跟規格比對。
import * as React from 'react';
import { Controls, Markdown, Primary, Source, Stories, Title, useOf } from '@storybook/blocks';
import { COMPONENT_SPECS, type DocNote, type DocTable, type SpecA11y, type SpecExample, type SpecPart, type SpecState } from '@mendesky/ds';
import { renderRefs } from '@mendesky/ds/scripts/component-refs.mjs';
import type { ComponentApi, ComponentDoc, DocProp } from '../src/docs/component-doc';

const h = React.createElement;

/**
 * 交給 Markdown 顯示。行首的 # 後面接英數字時（色碼 #ffffff、元件代號 #button）先跳脫：
 * Storybook 的 Markdown 不要求 # 後面有空格，會把它當成大標題並吃掉 #。
 */
function md(text: string) {
  return h(Markdown, null, text.replace(/^(\s*)#(?=[0-9A-Za-z])/gm, '$1\\#'));
}

// 自動收集 src 底下全部 Angular 用法說明，以 selector 對應元件；新增元件不用改這裡。
// 元件規格（何時用、注意事項、選用表格）在本體 @mendesky/ds，以 id 合併成完整說明。
const SPECS_BY_ID = new Map(COMPONENT_SPECS.map((spec) => [spec.id, spec]));
const docsContext = import.meta.webpackContext('../src', { recursive: true, regExp: /\.docs\.ts$/ });
const DOCS_BY_SELECTOR = new Map<string, ComponentDoc>();
const SELECTOR_BY_ID = new Map<string, string>();
for (const key of docsContext.keys()) {
  const mod = docsContext(key) as Record<string, ComponentApi>;
  for (const api of Object.values(mod)) {
    SELECTOR_BY_ID.set(api.id, api.selector);
    const spec = SPECS_BY_ID.get(api.id);
    if (spec) DOCS_BY_SELECTOR.set(api.selector, { ...spec, ...api });
  }
}

/**
 * 本體文字用 #元件id 指其他元件，這裡換成 Angular selector；Angular 沒有的元件保留原樣。
 * 會交給 Markdown 的文字把 selector 包成行內程式碼；純文字位置（表格標題、欄名）不包。
 */
export function coreText(text: string, asCode = true): string {
  return renderRefs(text, (id) => {
    const selector = SELECTOR_BY_ID.get(id);
    if (!selector) return undefined;
    return asCode ? `\`${selector}\`` : selector;
  });
}

/** Angular 編譯後的元件／directive 定義上帶有 selector */
function selectorOf(component: unknown): string | null {
  const def = (component as { ɵcmp?: { selectors?: string[][] }; ɵdir?: { selectors?: string[][] } } | undefined);
  const sel = def?.ɵcmp?.selectors?.[0] ?? def?.ɵdir?.selectors?.[0];
  if (!sel) return null;
  // 屬性 selector 編譯後是 ['', 'appTooltip', '']
  return sel[0] === '' ? `[${sel[1]}]` : sel[0];
}

export function findDoc(parameters: Record<string, unknown> | undefined, component: unknown): ComponentDoc | undefined {
  // 指定的說明檔只有 Angular 用法，一樣用 id 合併本體規格
  const explicit = parameters?.['dsDoc'] as ComponentApi | undefined;
  if (explicit) {
    const spec = SPECS_BY_ID.get(explicit.id);
    return spec ? { ...spec, ...explicit } : undefined;
  }
  const selector = selectorOf(component);
  return selector ? DOCS_BY_SELECTOR.get(selector) : undefined;
}

function PropsTable({ props }: { props: DocProp[] }) {
  if (!props.length) return h('p', { className: 'ds-doc-empty' }, '沒有輸入屬性。');
  return h(
    'table',
    { className: 'ds-doc-table' },
    h('thead', null, h('tr', null, ...['名稱', '型別', '預設值', '說明'].map((t) => h('th', { key: t }, t)))),
    h(
      'tbody',
      null,
      ...props.map((p) =>
        h(
          'tr',
          { key: p.name },
          h('td', null, h('code', null, p.name), p.isOutput ? h('span', { className: 'ds-doc-tag' }, '事件') : null),
          h('td', null, h('code', null, p.type)),
          h('td', null, p.default !== undefined ? h('code', null, p.default) : '—'),
          h('td', null, md(p.desc ?? p.description ?? '')),
        ),
      ),
    ),
  );
}

// fromCore：內容來自本體（要換 #元件id）；Angular 注意事項是 Angular 自己寫的，可能含 #name 這類範本變數，不換
function NoteBlock({ note, fromCore = false }: { note: DocNote | string; fromCore?: boolean }) {
  const n = typeof note === 'string' ? { type: 'info', content: note } : note;
  const warn = n.type === 'warn' || n.type === 'warning';
  return h(
    'div',
    { className: `ds-doc-note ${warn ? 'ds-doc-note--warn' : ''}` },
    h('span', { className: 'ds-doc-note__label' }, warn ? '注意' : '說明'),
    h('div', null, md(fromCore ? coreText(n.content) : n.content)),
  );
}

// 表格都來自本體
function CustomTable({ table }: { table: DocTable }) {
  return h(
    React.Fragment,
    null,
    h('h3', null, coreText(table.title, false)),
    h(
      'table',
      { className: 'ds-doc-table' },
      h('thead', null, h('tr', null, ...table.columns.map((c) => h('th', { key: c }, coreText(c, false))))),
      h(
        'tbody',
        null,
        ...table.rows.map((row, i) =>
          h('tr', { key: i }, ...row.map((cell, j) => h('td', { key: j }, md(coreText(String(cell)))))),
        ),
      ),
    ),
  );
}

// ── 規格第 2 版欄位：都來自本體，名稱、說明、每一條文字都要換 #元件id ──

function Anatomy({ parts }: { parts: SpecPart[] }) {
  return h(
    React.Fragment,
    null,
    h('h2', { 'data-testid': 'ds-doc-anatomy' }, '部位'),
    h(
      'ol',
      { className: 'ds-doc-anatomy' },
      ...parts.map((p, i) =>
        h('li', { key: i, 'data-testid': 'ds-doc-anatomy-item' }, md(`**${coreText(p.name)}**：${coreText(p.description)}`)),
      ),
    ),
  );
}

function States({ states }: { states: SpecState[] }) {
  return h(
    React.Fragment,
    null,
    h('h2', { 'data-testid': 'ds-doc-states' }, '狀態'),
    h(
      'table',
      { className: 'ds-doc-table' },
      h('thead', null, h('tr', null, ...['狀態', '長怎樣、什麼時候出現'].map((t) => h('th', { key: t }, t)))),
      h(
        'tbody',
        null,
        ...states.map((s, i) =>
          h(
            'tr',
            { key: i, 'data-testid': 'ds-doc-state-item' },
            h('td', { className: 'ds-doc-state-name' }, md(coreText(s.name))),
            h('td', null, md(coreText(s.description))),
          ),
        ),
      ),
    ),
  );
}

/** 連到範例網站裡的一個範例。說明頁在 iframe 裡，要換掉整個範例網站（_top）；data-story-id 讓冒煙測試確認這個範例存在 */
function StoryLink({ storyId }: { storyId: string }) {
  return h(
    'a',
    { className: 'ds-doc-story-link', href: `./?path=/story/${encodeURIComponent(storyId)}`, target: '_top', 'data-story-id': storyId },
    '看範例',
  );
}

/** 可以／不要這樣做；有範例代號（story）時在該項後面連到範例，完整 story id 是「<元件id>--<代號>」。沒有項目的那一欄不畫 */
function DoDont({ id, dos, donts }: { id: string; dos: SpecExample[]; donts: SpecExample[] }) {
  const columns = [
    { kind: 'do', title: '✅ 可以這樣做', testid: 'ds-doc-do-item', items: dos },
    { kind: 'dont', title: '❌ 不要這樣做', testid: 'ds-doc-dont-item', items: donts },
  ].filter((c) => c.items.length);
  return h(
    React.Fragment,
    null,
    h('h2', { 'data-testid': 'ds-doc-dodont' }, '可以這樣做、不要這樣做'),
    h(
      'div',
      { className: 'ds-doc-dodont' },
      ...columns.map((c) =>
        h(
          'div',
          { key: c.kind, className: `ds-doc-dodont__col ds-doc-dodont__col--${c.kind}` },
          h('p', { className: 'ds-doc-dodont__title' }, c.title),
          h(
            'ul',
            null,
            ...c.items.map((e, i) =>
              h('li', { key: i, 'data-testid': c.testid }, md(coreText(e.text)), e.story ? h(StoryLink, { storyId: `${id}--${e.story}` }) : null),
            ),
          ),
        ),
      ),
    ),
  );
}

// 無障礙分兩組：網頁和 APP 都要做到的行為、網頁才有的 ARIA 與 HTML 語意
const A11Y_GROUPS: { title: string; keys: (keyof SpecA11y)[] }[] = [
  { title: '網頁和 APP 都要做到', keys: ['keyboard', 'focus', 'screenReader', 'motion', 'touch'] },
  { title: '網頁專屬', keys: ['aria'] },
];
const A11Y_LABEL: Record<keyof SpecA11y, string> = {
  keyboard: '鍵盤',
  focus: '焦點',
  screenReader: '報讀軟體',
  motion: '動態',
  touch: '觸控',
  aria: 'ARIA 與 HTML 語意',
};

type A11yGroup = { title: string; entries: { key: keyof SpecA11y; items: string[] }[] };

/** 只留有內容的分類與組；整個沒有內容時回傳空陣列 */
function a11yGroups(a11y: SpecA11y = {}): A11yGroup[] {
  return A11Y_GROUPS.map((g) => ({
    title: g.title,
    entries: g.keys.filter((k) => a11y[k]?.length).map((k) => ({ key: k, items: a11y[k] ?? [] })),
  })).filter((g) => g.entries.length);
}

function A11y({ groups }: { groups: A11yGroup[] }) {
  return h(
    React.Fragment,
    null,
    h('h2', { 'data-testid': 'ds-doc-a11y' }, '無障礙'),
    ...groups.map((g) =>
      h(
        React.Fragment,
        { key: g.title },
        h('h3', null, g.title),
        h(
          'dl',
          { className: 'ds-doc-a11y' },
          ...g.entries.map((e) =>
            h(
              React.Fragment,
              { key: e.key },
              h('dt', { className: 'ds-doc-a11y__label' }, A11Y_LABEL[e.key]),
              h('dd', null, h('ul', null, ...e.items.map((item, i) => h('li', { key: i, 'data-testid': 'ds-doc-a11y-item' }, md(coreText(item)))))),
            ),
          ),
        ),
      ),
    ),
  );
}

export function DsDocsPage() {
  const resolved = useOf('meta');
  const prepared = resolved.type === 'meta' ? resolved.preparedMeta : undefined;
  const doc = findDoc(prepared?.parameters, prepared?.component);

  if (!doc) {
    return h(React.Fragment, null, h(Title), h(Primary), h(Controls), h(Stories));
  }

  const a11y = a11yGroups(doc.a11y);
  return h(
    'div',
    { className: 'ds-doc', 'data-ds-id': doc.id },
    h(Title, null, doc.name),
    h('p', { className: 'ds-doc-selector' }, h('code', null, doc.selector)),
    doc.when ? h('div', { className: 'ds-doc-when', 'data-testid': 'ds-doc-when' }, md(coreText(doc.when))) : null,

    doc.anatomy?.length ? h(Anatomy, { parts: doc.anatomy }) : null,
    doc.states?.length ? h(States, { states: doc.states }) : null,
    doc.dos?.length || doc.donts?.length ? h(DoDont, { id: doc.id, dos: doc.dos ?? [], donts: doc.donts ?? [] }) : null,

    h('h2', { 'data-testid': 'ds-doc-example' }, '範例'),
    h(Primary),
    h(Controls),

    h('h2', { 'data-testid': 'ds-doc-props' }, '屬性'),
    h(PropsTable, { props: doc.props }),

    doc.usage.length ? h('h2', { 'data-testid': 'ds-doc-usage' }, '程式碼範例') : null,
    ...doc.usage.map((u, i) =>
      h(React.Fragment, { key: `usage-${i}` }, u.label ? h('h3', null, u.label) : null, h(Source, { code: u.code, language: 'html', dark: true })),
    ),

    // 只有 Angular 才需要知道的注意事項（*.docs.ts 的 usageNotes）；跨框架的注意事項在「說明與注意事項」
    doc.usageNotes?.length ? h('h2', { 'data-testid': 'ds-doc-usage-notes' }, 'Angular 注意事項') : null,
    ...(doc.usageNotes ?? []).map((n, i) => h(NoteBlock, { key: `usage-note-${i}`, note: n })),

    a11y.length ? h(A11y, { groups: a11y }) : null,

    doc.description || doc.notes.length || doc.customTables?.length
      ? h('h2', { 'data-testid': 'ds-doc-notes' }, '說明與注意事項')
      : null,
    doc.description ? md(coreText(doc.description)) : null,
    ...doc.notes.map((n, i) => h(NoteBlock, { key: `note-${i}`, note: n, fromCore: true })),
    ...(doc.customTables ?? []).map((t, i) => h(CustomTable, { key: `table-${i}`, table: t })),

    h(Stories, { title: '其他變體', includePrimary: false }),
  );
}
