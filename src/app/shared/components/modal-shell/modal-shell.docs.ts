import type { ComponentApi } from '../../../../docs/component-doc';

export const modalShellDoc: ComponentApi = {
  id: 'modal-shell',
  selector: 'app-modal-shell',
  summary: '[isOpen] width maxHeight variant: default|search|floating-right · overflowVisible · darkBackdrop · canDismiss · ariaLabel · ariaLabelledBy · (backdropClick) · (escapePress) · <ng-content>（標題加 appModalTitle）',
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
      desc: '卡片 aria-labelledby 要指的元素 id。平常不用設，標題加 appModalTitle 就會自動接上；標題放在外殼外面、或名稱要由好幾個元素組成時才用。有設時蓋過 appModalTitle',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '對話框的報讀名稱，落在卡片的 aria-label。畫面上沒有標題時才用，例如搜尋視窗。有設時卡片就不輸出 aria-labelledby',
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
  <!-- 任意內容透過 ng-content 投影；標題加 appModalTitle，報讀軟體開窗時會念出來 -->
  <h2 class="my-dialog-header" appModalTitle>新增聯絡窗口</h2>
  <div class="my-dialog-body">內容</div>
</app-modal-shell>`,
    },
    {
      label: '沒有標題時（例如搜尋視窗）',
      code: `<app-modal-shell
  [isOpen]="showSearch"
  variant="search"
  ariaLabel="搜尋"
  (backdropClick)="showSearch = false"
  (escapePress)="showSearch = false"
>
  <input class="search-input" placeholder="搜尋客戶、案件" />
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
  <div class="wizard__header"><h2 appModalTitle>{{ currentStepTitle() }}</h2></div>
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
  usageNotes: [
    {
      type: 'warning',
      content: 'app-modal-shell 會把 host element 搬到 document.body，所以父層的 ::ng-deep 打不到 .modal-card 內部樣式；如需修改卡片行為請用 @Input（例：overflowVisible）。',
    },
    {
      type: 'info',
      content: '每個對話框都要有名稱，報讀軟體開窗時才知道要念什麼。有標題就在標題加 appModalTitle，沒有標題再設 ariaLabel。兩個都沒有的話，開發模式會在進場動畫結束時（約 450ms）於 console 警告一次。標題要等資料回來才出現的話，載入期間就會被警告，所以載入中也先把標題文字放出來。',
    },
    {
      type: 'warning',
      content: 'appModalTitle 是獨立的指令，要加進元件的 imports 才會生效。只寫在 template、忘了 import 時 Angular 不會報錯，標題就這樣安靜地沒接上；開發模式的警告會提醒你。',
    },
    {
      type: 'warning',
      content: 'ariaLabel 要寫成元件的設定（ariaLabel="…" 或 [ariaLabel]="…"）。直接寫 aria-label 會留在外層 app-modal-shell 上，到不了 role="dialog" 的卡片，報讀軟體讀不到。',
    },
    {
      type: 'info',
      content: 'appModalTitle 接的是「寫這個標題的那份 template」裡最近的 app-modal-shell，不是畫面上包住它的那一個。直接寫在外殼裡、或寫在放進去的子元件自己的 template 裡都沒問題。有兩種寫法會接不上：標題寫在外殼外面的 ng-template，再用 ngTemplateOutlet 放進來；或是包了一層元件，用 ng-content 把內容轉進它自己的 app-modal-shell（外面若還有別的對話框，標題反而會接到外面那個）。這兩種情況改用 ariaLabelledBy 指向標題的 id。',
    },
    {
      type: 'warning',
      content: '標題要自訂 id 時寫 id="…" 或 [id]="…"。用 [attr.id] 寫的 id appModalTitle 收不到，會被自動產生的 id 蓋掉。',
    },
    {
      type: 'info',
      content: '一個對話框同一時間只能有一個 appModalTitle。用 @if 切換標題沒關係，沒顯示的分支根本不會建立；但投影進子元件、只是被收起來沒畫出來的標題仍然算數。同時有兩個的話，用的是最早建立的那一個（不一定是畫面上排在前面的），開窗時開發模式會警告。',
    },
  ],
};
