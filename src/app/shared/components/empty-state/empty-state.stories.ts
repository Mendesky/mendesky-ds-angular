import type { Meta, StoryObj } from '@storybook/angular';
import { EmptyStateComponent } from '../../../../index';

const meta: Meta<EmptyStateComponent> = {
  title: '展示元件/Empty State',
  id: 'empty-state',
  component: EmptyStateComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'inline-radio',
      options: ['empty', 'error'],
      description: 'empty 顯示插圖與 message；error 是內容讀取失敗，改顯示紅色圖示、標題、說明與重試鈕',
      table: { defaultValue: { summary: 'empty' } },
    },
    message: {
      control: 'text',
      description: '插圖下方說明文字；空字串時不顯示文字。只有 empty 版本顯示',
      table: { defaultValue: { summary: '目前無資料' } },
    },
    title: {
      control: 'text',
      description: 'error 版本的標題：寫哪一塊沒載入',
      table: { defaultValue: { summary: '載入失敗' } },
    },
    description: {
      control: 'text',
      description: 'error 版本的說明：寫下一步；空字串時不顯示',
      table: { defaultValue: { summary: '' } },
    },
    retryText: {
      control: 'text',
      description: 'error 版本重試鈕的文字',
      table: { defaultValue: { summary: '重試' } },
    },
    retrying: {
      control: 'boolean',
      description: 'error 版本：true 時重試鈕顯示載入圈與「重試中」，再按不會送出 retry',
      table: { defaultValue: { summary: 'false' } },
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

// ── 錯誤版本：外框與高度由使用端照正常內容設定 ─────────────────
// 外框用 --border/primary 與 --radious/md 的值；--es-min-height 對齊正常內容的高度
const errorFrame = 'background:#fff;border:1px solid #e7e7e7;border-radius:8px;--es-padding:24px;--es-min-height:240px;max-width:480px;';

// ── 讀取失敗、可以重試（按重試：1.5 秒重試中，之後回到失敗）────────
export const ErrorWithRetry: Story = {
  render: () => ({
    props: {
      retrying: false,
      onRetry(this: { retrying: boolean }) {
        this.retrying = true;
        setTimeout(() => { this.retrying = false; }, 1500);
      },
    },
    template: `
      <div style="${errorFrame}">
        <app-empty-state variant="error"
          title="附件清單載入失敗"
          description="請重試。如果一直失敗，請聯絡系統管理員。"
          [retrying]="retrying"
          (retry)="onRetry()"></app-empty-state>
      </div>
    `,
    moduleMetadata: { imports: [EmptyStateComponent] },
  }),
};

// ── 重試中 ──────────────────────────────────────────────
export const ErrorRetrying: Story = {
  render: () => ({
    props: { onRetry: () => {} },
    template: `
      <div style="${errorFrame}">
        <app-empty-state variant="error"
          title="附件清單載入失敗"
          description="請重試。如果一直失敗，請聯絡系統管理員。"
          [retrying]="true"
          (retry)="onRetry()"></app-empty-state>
      </div>
    `,
    moduleMetadata: { imports: [EmptyStateComponent] },
  }),
};

// ── 讀取失敗、不能重試（沒綁 retry，不出現重試鈕）──────────────
export const ErrorNoRetry: Story = {
  render: () => ({
    template: `
      <div style="${errorFrame}">
        <app-empty-state variant="error"
          title="附件清單載入失敗"
          description="請聯絡系統管理員。"></app-empty-state>
      </div>
    `,
    moduleMetadata: { imports: [EmptyStateComponent] },
  }),
};
