/**
 * `%%` autocomplete 觸發偵測（兩個範本變數編輯器共用：TipTap / 自刻 contenteditable）。
 *
 * 給「游標前的文字」，偵測結尾是否為 `%%` 起手的觸發序列：
 *   `%%` + 連續非 `%`/非空白字（= 查詢字串），且必須緊貼游標（結尾錨定 `$`）。
 *
 * 設計為純函數，讓兩端共用同一份偵測邏輯且可單元測試（不依賴 DOM / ProseMirror）。
 * - 即時重掃（每次輸入呼叫一次）即可自然處理 Backspace / node 拆分 / 邊界，無需維護錨點。
 * - 用 `%%` 而非單一 `%`：避開一般文字裡的百分比（如「10%」），並與手打 `%Key%` 的單 `%` 路徑區分。
 * - 打到空白或第三個 `%` → `[^%\s]*` 中止且無法接到 `$` → 回 null（視為離開觸發、關閉面板）。
 *
 * @param textBeforeCursor 游標前（同一 textblock / text node）的文字
 * @returns 命中回 `{ query, start }`（start = 觸發序列第一個 `%` 的索引）；否則 `null`
 */
export function detectInlineTrigger(
  textBeforeCursor: string,
): { query: string; start: number } | null {
  const match = /%%([^%\s]*)$/.exec(textBeforeCursor);
  if (!match) return null;
  return { query: match[1], start: match.index };
}
