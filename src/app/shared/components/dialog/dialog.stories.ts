// 範例情境：刪除聯絡窗口（Warning）、放棄設定（Normal）、永久刪除備註（Warning）
import type { Meta, StoryObj } from '@storybook/angular';
import { DialogComponent, ButtonComponent } from '../../../../index';

const meta: Meta<DialogComponent> = {
  title: '浮層元件/Dialog',
  id: 'dialog',
  component: DialogComponent,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '控制 dialog 顯示 / 隱藏',
      table: { defaultValue: { summary: 'false' } },
    },
    header: {
      control: 'text',
      description: 'Dialog 標題文字',
      table: { defaultValue: { summary: 'Header' } },
    },
    content: {
      control: 'text',
      description: 'Dialog 內文說明',
      table: { defaultValue: { summary: 'Content' } },
    },
    propClass: {
      control: 'select',
      options: ['Warning', 'Normal'],
      description: '樣式語意：Warning 紅色確認鍵 / Normal 藍色確認鍵',
      table: { defaultValue: { summary: 'Warning' } },
    },
    confirmText: {
      control: 'text',
      description: '確認按鈕文字',
      table: { defaultValue: { summary: '確認封存' } },
    },
    cancel:  { action: 'cancel' },
    confirm: { action: 'confirm' },
  },
};

export default meta;
type Story = StoryObj<DialogComponent>;

// ── 互動：按鈕開關 ────────────────────────────────────
// 排第一個：文件網站的元件頁「用法」嵌入的是第一個範例。關閉狀態的 Dialog 畫面上什麼都沒有，
// 所以第一個範例放一顆按鈕，按了打開，按取消或確認關閉。
export const Interactive: Story = {
  name: '互動（按鈕開關）',
  render: () => ({
    template: `
      <div style="padding:24px;">
        <app-button
          variant="outlined"
          size="S"
          text="刪除備註"
          (btnClick)="open = true">
        </app-button>
        <app-dialog
          [isOpen]="open"
          header="永久刪除無法回復"
          content="此操作將永久刪除此則備註，無法撤回，是否繼續？"
          propClass="Warning"
          confirmText="確認刪除"
          (cancel)="open = false"
          (confirm)="open = false">
        </app-dialog>
      </div>
    `,
    props: { open: false },
    moduleMetadata: { imports: [DialogComponent, ButtonComponent] },
  }),
  parameters: {
    controls: { disable: true },
    docs: {
      source: {
        code: `<app-button text="刪除備註" (btnClick)="open = true"></app-button>
<app-dialog
  [isOpen]="open"
  header="永久刪除無法回復"
  content="此操作將永久刪除此則備註，無法撤回，是否繼續？"
  propClass="Warning"
  confirmText="確認刪除"
  (cancel)="open = false"
  (confirm)="open = false">
</app-dialog>`,
      },
    },
  },
};

// ── Warning（關閉狀態）─────────────────────────
export const WarningClosed: Story = {
  args: {
    isOpen: false,
    header: '刪除聯絡窗口資料',
    content: '此動作無法復原，請確認是否刪除該位聯絡窗口資料',
    propClass: 'Warning',
    confirmText: '確認刪除',
  },
};

// ── Warning（開啟狀態）──────────────────────────────
export const WarningOpen: Story = {
  args: {
    isOpen: true,
    header: '刪除聯絡窗口資料',
    content: '此動作無法復原，請確認是否刪除該位聯絡窗口資料',
    propClass: 'Warning',
    confirmText: '確認刪除',
  },
};

// ── Normal（一般確認，開啟狀態）─────────────────────
export const NormalOpen: Story = {
  args: {
    isOpen: true,
    header: '放棄設定？',
    content: '目前填寫的內容尚未儲存，放棄後將不會保留。',
    propClass: 'Normal',
    confirmText: '放棄',
  },
};
