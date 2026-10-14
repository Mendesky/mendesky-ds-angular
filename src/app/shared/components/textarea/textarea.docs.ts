import type { ComponentDoc } from '../../../../docs/component-doc';

export const textareaDoc: ComponentDoc = {
  id: 'textarea',
  name: 'Textarea',
  selector: 'app-textarea',
  group: '表單元件',
  summary: 'size: M|L · placeholder errorMessage errorPosition: top|bottom · [disabled] [autoResize] · (valueChange) (blur)',
  when: '備注、描述等多行輸入。禁止原生 <textarea>。',
  props: [
    {
      name: 'size',
      type: 'TextareaSize',
      default: "'L'",
      desc: "'M' | 'L'",
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'Placeholder'",
      desc: '佔位文字',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '錯誤訊息；有值時切換 error 狀態並顯示在下方',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤 tooltip 顯示方向（浮動，不佔版面）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態（禁止 resize）',
    },
    {
      name: 'autoResize',
      type: 'boolean',
      default: 'false',
      desc: '高度隨內容自動撐開（禁用手動 resize handle）。適用於系統組合的長文字，如 P4-3 服務範圍內容',
    },
    {
      name: 'initialValue',
      type: 'string',
      default: "''",
      desc: '初始值（外部設定，支援非同步綁定）。同族 app-input 亦有此 prop，兩者行為一致',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string>',
      desc: '值變更事件（每次輸入）',
      isOutput: true,
    },
    {
      name: '(blur)',
      type: 'EventEmitter<string>',
      desc: '失焦時 emit 當前值；供「blur 才存檔」的欄位綁定（對齊 app-input）',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '搭配 app-field 提供標題與必填標示',
      code: `<app-field label="備註說明" [required]="true">
  <app-textarea
    size="L"
    placeholder="請輸入備註說明"
    [errorMessage]="form.noteError"
    (valueChange)="onNoteChange($event)"
  ></app-textarea>
</app-field>`,
    },
  ],
  notes: [],
  customTables: [],
};
