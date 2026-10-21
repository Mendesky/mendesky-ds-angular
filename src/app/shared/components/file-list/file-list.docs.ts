import type { ComponentApi } from '../../../../docs/component-doc';

export const fileListDoc: ComponentApi = {
  id: 'file-list',
  selector: 'app-file-list',
  summary: '已上傳檔案清單中間層元件，動作固定為 view / delete（**不可覆寫**），支援唯讀（disabled）模式與空狀態提示。與 app-upload-dropzone 搭配使用。',
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
      desc: '唯讀模式，從 actions 濾掉 delete（預設情況即只剩 view）；用於「沿用其他來源的檔案」預覽等唯讀情境',
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
  [docs]="uploadedDocs()"
  emptyText="尚未上傳任何原始檔案"
  (removeFile)="removeDoc($event)"
  (viewFile)="viewDoc($event)">
</app-file-list>`,
    },
    {
      label: '唯讀預覽（沿用其他來源的檔案）',
      code: `<app-file-list
  [docs]="sourceDocs"
  [disabled]="true"
  emptyText="來源尚未上傳檔案">
</app-file-list>`,
    },
    {
      label: '不顯示空狀態（用於卡片內）',
      code: `<app-file-list
  [docs]="uploadedDocs()"
  emptyText=""
  (viewFile)="onDocAction($event, 'view')"
  (removeFile)="onDocAction($event, 'delete')">
</app-file-list>`,
    },
  ],
};
