import type { ComponentApi } from '../../../../docs/component-doc';

export const processToastDoc: ComponentApi = {
  id: 'process-toast',
  selector: 'app-process-toast',
  summary: 'type: success|error|loading · message [duration] · size: S|M · action?: {label,onClick} · (dismissed)',
  props: [
    {
      name: 'type',
      type: "'success' | 'error' | 'loading'",
      default: "'error'",
      desc: 'Toast 類型：success 綠勾 / error 紅 / loading 中性白底 + 旋轉 spinner（進行中）；決定背景色與 icon',
    },
    {
      name: 'message',
      type: 'string',
      default: "''",
      desc: '顯示訊息（單行）',
    },
    {
      name: 'duration',
      type: 'number',
      default: '3000 / 5000',
      desc: '自動消失毫秒數。caller 未指定時：有 action → 5000，沒 action → 3000',
    },
    {
      name: 'size',
      type: "'S' | 'M'",
      default: "'S'",
      desc: '尺寸：S 為預設輕量小尺寸（260×40px），M 為大尺寸（333×56px）',
    },
    {
      name: 'action',
      type: 'ToastAction',
      default: 'undefined',
      desc: '選填的 undo 按鈕。提供時於右側顯示文字按鈕；按下呼叫 onClick（通常是呼叫還原 API）並關閉 toast；toast 自動消失代表使用者未反悔，不觸發 onClick',
    },
    {
      name: 'stackMode',
      type: 'boolean',
      default: 'false',
      desc: 'true 時改為 position:static、寬度填滿容器，位置交給所屬容器排版（app-toast-container 堆疊多顆時用，手機版只吃寬度與掉落動畫）；false 時自身 position:fixed 置中定位（單獨使用）',
    },
    {
      name: '(dismissed)',
      type: 'EventEmitter<void>',
      desc: '退場動畫結束後觸發，用於從 DOM 移除元件',
      isOutput: true,
    },
    {
      name: 'requestHide',
      type: 'boolean',
      default: 'false',
      desc: '設為 true 時從外部觸發離場動畫（ToastService 用它控制消失時機）',
    },
  ],
  usage: [
    {
      label: '介面定義',
      code: `// 從 process-toast 元件 import
import { ToastAction } from '...process-toast/process-toast.component';

interface ToastAction {
  label: string;              // 按鈕文字，例：'復原'
  onClick: () => void;        // 通常呼叫還原 / undelete API
}`,
    },
    {
      label: '配合 @if 控制顯示（M，預設）',
      code: `@if (showToast) {
  <app-process-toast
    type="success"
    message="項目已成功建立"
    [duration]="3000"
    (dismissed)="showToast = false"
  ></app-process-toast>
}`,
    },
    {
      label: 'S 小尺寸（輕量通知）',
      code: `@if (showToast) {
  <app-process-toast
    type="success"
    message="已儲存"
    size="S"
    [duration]="2000"
    (dismissed)="showToast = false"
  ></app-process-toast>
}`,
    },
    {
      label: '含復原（reversibleToast pattern）',
      code: `@if (showToast) {
  <app-process-toast
    type="success"
    message="已刪除「附件 A」"
    [action]="{ label: '復原', onClick: restoreAttachment }"
    (dismissed)="showToast = false"
  ></app-process-toast>
}

// component.ts
restoreAttachment = () => {
  // 呼叫還原 API（動作已寫入，不是 pending queue）
  this.attachmentService.restore(this.lastDeletedId).subscribe();
};`,
    },
  ],
  usageNotes: [
    '本體說的「toast 服務」在 Angular 是 ToastService：以 inject(ToastService) 取得；loading 型別呼叫 show({ persist: true }) 後，再用 update(id, patch) 原地轉場。',
  ],
};
