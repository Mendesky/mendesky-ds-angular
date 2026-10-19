import type { Meta, StoryObj } from '@storybook/angular';
import { EmptyStateComponent } from '../../../../index';

const meta: Meta<EmptyStateComponent> = {
  title: '展示元件/Empty State',
  id: 'empty-state',
  component: EmptyStateComponent,
  tags: ['autodocs'],
  argTypes: {
    message: {
      control: 'text',
      description: '插圖下方說明文字；空字串時不顯示文字',
      table: { defaultValue: { summary: '目前無資料' } },
    },
  },
};

export default meta;
type Story = StoryObj<EmptyStateComponent>;

// ── 預設（有訊息文字）──────────────────────────────────
export const Default: Story = {
  args: {
    message: '目前無資料',
  },
};

// ── 無訊息文字 ────────────────────────────────────────
export const NoMessage: Story = {
  args: {
    message: '',
  },
};

// ── 自訂訊息（聯絡窗口清單情境）──────────────────────
export const CustomMessage: Story = {
  args: {
    message: '尚無聯絡窗口資料！請至少建立 1 位聯絡窗口',
  },
};

// ── 多情境對比 ────────────────────────────────────────
export const AllVariants: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:32px;flex-wrap:wrap;padding:24px;background:#f8f9fa;">
        <div style="flex:1;min-width:200px;">
          <p style="font-size:12px;color:#999;margin:0 0 8px;text-align:center;">預設訊息</p>
          <app-empty-state message="目前無資料"></app-empty-state>
        </div>
        <div style="flex:1;min-width:200px;">
          <p style="font-size:12px;color:#999;margin:0 0 8px;text-align:center;">自訂訊息</p>
          <app-empty-state message="目前沒有待處理的項目"></app-empty-state>
        </div>
        <div style="flex:1;min-width:200px;">
          <p style="font-size:12px;color:#999;margin:0 0 8px;text-align:center;">不顯示文字</p>
          <app-empty-state message=""></app-empty-state>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [EmptyStateComponent] },
  }),
};
