import { detectInlineTrigger } from './inline-trigger';

/**
 * `%%` autocomplete 觸發偵測純函數。
 * 偵測「游標前文字」結尾是否為 `%%` + 非 `%`/空白 的查詢字；命中回 { query, start }，否則 null。
 * 抽成純函數以便兩個編輯器（TipTap / contenteditable）共用且可單元測試（不依賴 DOM/PM）。
 */
describe('detectInlineTrigger', () => {
  it('case 1：`%%` → { query: "", start: 0 }', () => {
    expect(detectInlineTrigger('%%')).toEqual({ query: '', start: 0 });
  });

  it('case 2：`%%comp` → { query: "comp", start: 0 }', () => {
    expect(detectInlineTrigger('%%comp')).toEqual({ query: 'comp', start: 0 });
  });

  it('case 3：`前綴 %%c` → { query: "c", start: 3 }（start 指向第一個 %）', () => {
    expect(detectInlineTrigger('前綴 %%c')).toEqual({ query: 'c', start: 3 });
  });

  it('case 4：`%c`（單 % / Backspace 刪到剩一個）→ null', () => {
    expect(detectInlineTrigger('%c')).toBeNull();
  });

  it('case 5：`%%a b`（打空白離開觸發）→ null', () => {
    expect(detectInlineTrigger('%%a b')).toBeNull();
  });

  it('case 6：`%%a%%b` → 只認最後一段 { query: "b", start: 3 }', () => {
    expect(detectInlineTrigger('%%a%%b')).toEqual({ query: 'b', start: 3 });
  });

  it('case 7：空字串 / 純文字 → null', () => {
    expect(detectInlineTrigger('')).toBeNull();
    expect(detectInlineTrigger('一般文字沒有觸發')).toBeNull();
  });

  it('補充：公費百分比「持有超過 10%」單一 % → null（不誤觸）', () => {
    expect(detectInlineTrigger('持有超過 10%')).toBeNull();
  });

  it('補充：中文 query「%%預設」→ { query: "預設" }（可用中文名稱過濾）', () => {
    expect(detectInlineTrigger('%%預設')).toEqual({ query: '預設', start: 0 });
    expect(detectInlineTrigger('信件 %%案件名')).toEqual({ query: '案件名', start: 3 });
  });
});
