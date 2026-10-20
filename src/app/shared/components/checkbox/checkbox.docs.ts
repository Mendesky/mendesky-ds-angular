import type { ComponentApi } from '../../../../docs/component-doc';

export const checkboxDoc: ComponentApi = {
  id: 'checkbox',
  selector: 'app-checkbox',
  summary: '[checked] [indeterminate] · size: s|m|l · label · ariaLabel · [disabled] · (checkedChange) · CVA（ngModel）',
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
      desc: '沒有 label 時一定要給，讀螢幕軟體才唸得出這是什麼（例：「使用者管理 整組檢視」）',
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
  label="使用者管理"
  (checkedChange)="toggleGroup($event)"
></app-checkbox>`,
    },
    {
      label: '沒有文字時給 ariaLabel',
      code: `<app-checkbox size="s" [(ngModel)]="selected" ariaLabel="選取這一列"></app-checkbox>`,
    },
  ],
};
