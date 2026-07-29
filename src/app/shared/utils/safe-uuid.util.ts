/**
 * secure-context-safe UUID.
 *
 * `crypto.randomUUID()` 只在 secure context（HTTPS / localhost）才存在；在 http 的內網 IP／
 * 主機名下（非 localhost）為 `undefined`，直接呼叫會丟 `TypeError: crypto.randomUUID is not a
 * function`。本專案內網以 http 部署（nginx listen 80），故凡是「純前端 render key / client id」
 * 用途一律走此 helper，避免在不支援的環境整條流程 throw。
 *
 * 註：`crypto.getRandomValues()` 在 insecure context 仍可用，故優先用它產生符合 RFC4122 v4 的字串；
 * 連它都沒有時才退回 Math.random（此 id 非安全用途，僅供畫面/暫存 keying）。
 */
export function safeUuid(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  if (c && typeof c.getRandomValues === 'function') {
    const b = c.getRandomValues(new Uint8Array(16));
    b[6] = (b[6] & 0x0f) | 0x40; // version 4
    b[8] = (b[8] & 0x3f) | 0x80; // variant
    const h = [...b].map(x => x.toString(16).padStart(2, '0'));
    return `${h[0]}${h[1]}${h[2]}${h[3]}-${h[4]}${h[5]}-${h[6]}${h[7]}-${h[8]}${h[9]}-${h[10]}${h[11]}${h[12]}${h[13]}${h[14]}${h[15]}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
