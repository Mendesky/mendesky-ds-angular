import type { ComponentApi } from '../../../../docs/component-doc';

export const selectDoc: ComponentApi = {
  id: 'select',
  selector: 'app-select',
  summary: 'options: SelectOption[] · placeholder size: S|M|L · [clearable] errorMessage errorPosition: top|bottom · CVA 控制 value/isDisabled',
  props: [
    {
      name: 'options',
      type: 'SelectOption[]',
      default: '[]',
      desc: '選項列表：{ value, label, disabled? }',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'請選擇'",
      desc: '未選中時的佔位文字',
    },
    {
      name: 'size',
      type: "'S' | 'M' | 'L'",
      default: "'M'",
      desc: 'L=40px、M=36px、S=32px（觸發框高度）',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '錯誤訊息；有值時切換 error 狀態',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤 tooltip 顯示方向（浮動，不佔版面）',
    },
    {
      name: 'clearable',
      type: 'boolean',
      default: 'false',
      desc: '為 true 時，select 有選中值的情況下右側顯示清除 icon（No-X-Cancel 16px）；點擊清除會將值設為 null',
    },
    {
      name: 'searchable',
      type: 'boolean',
      default: 'false',
      desc: '觸發區改成可輸入的搜尋框，邊打字邊篩選選項',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用；停用時不能開啟下拉',
    },
  ],
  usage: [
    {
      label: '搭配 app-field 使用',
      code: `<app-field label="部門" [required]="true">
  <app-select
    [options]="departmentOptions"
    placeholder="請選擇部門"
    [errorMessage]="form.departmentError"
    formControlName="department"
  ></app-select>
</app-field>`,
    },
    {
      label: 'options 格式',
      code: `// component.ts
departmentOptions: SelectOption[] = [
  { value: 'design',      label: '設計部' },
  { value: 'engineering', label: '工程部' },
  { value: 'admin',       label: '行政部', disabled: true },
];`,
    },
  ],
  usageNotes: [
    'app-select 實作 CVA（ControlValueAccessor），可直接接 formControlName 或 [(ngModel)]。',
  ],
};
