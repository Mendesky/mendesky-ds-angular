import type { ComponentApi } from '../../../../docs/component-doc';

export const drawerShellDoc: ComponentApi = {
  id: 'drawer-shell',
  selector: 'app-drawer-shell',
  summary: '[isOpen] side: left|right|bottom · width · (close) · <ng-content>',
  props: [
    {
      name: 'isOpen',
      type: 'boolean',
      default: 'false',
      desc: '控制顯示 / 隱藏；false 時觸發 leave 動畫（300ms）後移除 DOM',
    },
    {
      name: 'side',
      type: "'left' | 'right' | 'bottom'",
      default: "'right'",
      desc: '面板滑出方向；bottom 時面板佔滿寬度，不看 width',
    },
    {
      name: 'width',
      type: 'string',
      default: "'280px'",
      desc: "面板寬度（任何 CSS 長度值，如 'min(280px, 85vw)'）",
    },
    {
      name: '(close)',
      type: 'EventEmitter<void>',
      desc: '點擊 overlay 或按 ESC 時觸發；父層負責將 isOpen 設為 false',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-drawer-shell
  [isOpen]="isOpen"
  side="right"
  width="280px"
  (close)="isOpen = false"
>
  <!-- 任意內容透過 ng-content 投影 -->
  <div class="my-drawer-content">內容</div>
</app-drawer-shell>`,
    },
  ],
  usageNotes: [
    {
      type: 'info',
      content: '各 Drawer 元件只需在 <app-drawer-shell> 標籤內放自己的內容（ng-content 投影），不需要自己寫 isClosing、setTimeout 或 @HostListener 監聽 ESC——這些 app-drawer-shell 內部已處理。',
    },
  ],
};
