import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProseMirrorJSON } from '../../../features/quoting-cases/models/p4-contract.model';
import { RichTextEditorComponent } from './rich-text-editor.component';
import { tableHighlightKey } from './table-toolbar/rte-table-highlight.plugin';
import {
  docEqualsIgnoringAttrs,
  extractAndCleanExcelTable,
  isMarkdownLike,
  isExcelHtml,
  isRichHtml,
  stripNodeAttrs,
} from './rich-text-editor.helpers';

// ── docEqualsIgnoringAttrs ────────────────────────────────────────────────────

describe('docEqualsIgnoringAttrs', () => {
  it('plan case 1: 兩 doc 唯一差異為 displayUrl，ignoredAttrs=[displayUrl] → true', () => {
    const a: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', url: '/files/x', displayUrl: 'blob:http://localhost/1' },
      }],
    };
    const b: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', url: '/files/x', displayUrl: undefined },
      }],
    };
    expect(docEqualsIgnoringAttrs(a, b, ['displayUrl'])).toBeTrue();
  });

  it('plan case 2: 兩 doc 有實質文字段落，其中一個多了一個有內容的 paragraph → false', () => {
    const a: ProseMirrorJSON = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '第一段' }] },
        { type: 'paragraph', content: [{ type: 'text', text: '第二段' }] },
      ],
    };
    const b: ProseMirrorJSON = {
      type: 'doc',
      content: [
        { type: 'paragraph', content: [{ type: 'text', text: '第一段' }] },
      ],
    };
    expect(docEqualsIgnoringAttrs(a, b, [])).toBeFalse();
  });

  it('plan case 3a: 兩個 null → true', () => {
    expect(docEqualsIgnoringAttrs(null, null, [])).toBeTrue();
  });

  it('plan case 3b: 一 null 一 non-null → false', () => {
    const doc: ProseMirrorJSON = { type: 'doc', content: [] };
    expect(docEqualsIgnoringAttrs(null, doc, [])).toBeFalse();
    expect(docEqualsIgnoringAttrs(doc, null, [])).toBeFalse();
  });

  it('ignoredAttrs=[] 時不忽略任何 attr（displayUrl 不同 → false）', () => {
    const a: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', displayUrl: 'blob:x' },
      }],
    };
    const b: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', displayUrl: null },
      }],
    };
    expect(docEqualsIgnoringAttrs(a, b, [])).toBeFalse();
  });

  it('多個 ignoredAttrs 同時生效', () => {
    const a: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', displayUrl: 'blob:x', pending: true },
      }],
    };
    const b: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', displayUrl: null, pending: false },
      }],
    };
    expect(docEqualsIgnoringAttrs(a, b, ['displayUrl', 'pending'])).toBeTrue();
  });

  it('巢狀節點中的 ignoredAttrs 同樣生效', () => {
    const a: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'imageAsset',
            attrs: { displayUrl: 'data:image/png;base64,XYZ' },
          }],
        }],
      }],
    };
    const b: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'bulletList',
        content: [{
          type: 'listItem',
          content: [{
            type: 'imageAsset',
            attrs: { displayUrl: null },
          }],
        }],
      }],
    };
    expect(docEqualsIgnoringAttrs(a, b, ['displayUrl'])).toBeTrue();
  });

  it('attr key 順序不同但語意相同 → true（order-insensitive）', () => {
    const a: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', documentId: 'd1', url: '/files/x', alt: '', pending: false },
      }],
    };
    const b: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { alt: '', assetId: 'a', documentId: 'd1', url: '/files/x', displayUrl: 'blob:abc', pending: false },
      }],
    };
    expect(docEqualsIgnoringAttrs(a, b, ['displayUrl'])).toBeTrue();
  });

  it('TipTap 尾部空段落正規化：parser 無尾段 vs editor 有尾段 → true', () => {
    const fromParser: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', documentId: 'd1', url: '/files/x', alt: '', pending: false },
      }],
    };
    const fromEditor: ProseMirrorJSON = {
      type: 'doc',
      content: [{
        type: 'imageAsset',
        attrs: { assetId: 'a', documentId: 'd1', url: '/files/x', alt: '', pending: false },
      }, {
        type: 'paragraph',
      }],
    };
    expect(docEqualsIgnoringAttrs(fromParser, fromEditor, ['displayUrl'])).toBeTrue();
  });

  it('content:[] vs missing content key（空段落）→ true', () => {
    const a: ProseMirrorJSON = { type: 'doc', content: [{ type: 'paragraph', content: [] }] };
    const b: ProseMirrorJSON = { type: 'doc', content: [{ type: 'paragraph' }] };
    expect(docEqualsIgnoringAttrs(a, b, [])).toBeTrue();
  });
});

// ── extractAndCleanExcelTable ─────────────────────────────────────────────────

describe('extractAndCleanExcelTable', () => {
  it('plan case 4: Excel HTML → 純 <table> 結構，無 mso- style / colgroup / style tag', () => {
    const excelHtml = `
      <style>td {mso-number-format:"@";}</style>
      <colgroup><col width="100"/></colgroup>
      <table class="xl65">
        <tr>
          <th style="mso-format:auto">名稱</th>
          <th>金額</th>
        </tr>
        <tr>
          <td class="xl66">記帳</td>
          <td>3000</td>
        </tr>
      </table>
    `;
    const result = extractAndCleanExcelTable(excelHtml);
    expect(result).not.toBeNull();
    expect(result!).toContain('<table>');
    expect(result!).toContain('名稱');
    expect(result!).toContain('3000');
    expect(result!).not.toContain('mso-');
    expect(result!).not.toContain('style=');
    expect(result!).not.toContain('colgroup');
  });

  it('完全空白列（僅 &nbsp;）被跳過', () => {
    const html = `
      <table>
        <tr><td>有內容</td></tr>
        <tr><td>&nbsp;</td></tr>
      </table>
    `;
    const result = extractAndCleanExcelTable(html);
    expect(result).not.toBeNull();
    const parser = new DOMParser();
    const doc = parser.parseFromString(result!, 'text/html');
    expect(doc.querySelectorAll('tr').length).toBe(1);
  });

  it('無 table 的 HTML → null', () => {
    expect(extractAndCleanExcelTable('<div>no table</div>')).toBeNull();
  });

  it('rowspan / colspan 保留（非 1 值）', () => {
    const html = `<table><tr><td rowspan="2">跨行</td><td>一般</td></tr><tr><td>次行</td></tr></table>`;
    const result = extractAndCleanExcelTable(html);
    expect(result).toContain('rowspan="2"');
    expect(result).not.toContain('rowspan="1"');
  });
});

// ── isMarkdownLike ────────────────────────────────────────────────────────────

describe('isMarkdownLike', () => {
  it('plan case 5a: **bold** → true', () => {
    expect(isMarkdownLike('**bold text**')).toBeTrue();
  });

  it('plan case 5b: GFM table → true', () => {
    expect(isMarkdownLike('| col1 | col2 |\n|------|------|\n| a | b |')).toBeTrue();
  });

  it('plan case 5c: unordered list → true', () => {
    expect(isMarkdownLike('- item 1\n- item 2')).toBeTrue();
  });

  it('plain HTML → false', () => {
    expect(isMarkdownLike('<p>plain HTML content</p>')).toBeFalse();
  });

  it('# heading → true', () => {
    expect(isMarkdownLike('# 標題\n內容')).toBeTrue();
  });

  it('numbered list → true', () => {
    expect(isMarkdownLike('1. 第一項\n2. 第二項')).toBeTrue();
  });

  it('inline link → true', () => {
    expect(isMarkdownLike('[Google](https://google.com)')).toBeTrue();
  });

  it('純中文文字（無 markdown 語法）→ false', () => {
    expect(isMarkdownLike('這是一段普通中文文字，沒有特殊格式')).toBeFalse();
  });
});

// ── isExcelHtml ───────────────────────────────────────────────────────────────

describe('isExcelHtml', () => {
  it('plan case 6a: 含 mso- office excel namespace → true', () => {
    const html = '<html xmlns:o="urn:schemas-microsoft-com" xmlns:x="urn:schemas-microsoft-com:office:excel">';
    expect(isExcelHtml(html)).toBeTrue();
  });

  it('plan case 6b: 含 meta Generator=Microsoft Excel → true', () => {
    const html = '<meta name="Generator" content="Microsoft Excel 15">';
    expect(isExcelHtml(html)).toBeTrue();
  });

  it('含 class="xl → true', () => {
    expect(isExcelHtml('<td class="xl65">value</td>')).toBeTrue();
  });

  it('普通 HTML → false', () => {
    expect(isExcelHtml('<table><tr><td>value</td></tr></table>')).toBeFalse();
  });
});

// ── isRichHtml ────────────────────────────────────────────────────────────────

describe('isRichHtml', () => {
  it('含 table tag 且長度 > 50 → true', () => {
    const html = '<div><table><tr><td>some cell content here</td></tr></table></div>';
    expect(isRichHtml(html)).toBeTrue();
  });

  it('含 strong tag → true', () => {
    const html = '<p>This is <strong>bold text with more content here</strong></p>';
    expect(isRichHtml(html)).toBeTrue();
  });

  it('長度 ≤ 50 的 HTML → false（太短視為簡單文字）', () => {
    expect(isRichHtml('<p>short</p>')).toBeFalse();
  });

  it('純文字（無 rich HTML tag）→ false', () => {
    expect(isRichHtml('This is plain text without any HTML tags, just a long string')).toBeFalse();
  });
});

// ── Toolbar 格式擴充：刪除線 / 底線 / 標題 / 顏色 ──────────────────────────────

describe('RichTextEditorComponent toolbar formats', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let comp: RichTextEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(RichTextEditorComponent);
    comp = fixture.componentInstance;
    // editor view 需掛在 document 中，chain().focus() 才有效（block transform 如 heading 依賴 focus）
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges(); // 觸發 ngAfterViewInit 建立 editor
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  function ed() {
    return comp.getEditor()!;
  }

  function selectAllText(html: string) {
    ed().commands.setContent(html);
    ed().commands.selectAll();
  }

  it('extensions 含 textStyle/color/strike/underline/heading', () => {
    const names = ed().extensionManager.extensions.map((e) => e.name);
    expect(names).toContain('textStyle');
    expect(names).toContain('color');
    expect(names).toContain('strike');
    expect(names).toContain('underline');
    expect(names).toContain('heading');
  });

  it('toggleStrike() → isActive(strike) 為 true', () => {
    selectAllText('<p>hello</p>');
    comp.toggleStrike();
    expect(comp.isActive('strike')).toBeTrue();
  });

  it('toggleUnderline() → isActive(underline) 為 true', () => {
    selectAllText('<p>hello</p>');
    comp.toggleUnderline();
    expect(comp.isActive('underline')).toBeTrue();
  });

  it('toggleHeading() → 段落變 H3；再 toggle → 回 paragraph', () => {
    // 用 cursor selection（非 selectAll）：toggle 後 cursor 留在 heading 內，isActive 判斷才一致
    ed().commands.setContent('<p>title</p>');
    ed().commands.setTextSelection(3);
    comp.toggleHeading();
    expect(ed().isActive('heading', { level: 3 })).toBeTrue();
    comp.toggleHeading();
    expect(ed().isActive('heading', { level: 3 })).toBeFalse();
  });

  it('applyColor(hex) → selection 套用 textStyle color；clearColor() → 移除', () => {
    selectAllText('<p>colored</p>');
    comp.applyColor('#cc5252');
    expect(ed().getAttributes('textStyle')['color']).toBe('#cc5252');
    comp.clearColor();
    expect(ed().getAttributes('textStyle')['color']).toBeFalsy();
  });

  // 持久化 round-trip：驗證新格式不會在「載入→序列化（存draft）→stripNodeAttrs」過程被 schema 丟棄
  it('持久化 round-trip 保留 heading/underline/strike/color（Codex: persisted-but-not-saved 驗證）', () => {
    const doc: ProseMirrorJSON = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '標題' }] },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: '色', marks: [{ type: 'textStyle', attrs: { color: '#cc5252' } }] },
            { type: 'text', text: '底', marks: [{ type: 'underline' }] },
            { type: 'text', text: '刪', marks: [{ type: 'strike' }] },
          ],
        },
      ],
    };
    // 1. 載入（模擬 reopen/reload）→ editor schema 必須認得這些 node/mark，否則 silently drop
    ed().commands.setContent(doc);
    // 2. 序列化（模擬存 draft 的 getJSON）
    const saved = JSON.stringify(ed().getJSON());
    expect(saved).toContain('"type":"heading"');
    expect(saved).toContain('"level":3');
    expect(saved).toContain('underline');
    expect(saved).toContain('strike');
    expect(saved).toContain('#cc5252');
    // 3. 經 fee-supplement 持久化序列化 stripNodeAttrs → 不得丟 marks/heading
    const stripped = JSON.stringify(stripNodeAttrs(ed().getJSON() as ProseMirrorJSON, ['displayUrl']));
    expect(stripped).toContain('"type":"heading"');
    expect(stripped).toContain('underline');
    expect(stripped).toContain('strike');
    expect(stripped).toContain('#cc5252');
  });

  // 色盤沿用舊前端 markdown-textarea 的 7 色（含紫）；曾因缺紫色無法對齊 CSV/舊前端。
  it('TEXT_COLORS = 預設(清除) + 舊前端 7 色（含紫 #805AD5）', () => {
    expect(comp.TEXT_COLORS.find(c => c.hex === null)?.label).toBe('預設');
    expect(comp.TEXT_COLORS.filter(c => c.hex).map(c => c.hex)).toEqual(
      ['#E53E3E', '#DD6B20', '#D4A017', '#38A169', '#2980AB', '#805AD5', '#718096'],
    );
  });
});

// ── hiddenTools：工具列縮減（回報問題場景；後端 Notion 轉換不支援 underline/color/table） ──

describe('RichTextEditorComponent hiddenTools', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let comp: RichTextEditorComponent;

  function create(hiddenTools: ReadonlyArray<'underline' | 'color' | 'table'>) {
    fixture = TestBed.createComponent(RichTextEditorComponent);
    comp = fixture.componentInstance;
    comp.hiddenTools = hiddenTools;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges(); // 觸發 ngAfterViewInit 建立 editor（extensions 於此組裝）
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RichTextEditorComponent],
    }).compileComponents();
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  function extensionNames(): string[] {
    return comp.getEditor()!.extensionManager.extensions.map((e) => e.name);
  }

  function query(testid: string): HTMLElement | null {
    return fixture.nativeElement.querySelector(`[data-testid="${testid}"]`);
  }

  it('預設（[]）：underline/color/table 按鈕與 extension 全部存在（酬金補充說明迴歸）', () => {
    create([]);
    expect(query('rte-underline')).not.toBeNull();
    expect(query('rte-color')).not.toBeNull();
    expect(query('rte-table')).not.toBeNull();
    const names = extensionNames();
    expect(names).toContain('underline');
    expect(names).toContain('table');
    expect(names).toContain('textStyle');
    expect(names).toContain('color');
  });

  it('hiddenTools 全傳：三顆按鈕不渲染', () => {
    create(['underline', 'color', 'table']);
    expect(query('rte-underline')).toBeNull();
    expect(query('rte-color')).toBeNull();
    expect(query('rte-table')).toBeNull();
    // 其餘工具不受影響
    expect(query('rte-heading')).not.toBeNull();
    expect(query('rte-strike')).not.toBeNull();
  });

  it('hiddenTools 全傳：schema 層同步關閉（Cmd+U / Excel 表格貼上都進不來）', () => {
    create(['underline', 'color', 'table']);
    const names = extensionNames();
    expect(names).not.toContain('underline');
    expect(names).not.toContain('table');
    expect(names).not.toContain('tableRow');
    expect(names).not.toContain('textStyle');
    expect(names).not.toContain('color');
    // schema 無 table node：插入表格指令無效果、內容不出現 table 節點
    comp.insertTable();
    expect(JSON.stringify(comp.getEditor()!.getJSON())).not.toContain('"table"');
  });

  it('只藏 table：underline/color 保留（部分縮減）', () => {
    create(['table']);
    expect(query('rte-underline')).not.toBeNull();
    expect(query('rte-color')).not.toBeNull();
    expect(query('rte-table')).toBeNull();
    expect(extensionNames()).not.toContain('table');
    expect(extensionNames()).toContain('underline');
  });
});

// ── tableStructureEditing：Notion 式 hover 把手 gate + 掛載 + 7 結構指令 ──

describe('RichTextEditorComponent tableStructureEditing', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let comp: RichTextEditorComponent;

  function create(opts: { tableStructureEditing?: boolean; readOnly?: boolean } = {}) {
    fixture = TestBed.createComponent(RichTextEditorComponent);
    comp = fixture.componentInstance;
    if (opts.tableStructureEditing !== undefined) comp.tableStructureEditing = opts.tableStructureEditing;
    if (opts.readOnly !== undefined) comp.readOnly = opts.readOnly;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges(); // 觸發 ngAfterViewInit 建 editor + 註冊 hover handler
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RichTextEditorComponent] }).compileComponents();
  });
  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
    // 清理殘留在 body 的把手 portal（避免跨 test 汙染）
    document.body.querySelectorAll('app-rte-table-grip').forEach(el => el.remove());
  });

  function ed() { return comp.getEditor()!; }
  function rowCount(): number {
    const json = ed().getJSON() as { content?: Array<{ type: string; content?: unknown[] }> };
    return json.content?.find(n => n.type === 'table')?.content?.length ?? 0;
  }
  function firstRowCells(): number {
    const json = ed().getJSON() as { content?: Array<{ type: string; content?: Array<{ content?: unknown[] }> }> };
    return json.content?.find(n => n.type === 'table')?.content?.[0]?.content?.length ?? 0;
  }
  function putCursorInTable() {
    comp.insertTable();                 // 3x3 含表頭
    ed().commands.setTextSelection(3);  // 游標移入第一個 cell
  }
  function gripInBody(dir: 'row' | 'col'): HTMLElement | null {
    return document.body.querySelector(`[data-testid="rte-grip-${dir}"]`);
  }
  /** 模擬 hover 表格第一個 cell（mousemove 冒泡到 editorHost 觸發把手掛載）。 */
  function hoverFirstCell() {
    comp.insertTable();
    const cell = ed().view.dom.querySelector('td, th') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
  }

  // ── gate ──
  it('tableStructureEditing 預設 false', () => {
    create();
    expect(comp.tableStructureEditing).toBeFalse();
  });

  it('flag=true：hover table cell → 列/欄把手掛載到 body', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();
    expect(gripInBody('row')).not.toBeNull();
    expect(gripInBody('col')).not.toBeNull();
  });

  it('flag=true：tap/鍵盤進 cell（selectionUpdate）→ 把手掛載（觸控裝置無 hover 靠此）', () => {
    create({ tableStructureEditing: true });
    putCursorInTable(); // insertTable + setTextSelection → selectionUpdate 觸發（不依賴 mousemove）
    expect(gripInBody('row')).not.toBeNull();
    expect(gripInBody('col')).not.toBeNull();
  });

  it('flag=false：hover cell 不掛把手（gate 不外溢 HDM/其他 consumer）', () => {
    create({ tableStructureEditing: false });
    hoverFirstCell();
    expect(gripInBody('row')).toBeNull();
    expect(gripInBody('col')).toBeNull();
  });

  it('readOnly=true：即使 flag=true 也不掛把手（唯讀 view 不受影響）', () => {
    create({ tableStructureEditing: true, readOnly: true });
    ed().commands.setContent('<table><tbody><tr><td>x</td></tr></tbody></table>');
    const cell = ed().view.dom.querySelector('td') as HTMLElement | null;
    cell?.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    expect(gripInBody('row')).toBeNull();
  });

  // ── 7 結構指令（真 editor 行為；作用於當前選區所在列/欄）──
  it('addRowAfter() → 列數 +1', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    const before = rowCount(); comp.addRowAfter();
    expect(rowCount()).toBe(before + 1);
  });
  it('addRowBefore() → 列數 +1', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    const before = rowCount(); comp.addRowBefore();
    expect(rowCount()).toBe(before + 1);
  });
  it('deleteRow() → 列數 -1', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    const before = rowCount(); comp.deleteRow();
    expect(rowCount()).toBe(before - 1);
  });
  it('addColumnAfter() → 每列 cell 數 +1', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    const before = firstRowCells(); comp.addColumnAfter();
    expect(firstRowCells()).toBe(before + 1);
  });
  it('addColumnBefore() → 每列 cell 數 +1', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    const before = firstRowCells(); comp.addColumnBefore();
    expect(firstRowCells()).toBe(before + 1);
  });
  it('deleteColumn() → 每列 cell 數 -1', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    const before = firstRowCells(); comp.deleteColumn();
    expect(firstRowCells()).toBe(before - 1);
  });
  it('deleteTable() → table 節點消失', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    comp.deleteTable();
    expect(JSON.stringify(ed().getJSON())).not.toContain('"table"');
  });

  // ── clear / duplicate（純前端 ProseMirror；作用於當前選區所在列/欄）──
  /** 取 table 中第 rowIndex 列所有 cell 的純文字串接。 */
  function rowText(rowIndex: number): string {
    const json = ed().getJSON() as { content?: Array<{ type: string; content?: unknown[] }> };
    const table = json.content?.find(n => n.type === 'table');
    const row = (table?.content?.[rowIndex] as { content?: unknown[] } | undefined);
    return JSON.stringify(row?.content ?? []);
  }

  it('clearRow() → 該列每 cell 內容清空、列數/欄數不變', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    ed().commands.insertContent('hello');      // 打字進第一列第一個 cell
    ed().commands.setTextSelection(3);          // 游標回到第一列
    const beforeRows = rowCount();
    const beforeCells = firstRowCells();
    comp.clearRow();
    expect(rowCount()).toBe(beforeRows);        // 列數不變
    expect(firstRowCells()).toBe(beforeCells);  // 欄數不變
    expect(rowText(0)).not.toContain('hello');  // 內容清空
  });

  it('duplicateRow() → 列數 +1、內容複製', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    ed().commands.insertContent('dup');
    ed().commands.setTextSelection(3);
    const before = rowCount();
    comp.duplicateRow();
    expect(rowCount()).toBe(before + 1);
    // 'dup' 至少出現兩次（原列 + 複本列）
    const occurrences = JSON.stringify(ed().getJSON()).split('dup').length - 1;
    expect(occurrences).toBeGreaterThanOrEqual(2);
  });

  it('clearColumn() → 該欄每 cell 內容清空、列數/欄數不變', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    ed().commands.insertContent('hello');
    ed().commands.setTextSelection(3);
    const beforeRows = rowCount();
    const beforeCells = firstRowCells();
    comp.clearColumn();
    expect(rowCount()).toBe(beforeRows);
    expect(firstRowCells()).toBe(beforeCells);
    expect(rowText(0)).not.toContain('hello');  // 第一列第一欄已清空
  });

  it('duplicateColumn() → 每列 cell 數 +1', () => {
    create({ tableStructureEditing: true }); putCursorInTable();
    const before = firstRowCells();
    comp.duplicateColumn();
    expect(firstRowCells()).toBe(before + 1);
  });

  // ── 選單開啟時高亮該列/欄操作範圍（Notion 式整塊外框 + 淡藍底）──
  // 斷言實際渲染的 cell classList（非只內部 state）；高亮由 grip 選單 menuStateChange 驅動。
  const HL_CLASSES = ['rte-hl-row', 'rte-hl-row-start', 'rte-hl-row-end', 'rte-hl-col', 'rte-hl-col-start', 'rte-hl-col-end'];
  function allCells(): HTMLElement[] {
    return Array.from(ed().view.dom.querySelectorAll('td, th')) as HTMLElement[];
  }
  function anyHighlighted(): boolean {
    return allCells().some(c => HL_CLASSES.some(cls => c.classList.contains(cls)));
  }

  it('列把手選單開啟 → 該列所有 cell 加 rte-hl-row，首/尾 cell 加 start/end 端點 class', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();                                   // hover 第一列（表頭）→ 掛列/欄把手
    (gripInBody('row') as HTMLElement).click();         // 開列選單 → menuStateChange(true) → highlightScope('row')
    const headerRow = ed().view.dom.querySelector('tr') as HTMLElement;
    const cells = Array.from(headerRow.children) as HTMLElement[];
    expect(cells.length).toBe(3);
    cells.forEach(c => expect(c.classList.contains('rte-hl-row')).toBeTrue());
    expect(cells[0].classList.contains('rte-hl-row-start')).toBeTrue();
    expect(cells[2].classList.contains('rte-hl-row-end')).toBeTrue();
    // 中間格不帶端點 class（外框左右只在首尾格 → 內部分隔線維持灰）
    expect(cells[1].classList.contains('rte-hl-row-start')).toBeFalse();
    expect(cells[1].classList.contains('rte-hl-row-end')).toBeFalse();
  });

  it('欄把手選單開啟 → 該欄每列 cell 加 rte-hl-col（跨 th+td），首/尾 cell 加 start/end', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();                                   // 第 0 欄
    (gripInBody('col') as HTMLElement).click();         // 開欄選單 → highlightScope('col')
    const rows = Array.from(ed().view.dom.querySelectorAll('tr')) as HTMLElement[];
    const colCells = rows.map(r => r.children[0] as HTMLElement);
    expect(colCells.length).toBe(3);
    colCells.forEach(c => expect(c.classList.contains('rte-hl-col')).toBeTrue());
    expect(colCells[0].classList.contains('rte-hl-col-start')).toBeTrue();   // 表頭 th（欄頂）
    expect(colCells[2].classList.contains('rte-hl-col-end')).toBeTrue();     // 最後 td（欄底）
  });

  it('選單關閉（再次 toggle）→ 所有 cell 高亮 class 清除', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();
    const rowBtn = gripInBody('row') as HTMLElement;
    rowBtn.click();                                     // 開
    expect(anyHighlighted()).toBeTrue();
    rowBtn.click();                                     // 關 → menuStateChange(false) → clearHighlight
    expect(anyHighlighted()).toBeFalse();
  });

  it('detachGrips → 高亮 class 清除（hover 收起 / 元件銷毀共用此 choke-point）', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();
    (gripInBody('row') as HTMLElement).click();
    expect(anyHighlighted()).toBeTrue();
    (comp as unknown as { detachGrips(): void }).detachGrips();
    expect(anyHighlighted()).toBeFalse();
  });

  it('選單開啟後執行結構指令（onGripPick）→ 高亮不殘留', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();
    (gripInBody('row') as HTMLElement).click();
    expect(anyHighlighted()).toBeTrue();
    (comp as unknown as { onGripPick(dir: 'row' | 'col', id: string): void }).onGripPick('row', 'addBelow');
    expect(rowCount()).toBe(4);                          // 指令生效（列數 +1）
    expect(anyHighlighted()).toBeFalse();                // 高亮清乾淨、無殘留
  });

  it('高亮以 ProseMirror Decoration 實作（非 classList）→ plugin state 內有 decoration', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();
    (gripInBody('row') as HTMLElement).click();
    const set = tableHighlightKey.getState(ed().state);
    expect(set).toBeTruthy();
    expect(set!.find().length).toBeGreaterThan(0);       // 由 PM 管理，每次 render 重新套用、重繪抹不掉
  });

  it('高亮後 doc 變動觸發 PM 重繪 → 高亮仍在（decoration 隨 mapping 保留並重套；classList 版此處會被抹掉）', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();
    (gripInBody('row') as HTMLElement).click();
    expect(anyHighlighted()).toBeTrue();
    ed().chain().focus().insertContentAt(3, 'x').run();  // header cell 內容變動 → nodeview 重繪
    expect(anyHighlighted()).toBeTrue();                 // decoration 存活（PM 重新套用），classList 版會歸零
  });

  it('單一 cell 的列（1x1）選單開啟 → 該 cell 同帶 row + start + end（四邊皆描）', () => {
    create({ tableStructureEditing: true });
    ed().commands.setContent('<table><tbody><tr><td>x</td></tr></tbody></table>');
    const cell = ed().view.dom.querySelector('td, th') as HTMLElement;
    cell.dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));   // 掛把手
    (gripInBody('row') as HTMLElement).click();
    expect(cell.classList.contains('rte-hl-row')).toBeTrue();
    expect(cell.classList.contains('rte-hl-row-start')).toBeTrue();
    expect(cell.classList.contains('rte-hl-row-end')).toBeTrue();
  });

  it('切換把手：列選單開→欄選單開，欄高亮生效且列高亮不殘留（方向守衛）', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();
    (gripInBody('row') as HTMLElement).click();          // 列高亮
    expect(allCells().some(c => c.classList.contains('rte-hl-row'))).toBeTrue();
    (gripInBody('col') as HTMLElement).click();          // 切欄：highlightScope('col') 先 clear 再套
    expect(allCells().some(c => c.classList.contains('rte-hl-col'))).toBeTrue();  // 欄高亮生效
    expect(allCells().some(c => c.classList.contains('rte-hl-row'))).toBeFalse(); // 列高亮不殘留
  });

  it('flag=false：把手不掛、無法開選單 → 無任何高亮（gate 不外溢）', () => {
    create({ tableStructureEditing: false });
    hoverFirstCell();
    expect(gripInBody('row')).toBeNull();
    expect(anyHighlighted()).toBeFalse();
  });

  it('選單開啟中游標移過其他列 → 選單項凍結（表頭列選單不冒出「上方插入列」）', () => {
    create({ tableStructureEditing: true });
    hoverFirstCell();  // hover 表頭列（第一列）→ 掛列把手，表頭 gate：選單無 addAbove
    const rowRef = (comp as unknown as {
      rowGripRef: { instance: { toggle(): void }; changeDetectorRef: { detectChanges(): void } };
    }).rowGripRef;
    rowRef.instance.toggle();                 // 開選單 → gripMenuOpen=true
    rowRef.changeDetectorRef.detectChanges();  // render 選單項（zone 外，手動 CD）
    // 選單有渲染，且表頭列無「上方插入列」
    expect(document.body.querySelector('[data-testid="rte-grip-item-addBelow"]')).not.toBeNull();
    expect(document.body.querySelector('[data-testid="rte-grip-item-addAbove"]')).toBeNull();
    // 游標移到非表頭列 cell（若無守衛會重指把手、把選單項換成含 addAbove 的完整版）
    const cells = ed().view.dom.querySelectorAll('td, th');
    (cells[cells.length - 1] as HTMLElement).dispatchEvent(new MouseEvent('mousemove', { bubbles: true }));
    rowRef.changeDetectorRef.detectChanges();
    // 凍結：addAbove 仍不出現
    expect(document.body.querySelector('[data-testid="rte-grip-item-addAbove"]')).toBeNull();
  });
});
