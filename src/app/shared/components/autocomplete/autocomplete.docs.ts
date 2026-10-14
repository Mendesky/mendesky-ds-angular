import type { ComponentDoc } from '../../../../docs/component-doc';

export const autocompleteDoc: ComponentDoc = {
  id: 'autocomplete',
  name: 'Autocomplete',
  selector: 'app-autocomplete',
  group: '表單元件',
  summary: 'size: S|M|L · placeholder options: AutocompleteOption[] value errorMessage errorPosition: top|bottom · [disabled] [singleSelect] [clearable] · (selectionChange)',
  when: '搜尋後動態篩選選項的輸入框。',
  props: [
    {
      name: 'size',
      type: 'AutocompleteSize',
      default: "'L'",
      desc: "'S' | 'M' | 'L'",
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'Placeholder'",
      desc: '未選擇時的佔位文字',
    },
    {
      name: 'options',
      type: 'AutocompleteOption[]',
      default: '[]',
      desc: '所有可選項目 { value, label }',
    },
    {
      name: 'value',
      type: 'AutocompleteOption[]',
      default: '[]',
      desc: '外部傳入已選項目（可選）',
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
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態',
    },
    {
      name: 'singleSelect',
      type: 'boolean',
      default: 'false',
      desc: '單選模式：選新值直接取代舊值（不累加 chip）',
    },
    {
      name: 'clearable',
      type: 'boolean',
      default: 'true',
      desc: '是否允許清空已選值。false 會同時關掉三條清空路徑：右側「清除全部」X 鈕、每個 chip 的移除鈕、輸入框為空時按 Backspace。用於「後端欄位 required 且無 clear 路由」的情境——清空在後端無法表達時 UI 就不該提供，否則畫面空但後端留舊值、reopen 又跑回來。命名對齊 app-select 同名 prop',
    },
    {
      name: '(selectionChange)',
      type: 'EventEmitter<AutocompleteOption[]>',
      desc: '已選項目變更時觸發',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '搭配 app-field 提供標題與必填標示',
      code: `<app-field label="縣市" [required]="true">
  <app-autocomplete
    size="L"
    placeholder="搜尋縣市"
    [options]="cityOptions"
    [errorMessage]="form.cityError"
    (selectionChange)="onCityChange($event)"
  ></app-autocomplete>
</app-field>`,
    },
  ],
  notes: [],
  customTables: [],
};
