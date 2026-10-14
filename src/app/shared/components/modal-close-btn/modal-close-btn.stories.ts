import type { Meta, StoryObj } from '@storybook/angular';
import { IconComponent, ModalCloseBtnComponent } from '../../../../index';

// 範例文字取自 dashboard-app 主線實際用法：
// - 預設 ariaLabel「關閉」（多數 modal）
// - 情境特定 ariaLabel「關閉酬金拆分」（p2-split-modal；同見本元件 spec）
// - [disabled]="busy()"（serial-number-modal：處理中不可關）
// - 放在 header 的範例比照封存案件 modal（archive-modal）的標題列
const meta: Meta<ModalCloseBtnComponent> = {
  title: '浮層元件/Modal Close Button',
  id: 'modal-close-btn',
  component: ModalCloseBtnComponent,
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: {
      control: 'text',
      description: '無障礙標籤；情境特定可覆寫（如「關閉酬金拆分」）',
      table: { defaultValue: { summary: "'關閉'" } },
    },
    disabled: {
      control: 'boolean',
      description: '停用（如 saving 中不可關）',
      table: { defaultValue: { summary: 'false' } },
    },
    closeClick: { action: 'closeClick' },
  },
};

export default meta;
type Story = StoryObj<ModalCloseBtnComponent>;

// ── 主範例 ───────────────────────────────────────────
export const Default: Story = {
  name: '基本用法',
  args: {
    ariaLabel: '關閉',
    disabled: false,
  },
};

// ── 停用（處理中不可關）───────────────────────────────
export const Disabled: Story = {
  name: '停用（處理中）',
  args: {
    ariaLabel: '關閉',
    disabled: true,
  },
};

// ── 情境特定的無障礙標籤 ──────────────────────────────
export const CustomAriaLabel: Story = {
  name: '自訂 ariaLabel',
  args: {
    ariaLabel: '關閉酬金拆分',
    disabled: false,
  },
};

// ── 放在 modal header 右側 ────────────────────────────
export const InHeader: Story = {
  name: '放在 modal header',
  render: (args) => ({
    props: args,
    template: `
      <div style="width:520px;max-width:100%;border:1px solid #e5e5e5;border-radius:16px;background:#fff;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:24px;">
          <div style="display:flex;align-items:center;gap:8px;font-size:18px;font-weight:700;color:#3e3e3e;">
            <app-icon name="Archive" size="24"></app-icon>
            <span>封存案件</span>
          </div>
          <app-modal-close-btn [ariaLabel]="ariaLabel" [disabled]="disabled" (closeClick)="closeClick()"></app-modal-close-btn>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [ModalCloseBtnComponent, IconComponent] },
  }),
  args: {
    ariaLabel: '關閉',
    disabled: false,
  },
};
