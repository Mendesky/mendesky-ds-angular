import { ProseMirrorJSON } from '../../../features/quoting-cases/models/p4-contract.model';

export function isExcelHtml(html: string): boolean {
  return (
    html.includes('urn:schemas-microsoft-com:office:excel') ||
    html.includes('xmlns:o="urn:schemas-microsoft-com') ||
    /class="xl/i.test(html) ||
    /<meta[^>]*Generator[^>]*Microsoft Excel/i.test(html)
  );
}

export function extractAndCleanExcelTable(html: string): string | null {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const table = doc.querySelector('table');
  if (!table) return null;

  const cleanText = (el: Element): string =>
    (el.textContent ?? '')
      .replace(/[\r\n]+/g, '')
      .replace(/ /g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

  const newTable = document.createElement('table');
  const newTbody = document.createElement('tbody');

  for (const row of Array.from(table.querySelectorAll('tr'))) {
    const cells = Array.from(row.querySelectorAll('td, th'));
    if (!cells.some(c => cleanText(c).length > 0)) continue;

    const newRow = document.createElement('tr');
    for (const cell of cells) {
      const tag = cell.tagName.toLowerCase() as 'th' | 'td';
      const newCell = document.createElement(tag);
      const rowspan = cell.getAttribute('rowspan');
      const colspan = cell.getAttribute('colspan');
      if (rowspan && rowspan !== '1') newCell.setAttribute('rowspan', rowspan);
      if (colspan && colspan !== '1') newCell.setAttribute('colspan', colspan);
      newCell.textContent = cleanText(cell);
      newRow.appendChild(newCell);
    }
    newTbody.appendChild(newRow);
  }

  newTable.appendChild(newTbody);
  return newTable.outerHTML;
}

export function isRichHtml(html: string): boolean {
  return html.length > 50 && /<(table|ul|ol|strong|em|b|i|h[1-6])\b/i.test(html);
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
