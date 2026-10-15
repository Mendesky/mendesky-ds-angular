import type { ComponentDoc } from '../../../../docs/component-doc';

export const drawerShellDoc: ComponentDoc = {
  id: 'drawer-shell',
  name: 'Drawer Shell',
  selector: 'app-drawer-shell',
  group: '浮層元件',
  summary: '[isOpen] side: left|right|bottom · width · (close) · <ng-content>',
  when: '所有 Drawer 的容器。提供毛玻璃背景、透明 overlay、進出場動畫（Panel 450ms enter / 300ms exit）、ESC 關閉。禁止各 Drawer 自刻 overlay + panel + animation。',
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
  notes: [
    {
      type: 'info',
      content: '內部已處理 ESC 關閉、enter/leave 動畫狀態切換、overlay 點擊。各 Drawer 元件只需在 <app-drawer-shell> 內放置自己的 content，不需要自行處理 isClosing、setTimeout、@HostListener ESC。',
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
          '面板背景',
          'rgba(255,255,255,0.3) / backdrop-filter: blur(20px)',
        ],
        [
          '邊框 (right)',
          'border-left: 1px solid #fff',
        ],
        [
          '邊框 (left)',
          'border-right: 1px solid #fff',
        ],
        [
          '陰影',
          '0px 0px 250px 0px rgba(0,0,0,0.2)',
        ],
        [
          '動畫 Tier',
          'Panel — 450ms enter / 300ms exit',
        ],
        [
          '進場 easing',
          'cubic-bezier(0,0,0.2,1)',
        ],
        [
          '退場 easing',
          'cubic-bezier(0.4,0,1,1)',
        ],
        [
          'Overlay',
          '透明（position:fixed;inset:0）/ z-index: 300 / panel: 301',
        ],
      ],
    },
  ],
};
