import type { ComponentApi } from '../../../../docs/component-doc';

export const selectDoc: ComponentApi = {
  id: 'select',
  selector: 'app-select',
  summary: 'options: SelectOption[]（{ value, label, disabled?, status?: { label } }）· placeholder size: S|M|L · [clearable] errorMessage errorPosition: top|bottom · CVA 控制 value/isDisabled',
  props: [
    {
      name: 'options',
      type: 'SelectOption[]',
      default: '[]',
      desc: '選項列表：{ value, label, disabled?, status? }。status 是狀態標記 { label }，有值時這個選項的文字右邊顯示紅色驚嘆號，滑過顯示 label，報讀軟體把 label 接在文字後面念；選中這個選項後，選取框文字右邊也會顯示。',
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
    {
      label: '狀態標記：有東西要處理的選項，status 給 { label }',
      code: `groupOptions: SelectOption[] = [
  { value: 'a', label: '第一組', status: { label: '需處理' } },
  { value: 'b', label: '第二組' },
  { value: 'c', label: '第三組', status: { label: '需處理' } },
];`,
    },
  ],
  usageNotes: [
    'app-select 實作 CVA（ControlValueAccessor），可直接接 formControlName 或 [(ngModel)]。',
    '狀態標記的型別 StatusMark 從 @mendesky/ds-angular 匯出，跟 app-tabs 的狀態標記是同一個型別。',
    '可輸入模式（[searchable]="true"）打開下拉、正在打字時，選取框的驚嘆號先藏起來；關上後再顯示。選項上的驚嘆號照常顯示。',
    'status 只有 label 改變時，選項也會重畫；內容完全相同的新陣列不會重畫。',
  ],
};
