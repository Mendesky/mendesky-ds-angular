import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import {
  ButtonComponent,
  IconComponent,
  InputComponent,
  ModalCloseBtnComponent,
  ModalShellComponent,
} from '../../../../index';

// 範例內容取自 dashboard-app 主線實際用法：
// - 封存案件（quoting-cases/components/archive-modal）：width 520px、maxHeight 85vh、frostedGlass；
//   標題「封存案件」、說明文字、取消 / 確認封存按鈕
// - 查詢訪談表（handover-search-modal）：variant="search"、placeholder「請輸入統編、公司名稱進行查詢」
// - 版本更新（release-notes-dialog）：darkBackdrop、frostedGlass、標題「版本更新」
//
// modal-shell 開啟時會把自己搬到 document.body，並以 position:fixed 蓋滿畫面。
// 說明頁若直接內嵌，開著的 modal 會蓋住整頁，所以這裡讓每個範例在說明頁中以獨立 iframe 呈現。

const ARCHIVE_CONTENT = (close: string) => `
  <div style="display:flex;flex-direction:column;">
    <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:24px 24px 0;">
      <div id="archive-modal-title" style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:var(--text\\/title, #3e3e3e);">
        <app-icon name="Archive" size="24"></app-icon>
        <span>封存案件</span>
      </div>
      <app-modal-close-btn (closeClick)="${close}"></app-modal-close-btn>
    </div>
    <p style="margin:0;padding:12px 24px 0;font-size:13px;line-height:1.6;color:var(--text\\/secondary, #686868);">
      封存後，案件狀態將更新為 <strong>已封存</strong>，後續可於列表中查閱封存紀錄與原因。
    </p>
    <div style="display:flex;justify-content:space-between;gap:12px;padding:16px 24px 24px;margin-top:16px;border-top:1px solid var(--border\\/primary, #e5e5e5);">
      <app-button variant="elevated" color="neutral" size="M" text="取消" (btnClick)="${close}"></app-button>
      <app-button variant="filled" color="danger" size="M" text="確認封存" (btnClick)="${close}"></app-button>
    </div>
  </div>
`;

const IMPORTS = [ModalShellComponent, ModalCloseBtnComponent, ButtonComponent, IconComponent];

// X 鈕與 footer 按鈕在範例中只記錄事件（關閉與否由 Controls 的 isOpen 決定）
const onClose = action('closeClick');

const meta: Meta<ModalShellComponent> = {
  title: '浮層元件/Modal Shell',
  id: 'modal-shell',
  component: ModalShellComponent,
  tags: ['autodocs'],
  parameters: {
    docs: { story: { inline: false, iframeHeight: 480 } },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '控制顯示 / 隱藏；false 時播放 leave 動畫後移除 DOM',
      table: { defaultValue: { summary: 'false' } },
    },
    width: {
      control: 'text',
      description: '卡片寬度（任何 CSS 長度值）',
      table: { defaultValue: { summary: "'580px'" } },
    },
    maxHeight: {
      control: 'text',
      description: '卡片最大高度',
      table: { defaultValue: { summary: "'88vh'" } },
    },
    variant: {
      control: 'inline-radio',
      options: ['default', 'search', 'floating-right'],
      description: 'default：垂直置中；search：上方對齊 14vh；floating-right：右下角浮層',
      table: { defaultValue: { summary: "'default'" } },
    },
    frostedGlass: {
      control: 'boolean',
      description: '啟用卡片毛玻璃效果（預設不透明）',
      table: { defaultValue: { summary: 'false' } },
    },
    darkBackdrop: {
      control: 'boolean',
      description: '加深 backdrop，用於需高度聚焦的彈窗',
      table: { defaultValue: { summary: 'false' } },
    },
    canDismiss: {
      control: 'boolean',
      description: '點 backdrop 是否可關；false 時 backdrop 完全不回應（ESC 不受影響）',
      table: { defaultValue: { summary: 'true' } },
    },
    overflowVisible: {
      control: 'boolean',
      description: '讓卡片 overflow: visible（stepper 浮在卡片上方的 wizard 模式）',
      table: { defaultValue: { summary: 'false' } },
    },
    animateContentHeight: {
      control: 'boolean',
      description: '內容高度變化時做動畫過渡',
      table: { defaultValue: { summary: 'false' } },
    },
    ariaLabelledBy: {
      control: 'text',
      description: 'aria-labelledby 指向的元素 id（通常是 modal 標題）',
      table: { defaultValue: { summary: "''" } },
    },
    backdropClick: { action: 'backdropClick' },
    escapePress: { action: 'escapePress' },
    afterLeave: { action: 'afterLeave' },
  },
};

export default meta;
type Story = StoryObj<ModalShellComponent>;

// ── 主範例：開啟中的封存案件 modal（可在 Controls 調整）──────
export const Default: Story = {
  name: '基本用法',
  args: {
    isOpen: true,
    width: '520px',
    maxHeight: '85vh',
    variant: 'default',
    frostedGlass: true,
    darkBackdrop: false,
    canDismiss: true,
    overflowVisible: false,
    animateContentHeight: false,
    ariaLabelledBy: 'archive-modal-title',
  },
  render: (args) => ({
    props: { ...args, onClose },
    template: `
      <app-modal-shell
        [isOpen]="isOpen"
        [width]="width"
        [maxHeight]="maxHeight"
        [variant]="variant"
        [frostedGlass]="frostedGlass"
        [darkBackdrop]="darkBackdrop"
        [canDismiss]="canDismiss"
        [overflowVisible]="overflowVisible"
        [animateContentHeight]="animateContentHeight"
        [ariaLabelledBy]="ariaLabelledBy"
        (backdropClick)="backdropClick()"
        (escapePress)="escapePress()"
        (afterLeave)="afterLeave()">
        ${ARCHIVE_CONTENT('onClose()')}
      </app-modal-shell>
    `,
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 搜尋版位（上方對齊）────────────────────────────────
export const Search: Story = {
  name: '搜尋版位（variant="search"）',
  args: {
    isOpen: true,
    variant: 'search',
    width: 'min(880px, calc(100vw - 64px))',
    maxHeight: '64vh',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-modal-shell
        [isOpen]="isOpen"
        [variant]="variant"
        [width]="width"
        [maxHeight]="maxHeight"
        (backdropClick)="backdropClick()"
        (escapePress)="escapePress()">
        <div style="display:flex;align-items:center;gap:12px;padding:16px 24px;">
          <app-icon name="Search" size="24" style="color:#686868;flex-shrink:0;"></app-icon>
          <app-input size="L" placeholder="請輸入統編、公司名稱進行查詢" style="flex:1;min-width:0;"></app-input>
          <app-button variant="outlined" color="primary" size="M" text="搜尋"></app-button>
        </div>
      </app-modal-shell>
    `,
    moduleMetadata: { imports: [...IMPORTS, InputComponent] },
  }),
};

// ── 加深背景（高度聚焦）────────────────────────────────
export const DarkBackdrop: Story = {
  name: '加深背景（darkBackdrop）',
  args: {
    isOpen: true,
    width: '580px',
    frostedGlass: true,
    darkBackdrop: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <app-modal-shell
        [isOpen]="isOpen"
        [width]="width"
        [frostedGlass]="frostedGlass"
        [darkBackdrop]="darkBackdrop"
        ariaLabelledBy="rn-heading"
        (backdropClick)="backdropClick()"
        (escapePress)="escapePress()">
        <div style="padding:24px;display:flex;flex-direction:column;gap:12px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <app-icon name="Sparkle" size="16"></app-icon>
            <h2 id="rn-heading" style="margin:0;font-size:16px;font-weight:500;">版本更新</h2>
          </div>
          <p style="margin:0;font-size:14px;color:#686868;">內容</p>
        </div>
      </app-modal-shell>
    `,
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 不可點背景關閉（表單已修改）──────────────────────────
export const CannotDismiss: Story = {
  name: '背景不可關閉（canDismiss=false）',
  args: {
    isOpen: true,
    width: '520px',
    maxHeight: '85vh',
    frostedGlass: true,
    canDismiss: false,
  },
  render: (args) => ({
    props: { ...args, onClose },
    template: `
      <app-modal-shell
        [isOpen]="isOpen"
        [width]="width"
        [maxHeight]="maxHeight"
        [frostedGlass]="frostedGlass"
        [canDismiss]="canDismiss"
        (backdropClick)="backdropClick()"
        (escapePress)="escapePress()">
        ${ARCHIVE_CONTENT('onClose()')}
      </app-modal-shell>
    `,
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 互動：按按鈕開啟，backdrop / ESC / X 鈕關閉 ─────────────
export const Interactive: Story = {
  name: '互動測試（按按鈕開啟）',
  render: () => ({
    template: `
      <div style="padding:24px;">
        <app-button variant="filled" color="primary" size="M" text="開啟 Modal" (btnClick)="open = true"></app-button>
        <p style="font-size:12px;color:#686868;margin-top:12px;">點背景、按 ESC 或右上角 X 皆可關閉。</p>
      </div>
      <app-modal-shell
        [isOpen]="open"
        width="520px"
        maxHeight="85vh"
        [frostedGlass]="true"
        ariaLabelledBy="archive-modal-title"
        (backdropClick)="open = false"
        (escapePress)="open = false">
        ${ARCHIVE_CONTENT('open = false')}
      </app-modal-shell>
    `,
    props: { open: false },
    moduleMetadata: { imports: IMPORTS },
  }),
};
