import type { ComponentDoc } from '../../../../docs/component-doc';

export const modalShellDoc: ComponentDoc = {
  id: 'modal-shell',
  name: 'Modal Shell',
  selector: 'app-modal-shell',
  group: '浮層元件',
  summary: '[isOpen] width maxHeight variant: default|search|floating-right · overflowVisible · darkBackdrop · canDismiss · ariaLabelledBy · (backdropClick) · (escapePress) · <ng-content>',
  when: '所有自訂 Modal 的容器。禁止自刻 overlay + card 組合。',
  props: [
    {
      name: 'isOpen',
      type: 'boolean',
      default: 'false',
      desc: '控制顯示 / 隱藏；false 時觸發 leave 動畫後移除 DOM',
    },
    {
      name: 'width',
      type: 'string',
      default: "'580px'",
      desc: '卡片寬度（任何 CSS 長度值）',
    },
    {
      name: 'maxHeight',
      type: 'string',
      default: "'88vh'",
      desc: '卡片最大高度',
    },
    {
      name: 'variant',
      type: "'default' | 'search' | 'floating-right'",
      default: "'default'",
      desc: 'default：垂直置中；search：上方對齊 14vh；floating-right：右下角浮層（dock 上方 84px），backdrop 透明 pointer-events: none',
    },
    {
      name: 'overflowVisible',
      type: 'boolean',
      default: 'false',
      desc: '讓卡片 overflow: visible，用於 stepper 浮在卡片上方的 wizard 模式',
    },
    {
      name: 'darkBackdrop',
      type: 'boolean',
      default: 'false',
      desc: '加深 backdrop 為 rgba(15,23,42,0.5)，用於需高度聚焦的彈窗（如版本更新公告）；預設用標準淺色 backdrop',
    },
    {
      name: 'canDismiss',
      type: 'boolean',
      default: 'true',
      desc: '點 backdrop 是否可關（對齊 modal.dismissal）。dirty 時傳 false → backdrop 完全 inert（不 emit、不關）；只作用於 backdrop，ESC 不受此 gate。用法 [canDismiss]="!isDirty()"',
    },
    {
      name: 'frostedGlass',
      type: 'boolean',
      default: 'false',
      desc: '啟用卡片毛玻璃效果。預設不透明，需 opt-in 啟用',
    },
    {
      name: 'animateContentHeight',
      type: 'boolean',
      default: 'false',
      desc: '內容高度變化時做動畫過渡。進場動畫結束後才啟用（避開開場）；尊重 prefers-reduced-motion。內容超過 max-height 時 card 固定高度、不觸發此動畫（改為 body 捲動）',
    },
    {
      name: '(backdropClick)',
      type: 'EventEmitter<void>',
      desc: '點擊遮罩時觸發（canDismiss=true 才 emit）；父層決定是否關閉',
      isOutput: true,
    },
    {
      name: '(escapePress)',
      type: 'EventEmitter<void>',
      desc: '按 ESC 時觸發（不受 canDismiss gate）；父層決定直接關或彈二次確認',
      isOutput: true,
    },
    {
      name: 'ariaLabelledBy',
      type: 'string',
      default: "''",
      desc: 'aria-labelledby 指向的元素 id（通常是 modal 標題），供螢幕報讀器朗讀',
    },
    {
      name: '(afterLeave)',
      type: 'EventEmitter<void>',
      desc: '離場動畫結束後觸發（約 450ms）；用在要等動畫結束才清資料的情境',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-modal-shell
  [isOpen]="showModal"
  width="580px"
  maxHeight="88vh"
  (backdropClick)="showModal = false"
>
  <!-- 任意內容透過 ng-content 投影 -->
  <div class="my-dialog-header">標題</div>
  <div class="my-dialog-body">內容</div>
</app-modal-shell>`,
    },
    {
      label: 'Wizard Pattern（stepper 浮在卡片上方）',
      code: `<!-- 1. overflowVisible 讓子元素可逃出卡片邊界 -->
<app-modal-shell
  [isOpen]="isOpen"
  [overflowVisible]="steps().length > 1"
  width="560px"
  maxHeight="85vh"
  (backdropClick)="onCancel()"
>
  <!-- 2. stepper 放第一個子元素，SCSS 用 position:absolute + translateY(-100%) 拉到卡片上方 -->
  @if (steps().length > 1) {
    <div class="wizard__stepper">
      <app-stepper variant="horizontal" [steps]="stepLabels()" [currentStep]="currentStepIndex()" (stepClick)="onStepClick($event)"></app-stepper>
    </div>
  }
  <div class="wizard__header">...</div>
  <div class="wizard__body">...</div>
  <div class="wizard__footer">...</div>
</app-modal-shell>

/* SCSS：wizard__stepper 絕對定位浮在卡片上方 */
.wizard__stepper {
  position: absolute;
  top: 0; left: 0; right: 0;
  transform: translateY(-100%);
  padding: 0 24px 12px;
}`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: '（2026-08-13 使用者拍板）毛玻璃卡片底色以實作為準＝rgba(255,255,255,0.8)（不是 0.85）。此值只在 frostedGlass=true 時生效；預設卡片是不透明 #ffffff。',
    },
    {
      type: 'info',
      content: 'app-dialog 適合固定格式的小型確認對話框；app-modal-shell 適合需要自訂 header / body / footer 的大型 Modal（例：多步驟精靈、詳情面板）。',
    },
    {
      type: 'warning',
      content: 'modal-shell 會把 host element 搬到 document.body（防止 overflow:hidden 裁切 backdrop-filter），因此父層 ::ng-deep 無法打到 .modal-card 內部樣式。如需修改卡片行為請用 @Input（例：overflowVisible）。',
    },
  ],
  customTables: [
    {
      title: '視覺規格',
      columns: [
        '屬性',
        '值',
      ],
      rows: [
        [
          '卡片背景',
          'rgba(255,255,255,0.8) / backdrop-filter: blur(7.5px)（僅 frostedGlass=true 時；預設卡片為不透明 #ffffff）',
        ],
        [
          '邊框 / 圓角',
          'border: 1px solid #fff / border-radius: 16px',
        ],
        [
          '陰影',
          '0px 4px 40px -10px rgba(0,0,0,0.2)',
        ],
        [
          '動畫 Tier',
          'Panel — 450ms / 進場: cubic-bezier(0,0,0.2,1) / 退場: cubic-bezier(0.4,0,1,1)',
        ],
      ],
    },
  ],
};
