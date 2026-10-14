import type { ComponentDoc } from '../../../../docs/component-doc';

export const cellBtnDoc: ComponentDoc = {
  id: 'cell-btn',
  name: 'Cell Button',
  selector: 'app-cell-btn',
  group: '互動元件',
  summary: '[text] [selected] [disabled] [empty] · (cellClick)',
  when: '日期/年月選擇器內部的格子按鈕。高密度網格選取場景（年份格、月份格、日期格）。',
  props: [
    {
      name: 'text',
      type: 'string',
      default: "''",
      desc: '顯示文字，如 "113 年"、"3 月"、"15"',
    },
    {
      name: 'selected',
      type: 'boolean',
      default: 'false',
      desc: '選中態（藍底白字）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用態（低透明度，不可點擊）',
    },
    {
      name: 'empty',
      type: 'boolean',
      default: 'false',
      desc: '空白佔位格，渲染 span 非 button（日曆前幾格）',
    },
    {
      name: '(cellClick)',
      type: 'EventEmitter<void>',
      desc: '點擊時觸發（disabled/empty 時不觸發）',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '月份格',
      code: '<app-cell-btn [text]="m + \' 月\'" [selected]="isSelected(m)" (cellClick)="selectMonth(m)"></app-cell-btn>',
    },
    {
      label: '年份格',
      code: '<app-cell-btn [text]="y + \' 年\'" [selected]="y === initYear" (cellClick)="selectYear(y)"></app-cell-btn>',
    },
    {
      label: '空白佔位',
      code: '<app-cell-btn [empty]="true" text=""></app-cell-btn>',
    },
  ],
  notes: [
    'display: contents — 外殼透明，父層 grid 直接作用在內部 button 上，不破壞 grid 佈局',
    'hover 效果為元件內建（:hover 偽類），不需額外 Input',
    'selected + hover 時 hover 不覆蓋 selected 態',
  ],
  customTables: [],
};
