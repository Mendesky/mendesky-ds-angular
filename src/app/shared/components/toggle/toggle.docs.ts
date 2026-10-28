import type { ComponentApi } from '../../../../docs/component-doc';

export const toggleDoc: ComponentApi = {
  id: 'toggle',
  selector: 'app-toggle',
  summary: '[checked] [disabled] · ariaLabel · (checkedChange)',
  props: [
    {
      name: 'checked',
      type: 'boolean',
      default: 'false',
      desc: '開關狀態（雙向綁定用 [(checked)]）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態（opacity 0.5，不可點擊）',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '報讀軟體念的名稱，套在內層 switch 的 aria-label。開關本身沒有文字，一律要給；旁邊的文字會隨開關改變時，給固定名稱。',
    },
    {
      name: '(checkedChange)',
      type: 'EventEmitter<boolean>',
      desc: '狀態切換時觸發，回傳新值',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '單向綁定',
      code: '<app-toggle [checked]="isEnabled" ariaLabel="Email 通知" (checkedChange)="isEnabled = $event"></app-toggle>',
    },
    {
      label: '雙向綁定',
      code: '<app-toggle [(checked)]="isEnabled" ariaLabel="Email 通知"></app-toggle>',
    },
    {
      label: '禁用',
      code: '<app-toggle [checked]="isEnabled" [disabled]="true" ariaLabel="Email 通知"></app-toggle>',
    },
  ],
  usageNotes: [
    {
      type: 'warn',
      content: 'ariaLabel 要寫成元件的設定（ariaLabel="…" 或 [ariaLabel]="…"）。直接寫 aria-label 或 [attr.aria-label] 會留在外層 app-toggle 上，到不了內層 button，報讀軟體讀不到。',
    },
  ],
};
