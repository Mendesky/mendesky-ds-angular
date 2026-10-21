import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProseMirrorJSON } from '@mendesky/ds';
import { RichTextEditorComponent, type RichTextEditorTool } from './rich-text-editor.component';
import { tableHighlightKey } from './table-toolbar/rte-table-highlight.plugin';
import {
  TEXT_COLORS,
  docEqualsIgnoringAttrs,
  extractAndCleanExcelTable,
  isMarkdownLike,
  isExcelHtml,
  isOfficeHtml,
  isRichHtml,
  normalizeOfficeHtml,
  snapPasteColor,
  stripNodeAttrs,
} from './rich-text-editor.helpers';
import {
  EXCEL_MAC_HTML,
  GOOGLE_DOCS_HTML,
  MAC_MAIL_HTML,
  WORD_EMAIL_HTML,
  WORD_MAC_SAFARI_HTML,
  WORD_WIN_HTML,
} from './rich-text-editor.paste-fixtures';

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
          <td class="xl66">文具</td>
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
  // ── 正向：只認「Excel 專屬的 meta 指紋」，且必須 quote-agnostic ──
  // 2026-08-03 實機擷取顯示，同一份 Excel HTML 內兩種引號方言並存：
  //   <meta name=ProgId content=Excel.Sheet>              ← 無引號
  //   <meta name=Generator content="Microsoft Excel 15">  ← 有引號

  it('真實 Excel（macOS）→ true', () => {
    expect(isExcelHtml(EXCEL_MAC_HTML)).toBeTrue();
  });

  it('meta ProgId=Excel.Sheet 無引號 → true', () => {
    expect(isExcelHtml('<meta name=ProgId content=Excel.Sheet>')).toBeTrue();
  });

  it('meta ProgId="Excel.Sheet" 有引號 → true', () => {
    expect(isExcelHtml('<meta name="ProgId" content="Excel.Sheet">')).toBeTrue();
  });

  it('meta Generator=Microsoft Excel 有引號 → true', () => {
    expect(isExcelHtml('<meta name="Generator" content="Microsoft Excel 15">')).toBeTrue();
  });

  it('meta Generator=Microsoft Excel 無引號 → true', () => {
    expect(isExcelHtml('<meta name=Generator content="Microsoft Excel 16">')).toBeTrue();
  });

  // ── 負向：Word 三方言一律不得判為 Excel ──
  // 這三條是「Word/Outlook 貼上完全沒反應」的核心迴歸測試：
  // 誤判為 Excel → extractAndCleanExcelTable 找不到 <table> 回 null
  // → onPaste 什麼都沒插入卻 return true → ProseMirror 取消預設貼上。

  it('真實 Word（Windows）→ false（誤判會導致死貼上）', () => {
    expect(isExcelHtml(WORD_WIN_HTML)).toBeFalse();
  });

  it('真實 Word（macOS Safari，完全無 meta）→ false（誤判會導致死貼上）', () => {
    expect(isExcelHtml(WORD_MAC_SAFARI_HTML)).toBeFalse();
  });

  it('真實 Word email（filtered medium，含 xmlns:x=office:excel）→ false', () => {
    // 這份是 Word 卻宣告了 Excel 命名空間 → 證明 Excel 判準不得用任何 xmlns
    expect(WORD_EMAIL_HTML).toContain('urn:schemas-microsoft-com:office:excel');
    expect(isExcelHtml(WORD_EMAIL_HTML)).toBeFalse();
  });

  it('macOS Mail（WebKit inline-style 序列化）→ false', () => {
    expect(isExcelHtml(MAC_MAIL_HTML)).toBeFalse();
  });

  it('普通 HTML → false', () => {
    expect(isExcelHtml('<table><tr><td>value</td></tr></table>')).toBeFalse();
  });

  it('僅 xmlns:o office namespace（Office 共用，非 Excel 專屬）→ false', () => {
    const html = '<html xmlns:o="urn:schemas-microsoft-com:office:office">';
    expect(isExcelHtml(html)).toBeFalse();
  });

  it('class="xl65"（Excel 實測不輸出此形式，只會誤傷網頁）→ false', () => {
    expect(isExcelHtml('<td class="xl65">value</td>')).toBeFalse();
  });
});

// ── isRichHtml ────────────────────────────────────────────────────────────────

describe('isRichHtml', () => {
  // isRichHtml 是「要不要放行 markdown 重繪路徑」的閘門：回 false 且 text/plain 像 markdown
  // 時，整包 HTML 會被丟棄改用 markdown-it 重繪。因此白名單太窄 = 真實 HTML 被吃掉。
  // 2026-08-03 實測：macOS Mail 一整封信 8KB，舊白名單（table|ul|ol|strong|em|b|i|h1-6）
  // 一個都不命中 → 只因該信 text/plain 剛好不像 markdown 才逃過；有「1. …」編號就會中。

  it('含 table tag 且長度 > 50 → true', () => {
    const html = '<div><table><tr><td>some cell content here</td></tr></table></div>';
    expect(isRichHtml(html)).toBeTrue();
  });

  it('含 strong tag → true', () => {
    const html = '<p>This is <strong>bold text with more content here</strong></p>';
    expect(isRichHtml(html)).toBeTrue();
  });

  it('真實 macOS Mail（只有 p + span[style]，無舊白名單 tag）→ true', () => {
    expect(isRichHtml(MAC_MAIL_HTML)).toBeTrue();
  });

  it('只有 p 的長 HTML → true（段落結構是 markdown 表達不了的資訊）', () => {
    const html = '<p>第一段落內容，這裡要夠長才能通過既有的 50 字元長度門檻</p><p>第二段落內容也一樣要夠長</p>';
    expect(html.length).toBeGreaterThan(50); // 守住 fixture 本身：太短會因長度門檻假紅
    expect(isRichHtml(html)).toBeTrue();
  });

  it('只有 div 的長 HTML → true', () => {
    const html = '<div>第一區塊內容，這裡要夠長以通過長度門檻</div><div>第二區塊內容也一樣夠長</div>';
    expect(isRichHtml(html)).toBeTrue();
  });

  it('只有 br 的長 HTML → true（換行是 markdown 難以無損表達的結構）', () => {
    const html = 'plain text line one with enough length<br>line two also with enough length';
    expect(isRichHtml(html)).toBeTrue();
  });

  it('含 a href 的長 HTML → true', () => {
    const html = 'see <a href="https://example.com/docs">this documentation page</a> for more detail';
    expect(isRichHtml(html)).toBeTrue();
  });

  it('長度 ≤ 50 的 HTML → false（太短視為簡單文字）', () => {
    expect(isRichHtml('<p>short</p>')).toBeFalse();
  });

  it('純文字（完全無 HTML tag）→ false（此時才放行 markdown 重繪）', () => {
    expect(isRichHtml('This is plain text without any HTML tags, just a long string')).toBeFalse();
  });

  it('純 markdown 原始碼（無 HTML tag）→ false（markdown 自動轉換仍須生效）', () => {
    expect(isRichHtml('**粗體字**\n- 清單項目一\n- 清單項目二\n1. 編號項目\n\n更多純文字內容')).toBeFalse();
  });
});

// ── isOfficeHtml ──────────────────────────────────────────────────────────────
// 「要不要跑 Office 正規化」的判準（與 isExcelHtml 的「要不要走表格清洗」不同）。
// 必須是多訊號 OR：Word 三方言的共同點只有 xmlns:o/w 與 Mso class / mso-list style，
// macOS Safari 那份連一個 <meta> 都沒有。

describe('isOfficeHtml', () => {
  it('真實 Word（Windows）→ true', () => {
    expect(isOfficeHtml(WORD_WIN_HTML)).toBeTrue();
  });

  it('真實 Word（macOS Safari，無任何 meta）→ true', () => {
    expect(isOfficeHtml(WORD_MAC_SAFARI_HTML)).toBeTrue();
  });

  it('真實 Word email（filtered medium）→ true', () => {
    expect(isOfficeHtml(WORD_EMAIL_HTML)).toBeTrue();
  });

  it('真實 Excel（macOS）→ true', () => {
    expect(isOfficeHtml(EXCEL_MAC_HTML)).toBeTrue();
  });

  it('macOS Mail（WebKit 序列化）→ false（現況正常，不得被正規化介入）', () => {
    expect(isOfficeHtml(MAC_MAIL_HTML)).toBeFalse();
  });

  it('Google Docs → false（TipTap Bold 的兩道防線已能正確處理，不得介入）', () => {
    expect(isOfficeHtml(GOOGLE_DOCS_HTML)).toBeFalse();
  });

  it('一般網頁 HTML → false', () => {
    expect(isOfficeHtml('<div><h2>標題</h2><p>內容</p><ul><li>項目</li></ul></div>')).toBeFalse();
  });

  it('空字串 → false', () => {
    expect(isOfficeHtml('')).toBeFalse();
  });
});

// ── snapPasteColor ────────────────────────────────────────────────────────────
// 貼上的顏色吸附到編輯器色盤（使用者 2026-08-03 拍板「文字顏色應該要用編輯器有支援的顏色」）。
// 規則：無彩色（黑／白／低飽和灰）→ null＝預設色；有彩色 → 色相最近的色盤色。
// 為什麼無彩色不映射到「灰 #718096」：Word 正文絕大多數帶顯式 color:black，
// 按最近色硬算會讓每次貼上全文變淺灰。代價是「灰」無法經由貼上取得（明確接受）。

describe('snapPasteColor', () => {
  it('#000000（Word 正文預設）→ null，不得變成灰 #718096', () => {
    expect(snapPasteColor('#000000')).toBeNull();
  });

  it('#FFFFFF → null（Excel 深藍底標題列白字的隱形防線）', () => {
    expect(snapPasteColor('#FFFFFF')).toBeNull();
  });

  it('white（色名）→ null', () => {
    expect(snapPasteColor('white')).toBeNull();
  });

  it('windowtext（CSS 系統色關鍵字，實測 Excel 使用）→ null', () => {
    expect(snapPasteColor('windowtext')).toBeNull();
  });

  it('rgb(51, 51, 51)（深灰）→ null', () => {
    expect(snapPasteColor('rgb(51, 51, 51)')).toBeNull();
  });

  it('transparent → null', () => {
    expect(snapPasteColor('transparent')).toBeNull();
  });

  it('#FF0000 → 紅 #E53E3E', () => {
    expect(snapPasteColor('#FF0000')).toBe('#E53E3E');
  });

  it('#EE0000（實測 Word 紅色標題原始值）→ 紅 #E53E3E', () => {
    expect(snapPasteColor('#EE0000')).toBe('#E53E3E');
  });

  it('rgb(238, 0, 0) !important（實測 macOS Mail，必須 strip !important）→ 紅 #E53E3E', () => {
    expect(snapPasteColor('rgb(238, 0, 0) !important')).toBe('#E53E3E');
  });

  it('red（色名）→ 紅 #E53E3E', () => {
    expect(snapPasteColor('red')).toBe('#E53E3E');
  });

  it('#0070C0（Word 標準藍）→ 藍 #2980AB', () => {
    expect(snapPasteColor('#0070C0')).toBe('#2980AB');
  });

  it('#00B050（Word 標準綠）→ 綠 #38A169', () => {
    expect(snapPasteColor('#00B050')).toBe('#38A169');
  });

  it('#7030A0（Word 標準紫）→ 紫 #805AD5', () => {
    expect(snapPasteColor('#7030A0')).toBe('#805AD5');
  });

  it('#FFC000（Word 標準橙黃）→ 黃 #D4A017', () => {
    expect(snapPasteColor('#FFC000')).toBe('#D4A017');
  });

  it('空字串 / 無法解析 → null（不得 throw）', () => {
    expect(snapPasteColor('')).toBeNull();
    expect(snapPasteColor('not-a-color')).toBeNull();
    expect(snapPasteColor(null)).toBeNull();
    expect(snapPasteColor(undefined)).toBeNull();
  });

  it('回傳值一律屬於 TEXT_COLORS 的 hex 或 null（不得產生色盤外的顏色）', () => {
    const allowed = TEXT_COLORS.filter(c => c.hex).map(c => c.hex);
    const inputs = ['#FF0000', '#0070C0', '#00B050', '#7030A0', '#FFC000', '#FF8800', '#8B00FF', '#00FFFF'];
    for (const input of inputs) {
      const out = snapPasteColor(input);
      expect(out).not.toBeNull();
      expect(allowed).toContain(out!);
    }
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
    // 3. 經持久化前的 stripNodeAttrs → 不得丟 marks/heading
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

  function create(hiddenTools: ReadonlyArray<RichTextEditorTool>) {
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

  it('預設（[]）：underline/color/table 按鈕與 extension 全部存在（預設工具列迴歸）', () => {
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

  // 某些欄位只要兩種清單：文字格式會一路存成 markdown 並印進匯出的 PDF，
  // 出現粗體／標題不是想要的結果。**藏按鈕不夠**——StarterKit 帶鍵盤快速鍵與 markdown
  // input rule，⌘B 與打 `**粗體**` 照樣生效，所以 extension 必須一起關（比照既有的 underline）。
  it('hiddenTools 含 bold/italic/strike/heading：按鈕與 extension 都不存在', () => {
    create(['bold', 'italic', 'strike', 'heading']);

    expect(query('rte-bold')).toBeNull();
    expect(query('rte-italic')).toBeNull();
    expect(query('rte-strike')).toBeNull();
    expect(query('rte-heading')).toBeNull();

    const names = extensionNames();
    expect(names).not.toContain('bold');
    expect(names).not.toContain('italic');
    expect(names).not.toContain('strike');
    expect(names).not.toContain('heading');
  });

  it('只藏文字格式時，兩種清單仍在（服務內容要用的就是它們）', () => {
    create(['bold', 'italic', 'strike', 'heading', 'underline', 'color', 'table']);

    expect(query('rte-bullet-list')).not.toBeNull();
    expect(query('rte-ordered-list')).not.toBeNull();
    const names = extensionNames();
    expect(names).toContain('bulletList');
    expect(names).toContain('orderedList');
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

  it('flag=false：hover cell 不掛把手（gate 不外溢到其他 consumer）', () => {
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

// ── 貼上分派（onPaste）：結構性保證「不吞內容」 ────────────────────────────────
//
// 這一組守的是一條硬規則：**任何分支若產不出可插入內容，一律 return false 把控制權
// 交還 ProseMirror**（PM 對不認識的元素是保留內文往下遞迴，交還不會吃掉內容）。
// 原本只有 Excel 分支允許「沒插入也 return true」，把「嗅探錯誤」升級成「內容永久遺失」。

describe('RichTextEditorComponent paste dispatch', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let comp: RichTextEditorComponent;

  function create(hiddenTools: ReadonlyArray<'underline' | 'color' | 'table'> = []) {
    fixture = TestBed.createComponent(RichTextEditorComponent);
    comp = fixture.componentInstance;
    comp.hiddenTools = hiddenTools;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RichTextEditorComponent] }).compileComponents();
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  function ed() {
    return comp.getEditor()!;
  }

  /** 組出真實 ClipboardEvent（karma 跑真 Chrome，DataTransfer / ClipboardEvent 都可用）。 */
  function pasteEvent(parts: { html?: string; text?: string; withImage?: boolean }): ClipboardEvent {
    const dt = new DataTransfer();
    if (parts.html) dt.setData('text/html', parts.html);
    if (parts.text) dt.setData('text/plain', parts.text);
    if (parts.withImage) {
      dt.items.add(new File([new Uint8Array([137, 80, 78, 71])], 'clip.png', { type: 'image/png' }));
    }
    return new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true });
  }

  function callOnPaste(e: ClipboardEvent): boolean {
    return (comp as unknown as { onPaste(e: ClipboardEvent): boolean }).onPaste(e);
  }

  // ── 死貼上迴歸：Word 三方言都必須交還 ProseMirror 且真的有內容進來 ──

  it('Word（Windows）→ onPaste 回 false（交還 PM），不得宣告已處理', () => {
    create();
    expect(callOnPaste(pasteEvent({ html: WORD_WIN_HTML, text: 'Item1\nItem 2\nSome text' }))).toBeFalse();
  });

  it('Word（macOS Safari）→ onPaste 回 false', () => {
    create();
    expect(callOnPaste(pasteEvent({ html: WORD_MAC_SAFARI_HTML, text: 'Item1\nSome text' }))).toBeFalse();
  });

  it('Word email（filtered medium）→ onPaste 回 false', () => {
    create();
    expect(callOnPaste(pasteEvent({ html: WORD_EMAIL_HTML, text: '前言段落\nItem1' }))).toBeFalse();
  });

  it('Word（Windows）實際 dispatch 到編輯器 → 內文非空且含來源文字（原始 bug 的端到端迴歸）', () => {
    create();
    ed().view.dom.dispatchEvent(pasteEvent({ html: WORD_WIN_HTML, text: 'Item1\nItem 2\nSome text' }));
    const text = ed().getText();
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain('Item1');
    expect(text).toContain('Some text');
  });

  it('Word email 含表格外段落 → 表格前後的段落都在（不得只留第一張表）', () => {
    create();
    ed().view.dom.dispatchEvent(pasteEvent({ html: WORD_EMAIL_HTML, text: '前言段落\nItem1\nItem 2\n後記段落' }));
    const text = ed().getText();
    expect(text).toContain('前言段落');
    expect(text).toContain('後記段落');
  });

  // ── image flavor 共存：Excel 與 Word 的 clipboard 都同時帶 image/png（2026-08-03 實測）──
  // 若 image 分支排在 HTML 之前，或未檢查宿主是否訂閱 imagePasted，會把整包文字換成一張
  // 儲存格截圖、或在未綁 (imagePasted) 的宿主直接吞掉貼上。

  it('Word HTML ＋ image/png 共存 → 走文字路徑，不得 emit imagePasted', () => {
    create();
    let emitted = 0;
    comp.imagePasted.subscribe(() => emitted++);
    ed().view.dom.dispatchEvent(pasteEvent({ html: WORD_WIN_HTML, text: 'Item1', withImage: true }));
    expect(emitted).toBe(0);
    expect(ed().getText()).toContain('Item1');
  });

  it('Excel HTML ＋ image/png 共存 → 走表格路徑，不得 emit imagePasted（儲存格截圖須被吞掉）', () => {
    create();
    let emitted = 0;
    comp.imagePasted.subscribe(() => emitted++);
    expect(callOnPaste(pasteEvent({ html: EXCEL_MAC_HTML, text: '編號\t項目\t金額', withImage: true }))).toBeTrue();
    expect(emitted).toBe(0);
  });

  it('只有圖片（無 HTML）且宿主已訂閱 imagePasted → emit 並接手', () => {
    create();
    let emitted = 0;
    comp.imagePasted.subscribe(() => emitted++);
    expect(callOnPaste(pasteEvent({ withImage: true }))).toBeTrue();
    expect(emitted).toBe(1);
  });

  it('只有圖片（無 HTML）但宿主未訂閱 imagePasted → 回 false，不得吞掉貼上', () => {
    // 不是每個宿主都有綁 (imagePasted)：若無此守衛就是「emit 進虛空 + 吞掉貼上」
    create();
    expect(callOnPaste(pasteEvent({ withImage: true }))).toBeFalse();
  });

  // ── markdown 劫持：有語意 HTML 時不得丟棄 HTML 改用 text/plain 重繪 ──

  it('HTML 只有 p（無舊白名單 tag）＋ text/plain 像 markdown → 交還 PM，HTML 不得被丟棄', () => {
    create();
    const html =
      '<p>第一段落內容，這裡刻意寫得長一些，確保整段 HTML 的字元數超過 isRichHtml 既有的 50 字元門檻</p>' +
      '<p>第二段落內容，同樣是一般段落，沒有任何舊白名單裡的語意標籤</p>';
    expect(html.length).toBeGreaterThan(50); // 守住 fixture 本身：太短會因長度門檻假紅
    expect(callOnPaste(pasteEvent({ html, text: '1. 第一項\n2. 第二項' }))).toBeFalse();
  });

  it('macOS Mail → 交還 PM（現況正常的 baseline，不得回歸）', () => {
    create();
    expect(callOnPaste(pasteEvent({ html: MAC_MAIL_HTML, text: '為解決排班系統、ERP 及人資 HRS' }))).toBeFalse();
    ed().view.dom.dispatchEvent(pasteEvent({ html: MAC_MAIL_HTML, text: '為解決排班系統' }));
    expect(ed().getText()).toContain('排班系統');
  });

  it('只有 text/plain 的 markdown（無 text/html）→ 仍自動轉為格式化內容（既有功能不得被破壞）', () => {
    create();
    expect(callOnPaste(pasteEvent({ text: '**粗體字**\n- 清單項目' }))).toBeTrue();
    expect(JSON.stringify(ed().getJSON())).toContain('bulletList');
  });

  // ── Excel 表格清洗：反向護欄 ＋ schema 無 table node 時不得硬插 ──

  it('Excel（只有一張表格）→ 接手清洗，doc 含 table 且不含 mso-', () => {
    create();
    expect(callOnPaste(pasteEvent({ html: EXCEL_MAC_HTML, text: '編號\t項目\t金額' }))).toBeTrue();
    const json = JSON.stringify(ed().getJSON());
    expect(json).toContain('"table"');
    expect(json).not.toContain('mso-');
    expect(ed().getText()).toContain('文具');
  });

  it('Excel 但 schema 無 table node（hiddenTools 含 table）→ 回 false 交還 PM，不得插入無處落地的 table', () => {
    create(['underline', 'color', 'table']);
    expect(comp.getEditor()!.schema.nodes['table']).toBeUndefined();
    expect(callOnPaste(pasteEvent({ html: EXCEL_MAC_HTML, text: '編號\t項目\t金額' }))).toBeFalse();
  });

  it('判為 Excel 但抽不到表格 → 回 false（不得「沒插入卻 return true」）', () => {
    create();
    const excelNoTable = '<meta name=ProgId content=Excel.Sheet><div>只有文字沒有表格的 Excel 圖表複製</div>';
    expect(callOnPaste(pasteEvent({ html: excelNoTable, text: '只有文字' }))).toBeFalse();
  });

  it('無 clipboardData → 回 false', () => {
    create();
    expect(callOnPaste(new ClipboardEvent('paste'))).toBeFalse();
  });
});

// ── normalizeOfficeHtml：Office 格式保真 ──────────────────────────────────────
//
// 掛在 `editorProps.transformPastedHTML`，只在 `isOfficeHtml` 為真時作用。
// 三件事在架構上非做不可：
// 1. Excel 的顏色/粗體住在 <style> 的 class 規則裡，而 ProseMirror **明確忽略 <style>**、
//    只讀 inline style attribute → 不 inline 化就拿不到（實測 macOS Excel 無 class=xl##，
//    故必須泛用任意 class 命名，不得寫死 .xl##）
// 2. Word 的清單不是 ul/li，是 <p class=MsoListParagraph style='mso-list:lN levelM'>
//    ＋被 <![if !supportLists]> 包住的符號 span；<![if]> 在 HTML5 是 bogus comment，
//    只有標記本身變註解、中間的符號 span 仍是活的 DOM → 不處理就會外洩字面「·」「1.」
// 3. colwidth / align 序列化層存不回去（serializeTableAsHtml 只存 colspan/rowspan）
//    → 必須主動 strip，否則是「編輯器看得到、reopen 變預設」的前後端不一致

describe('normalizeOfficeHtml', () => {
  function parse(html: string): Document {
    return new DOMParser().parseFromString(html, 'text/html');
  }

  // ── <style> class 規則 inline 化（泛用命名）──

  it('任意 class 命名的 <style> 規則都 inline 化（不得寫死 .xl##）', () => {
    const html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office">' +
      '<head><style><!--.xl65{color:#FF0000;font-weight:700} .head0{color:#0070C0;font-weight:700}--></style></head>' +
      '<body><table><tr><td class=xl65>紅字粗體</td><td class=head0>藍字粗體</td></tr></table></body></html>';
    const out = normalizeOfficeHtml(html);
    const cells = parse(out).querySelectorAll('td');
    expect(cells.length).toBe(2);
    // 顏色已 inline 且吸附到色盤（#FF0000 → 紅 #E53E3E；#0070C0 → 藍 #2980AB）
    expect(cells[0].getAttribute('style')).toContain('#E53E3E');
    expect(cells[1].getAttribute('style')).toContain('#2980AB');
    expect(cells[0].getAttribute('style')).toContain('font-weight');
  });

  it('真實 Excel fixture：白字標題列的 color:white 被移除（不得隱形），一般 cell 文字保留', () => {
    const out = normalizeOfficeHtml(EXCEL_MAC_HTML);
    expect(out).not.toContain('white');
    expect(out).toContain('編號');
    expect(out).toContain('文具');
    expect(out).toContain('12000');
  });

  it('color:windowtext（CSS 系統色）不得變成任何色盤色', () => {
    const html =
      '<html xmlns:x="urn:schemas-microsoft-com:office:excel"><head>' +
      '<meta name=ProgId content=Excel.Sheet>' +
      '<style><!--.font5{color:windowtext}--></style></head>' +
      '<body><table><tr><td class=font5>一般文字</td></tr></table></body></html>';
    const out = normalizeOfficeHtml(html);
    const style = parse(out).querySelector('td')!.getAttribute('style') ?? '';
    expect(style).not.toContain('color');
  });

  it('來源本就是 inline style（無 <style> 區塊）→ 顏色照吸附，不重複套用', () => {
    const html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body>' +
      '<p style="color:#EE0000;font-size:22pt">紅字</p></body></html>';
    const out = normalizeOfficeHtml(html);
    const style = parse(out).querySelector('p')!.getAttribute('style') ?? '';
    expect(style).toContain('#E53E3E');
    expect((style.match(/color/g) ?? []).length).toBe(1);
    expect(style).not.toContain('font-size'); // 字級刻意不保留
  });

  // ── Word 假清單重組 ──

  it('真實 Word（Windows）假清單 → 真 ol/ul，且不得殘留字面「·」或「1.」', () => {
    const out = normalizeOfficeHtml(WORD_WIN_HTML);
    const doc = parse(out);
    expect(doc.querySelectorAll('ol').length).toBeGreaterThan(0);
    expect(doc.querySelectorAll('ul').length).toBeGreaterThan(0);
    // Word 原始碼會在行中折行（`Item\n2`），HTML 語意上換行＝空白，PM 解析時才收斂；
    // normalizer 刻意不動空白（那是 PM 的職責，且動了會弄壞 <pre>），故此處比對前先收斂。
    const items = Array.from(doc.querySelectorAll('li')).map(li =>
      (li.textContent ?? '').replace(/\s+/g, ' ').trim(),
    );
    expect(items).toContain('Item1');
    expect(items).toContain('Bullet 1');
    // 符號不得外洩成內文
    const text = doc.body.textContent ?? '';
    expect(text).not.toContain('·');
    expect(text).not.toContain('1.');
    // 清單外的一般段落仍在
    expect(text).toContain('Some text');
  });

  it('真實 Word（macOS Safari）假清單 → 真 ol，符號不外洩', () => {
    const out = normalizeOfficeHtml(WORD_MAC_SAFARI_HTML);
    const doc = parse(out);
    expect(doc.querySelectorAll('ol, ul').length).toBeGreaterThan(0);
    expect((doc.body.textContent ?? '')).not.toContain('1.');
    expect(Array.from(doc.querySelectorAll('li')).map(li => (li.textContent ?? '').trim())).toContain('Item1');
  });

  it('Word email 已是真 ol/li → 不得再重組（重複包裹會多一層清單）', () => {
    const out = normalizeOfficeHtml(WORD_EMAIL_HTML);
    const doc = parse(out);
    expect(doc.querySelectorAll('ol').length).toBe(1);
    expect(doc.querySelectorAll('ol ol').length).toBe(0);
    expect(doc.querySelectorAll('li').length).toBe(2);
    expect(doc.body.textContent).toContain('前言段落');
    expect(doc.body.textContent).toContain('後記段落');
  });

  // ── Office 雜訊清除 ──

  it('移除 colgroup / col / align / class / <o:p> / mso-* 宣告', () => {
    const out = normalizeOfficeHtml(EXCEL_MAC_HTML);
    expect(out).not.toContain('<col');
    expect(out).not.toContain('colgroup');
    expect(out).not.toContain('mso-');
    expect(out).not.toContain('class=');
    expect(out.toLowerCase()).not.toContain('<o:p');
    expect(out).not.toContain('align=');
    expect(out).not.toContain('text-align');
  });

  // ── 紅線：不得破壞 TipTap Bold 的 font-weight 防線 ──

  it('紅線：font-weight:normal 宣告必須保留（移除會讓 Google Docs 整段變粗體）', () => {
    const html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body>' +
      '<b style="font-weight:normal"><p style="font-weight:400">一般文字</p></b></body></html>';
    const out = normalizeOfficeHtml(html);
    expect(out).toContain('font-weight:normal');
    expect(out).toContain('font-weight:400');
  });

  it('紅線：Google Docs 不被 isOfficeHtml 命中 → normalizer 不介入（貼上後 doc 中無 bold mark）', () => {
    expect(isOfficeHtml(GOOGLE_DOCS_HTML)).toBeFalse();
  });

  it('顏色一律落在 TEXT_COLORS 內或被移除（不得產生色盤外的顏色）', () => {
    const html =
      '<html xmlns:o="urn:schemas-microsoft-com:office:office"><body>' +
      '<p style="color:#8B00FF">紫調</p><p style="color:rgb(255,136,0)">橘調</p>' +
      '<p style="color:#123456">深藍灰</p></body></html>';
    const out = normalizeOfficeHtml(html);
    const allowed = TEXT_COLORS.filter(c => c.hex).map(c => c.hex!);
    const colors = Array.from(parse(out).querySelectorAll('[style]'))
      .map(el => /color\s*:\s*([^;]+)/i.exec(el.getAttribute('style') ?? '')?.[1]?.trim())
      .filter((c): c is string => !!c);
    for (const c of colors) expect(allowed).toContain(c);
  });

  it('空字串 / 非 Office HTML → 原樣回傳，不得 throw', () => {
    expect(normalizeOfficeHtml('')).toBe('');
    const plain = '<p>一般網頁段落</p>';
    expect(normalizeOfficeHtml(plain)).toContain('一般網頁段落');
  });
});

// ── transformPastedHTML 掛載：Office 來源才正規化 ──────────────────────────────

describe('RichTextEditorComponent transformPastedHTML', () => {
  let fixture: ComponentFixture<RichTextEditorComponent>;
  let comp: RichTextEditorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RichTextEditorComponent] }).compileComponents();
    fixture = TestBed.createComponent(RichTextEditorComponent);
    comp = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  function transform(html: string): string {
    const fn = comp.getEditor()!.view.someProp('transformPastedHTML') as
      | ((html: string) => string)
      | undefined;
    expect(fn).toBeDefined();
    return fn!(html);
  }

  it('Office HTML → 經過正規化（Word 假清單變真清單）', () => {
    expect(transform(WORD_WIN_HTML)).toContain('<li');
  });

  it('非 Office HTML（macOS Mail）→ 原樣通過，不得被介入', () => {
    expect(transform(MAC_MAIL_HTML)).toBe(MAC_MAIL_HTML);
  });

  it('Google Docs → 原樣通過（font-weight 防線不得被動到）', () => {
    expect(transform(GOOGLE_DOCS_HTML)).toBe(GOOGLE_DOCS_HTML);
  });

  it('Word 貼上端到端：清單進得來且無字面符號外洩', () => {
    const dt = new DataTransfer();
    dt.setData('text/html', WORD_WIN_HTML);
    dt.setData('text/plain', 'Item1\nItem 2\nSome text\nBullet 1');
    comp.getEditor()!.view.dom.dispatchEvent(
      new ClipboardEvent('paste', { clipboardData: dt, bubbles: true, cancelable: true }),
    );
    const json = JSON.stringify(comp.getEditor()!.getJSON());
    const text = comp.getEditor()!.getText();
    expect(json).toContain('orderedList');
    expect(json).toContain('bulletList');
    expect(text).toContain('Item1');
    expect(text).toContain('Some text');
    expect(text).not.toContain('·');
  });
});
