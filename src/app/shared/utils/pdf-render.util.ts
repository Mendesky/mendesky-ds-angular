import * as pdfjsLib from 'pdfjs-dist';

// 與 doc-preview.component.ts 相同的 pdfjs 設定（Promise.try polyfill + worker），避免重複的 worker 載入問題。
if (!(Promise as unknown as Record<string, unknown>)['try']) {
  (Promise as unknown as Record<string, unknown>)['try'] = function <T>(fn: () => T) {
    return new Promise<T>(resolve => resolve(fn()));
  };
}
pdfjsLib.GlobalWorkerOptions.workerSrc = 'assets/pdf.worker.min.js';

/**
 * 把 PDF blob render 成「每頁一張 JPEG data URL」，供與報價單預覽一致的頁面圖卡片呈現
 * （不用瀏覽器原生 iframe PDF viewer）。
 * scale=2、toDataURL('image/jpeg') 對齊 doc-preview.component；單頁 render 失敗則略過該頁。
 */
export async function renderPdfBlobToImages(blob: Blob, scale = 2): Promise<string[]> {
  const buffer = await blob.arrayBuffer();
  const pdfDoc = await pdfjsLib.getDocument(buffer).promise;
  const urls: string[] = [];
  for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
    try {
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale });
      const canvas = document.createElement('canvas');
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      const ctx = canvas.getContext('2d');
      if (!ctx) continue;
      await page.render({ canvasContext: ctx, viewport }).promise;
      urls.push(canvas.toDataURL('image/jpeg'));
    } catch {
      /* 單頁失敗略過，不影響其他頁 */
    }
  }
  return urls;
}
