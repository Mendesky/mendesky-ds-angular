/** 排序方向 */
export type SortDir = 'asc' | 'desc';

/** 列表目前依哪一欄、哪個方向排序；null 表示沒有排序（照資料原本的順序） */
export interface SortState<K extends string = string> {
  key: K;
  dir: SortDir;
}

/**
 * 點表頭後的下一個排序狀態：點同一欄就反轉方向，點別欄就從那欄的預設方向開始。
 * 兩段切換（升冪 ↔ 降冪），與 dashboard-app 案件列表一致。
 *
 * 用法：
 *   onSortChange(key: string) { this.sort.set(nextSort(this.sort(), key)); }
 *   // 數量、日期這類欄位通常希望第一次點就「多到少 / 新到舊」：
 *   nextSort(this.sort(), key, key === 'count' ? 'desc' : 'asc')
 */
export function nextSort<K extends string>(current: SortState<K> | null, key: K, defaultDir: SortDir = 'asc'): SortState<K> {
  if (current?.key === key) return { key, dir: current.dir === 'asc' ? 'desc' : 'asc' };
  return { key, dir: defaultDir };
}
