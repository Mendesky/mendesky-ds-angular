import type { ComponentDoc } from '../../../../docs/component-doc';

export const emptyStateDoc: ComponentDoc = {
  id: 'empty-state',
  name: 'Empty State',
  selector: 'app-empty-state',
  group: '展示元件',
  summary: 'message · ng-content default slot（投影 CTA 按鈕或自訂內容）',
  when: '列表/查詢無資料時顯示。',
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
  notes: [
    {
      type: 'info',
      content: 'default ng-content slot 可投影任意內容（按鈕、含 inline CTA 的訊息段落等），投影內容顯示在 message 文字下方。',
    },
  ],
  customTables: [],
};
