import type { ComponentApi } from '../../../../docs/component-doc';

export const uploadDropzoneDoc: ComponentApi = {
  id: 'upload-dropzone',
  selector: 'app-upload-dropzone',
  summary: '上傳拖放區標準元件，含動畫插畫 + 檔案類型/大小驗證。所有上傳介面統一使用。',
  props: [
    {
      name: 'acceptedTypes',
      type: 'string[]',
      default: '[]',
      desc: "可接受的副檔名陣列，如 ['.pdf', '.jpg']；空陣列表示不限制類型",
    },
    {
      name: 'maxSize',
      type: 'number',
      default: '20',
      desc: '單一檔案大小上限（MB）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用狀態，停用時拖放區不可點擊，插畫仍顯示但不可互動',
    },
    {
      name: 'disabledHint',
      type: 'string',
      default: "''",
      desc: '停用時顯示的提示文字，取代主說明文字',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '欄位驗證錯誤訊息；有值時顯示 tooltip（位置見 errorPosition，預設下方）＋ 框線轉錯誤紅（--border/error，與 app-input 錯誤框線同 token；hover/drag-over 期間錯誤紅優先）。空字串 = 無錯誤狀態（2026-07-08 一致化）',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤提示位置。欄位錯誤統一預設在下方；只有版面放不下（下方緊接其他內容會被遮住）時才改 top（2026-10-14 定案）',
    },
    {
      name: 'fileSelected',
      type: 'EventEmitter<File[]>',
      isOutput: true,
      desc: '選到有效檔案後 emit（陣列，支援多檔同時拖入或點選；每個檔案均已通過大小與類型驗證）',
    },
    {
      name: 'fileError',
      type: 'EventEmitter<string>',
      isOutput: true,
      desc: '檔案驗證失敗時 emit 錯誤訊息字串',
    },
  ],
  usage: [
    {
      label: '基本用法（限 PDF/圖片，20MB）',
      code: `<app-upload-dropzone
  [acceptedTypes]="['.pdf', '.jpg', '.jpeg', '.png']"
  [maxSize]="20"
  (fileSelected)="onFile($event)"
  (fileError)="onError($event)">
</app-upload-dropzone>`,
    },
    {
      label: '停用狀態（先完成前置條件）',
      code: `<app-upload-dropzone
  [disabled]="!conditionMet()"
  disabledHint="請先選擇文件類型"
  [acceptedTypes]="['.pdf']"
  (fileSelected)="onFile($event)"
  (fileError)="onError($event)">
</app-upload-dropzone>`,
    },
  ],
};
