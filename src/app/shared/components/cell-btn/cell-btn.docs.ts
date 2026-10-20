import type { ComponentApi } from '../../../../docs/component-doc';

export const cellBtnDoc: ComponentApi = {
  id: 'cell-btn',
  selector: 'app-cell-btn',
  summary: '[text] [selected] [disabled] [empty] · (cellClick)',
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
};
