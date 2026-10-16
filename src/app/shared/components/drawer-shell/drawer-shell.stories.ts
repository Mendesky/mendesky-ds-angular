import { componentWrapperDecorator, type Meta, type StoryObj } from '@storybook/angular';
import { DrawerShellComponent, IconComponent } from '../../../../index';

// 範例內容：
// - 左側導覽抽屜：side="left"、width="min(280px, 85vw)"、品牌字「範例平台」、
//   導覽項目（儀表板 / 項目管理 / 成員管理）
// - 右側個人抽屜：side="right"、width="280px"、
//   選單項目「查詢文件」「安全性與隱私設定」
//
// drawer 的 overlay 與 panel 都是 position:fixed。外層舞台加 transform，讓 fixed 以舞台為準，
// 範例才會關在框內，不會蓋住整個說明頁。
const STAGE_STYLE =
  'position:relative;height:420px;overflow:hidden;transform:translateZ(0);' +
  'border-radius:8px;background:linear-gradient(135deg,#e8f4fa 0%,#f1f3f5 60%,#fdf3e7 100%);';

const NAV_CONTENT = `
  <div style="display:flex;flex-direction:column;gap:4px;padding:16px;">
    <div style="display:flex;align-items:center;gap:8px;padding:4px 8px 16px;">
      <span style="flex:1;font-size:16px;font-weight:500;color:#3e3e3e;">範例平台</span>
      <button type="button" aria-label="關閉導覽" (click)="close()" style="border:none;background:none;cursor:pointer;color:#686868;display:inline-flex;">
        <app-icon name="No-X-Cancel" size="16"></app-icon>
      </button>
    </div>
    <button type="button" style="display:flex;align-items:center;gap:12px;padding:10px 8px;border:none;border-radius:6px;background:none;color:#3e3e3e;font-size:14px;cursor:pointer;">
      <app-icon name="Dashboard" size="24"></app-icon>儀表板
    </button>
    <button type="button" style="display:flex;align-items:center;gap:12px;padding:10px 8px;border:none;border-radius:6px;background:rgba(58,156,205,0.12);color:#3a9ccd;font-size:14px;cursor:pointer;">
      <app-icon name="Briefcase" size="24"></app-icon>項目管理
    </button>
    <button type="button" style="display:flex;align-items:center;gap:12px;padding:10px 8px;border:none;border-radius:6px;background:none;color:#3e3e3e;font-size:14px;cursor:pointer;">
      <app-icon name="Assign" size="24"></app-icon>成員管理
    </button>
  </div>
`;

const PROFILE_CONTENT = `
  <div style="display:flex;flex-direction:column;gap:4px;padding:16px;">
    <div style="display:flex;justify-content:flex-end;padding-bottom:12px;">
      <button type="button" title="關閉" (click)="close()" style="border:none;background:none;cursor:pointer;color:#686868;display:inline-flex;">
        <app-icon name="No-X-Cancel" size="16"></app-icon>
      </button>
    </div>
    <button type="button" style="display:flex;align-items:center;gap:8px;padding:8px;border:none;border-radius:6px;background:none;color:#3e3e3e;font-size:14px;cursor:pointer;">
      <app-icon name="Search" size="16"></app-icon>查詢文件
    </button>
    <button type="button" style="display:flex;align-items:center;gap:8px;padding:8px;border:none;border-radius:6px;background:none;color:#3e3e3e;font-size:14px;cursor:pointer;">
      <app-icon name="Key" size="16"></app-icon>安全性與隱私設定
    </button>
  </div>
`;

const meta: Meta<DrawerShellComponent> = {
  title: '浮層元件/Drawer Shell',
  id: 'drawer-shell',
  component: DrawerShellComponent,
  tags: ['autodocs'],
  decorators: [componentWrapperDecorator((story) => `<div style="${STAGE_STYLE}">${story}</div>`)],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '控制顯示 / 隱藏；false 時播放 300ms 退場動畫後移除 DOM',
      table: { defaultValue: { summary: 'false' } },
    },
    side: {
      control: 'inline-radio',
      options: ['left', 'right', 'bottom'],
      description: '面板滑出方向（bottom 模式寬度固定 100%，忽略 width）',
      table: { defaultValue: { summary: "'right'" } },
    },
    width: {
      control: 'text',
      description: "面板寬度（任何 CSS 長度值，如 'min(280px, 85vw)'）",
      table: { defaultValue: { summary: "'280px'" } },
    },
    close: { action: 'close' },
  },
};

export default meta;
type Story = StoryObj<DrawerShellComponent>;

// ── 主範例：右側滑出、開啟中（可在 Controls 調整方向與寬度）──────
export const Default: Story = {
  name: '基本用法（右側）',
  args: {
    isOpen: true,
    side: 'right',
    width: '280px',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-drawer-shell [isOpen]="isOpen" [side]="side" [width]="width" (close)="close()">
        ${PROFILE_CONTENT}
      </app-drawer-shell>
    `,
    moduleMetadata: { imports: [DrawerShellComponent, IconComponent] },
  }),
};

// ── 左側滑出（導覽抽屜）─────────────────────────────
export const Left: Story = {
  name: '左側滑出（導覽抽屜）',
  args: {
    isOpen: true,
    side: 'left',
    width: 'min(280px, 85vw)',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-drawer-shell [isOpen]="isOpen" [side]="side" [width]="width" (close)="close()">
        ${NAV_CONTENT}
      </app-drawer-shell>
    `,
    moduleMetadata: { imports: [DrawerShellComponent, IconComponent] },
  }),
};

// ── 底部滑出 ─────────────────────────────────────────
export const Bottom: Story = {
  name: '底部滑出',
  args: {
    isOpen: true,
    side: 'bottom',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-drawer-shell [isOpen]="isOpen" [side]="side" (close)="close()">
        ${PROFILE_CONTENT}
      </app-drawer-shell>
    `,
    moduleMetadata: { imports: [DrawerShellComponent, IconComponent] },
  }),
};

// ── 互動：按按鈕開啟，點 overlay 或按 ESC 關閉 ────────────
export const Interactive: Story = {
  name: '互動測試（按按鈕開啟）',
  render: () => ({
    template: `
      <div style="padding:24px;">
        <button
          type="button"
          (click)="open = true"
          style="padding:8px 16px;background:#3a9ccd;color:#fff;border:none;border-radius:6px;cursor:pointer;">
          開啟 Drawer
        </button>
        <p style="font-size:12px;color:#686868;margin-top:12px;">點擊 overlay、關閉鈕或按 ESC 關閉。</p>
      </div>
      <app-drawer-shell [isOpen]="open" side="left" width="min(280px, 85vw)" (close)="open = false">
        ${NAV_CONTENT.replace('(click)="close()"', '(click)="open = false"')}
      </app-drawer-shell>
    `,
    props: { open: false },
    moduleMetadata: { imports: [DrawerShellComponent, IconComponent] },
  }),
};
