import type { Meta, StoryObj } from '@storybook/angular';
import { SpinnerComponent } from '../../../../index';

// 轉圈只畫「還在進行」，旁邊的說明文字由呼叫端自己排，所以範例裡一併示範。
// 顏色跟著外層的 color：弧是文字色，軌道是同色 20%。

const meta: Meta<SpinnerComponent> = {
  title: '展示元件/Spinner',
  id: 'spinner',
  component: SpinnerComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['12', '16', '24', '36'],
      description: '寬高（px），對齊圖示尺寸。線寬依序 1.5、2、2.5、3',
      table: { defaultValue: { summary: '16' } },
    },
    label: {
      control: 'text',
      description: '給報讀軟體念的文字，畫面上看不到',
      table: { defaultValue: { summary: '載入中' } },
    },
    decorative: {
      control: 'boolean',
      description: '旁邊已經有文字在講同一件事時設 true：不輸出 role="status"、整個轉圈對報讀軟體隱藏',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    size: '16',
    label: '載入中',
    decorative: false,
  },
};

export default meta;
type Story = StoryObj<SpinnerComponent>;

// ── 主範例：可用 Controls 調整 size / label / decorative ───────────
export const Default: Story = {
  name: '預設（16px）',
};

// ── 四種尺寸 ─────────────────────────────────────────────────────
export const Sizes: Story = {
  name: '四種尺寸（12、16、24、36）',
  render: () => ({
    template: `
      <div style="display:flex;align-items:center;gap:24px;color:#686868;">
        <app-spinner size="12"></app-spinner>
        <app-spinner size="16"></app-spinner>
        <app-spinner size="24"></app-spinner>
        <app-spinner size="36"></app-spinner>
      </div>
    `,
    moduleMetadata: { imports: [SpinnerComponent] },
  }),
};

// ── 搭配說明文字：轉圈設成裝飾用，報讀軟體只念文字 ───────────────
export const WithText: Story = {
  name: '搭配說明文字（decorative）',
  render: () => ({
    template: `
      <span class="noto-14-regular" style="display:inline-flex;align-items:center;gap:6px;color:#686868;">
        <app-spinner size="16" [decorative]="true"></app-spinner>
        儲存中…
      </span>
    `,
    moduleMetadata: { imports: [SpinnerComponent] },
  }),
};

// ── 深色底：改外層文字色，轉圈跟著變 ─────────────────────────────
export const OnDark: Story = {
  name: '深色底（外層文字色改白色）',
  render: () => ({
    template: `
      <span class="noto-12-regular"
            style="display:inline-flex;align-items:center;gap:6px;padding:4px 12px;border-radius:999px;background:#535353;color:#ffffff;">
        <app-spinner size="16" [decorative]="true"></app-spinner>
        更新中…
      </span>
    `,
    moduleMetadata: { imports: [SpinnerComponent] },
  }),
};
