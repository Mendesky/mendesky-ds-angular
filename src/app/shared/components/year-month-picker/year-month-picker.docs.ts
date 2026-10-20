import type { ComponentApi } from '../../../../docs/component-doc';

export const yearMonthPickerDoc: ComponentApi = {
  id: 'year-month-picker',
  selector: 'app-year-month-picker',
  summary: 'size: S|M|L · [yearOnly] [mode: month|period] · minYear maxYear · [disabled] · CVA 控制 value',
  props: [
    {
      name: 'size',
      type: "'S' | 'M' | 'L'",
      default: "'S'",
      desc: 'trigger 尺寸',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'選擇年月'",
      desc: '空值時顯示的 placeholder 文字',
    },
    {
      name: 'minYear',
      type: 'number',
      default: '110',
      desc: '可選最小民國年',
    },
    {
      name: 'maxYear',
      type: 'number',
      default: '125',
      desc: '可選最大民國年',
    },
    {
      name: 'yearOnly',
      type: 'boolean',
      default: 'false',
      desc: "true：只選年度，值格式為 '114'；false（預設）：選年月，值格式為 '114-3'",
    },
    {
      name: 'mode',
      type: "'month' | 'period'",
      default: "'month'",
      desc: "'month'（預設）：選年月；'period'：1 期 = 2 個月，startMonth ∈ {1,3,5,7,9,11}",
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: 'true：唯讀（不可開啟面板、不可選），additive、向後相容',
    },
  ],
  usage: [
    {
      label: '選年月（預設）',
      code: `<app-year-month-picker
  size="S"
  [ngModel]="period"
  (ngModelChange)="onPeriodChange($event)">
</app-year-month-picker>`,
    },
    {
      label: '只選年',
      code: `<app-year-month-picker
  [yearOnly]="true"
  size="L"
  placeholder="選擇年度"
  [ngModel]="year"
  (ngModelChange)="onYearChange($event)">
</app-year-month-picker>`,
    },
    {
      label: '選期別（1 期 = 2 個月）',
      code: `<app-year-month-picker
  mode="period"
  size="M"
  [ngModel]="taxPeriod"
  (ngModelChange)="onTaxPeriodChange($event)">
</app-year-month-picker>`,
    },
  ],
};
