import { ProseMirrorJSON } from '../../models/prosemirror.model';

/**
 * 編輯器文字色盤（SSOT）。`hex=null` 為「預設（清除顏色）」。
 *
 * 住在 helpers 而非 component，是為了讓 `snapPasteColor` 能從同一份定義推導可用色相，
 * 避免色盤在兩處漂移。component 以 `readonly TEXT_COLORS = TEXT_COLORS` 轉出給 template。
 */
export const TEXT_COLORS: ReadonlyArray<{ label: string; hex: string | null }> = [
  { label: '預設', hex: null },
  { label: '紅', hex: '#E53E3E' },
  { label: '橘', hex: '#DD6B20' },
  { label: '黃', hex: '#D4A017' },
  { label: '綠', hex: '#38A169' },
  { label: '藍', hex: '#2980AB' },
  { label: '紫', hex: '#805AD5' },
  { label: '灰', hex: '#718096' },
];

// ── clipboard 來源嗅探 ────────────────────────────────────────────────────────
//
// 嗅探只用來決定「要不要做額外處理」，**不得**用來決定「內容能不能進來」。
// 任何嗅探分支若產不出可插入內容，一律把控制權交還 ProseMirror 預設貼上
// （PM 對不認識的元素是保留內文往下遞迴，交還不會吃掉內容）。

/** 取出所有 `<meta …>` 標籤原文，供 quote-agnostic 的 name/content 配對比對。 */
function metaTags(html: string): string[] {
  return html.match(/<meta\b[^>]*>/gi) ?? [];
}

/** 同一個 meta 標籤內同時命中 name 與 content 兩個 pattern（屬性順序無關）。 */
function metaHas(html: string, name: RegExp, content: RegExp): boolean {
  return metaTags(html).some(tag => name.test(tag) && content.test(tag));
}

/**
 * 這份 clipboard HTML 是不是 **Excel** 產的。
 *
 * 只認 Excel 專屬的 meta 指紋，**不得**用任何 xmlns 判斷：
 * - `xmlns:o="urn:schemas-microsoft-com:office:office"` 是 Office **共用**命名空間，
 *   Word / Outlook 全部都有 → 用它判 Excel 會讓 Word 貼上完全沒反應。
 * - `urn:schemas-microsoft-com:office:excel` 也不行：Word 產生的 email HTML
 *   （`Microsoft Word 15 (filtered medium)`）**自己就宣告了 Excel 命名空間**。
 * - `class="xl##"` 也不行：2026-08-03 實測 macOS Excel 根本不輸出該 class
 *   （quote-agnostic 兩種寫法皆不命中），淨效果只有誤傷 class 以 `xl` 開頭的網頁。
 *
 * 引號必須容許有無兩種：同一份真實 Excel HTML 內兩種方言並存
 * （`content=Excel.Sheet` 無引號 ＋ `content="Microsoft Excel 15"` 有引號）。
 */
export function isExcelHtml(html: string): boolean {
  if (!html) return false;
  return (
    metaHas(html, /\bname=["']?ProgId\b/i, /\bcontent=["']?Excel\.Sheet\b/i) ||
    metaHas(html, /\bname=["']?Generator\b/i, /\bcontent=["']?Microsoft Excel\b/i)
  );
}

/**
 * 這份 clipboard HTML 是不是 **Office（Word / Excel / Outlook 桌面版）** 產的
 * ——決定要不要跑 `normalizeOfficeHtml`，與 `isExcelHtml`（要不要走表格清洗）是不同判斷。
 *
 * 必須是多訊號 OR：Word 三方言的共同點只有 xmlns 與 Mso class / mso-list style，
 * 其中 macOS Safari 那份**連一個 `<meta>` 都沒有**，只認 meta 會漏。
 *
 * 刻意**不**命中的來源（它們走 ProseMirror 預設解析就已正確，介入只會弄壞）：
 * - macOS Mail / Outlook Web：WebKit inline-style 序列化
 * - Google Docs：`<b style="font-weight:normal">` 包整段，TipTap Bold 自有兩道防線
 */
export function isOfficeHtml(html: string): boolean {
  if (!html) return false;
  return (
    isExcelHtml(html) ||
    /xmlns:[owxv]=["']?urn:schemas-microsoft-com/i.test(html) ||
    /WebKit-mso-list-quirks-style/i.test(html) ||
    /\bclass=["']?Mso/i.test(html) ||
    /mso-list\s*:/i.test(html) ||
    metaHas(html, /\bname=["']?ProgId\b/i, /\bcontent=["']?(Excel\.Sheet|Word\.Document|PowerPoint\.Slide)\b/i) ||
    metaHas(html, /\bname=["']?Generator\b/i, /\bcontent=["']?Microsoft (Excel|Word|PowerPoint)\b/i)
  );
}

// ── 貼上顏色吸附到色盤 ────────────────────────────────────────────────────────

/** 明確表達「沒有顏色 / 沿用繼承色」的關鍵字 → 一律回 null。 */
const NO_COLOR_KEYWORDS = new Set([
  'transparent', 'currentcolor', 'inherit', 'initial', 'unset', 'revert', 'auto', 'none',
]);

/**
 * CSS 系統色關鍵字 → 一律回 null（語意就是「系統預設文字色」）。
 * `windowtext` 是實測 Excel 使用的值。
 */
const SYSTEM_COLOR_KEYWORDS = new Set([
  'windowtext', 'window', 'buttontext', 'buttonface', 'captiontext', 'graytext',
  'highlighttext', 'infotext', 'infobackground', 'menutext', 'threedshadow',
  'threeddarkshadow', 'threedface', 'threedhighlight', 'activetext', 'linktext',
  'visitedtext', 'canvastext', 'canvas', 'field', 'fieldtext', 'mark', 'marktext',
]);

/** 飽和度低於此值視為無彩色（黑／白／灰）→ 映射為 null＝預設色。 */
const ACHROMATIC_SATURATION_MAX = 0.15;

interface Rgba { r: number; g: number; b: number; a: number }

/** 惰性建立的 canvas 2d context，用來讓瀏覽器自己解析長尾色值表示法（色名、hsl()、lab()…）。 */
let colorParseCtx: CanvasRenderingContext2D | null | undefined;

/** 用瀏覽器原生 CSS 解析器正規化色值；無法解析或無 canvas 時回 null。 */
function normalizeViaCanvas(raw: string): string | null {
  if (colorParseCtx === undefined) {
    colorParseCtx = typeof document === 'undefined'
      ? null
      : document.createElement('canvas').getContext('2d');
  }
  if (!colorParseCtx) return null;
  // 無效值不會改變 fillStyle → 用兩個不同 sentinel 各試一次，兩次結果相同才代表真的被解析。
  colorParseCtx.fillStyle = '#010203';
  colorParseCtx.fillStyle = raw;
  const first = String(colorParseCtx.fillStyle);
  colorParseCtx.fillStyle = '#040506';
  colorParseCtx.fillStyle = raw;
  const second = String(colorParseCtx.fillStyle);
  return first === second ? first : null;
}

/** 解析 `#hex` / `rgb()` / `rgba()`；其餘交給瀏覽器解析器。 */
function parseColor(raw: string): Rgba | null {
  const hex = /^#([0-9a-f]{3,8})$/i.exec(raw);
  if (hex) {
    const d = hex[1];
    const expand = (s: string): number => parseInt(s.length === 1 ? s + s : s, 16);
    if (d.length === 3 || d.length === 4) {
      return {
        r: expand(d[0]), g: expand(d[1]), b: expand(d[2]),
        a: d.length === 4 ? expand(d[3]) / 255 : 1,
      };
    }
    if (d.length === 6 || d.length === 8) {
      return {
        r: parseInt(d.slice(0, 2), 16), g: parseInt(d.slice(2, 4), 16), b: parseInt(d.slice(4, 6), 16),
        a: d.length === 8 ? parseInt(d.slice(6, 8), 16) / 255 : 1,
      };
    }
    return null;
  }

  const fn = /^rgba?\(([^)]+)\)$/i.exec(raw);
  if (fn) {
    const parts = fn[1].split(/[,/\s]+/).filter(Boolean);
    if (parts.length < 3) return null;
    const num = (s: string, max: number): number =>
      s.endsWith('%') ? (parseFloat(s) / 100) * max : parseFloat(s);
    const r = num(parts[0], 255), g = num(parts[1], 255), b = num(parts[2], 255);
    if ([r, g, b].some(v => !Number.isFinite(v))) return null;
    const a = parts.length > 3 ? num(parts[3], 1) : 1;
    return { r, g, b, a: Number.isFinite(a) ? a : 1 };
  }

  const normalized = normalizeViaCanvas(raw);
  return normalized && normalized !== raw ? parseColor(normalized) : null;
}

/** RGB → HSL 的色相（度）與飽和度（0–1）。 */
function hueAndSaturation(c: Rgba): { hue: number; saturation: number } {
  const r = c.r / 255, g = c.g / 255, b = c.b / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const delta = max - min;
  if (delta === 0) return { hue: 0, saturation: 0 };
  const lightness = (max + min) / 2;
  const saturation = lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min);
  let hue: number;
  if (max === r) hue = ((g - b) / delta + (g < b ? 6 : 0)) * 60;
  else if (max === g) hue = ((b - r) / delta + 2) * 60;
  else hue = ((r - g) / delta + 4) * 60;
  return { hue, saturation };
}

/**
 * 可作為吸附目標的色盤色相表。
 * 只收「自身飽和度足夠」的色盤色——`灰 #718096` 的飽和度僅約 0.15，若讓它參與色相吸附
 * 會把低飽和的藍搶走；而無彩色本來就映射為 null，所以灰是刻意無法經由貼上取得的。
 */
const SNAP_TARGETS: ReadonlyArray<{ hex: string; hue: number }> = TEXT_COLORS
  .map(c => c.hex)
  .filter((hex): hex is string => !!hex)
  .map(hex => {
    const parsed = parseColor(hex);
    const hs = parsed ? hueAndSaturation(parsed) : { hue: 0, saturation: 0 };
    return { hex, hue: hs.hue, saturation: hs.saturation };
  })
  .filter(t => t.saturation > ACHROMATIC_SATURATION_MAX)
  .map(({ hex, hue }) => ({ hex, hue }));

/**
 * 把外部貼上的任意色值吸附到編輯器色盤（使用者 2026-08-03 拍板
 * 「文字顏色應該要用編輯器有支援的顏色」）。
 *
 * - **無彩色（黑／白／低飽和灰）→ `null`＝預設色**，不是映射到色盤的「灰」。
 *   Word 正文絕大多數帶顯式 `color:black`，按最近色硬算會讓每次貼上全文變淺灰；
 *   而白字映射成預設色順便解掉「Excel 深藍底白字標題列貼進白底編輯器隱形」。
 * - 有彩色 → 色相最近的色盤色（色相比 RGB 歐氏距離更貼近「同一個顏色」的直覺）。
 * - 完全無法解析 → `null`（不得 throw）。
 *
 * 回傳值保證是 `TEXT_COLORS` 內的 hex 或 `null`。
 */
export function snapPasteColor(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // macOS Mail 實測會輸出 `color: rgb(238, 0, 0) !important` → 解析前必須 strip
  const cleaned = raw.replace(/!\s*important/gi, '').trim().toLowerCase();
  if (!cleaned) return null;
  if (NO_COLOR_KEYWORDS.has(cleaned) || SYSTEM_COLOR_KEYWORDS.has(cleaned)) return null;

  const parsed = parseColor(cleaned);
  if (!parsed || parsed.a === 0) return null;

  const { hue, saturation } = hueAndSaturation(parsed);
  if (saturation <= ACHROMATIC_SATURATION_MAX) return null;
  if (!SNAP_TARGETS.length) return null;

  const distance = (a: number, b: number): number => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  };
  return SNAP_TARGETS.reduce(
    (best, t) => (distance(hue, t.hue) < distance(hue, best.hue) ? t : best),
    SNAP_TARGETS[0],
  ).hex;
}

/**
 * clipboard 是否「只有一張表格」——表格之外沒有任何實質內容。
 *
 * 這是 Excel 表格清洗的形狀閘門。少了它，Word 的「段落＋表格＋段落」與 Outlook 的
 * 「正文＋簽名檔 layout table」都會被當成 Excel 表格處理，結果只留下那張表、其餘內容
 * 靜默丟失（比完全貼不上更危險：使用者以為貼成功了，但少了一半）。
 */
export function isTableOnlyClipboard(html: string): boolean {
  if (!html) return false;
  const body = new DOMParser().parseFromString(html, 'text/html').body;
  if (!body) return false;
  if (body.querySelectorAll('table').length !== 1) return false;

  // 把唯一那張表拿掉之後，不得還剩下文字或有意義的元素
  const rest = body.cloneNode(true) as HTMLElement;
  rest.querySelector('table')?.remove();
  if (normalizeCellWhitespace(rest.textContent ?? '').length > 0) return false;
  return !rest.querySelector('img, hr, br, input, svg');
}

/**
 * cell 文字正規化。三步都是刻意的（原始意圖註解在 `c11ec66d` 搬進 helpers 時遺失，此處補回）：
 * - 移除換行：Excel 用換行做數字格式的視覺排版，跨 cell join 時會產生假空白
 * - ` `（不斷行空白）→ 普通空白：Excel 大量用它做儲存格內縮排
 * - 收斂連續空白
 */
function normalizeCellWhitespace(text: string): string {
  return text
    .replace(/[\r\n]+/g, '')
    .replace(/ /g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 只取屬於這張表自己的列（`:scope >`），不含巢狀表格的列。 */
function directRows(table: Element): Element[] {
  return Array.from(
    table.querySelectorAll(':scope > tr, :scope > thead > tr, :scope > tbody > tr, :scope > tfoot > tr'),
  );
}

/** 只取屬於這一列自己的 cell，不含巢狀表格的 cell。 */
function directCells(row: Element): Element[] {
  return Array.from(row.querySelectorAll(':scope > td, :scope > th'));
}

/** cell 內允許保留的 inline 標籤。皆為序列化契約（`applyMarks`）表達得出、能 round-trip 的。 */
const CELL_INLINE_WHITELIST = new Set(['BR', 'STRONG', 'B', 'EM', 'I', 'U', 'S', 'DEL', 'STRIKE', 'SPAN']);

/**
 * 重建 cell 內容：白名單內的 inline 標籤保留（換行、粗體、斜體、底線、刪除線、帶色 span），
 * 其餘一律拆解成文字（拆解＝內文往上接，不丟內容）。屬性全部丟棄，只有 `<span>` 的 `color`
 * 會以吸附後的色盤色重寫。
 *
 * 為什麼不用 `textContent`：原版把整個 cell 攤平成一個字串，連 Excel 的 alt+enter 換行
 * 都消失、粗體與字色全丟——而這些其實是持久化契約支援、能 round-trip 的
 * （`serializeTableAsHtml` 的 cell 內容走 `htmlMarks=true`）。
 */
function rebuildCellContent(source: Element, target: Element): void {
  const walk = (from: Node, to: Node): void => {
    for (const node of Array.from(from.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = normalizeCellWhitespace(node.textContent ?? '');
        if (text) to.appendChild(document.createTextNode(text));
        continue;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) continue; // 註解／MS 條件註解殘骸一律丟棄
      const el = node as Element;
      if (!CELL_INLINE_WHITELIST.has(el.tagName)) {
        walk(el, to);
        continue;
      }
      if (el.tagName === 'BR') {
        to.appendChild(document.createElement('br'));
        continue;
      }
      const color = snapPasteColor((el as HTMLElement).style?.color);
      if (el.tagName === 'SPAN' && !color) {
        walk(el, to); // 沒有帶得走的顏色的 span 無語意 → 拆解，避免產生空的 textStyle mark
        continue;
      }
      const kept = document.createElement(el.tagName.toLowerCase());
      if (color) kept.setAttribute('style', `color:${color}`);
      walk(el, kept);
      if (kept.childNodes.length) to.appendChild(kept);
    }
  };
  walk(source, target);
}

/**
 * 從 Excel clipboard HTML 抽出乾淨的 `<table>`。
 *
 * 為什麼要清洗（原始意圖，`c11ec66d`；搬進 helpers 時註解遺失，此處補回）：
 * 1. Excel 複製時 clipboard **同時**放一張儲存格截圖（2026-08-03 實測 `items` 含
 *    `image/png`），必須在 image 分支之前處理掉，否則貼上會變成一張圖。
 * 2. 不讓 TipTap 直接吃 MS Office HTML：Excel 會輸出裸 `<col>`，而 TipTap `TableCell`
 *    會從 `colgroup > col` 回填 `colwidth`；但序列化層（`serializeTableAsHtml`）只存
 *    `colspan`/`rowspan`，`colwidth` 存不回去 → 留著就是「編輯器看得到寬度、reopen
 *    變預設」的前後端不一致。
 *
 * 抽不到任何列時回 `null`，呼叫端必須據此**交還 ProseMirror**：空 `<tbody>` 不符
 * TipTap table node 的 `content: "tableRow+"`，插進去等於什麼都沒插入。
 */
export function extractAndCleanExcelTable(html: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const newTable = document.createElement('table');
  const newTbody = document.createElement('tbody');

  for (const row of directRows(table)) {
    const cells = directCells(row);
    if (!cells.some(c => normalizeCellWhitespace(c.textContent ?? '').length > 0)) continue;

    const newRow = document.createElement('tr');
    for (const cell of cells) {
      const tag = cell.tagName.toLowerCase() as 'th' | 'td';
      const newCell = document.createElement(tag);
      const rowspan = cell.getAttribute('rowspan');
      const colspan = cell.getAttribute('colspan');
      if (rowspan && rowspan !== '1') newCell.setAttribute('rowspan', rowspan);
      if (colspan && colspan !== '1') newCell.setAttribute('colspan', colspan);
      rebuildCellContent(cell, newCell);
      newRow.appendChild(newCell);
    }
    newTbody.appendChild(newRow);
  }

  if (!newTbody.childElementCount) return null;
  newTable.appendChild(newTbody);
  return newTable.outerHTML;
}

/**
 * 語意標籤白名單：出現任一個就代表「這份 HTML 帶有 markdown 無法無損表達的結構」。
 *
 * 刻意**不含**純包裝標籤（`html` / `head` / `body` / `meta` / `link` / `style` / `script`
 * / `title`）——只有它們的話，內容其實就是純文字，該讓 markdown 自動轉換路徑生效。
 */
const RICH_HTML_TAGS = [
  'p', 'div', 'br', 'hr', 'ul', 'ol', 'li', 'dl', 'dt', 'dd',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'caption',
  'blockquote', 'pre', 'code', 'h[1-6]',
  'strong', 'b', 'em', 'i', 'u', 's', 'strike', 'del', 'ins', 'mark', 'sub', 'sup',
  'a', 'span', 'img', 'font', 'center',
  'section', 'article', 'figure', 'figcaption',
].join('|');

const RICH_HTML_RE = new RegExp(`<(${RICH_HTML_TAGS})\\b`, 'i');

/**
 * 這份 HTML 是否帶有值得保留的結構 —— 亦即「是否**不該**被 markdown 重繪路徑取代」。
 *
 * 回 `false` 且 text/plain 像 markdown 時，`onPaste` 會丟棄整包 HTML 改用 markdown-it
 * 重繪，所以白名單太窄等於真實 HTML 被靜默吃掉：2026-08-03 實測一整封 8KB 的
 * macOS Mail 郵件，舊白名單（`table|ul|ol|strong|em|b|i|h1-6`）**一個都不命中**，
 * 只因該信的 text/plain 剛好不像 markdown 才逃過；郵件含「1. …」編號就會中。
 *
 * 原則：**有 HTML 就相信 HTML**，markdown 自動轉換降為「剪貼簿沒有可用 HTML」的 fallback。
 */
export function isRichHtml(html: string): boolean {
  return html.length > 50 && RICH_HTML_RE.test(html);
}

export function isMarkdownLike(text: string): boolean {
  return (
    /^\|.+\|\s*\n\s*\|[\s\-:|]+\|/m.test(text) ||
    /\*\*\S[^*]*\*\*/.test(text) ||
    /^#{1,6}\s+\S/m.test(text) ||
    /^[-*]\s+\S/m.test(text) ||
    /^\d+\.\s+\S/m.test(text) ||
    /\[.+\]\(https?:\/\/.+\)/.test(text)
  );
}

/**
 * 比對兩個 ProseMirror doc 是否語意相同，忽略 ignoredAttrs 內的 attr key。
 *
 * 抽自 fee-supplement-editor 的 docEqualsIgnoringDisplayUrl，泛化為可接受任意
 * ignoredAttrs 清單，讓不同場景指定各自需要略過的 runtime-only attr：
 * - fee-supplement-editor：['displayUrl']（blob URL 由 hydrate 動態寫入）
 * - P4-4 等其他場景：[]（不需略過任何 attr）
 *
 * 深度結構比較而非 JSON.stringify（避免 object key 順序問題）。
 * 尾部空段落修剪與 content:[] 等價空 content 邏輯維持不變。
 */
export function docEqualsIgnoringAttrs(
  a: unknown,
  b: unknown,
  ignoredAttrs: string[] = [],
): boolean {
  if (a === b) return true;
  if (!a || !b || typeof a !== 'object' || typeof b !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) {
    const strip = (arr: unknown[]): unknown[] => {
      let end = arr.length;
      while (end > 0) {
        const last = arr[end - 1] as Record<string, unknown>;
        const content = last?.['content'];
        const isEmptyParagraph = last?.['type'] === 'paragraph' &&
          (!content || (Array.isArray(content) && content.length === 0));
        if (isEmptyParagraph) end--; else break;
      }
      return end === arr.length ? arr : arr.slice(0, end);
    };
    const aa = strip(a);
    const bb = strip(b);
    if (aa.length !== bb.length) return false;
    for (let i = 0; i < aa.length; i++) {
      if (!docEqualsIgnoringAttrs(aa[i], bb[i], ignoredAttrs)) return false;
    }
    return true;
  }
  const aRec = a as Record<string, unknown>;
  const bRec = b as Record<string, unknown>;
  const filterKeys = (rec: Record<string, unknown>): string[] =>
    Object.keys(rec)
      .filter(k => !ignoredAttrs.includes(k))
      .filter(k => !(k === 'content' && Array.isArray(rec[k]) && (rec[k] as unknown[]).length === 0))
      .sort();
  const aKeys = filterKeys(aRec);
  const bKeys = filterKeys(bRec);
  if (aKeys.length !== bKeys.length) return false;
  for (let i = 0; i < aKeys.length; i++) {
    if (aKeys[i] !== bKeys[i]) return false;
    if (!docEqualsIgnoringAttrs(aRec[aKeys[i]], bRec[bKeys[i]], ignoredAttrs)) return false;
  }
  return true;
}

/**
 * 遞迴移除 ProseMirrorJSON 中所有節點的 ignoredAttrs（runtime-only attrs）。
 * fee-supplement-editor 傳 ['displayUrl'] 防止 blob URL 混入持久化 draft。
 */
export function stripNodeAttrs(node: ProseMirrorJSON, ignoredAttrs: string[]): ProseMirrorJSON {
  const result: ProseMirrorJSON = { ...node };
  if (result.attrs) {
    const filtered = { ...result.attrs };
    for (const key of ignoredAttrs) {
      delete filtered[key];
    }
    result.attrs = filtered;
  }
  if (result.content) {
    result.content = result.content.map(child => stripNodeAttrs(child, ignoredAttrs));
  }
  return result;
}

// ── Office HTML 正規化（transformPastedHTML）────────────────────────────────────
//
// 掛在 `editorProps.transformPastedHTML`，只在 `isOfficeHtml` 為真時作用。
// 目的是把 Office 的 clipboard HTML 轉成 ProseMirror schema 接得住的形狀——
// **不是**過濾內容。任何一步都不得整塊丟棄有內文的節點（不在白名單的標籤一律「拆解」
// ＝把內文往上接，而非移除）。

/**
 * 允許保留的 inline style 宣告。刻意極窄，因為序列化層（`applyMarks`）只表達得出這幾種；
 * 保留存不回去的宣告（`font-size` / `font-family` / `background` / `colwidth` / `text-align`）
 * 就是製造「編輯器看得到、reopen 變預設」的前後端不一致。
 *
 * `font-weight` **必須**在白名單內：TipTap Bold 靠 `font-weight:normal` / `400` 這兩個
 * 宣告才不會把 Google Docs 的 `<b style="font-weight:normal">` 整段判成粗體。
 */
const STYLE_DECLARATION_WHITELIST = new Set([
  'color', 'font-weight', 'font-style', 'text-decoration', 'text-decoration-line',
]);

/** 一律移除的元素（無內文語意，或其資訊序列化層存不回去）。 */
const DROP_ELEMENT_TAGS = new Set(['STYLE', 'LINK', 'META', 'TITLE', 'SCRIPT', 'COLGROUP', 'COL']);

/** 一律移除的屬性。`class` 在 inline 化完成後才移除。 */
const DROP_ATTRIBUTES = [
  'class', 'lang', 'xml:lang', 'align', 'valign', 'width', 'height', 'border',
  'cellpadding', 'cellspacing', 'bgcolor', 'link', 'vlink', 'start', 'type',
];

/** 拆解 CSS 宣告串（`a:1;b:2`）成 [prop, value] 陣列，保留原始大小寫的 value。 */
function parseDeclarations(cssText: string): Array<[string, string]> {
  return cssText
    .split(';')
    .map(d => d.trim())
    .filter(Boolean)
    .map(d => {
      const i = d.indexOf(':');
      return i < 0 ? null : ([d.slice(0, i).trim().toLowerCase(), d.slice(i + 1).trim()] as [string, string]);
    })
    .filter((d): d is [string, string] => !!d);
}

/**
 * 把 `<style>` 內的 class 規則 inline 化到對應元素。
 *
 * **泛用任意 class 命名，不寫死 `.xl##`**：2026-08-03 實測 macOS Excel 完全不輸出
 * `class=xl##`（quote-agnostic 兩種寫法皆不命中），但 `color:white` / `color:windowtext`
 * 這類宣告確實住在 `<style>` 裡。寫死命名會讓這一步在 macOS 上靜默失效。
 *
 * 不用 CSSOM 是因為 `DOMParser` 產生的 document 其 `<style>.sheet` 為 null（未附著、未渲染）。
 */
function inlineClassStyles(root: HTMLElement): void {
  const cssText = Array.from(root.ownerDocument.querySelectorAll('style'))
    .map(s => s.textContent ?? '')
    .join('\n')
    .replace(/<!--|-->/g, '');
  if (!cssText.trim()) return;

  const byClass = new Map<string, Array<[string, string]>>();
  const ruleRe = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = ruleRe.exec(cssText)) !== null) {
    const declarations = parseDeclarations(m[2]);
    if (!declarations.length) continue;
    for (const selector of m[1].split(',')) {
      // 只吃「單一 class」選擇器（`.a` / `td.a`）；後代／at-rule／偽類一律跳過
      const cls = /^\s*[a-z0-9]*\.([a-z0-9_-]+)\s*$/i.exec(selector)?.[1];
      if (!cls) continue;
      byClass.set(cls, [...(byClass.get(cls) ?? []), ...declarations]);
    }
  }
  if (!byClass.size) return;

  for (const el of Array.from(root.querySelectorAll('[class]'))) {
    const merged: Array<[string, string]> = [];
    for (const cls of (el.getAttribute('class') ?? '').split(/\s+/).filter(Boolean)) {
      const declarations = byClass.get(cls);
      if (declarations) merged.push(...declarations);
    }
    if (!merged.length) continue;
    // class 規則排在既有 inline style 之前 → inline style 仍然勝出（CSS 優先序語意）
    const own = el.getAttribute('style') ?? '';
    const prefix = merged.map(([p, v]) => `${p}:${v}`).join(';');
    el.setAttribute('style', own ? `${prefix};${own}` : prefix);
  }
}

/** Word 假清單的項目符號容器（`<span style='mso-list:Ignore'>1.</span>`）。 */
function markerSpans(scope: Element): Element[] {
  return Array.from(scope.querySelectorAll('[style]')).filter(el =>
    /mso-list\s*:\s*ignore/i.test(el.getAttribute('style') ?? ''),
  );
}

/** 這個段落是不是「Word 假清單」的一項（已是真 `<li>` 或已在真清單內的一律不算）。 */
function isWordFakeListItem(el: Element): boolean {
  if (el.tagName === 'LI') return false;
  if (el.closest('ul, ol')) return false;
  return /mso-list\s*:\s*l\d+/i.test(el.getAttribute('style') ?? '');
}

/** 依項目符號文字判斷編號清單 vs 項目符號清單。Word 的 level-2 項目符號是裸的「o」（無 `.`）。 */
function readFakeListMeta(el: Element): { ordered: boolean; level: number } {
  const style = el.getAttribute('style') ?? '';
  const level = Number(/mso-list\s*:\s*l\d+\s+level(\d+)/i.exec(style)?.[1] ?? '1');
  const marker = (markerSpans(el)[0]?.textContent ?? '').trim();
  return { ordered: /^\(?[0-9a-z]+[.)]/i.test(marker), level: Number.isFinite(level) ? level : 1 };
}

/**
 * 把連續的 Word 假清單段落重組成真 `ul` / `ol`。
 *
 * Word 的清單是 `<p class=MsoListParagraph style='mso-list:lN levelM'>` ＋被
 * `<![if !supportLists]>…<![endif]>` 包住的符號 span。`<![if]>` 在 HTML5 是 bogus
 * comment——**只有標記本身變註解，中間的符號 span 仍是活的 DOM**，所以不處理就會在每行
 * 開頭外洩字面「·」或「1.」。而 `BulletList` / `OrderedList` 只認 `ul` / `ol` / `li`，
 * 不重組就一定變成一串平坦段落。
 *
 * Word 產生的 **email** HTML 相反——它輸出真的 `<ol>/<li>`，**不得**再重組（會多包一層）。
 */
function rebuildWordFakeLists(root: HTMLElement): void {
  const doc = root.ownerDocument;
  const all = Array.from(root.querySelectorAll('p, div')).filter(isWordFakeListItem);
  if (!all.length) return;

  // 分組：以「前一個元素兄弟也是假清單項」為同組判準（Word 輸出為連續兄弟）
  const groups: Element[][] = [];
  for (const el of all) {
    const prev = el.previousElementSibling;
    const last = groups[groups.length - 1];
    if (last && prev && last[last.length - 1] === prev) last.push(el);
    else groups.push([el]);
  }

  for (const group of groups) {
    const anchor = group[0];
    const parent = anchor.parentNode;
    if (!parent) continue;
    const baseLevel = readFakeListMeta(anchor).level;
    const stack: Array<{ level: number; list: Element }> = [];
    const roots: Element[] = [];

    for (const el of group) {
      const { ordered, level: rawLevel } = readFakeListMeta(el);
      const level = Math.max(rawLevel, baseLevel);
      while (stack.length && stack[stack.length - 1].level > level) stack.pop();
      if (!stack.length || stack[stack.length - 1].level < level) {
        const list = doc.createElement(ordered ? 'ol' : 'ul');
        if (!stack.length) roots.push(list);
        else {
          const parentList = stack[stack.length - 1].list;
          (parentList.lastElementChild ?? parentList).appendChild(list);
        }
        stack.push({ level, list });
      }
      for (const marker of markerSpans(el)) marker.remove();
      const li = doc.createElement('li');
      while (el.firstChild) li.appendChild(el.firstChild);
      stack[stack.length - 1].list.appendChild(li);
    }

    for (const list of roots) parent.insertBefore(list, anchor);
    for (const el of group) el.remove();
  }
}

/** 移除元素但保留其內文（往上接）。 */
function unwrap(el: Element): void {
  const parent = el.parentNode;
  if (!parent) return;
  while (el.firstChild) parent.insertBefore(el.firstChild, el);
  parent.removeChild(el);
}

/** 清除 Office 雜訊：`<o:p>` 等命名空間元素、`<colgroup>/<col>`、殘留符號 span、屬性。 */
function stripOfficeNoise(root: HTMLElement): void {
  for (const marker of markerSpans(root)) marker.remove();

  for (const el of Array.from(root.querySelectorAll('*'))) {
    if (DROP_ELEMENT_TAGS.has(el.tagName)) { el.remove(); continue; }
    // `<o:p>` / `<v:shape>` / `<w:sdt>` 等命名空間元素：無語意，拆解保留內文
    if (el.tagName.includes(':')) { unwrap(el); continue; }
    for (const attr of DROP_ATTRIBUTES) el.removeAttribute(attr);
  }
}

/** 只留白名單宣告，`color` 吸附到色盤；沒有宣告存活就移除整個 style 屬性。 */
function sanitizeInlineStyles(root: HTMLElement): void {
  for (const el of Array.from(root.querySelectorAll('[style]'))) {
    const kept: string[] = [];
    const seen = new Set<string>();
    for (const [prop, value] of parseDeclarations(el.getAttribute('style') ?? '')) {
      if (!STYLE_DECLARATION_WHITELIST.has(prop) || seen.has(prop)) continue;
      if (prop === 'color') {
        const snapped = snapPasteColor(value);
        if (!snapped) { seen.add(prop); continue; } // 無彩色／不可解析 → 回到繼承色
        seen.add(prop);
        kept.push(`color:${snapped}`);
        continue;
      }
      seen.add(prop);
      kept.push(`${prop}:${value}`);
    }
    if (kept.length) el.setAttribute('style', kept.join(';'));
    else el.removeAttribute('style');
  }
}

/**
 * 正規化 Office（Word / Excel / Outlook 桌面版）的 clipboard HTML，讓 ProseMirror
 * 的 schema 接得住。**呼叫端必須先用 `isOfficeHtml` 守門**——非 Office 來源
 * （macOS Mail、Google Docs、一般網頁）走 PM 預設解析就已正確，介入只會弄壞
 * （Google Docs 靠 `<b style="font-weight:normal">` 的宣告避免整段變粗體）。
 *
 * 五步順序有依賴關係：class 規則要在 `class` 屬性被移除前 inline 化；假清單重組要在
 * 符號 span 被清掉前讀到符號才能判斷 ordered / bullet。
 */
export function normalizeOfficeHtml(html: string): string {
  if (!html) return html;
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const body = doc.body;
  if (!body) return html;

  inlineClassStyles(body);      // ① <style> class 規則 → inline（必須早於 class 屬性移除）
  rebuildWordFakeLists(body);   // ② 假清單 → 真 ul/ol（必須早於符號 span 清除）
  stripOfficeNoise(body);       // ③ o:p / colgroup / 殘留符號 span / 屬性
  sanitizeInlineStyles(body);   // ④ 白名單宣告 + 顏色吸附
  return body.innerHTML;
}
