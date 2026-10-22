import type { ComponentApi } from '../../../../docs/component-doc';

export const emptyStateDoc: ComponentApi = {
  id: 'empty-state',
  selector: 'app-empty-state',
  summary: 'message · ng-content default slot（投影 CTA 按鈕或自訂內容）',
  props: [
    {
      name: 'message',
      type: 'string',
      default: "'目前無資料'",
      desc: '插圖下方文字；空字串時不顯示',
    },
  ],
  usage: [
    {
      label: '預設文字',
      code: '<app-empty-state></app-empty-state>',
    },
    {
      label: '自訂文字',
      code: '<app-empty-state message="查無符合的項目"></app-empty-state>',
    },
    {
      label: '不顯示文字',
      code: '<app-empty-state message=""></app-empty-state>',
    },
    {
      label: '投影 CTA 按鈕',
      code: `<app-empty-state message="尚無資料">
  <app-button variant="filled" color="primary" size="M"
    text="新增" leftIcon="Plus"
    (btnClick)="onAdd()"></app-button>
</app-empty-state>`,
    },
  ],
  usageNotes: [
    {
      type: 'info',
      content: '自訂內容走預設的 ng-content slot（不需 select）：直接寫在 <app-empty-state> 標籤內，就會投影到 message 文字下方。',
    },
  ],
};
