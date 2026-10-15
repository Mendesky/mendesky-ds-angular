import type { ComponentDoc } from '../../../../docs/component-doc';

export const fileListDoc: ComponentDoc = {
  id: 'file-list',
  name: 'File List',
  selector: 'app-file-list',
  group: '展示元件',
  summary: '已上傳檔案清單中間層元件，動作固定為 view / delete（**不可覆寫**），支援唯讀（disabled）模式與空狀態提示。與 app-upload-dropzone 搭配使用。',
  when: '需要呈現已上傳檔案列表並提供操作時。支援「無類型模式」（wizard 報價單）與「有類型模式」（p1 報價依據文件，type 由父層傳入 FileItem.type）。disabled=true 為唯讀，只剩 view。**需要 download 或依檔案類型切換動作時不要用這支**——它沒有 actions Input；直接用 app-number-list（有 actions Input，NumberListAction 已含 download），客戶文件即如此。',
  props: [
    {
      name: 'docs',
      type: 'FileItem[]',
      default: '[]',
      desc: 'FileItem = { id, name, size, type?, url?, mimeType? }，size 單位 bytes；size 為 0 時只顯示檔名',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '唯讀模式，從 actions 濾掉 delete（預設情況即只剩 view）；用於集團案件「同主要公司」預覽等唯讀情境',
    },
    {
      name: 'emptyText',
      type: 'string',
      default: "'尚未上傳任何檔案'",
      desc: '空狀態提示文字；空字串時不渲染 empty state div（避免佔位）',
    },
    {
      name: 'removeFile',
      type: 'EventEmitter<string>',
      isOutput: true,
      desc: '使用者點 delete 時 emit doc.id',
    },
    {
      name: 'viewFile',
      type: 'EventEmitter<string>',
      isOutput: true,
      desc: '使用者點 view 時 emit doc.id',
    },
  ],
  usage: [
    {
      label: '基本用法（多檔上傳後列表）',
      code: `<app-file-list
  [docs]="backfillDocs()"
  emptyText="尚未上傳任何報價單原檔"
  (removeFile)="removeDoc($event)"
  (viewFile)="viewDoc($event)">
</app-file-list>`,
    },
    {
      label: '唯讀預覽（同主要公司）',
      code: `<app-file-list
  [docs]="mainClientDocs"
  [disabled]="true"
  emptyText="主要公司尚未上傳報價單">
</app-file-list>`,
    },
    {
      label: '不顯示空狀態（用於 p1 卡片內）',
      code: `<app-file-list
  [docs]="uploadedDocs()"
  emptyText=""
  (viewFile)="onDocAction($event, 'view')"
  (removeFile)="onDocAction($event, 'delete')">
</app-file-list>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: 'FileItem interface 從 file-list.component.ts export，外層元件直接 import 使用。',
    },
    {
      type: 'info',
      content: '元件內部使用 app-number-list 渲染每列，type 欄位對應 label chip；type 空字串時不渲染 chip。',
    },
    {
      type: 'warn',
      content: 'emptyText 設空字串時不渲染 empty state，避免在 p1 卡片等場景下產生多餘的 padding。',
    },
  ],
  customTables: [],
};
