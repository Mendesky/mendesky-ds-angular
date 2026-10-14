// 範例資料取自 dashboard-app 主線：src/app/features/quoting-cases/components/case-edit-modal/pages/p3-basic-info/p3-basic-info.component.html（刪除聯絡窗口，Warning）、
// .../case-edit-modal/pages/p2-quoting/components/p2-config-wizard/p2-config-wizard.component.html（放棄設定，Normal）、
// .../case-edit-modal/pages/p4-contract/components/p4-6-notes/p4-6-notes.component.html（永久刪除服務備註，Warning）
import type { Meta, StoryObj } from '@storybook/angular';
import { DialogComponent } from '../../../../index';

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

// ── Warning（預設，關閉狀態）─────────────────────────
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

// ── Interactive（切換開關）───────────────────────────
export const Interactive: Story = {
  render: () => ({
    template: `
      <div style="padding:24px;">
        <button
          (click)="open = !open"
          style="padding:8px 16px;background:#1976d2;color:#fff;border:none;border-radius:6px;cursor:pointer;">
          {{ open ? '關閉 Dialog' : '開啟 Dialog' }}
        </button>
        <app-dialog
          [isOpen]="open"
          header="永久刪除無法回復"
          content="此操作將永久刪除此服務備註，無法撤回，是否繼續？"
          propClass="Warning"
          confirmText="確認刪除"
          (cancel)="open = false"
          (confirm)="open = false">
        </app-dialog>
      </div>
    `,
    props: { open: false },
    moduleMetadata: { imports: [DialogComponent] },
  }),
};
