import type { ComponentApi } from '../../../../docs/component-doc';

export const modalCloseBtnDoc: ComponentApi = {
  id: 'modal-close-btn',
  selector: 'app-modal-close-btn',
  summary: 'ariaLabel · disabled · (closeClick) — 統一的 modal 關閉 X 鈕（No-X-Cancel + propClass="Modal"）',
  props: [
    {
      name: 'ariaLabel',
      type: 'string',
      default: "'關閉'",
      desc: '無障礙標籤；情境特定可覆寫（如「關閉費用設定」）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用（如 saving 中不可關）；傳給內部 icon-btn',
    },
    {
      name: '(closeClick)',
      type: 'EventEmitter<void>',
      desc: '點擊時觸發；parent 決定 dirty 時直接關還是彈二次確認',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: '<app-modal-close-btn (closeClick)="requestClose()"></app-modal-close-btn>',
    },
    {
      label: 'saving 中停用',
      code: '<app-modal-close-btn [disabled]="saving()" (closeClick)="requestClose()"></app-modal-close-btn>',
    },
  ],
  usageNotes: [
    {
      type: 'info',
      content: '搭配 app-modal-shell 時寫 [canDismiss]="!isDirty()"（backdrop 受 dirty gate），X 鈕綁 (closeClick)。',
    },
  ],
};
