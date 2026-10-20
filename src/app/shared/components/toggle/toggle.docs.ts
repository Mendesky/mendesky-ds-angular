import type { ComponentApi } from '../../../../docs/component-doc';

export const toggleDoc: ComponentApi = {
  id: 'toggle',
  selector: 'app-toggle',
  summary: '[checked] [disabled] · (checkedChange)',
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
      name: '(checkedChange)',
      type: 'EventEmitter<boolean>',
      desc: '狀態切換時觸發，回傳新值',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '單向綁定',
      code: '<app-toggle [checked]="isEnabled" (checkedChange)="isEnabled = $event"></app-toggle>',
    },
    {
      label: '雙向綁定',
      code: '<app-toggle [(checked)]="isEnabled"></app-toggle>',
    },
    {
      label: '禁用',
      code: '<app-toggle [checked]="isEnabled" [disabled]="true"></app-toggle>',
    },
  ],
};
