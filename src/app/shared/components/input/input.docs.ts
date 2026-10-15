import type { ComponentDoc } from '../../../../docs/component-doc';

export const inputDoc: ComponentDoc = {
  id: 'input',
  name: 'Input',
  selector: 'app-input',
  group: '表單元件',
  summary: 'size: S|M|L · placeholder type inputMode sanitize initialValue errorMessage errorPosition: top|bottom · [disabled] [readonly] · (valueChange) (blur)',
  when: '單行文字輸入。禁止原生 <input>。type=\'password\' 時自動顯示 eye toggle。電話/統編等純數字欄位用 inputMode="numeric" sanitize="digits"。',
  props: [
    {
      name: 'size',
      type: 'InputSize',
      default: "'L'",
      desc: "'S' | 'M' | 'L'",
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'Placeholder'",
      desc: '佔位文字',
    },
    {
      name: 'type',
      type: 'string',
      default: "'text'",
      desc: "HTML input type（text / date / email / number / password / tel 等）；type='password' 時自動顯示 eye toggle，clear 按鈕隱藏",
    },
    {
      name: 'inputMode',
      type: 'InputMode',
      default: "'text'",
      desc: '透傳至原生 inputmode，影響行動裝置鍵盤型態。\'numeric\' 跳出數字鍵盤（無符號）；\'tel\' 跳出電話鍵盤（含 + * #）。電話/手機/純數字欄位搭配 sanitize="digits" 一起用。',
    },
    {
      name: 'sanitize',
      type: "'none' | 'digits'",
      default: "'none'",
      desc: "輸入時自動過濾字元。'digits' = 只保留數字，非數字（英文、符號、連字號）在 input event 中即時被 strip，含 paste 情境；cursor 位置自動修正。",
    },
    {
      name: 'initialValue',
      type: 'string',
      default: "''",
      desc: '預填值；外部可透過此 Input 同步更新欄位內容（ngOnChanges 監聽）',
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
      desc: '禁用狀態',
    },
    {
      name: 'readonly',
      type: 'boolean',
      default: 'false',
      desc: '唯讀狀態：不可編輯、隱藏清空鈕，但文字維持正常色、可聚焦選取（展示型欄位用，如分享連結）。與 disabled 不同——disabled 文字轉淡灰且不可聚焦。',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string>',
      desc: '值變更事件',
      isOutput: true,
    },
    {
      name: '(blur)',
      type: 'EventEmitter<string>',
      desc: 'blur 事件，帶出當前值；用於需要 blur 後觸發邏輯的場景（如地址郵遞區號 lookup）',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '搭配 app-field 提供標題與必填標示',
      code: `<app-field label="案件名稱" [required]="true">
  <app-input
    size="L"
    placeholder="請輸入案件名稱"
    [errorMessage]="form.nameError"
    (valueChange)="onNameChange($event)"
  ></app-input>
</app-field>`,
    },
    {
      label: '預填值（例：從 API 回填）',
      code: `<app-input
  size="M"
  [initialValue]="prefillValue"
  (valueChange)="prefillValue = $event"
></app-input>`,
    },
    {
      label: '日期 input',
      code: '<app-input type="date" size="M" (valueChange)="onDateChange($event)"></app-input>',
    },
    {
      label: '唯讀展示（如分享連結，不可編輯但可讀可選取）',
      code: '<app-input size="M" [initialValue]="shareUrl" [readonly]="true"></app-input>',
    },
  ],
  notes: [
    'Suffix icon（eye toggle、clear 等）統一使用 size="16"，不可用其他尺寸。',
  ],
  customTables: [],
};
