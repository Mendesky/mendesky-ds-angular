import type { ComponentDoc } from '../../../../docs/component-doc';

export const docPreviewDoc: ComponentDoc = {
  id: 'doc-preview',
  name: 'Doc Preview 文件預覽',
  selector: 'app-doc-preview',
  group: '浮層元件',
  summary: 'docs: DocPreviewItem[]（必填）· startIndex · (closed) · PDF 走 pdfjs 渲染、其餘走圖片 · ESC 關閉 · 納入 ModalStackService',
  when: '預覽已上傳的附件（表單檔案、掃描文件）。可傳多份，元件自帶前後切換。PDF 與圖片可混在同一份清單，元件依 mimeType 或副檔名自行分派渲染方式。不負責下載或刪除，那些由呼叫端的清單元件處理。',
  props: [
    {
      name: 'docs',
      type: 'DocPreviewItem[]',
      default: '[]',
      desc: "必填（@Input({ required: true })）。DocPreviewItem = { name: string; url: string; mimeType?: string }。有帶 mimeType 時以 mimeType === 'application/pdf' 判定；沒帶時退回看檔名是否結尾 .pdf",
    },
    {
      name: 'startIndex',
      type: 'number',
      default: '0',
      desc: '初始顯示第幾份。多份預覽時從使用者點的那一份開啟',
    },
    {
      name: '(closed)',
      type: 'EventEmitter<void>',
      desc: '關閉時 emit（ESC 或關閉鈕）。父層負責把元件從 DOM 移除',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '單份 PDF',
      code: `@if (previewDoc()) {
  <app-doc-preview
    [docs]="[{ name: previewDoc()!.name, url: previewDoc()!.url }]"
    (closed)="previewDoc.set(null)"
  />
}`,
    },
    {
      label: '多份、從點擊的那份開啟',
      code: `@if (previewOpen()) {
  <app-doc-preview
    [docs]="attachments()"
    [startIndex]="clickedIndex()"
    (closed)="previewOpen.set(false)"
  />
}`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: 'z-index 2000。低於 app-toast-container 的 2100（2026-08-13 定案：預覽開著時的操作回饋必須看得到），低於 tooltip 與使用端全域 API 錯誤浮層的 9999。',
    },
    {
      type: 'warning',
      content: 'PDF 渲染依賴 pdfjs worker，路徑寫死為 assets/pdf.worker.min.js。該檔沒被 build 進 assets 時 PDF 會空白（圖片仍正常），且不會拋錯——換 build 設定後要實測一份 PDF。',
    },
    {
      type: 'info',
      content: '同一個 url 的 PDF 有 cache（pdfCache），來回切換不重新下載；元件銷毀時一併 destroy。',
    },
    {
      type: 'info',
      content: '注入 ModalStackService，所以它算在 modal 堆疊裡：ESC 只關最上層、開啟時外層 modal 不會同時被關。',
    },
  ],
};
