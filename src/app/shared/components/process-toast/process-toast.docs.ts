import type { ComponentDoc } from '../../../../docs/component-doc';

export const processToastDoc: ComponentDoc = {
  id: 'process-toast',
  name: 'Process Toast',
  selector: 'app-process-toast',
  group: '浮層元件',
  summary: 'type: success|error|loading · message [duration] · size: S|M · action?: {label,onClick} · (dismissed)',
  when: '非同步操作的回饋通知。提供 action 時顯示 undo 按鈕（reversibleToast pattern）。loading 型別搭配 ToastService.show({persist:true}) + update(id, patch) 可做「進行中→完成」單一 toast 原地轉場（如列印產 PDF：訪談表生成中→已開始下載）——**update() 僅限這種「同一件事的兩個階段」，不同事件各自一顆、堆疊**（2026-07-27 起；先前 HDM 逐欄存檔誤用 update() 取代，已修正）。渲染一律經全域 `app-toast-container`（掛 app root），元件不自建本地 toast stack；唯一例外是 `app-global-api-error-host`（自有 z-index 9999 層，需壓在 doc-preview 之上）。層級規則（2026-08-13 定案）：`app-toast-container` 為 2100，必須壓過 doc-preview 與 template-var-panel 的 2000 層——否則檔案預覽開啟時的操作回饋會被蓋住看不到（先前為 1600，實際被 doc-preview 蓋住）；`app-global-api-error-host` 與 tooltip portal 維持 9999（API 錯誤與游標提示更優先）。duration 由型別決定、呼叫端不自帶：success/loading 3000ms、error 5000ms、有 action 5000ms。容器內 toast 預設 `pointer-events: none`，僅帶 action 者可點（toast 位於卡片右下角，無條件可點會吃掉數秒點擊）。文案長度上限：success/loading 16 全形寬、error 24、有 action 18（`.toast__msg` 的 line-clamp:2 約在 29 全形寬靜默截斷）；插值長度必須有界，守門用 `npm run check:toast-copy`。',
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
    message="案件已成功建立"
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
  notes: [
    '（2026-08-13 使用者拍板）位置以實作為準：bottom 為 calc(24px + var(--dock/h, 48px) + 16px)、right 為 24px。原文件的固定 32px 會讓 toast 壓在底部工具列上；動態值在工具列高度變化時自動跟隨。',
    'undo 語意：使用者操作當下 API 已經成功寫入，toast 自動消失不代表「提交」，只是 UX 計時結束；onClick 的職責是呼叫還原 / undelete API。詳見 ds-patterns.js 的 action.confirm-destructive → reversibleToast。',
    '防重點：actionFired 一次性旗標擋下重複觸發；toast 被外部 dismiss 或元件 destroy 時清除 timer。',
  ],
  customTables: [
    {
      title: '視覺規格',
      columns: [
        '屬性',
        'M（預設）',
        'S',
      ],
      rows: [
        [
          '寬度',
          '333px',
          '260px',
        ],
        [
          '高度',
          '56px',
          '40px',
        ],
        [
          'padding',
          '8px 12px',
          '6px 10px',
        ],
        [
          'gap',
          '16px',
          '10px',
        ],
        [
          'border-radius',
          '10px',
          '8px',
        ],
        [
          'Icon',
          'app-icon size="36"',
          'app-icon size="24"',
        ],
        [
          '訊息文字',
          '16px / medium / white',
          '14px / medium / white',
        ],
        [
          '陰影',
          '0px 0px 20px rgba(0,0,0,0.2)',
          '同 M',
        ],
        [
          'success 背景',
          '#74ae3e（全色填滿）',
          '同 M',
        ],
        [
          'error 背景',
          '#cc5252（全色填滿）',
          '同 M',
        ],
        [
          'action 按鈕',
          '右側文字按鈕 · 14px / 600 / 白 · flex-shrink: 0',
          '13px / 600 · msg flex-shrink: 1 讓出空間',
        ],
      ],
    },
    {
      title: '定位規範',
      columns: [
        '屬性',
        '值',
      ],
      rows: [
        [
          'position',
          'fixed',
        ],
        [
          'bottom',
          'calc(24px + var(--dock/h, 48px) + 16px)　工具列 48px 時 ≈ 88px',
        ],
        [
          'right',
          '24px',
        ],
        [
          'z-index',
          '600',
        ],
        [
          '進場動畫',
          'toastSlideIn 300ms cubic-bezier(0, 0, 0.2, 1)',
        ],
        [
          '退場動畫',
          'toastSlideOut 300ms cubic-bezier(0.4, 0, 1, 1)',
        ],
      ],
    },
  ],
};
