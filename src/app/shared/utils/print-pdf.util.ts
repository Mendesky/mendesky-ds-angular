/**
 * 列印 PDF blob（跨瀏覽器，一律不開新分頁）。
 *
 * 契約（2026-07-22 定案）：本函式以「完整下載的 Blob」為輸入，且任何路徑都不開新分頁。
 *
 * - **Chromium（Chrome/Edge，`useIframe=true`）**：隱藏 iframe 載入 PDF → `contentWindow.print()`，
 *   同分頁無縫列印。
 * - **Safari/Firefox（`useIframe=false`）**：iframe 內 PDF 列印會印空白（瀏覽器限制，無法同分頁列印）
 *   → 直接下載 PDF 檔，由使用者開啟檔案列印（產品決策，取代先前「開新分頁載入 PDF」方案）。
 *   caller 據回傳值 `'downloaded'` 提示使用者。
 *
 * `filename` 由使用端決定（含 `.pdf`），也是列印對話窗「另存 PDF」的預設檔名。
 */
export function printPdfBlob(
  blob: Blob,
  filename: string,
  useIframe: boolean = supportsIframePrint(),
): 'printed' | 'downloaded' {
  if (typeof document === 'undefined') return 'printed';
  // 包成具名 File 再產 object URL：Chromium PDF viewer 以 File.name 作為文件標題，
  // 列印對話窗「另存 PDF」的預設檔名與 viewer 內下載鈕的檔名皆隨之採用（blob URL 本身是隨機 UUID）
  const url = URL.createObjectURL(new File([blob], filename, { type: blob.type || 'application/pdf' }));
  if (useIframe) {
    printViaIframe(url, filename.replace(/\.pdf$/i, ''));
    return 'printed';
  }
  downloadViaAnchor(url, filename);
  return 'downloaded';
}

/** Safari/Firefox：下載 PDF 檔（同分頁列印不可行的替代方案）。 */
function downloadViaAnchor(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Chromium（Chrome/Edge/Arc…）支援 iframe 內 PDF 列印；Safari/Firefox 不支援 → 下載。
 *
 * 偵測順序（2026-07-23 內網實測教訓）：`navigator.userAgentData` 只存在於 secure context
 * （HTTPS / localhost）——部署在內網 `http://<IP>` 時 Chromium 也拿不到，只靠它會把
 * Chrome/Arc/Edge 全誤判成 Safari/Firefox。故再以 UA 字串 fallback：`Chrome/` token
 * 僅 Chromium 系有（Safari 無、Firefox 無、iOS Chrome 是 `CriOS/` 且為 WebKit 核不支援）。
 */
export function supportsIframePrint(
  nav: { userAgent: string; userAgentData?: unknown } | undefined
    = typeof navigator !== 'undefined' ? navigator : undefined,
): boolean {
  if (!nav) return false;
  if (nav.userAgentData) return true;
  return /Chrome\/\d/.test(nav.userAgent);
}

/**
 * Chromium：隱藏 iframe 無縫列印。jobTitle = 另存 PDF 的預設檔名（不含副檔名）。
 *
 * Chrome 列印對話窗「另存為 PDF」的預設檔名取自「頂層頁面 document.title」（2026-07-23 實測：
 * 對話窗顯示的是網站標題而不是 PDF metadata 的 Title → 來源是頁標題），且快照
 * 發生在 print() 返回之後（同步還原實測無效）→ 標題須保持替換直到對話窗關閉才還原。
 * 關閉偵測：afterprint（PDF iframe 常不觸發）＋ document.hasFocus() 輪詢（對話窗開啟時
 * 頁面失焦、關閉時回焦）＋ 60s 保底。
 */
function printViaIframe(url: string, jobTitle: string): void {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;';

  const originalTitle = document.title;
  let cleaned = false;
  const cleanup = (): void => {
    if (cleaned) return;
    cleaned = true;
    // 只在標題仍是我們換上的值時才還原，避免蓋掉期間發生的其他標題變更
    if (document.title === jobTitle) document.title = originalTitle;
    URL.revokeObjectURL(url);
    iframe.remove();
  };

  iframe.onload = (): void => {
    const win = iframe.contentWindow;
    if (!win) { cleanup(); return; }
    try {
      win.addEventListener('afterprint', cleanup, { once: true });
      document.title = jobTitle;
      win.focus();
      win.print();
    } catch {
      cleanup();
      return;
    }
    // 對話窗關閉偵測：先觀察到「曾失焦」（對話窗確實開啟）後的回焦才算關閉，避免預覽尚未
    // 開啟時誤判提早還原；60s 保底涵蓋對話窗未開 / 事件全失效的情況
    const startedAt = Date.now();
    let sawDialogOpen = !document.hasFocus();
    const poll = window.setInterval(() => {
      if (!document.hasFocus()) {
        sawDialogOpen = true;
        return;
      }
      if (sawDialogOpen || Date.now() - startedAt > 60000) {
        window.clearInterval(poll);
        cleanup();
      }
    }, 500);
  };

  iframe.src = url;
  document.body.appendChild(iframe);
}
