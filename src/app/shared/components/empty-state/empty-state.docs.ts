import type { ComponentApi } from '../../../../docs/component-doc';

export const emptyStateDoc: ComponentApi = {
  id: 'empty-state',
  selector: 'app-empty-state',
  summary: 'variant（empty／error）· message · title · description · retryText · retrying · (retry) · ng-content default slot（投影 CTA 按鈕或自訂內容）',
  props: [
    {
      name: 'variant',
      type: "'empty' | 'error'",
      default: "'empty'",
      desc: 'empty 顯示插圖與 message；error 是內容讀取失敗，改顯示紅色圖示、標題、說明與重試鈕',
    },
    {
      name: 'message',
      type: 'string',
      default: "'目前無資料'",
      desc: '插圖下方文字；空字串時不顯示。只有 empty 版本顯示',
    },
    {
      name: 'title',
      type: 'string',
      default: "'載入失敗'",
      desc: 'error 版本的標題：寫哪一塊沒載入',
    },
    {
      name: 'description',
      type: 'string',
      default: "''",
      desc: 'error 版本的說明：寫下一步；空字串時不顯示',
    },
    {
      name: 'retryText',
      type: 'string',
      default: "'重試'",
      desc: 'error 版本重試鈕的文字',
    },
    {
      name: 'retrying',
      type: 'boolean',
      default: 'false',
      desc: 'error 版本：true 時重試鈕顯示載入圈與「重試中」，再按不會送出 (retry)',
    },
    {
      name: '(retry)',
      type: 'EventEmitter<void>',
      desc: 'error 版本按下重試鈕時 emit。有綁這個事件，重試鈕才會出現',
      isOutput: true,
    },
  ],
  events: [
    {
      name: 'retry',
      type: 'EventEmitter<void>',
      description: '按下錯誤版本的重試鈕時發射。retrying 為 true 時不發射。元件以 retry.observed 判斷要不要顯示重試鈕，所以不能重試的地方不要綁。',
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
    {
      label: '讀取失敗、可以重試',
      code: `@if (loadFailed()) {
  <div class="attachments-frame">
    <app-empty-state variant="error"
      title="附件清單載入失敗"
      description="請重試。如果一直失敗，請聯絡系統管理員。"
      [retrying]="retrying()"
      (retry)="retryLoad()"></app-empty-state>
  </div>
} @else {
  <!-- 正常的附件清單 -->
}`,
    },
    {
      label: '讀取失敗、不能重試（不綁 retry，不出現重試鈕）',
      code: `<app-empty-state variant="error"
  title="附件清單載入失敗"
  description="請聯絡系統管理員。"></app-empty-state>`,
    },
  ],
  usageNotes: [
    {
      type: 'info',
      content: '自訂內容走預設的 ng-content slot（不需 select）：直接寫在 <app-empty-state> 標籤內，就會投影到最下方。empty 與 error 兩種版本都會顯示。',
    },
    {
      type: 'info',
      content: '跟正常內容對齊高度：在外框的 CSS 設 app-empty-state { --es-min-height: 306px; }（數值量正常內容的高度），錯誤版本會撐到這個高度、內容上下置中。只對 error 版本生效。',
    },
    {
      type: 'info',
      content: '重試流程：(retry) 裡把 retrying 設為 true、只重讀失敗的那一段；失敗時設回 false，錯誤版本留著；成功時等內容全部讀完才把 @if 切回正常內容，中間不切回骨架。',
    },
  ],
};
