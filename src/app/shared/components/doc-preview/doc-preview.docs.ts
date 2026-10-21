import type { ComponentApi } from '../../../../docs/component-doc';

export const docPreviewDoc: ComponentApi = {
  id: 'doc-preview',
  selector: 'app-doc-preview',
  summary: 'docs: DocPreviewItem[]（必填）· startIndex · (closed) · PDF 走 pdfjs 渲染、其餘走圖片 · ESC 關閉 · 納入 ModalStackService',
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
};
