import type { ComponentDoc } from '../../../../docs/component-doc';

export const checkboxDoc: ComponentDoc = {
  id: 'checkbox',
  name: 'Checkbox',
  selector: 'app-checkbox',
  group: '互動元件',
  summary: '[checked] [indeterminate] · size: s|m|l · label · ariaLabel · [disabled] · (checkedChange) · CVA（ngModel）',
  when: '單純的勾選框，三態：沒有／全有／部分。「部分」用在「一組裡選了一些」的地方（例：權限清單的分類列）。要「勾選框＋文字」的可點按鈕、只需兩態時，改用 app-check-chip。',
  props: [
    {
      name: 'checked',
      type: 'boolean',
      default: 'false',
      desc: '全有',
    },
    {
      name: 'indeterminate',
      type: 'boolean',
      default: 'false',
      desc: '部分；為 true 時優先顯示「部分」，不管 checked 是什麼。只由呼叫端算出來，使用者點不出這個狀態',
    },
    {
      name: 'size',
      type: "'s' | 'm' | 'l'",
      default: "'m'",
      desc: 's（框約 16.7px）／m（框 20px）／l（框約 23.3px）',
    },
    {
      name: 'label',
      type: 'string',
      default: "''",
      desc: '框右邊的文字；點文字也算點勾選框。可省略',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '沒有 label 時一定要給，讀螢幕軟體才唸得出這是什麼（例：「報價案件管理 整組檢視」）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用。與 ngModel 一起用時也能直接從 template 停用',
    },
    {
      name: '(checkedChange)',
      type: 'EventEmitter<boolean>',
      desc: '使用者點擊後的新值。沒有 → true、全有 → false、部分 → true',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '分類列（部分勾選由呼叫端算）',
      code: `<app-checkbox
  [checked]="allSelected()"
  [indeterminate]="someSelected()"
  label="報價案件管理"
  (checkedChange)="toggleGroup($event)"
></app-checkbox>`,
    },
    {
      label: '沒有文字時給 ariaLabel',
      code: `<app-checkbox size="s" [(ngModel)]="selected" ariaLabel="選取這一列"></app-checkbox>`,
    },
  ],
  notes: [
    { type: 'info', content: '點擊後元件會先自己清掉 indeterminate，之後以呼叫端傳入的值為準。' },
    { type: 'info', content: '顏色：沒有＝text/body；全有、部分＝Color/Green/80。不用 button/success（#74ae3e），因為白色勾放在上面只有 2.67:1，達不到 WCAG 1.4.11 的 3:1。' },
    { type: 'info', content: '圖示與 app-check-chip 共用同一組 registry：CheckBox／CheckBoxOn／CheckBoxMixed。' },
  ],
};
