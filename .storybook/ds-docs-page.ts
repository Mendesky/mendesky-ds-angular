// 元件說明頁版型：由各元件的 *.docs.ts 畫出。
// 順序（工程師先確認能不能用、怎麼用）：
//   名稱與 selector → 用途與禁止事項 → 真範例（可調整）→ 屬性表 → 程式碼範例 → Angular 注意事項 → 說明與注意事項 → 其他變體
import * as React from 'react';
import { Controls, Markdown, Primary, Source, Stories, Title, useOf } from '@storybook/blocks';
import { COMPONENT_SPECS, type DocNote, type DocTable } from '@mendesky/ds';
import type { ComponentApi, ComponentDoc, DocProp } from '../src/docs/component-doc';

const h = React.createElement;

// 自動收集 src 底下全部 Angular 用法說明，以 selector 對應元件；新增元件不用改這裡。
// 元件規格（何時用、注意事項、選用表格）在本體 @mendesky/ds，以 id 合併成完整說明。
const SPECS_BY_ID = new Map(COMPONENT_SPECS.map((spec) => [spec.id, spec]));
const docsContext = import.meta.webpackContext('../src', { recursive: true, regExp: /\.docs\.ts$/ });
const DOCS_BY_SELECTOR = new Map<string, ComponentDoc>();
for (const key of docsContext.keys()) {
  const mod = docsContext(key) as Record<string, ComponentApi>;
  for (const api of Object.values(mod)) {
    const spec = SPECS_BY_ID.get(api.id);
    if (spec) DOCS_BY_SELECTOR.set(api.selector, { ...spec, ...api });
  }
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
          h('td', null, h(Markdown, null, p.desc ?? p.description ?? '')),
        ),
      ),
    ),
  );
}

function NoteBlock({ note }: { note: DocNote | string }) {
  const n = typeof note === 'string' ? { type: 'info', content: note } : note;
  const warn = n.type === 'warn' || n.type === 'warning';
  return h(
    'div',
    { className: `ds-doc-note ${warn ? 'ds-doc-note--warn' : ''}` },
    h('span', { className: 'ds-doc-note__label' }, warn ? '注意' : '說明'),
    h('div', null, h(Markdown, null, n.content)),
  );
}

function CustomTable({ table }: { table: DocTable }) {
  return h(
    React.Fragment,
    null,
    h('h3', null, table.title),
    h(
      'table',
      { className: 'ds-doc-table' },
      h('thead', null, h('tr', null, ...table.columns.map((c) => h('th', { key: c }, c)))),
      h(
        'tbody',
        null,
        ...table.rows.map((row, i) => h('tr', { key: i }, ...row.map((cell, j) => h('td', { key: j }, h(Markdown, null, String(cell)))))),
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

  return h(
    'div',
    { className: 'ds-doc' },
    h(Title, null, doc.name),
    h('p', { className: 'ds-doc-selector' }, h('code', null, doc.selector)),
    doc.when ? h('div', { className: 'ds-doc-when', 'data-testid': 'ds-doc-when' }, h(Markdown, null, doc.when)) : null,

    h('h2', { 'data-testid': 'ds-doc-example' }, '範例'),
    h(Primary),
    h(Controls),

    h('h2', { 'data-testid': 'ds-doc-props' }, '屬性'),
    h(PropsTable, { props: doc.props }),

    doc.usage.length ? h('h2', { 'data-testid': 'ds-doc-usage' }, '程式碼範例') : null,
    ...doc.usage.map((u, i) =>
      h(React.Fragment, { key: `usage-${i}` }, u.label ? h('h3', null, u.label) : null, h(Source, { code: u.code, language: 'html', dark: true })),
    ),

    // 只有 Angular 才需要知道的注意事項（*.docs.ts 的 usageNotes）；跨框架的注意事項在下一段
    doc.usageNotes?.length ? h('h2', { 'data-testid': 'ds-doc-usage-notes' }, 'Angular 注意事項') : null,
    ...(doc.usageNotes ?? []).map((n, i) => h(NoteBlock, { key: `usage-note-${i}`, note: n })),

    doc.description || doc.notes.length || doc.customTables?.length
      ? h('h2', { 'data-testid': 'ds-doc-notes' }, '說明與注意事項')
      : null,
    doc.description ? h(Markdown, null, doc.description) : null,
    ...doc.notes.map((n, i) => h(NoteBlock, { key: `note-${i}`, note: n })),
    ...(doc.customTables ?? []).map((t, i) => h(CustomTable, { key: `table-${i}`, table: t })),

    h(Stories, { title: '其他變體', includePrimary: false }),
  );
}
