import * as pdfjsLib from 'pdfjs-dist';
import { buildPdfLoadParams, loadPdfDocument, renderPdfBlobToImages } from './pdf-render.util';

/** 手寫一份最小的單頁 PDF（含一行 Helvetica 文字），xref 位移即時計算。 */
function minimalPdf(): Uint8Array {
  const content = 'BT /F1 24 Tf 20 100 Td (PDF) Tj ET';
  const bodies = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  let out = '%PDF-1.4\n';
  const offsets: number[] = [];
  bodies.forEach((b, i) => {
    offsets.push(out.length);
    out += `${i + 1} 0 obj\n${b}\nendobj\n`;
  });
  const xref = out.length;
  out += `xref\n0 ${bodies.length + 1}\n0000000000 65535 f \n`;
  out += offsets.map(o => `${String(o).padStart(10, '0')} 00000 n \n`).join('');
  out += `trailer\n<< /Size ${bodies.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out);
}

describe('pdf-render.util — PDF 安全載入（CVE-2024-4367）', () => {
  // Karma 測試頁的 base 是 "/"，assets 由 webpack 服務在 /_karma_webpack_/ 底下
  let originalWorkerSrc: string;
  beforeAll(() => {
    originalWorkerSrc = pdfjsLib.GlobalWorkerOptions.workerSrc;
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/_karma_webpack_/assets/pdf.worker.min.js';
  });
  afterAll(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = originalWorkerSrc;
  });

  it('buildPdfLoadParams 一律關閉 isEvalSupported', () => {
    const data = new Uint8Array([1, 2, 3]);
    const params = buildPdfLoadParams(data);
    expect(params.isEvalSupported).toBe(false);
    expect(params.data).toBe(data);
  });

  it('以真實 pdf.js 開啟 PDF，實際生效的 isEvalSupported 為 false', async () => {
    const pdf = await loadPdfDocument(minimalPdf());
    try {
      expect(pdf.numPages).toBe(1);
      // 讀 pdf.js 內部欄位確認「實際交給字型渲染」的參數；pdfjs 升版時可能要跟著改
      const params = (pdf as unknown as { _transport: { _params: { isEvalSupported: boolean } } })._transport._params;
      expect(params.isEvalSupported).toBe(false);
    } finally {
      await pdf.destroy();
    }
  });

  it('renderPdfBlobToImages 仍能把 PDF 轉成圖', async () => {
    const urls = await renderPdfBlobToImages(new Blob([minimalPdf()], { type: 'application/pdf' }), 1);
    expect(urls.length).toBe(1);
    expect(urls[0].startsWith('data:image/jpeg')).toBeTrue();
  });
});
