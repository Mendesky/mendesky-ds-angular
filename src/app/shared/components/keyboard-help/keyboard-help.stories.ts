import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, KeyboardHelpComponent, type ShortcutGroup } from '../../../../index';

// 快速鍵資料為示意：一組頁面專屬快速鍵（「項目管理」）＋一組「全域」快速鍵
// （⌘K 全域搜尋在 Windows 顯示為 Ctrl K）
const ITEMS_GROUP: ShortcutGroup = {
  label: '項目管理',
  items: [
    { description: '新增項目', keys: ['C'] },
    { description: '卡片／列導覽：上', keys: ['W'] },
    { description: '卡片／列導覽：下', keys: ['S'] },
    { description: '卡片導覽：左欄（限看板）', keys: ['A'] },
    { description: '卡片導覽：右欄（限看板）', keys: ['D'] },
    { description: '開啟項目', keys: ['Enter'] },
    { description: '取消選取', keys: ['Esc'] },
    { description: '搜尋項目', keys: ['/'] },
  ],
};

const GLOBAL_GROUP: ShortcutGroup = {
  label: '全域',
  items: [
    { description: '全域搜尋', keys: ['⌘', 'K'] },
    { description: '顯示快速鍵說明', keys: ['?'] },
  ],
};

const meta: Meta<KeyboardHelpComponent> = {
  title: '浮層元件/Keyboard Help 快速鍵說明',
  id: 'keyboard-help',
  component: KeyboardHelpComponent,
  tags: ['autodocs'],
  // 面板以 modal-shell 組成，開啟時會被搬到 document.body 並蓋滿畫面；
  // 說明頁中改用獨立 iframe 呈現每個範例，才不會蓋住整頁。
  parameters: {
    docs: { story: { inline: false, iframeHeight: 560 } },
  },
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: '開關狀態。父層自行綁定 ? 鍵的監聽',
      table: { defaultValue: { summary: 'false' } },
    },
    shortcuts: {
      control: 'object',
      description: 'ShortcutGroup[]：{ label, items: { description, keys[] }[] }；keys 每個元素畫成一個鍵帽',
      table: { defaultValue: { summary: '[]' } },
    },
    close: { action: 'close' },
  },
};

export default meta;
type Story = StoryObj<KeyboardHelpComponent>;

// ── 主範例：開啟中（可在 Controls 調整 shortcuts）────────────
export const Default: Story = {
  name: '基本用法',
  args: {
    isOpen: true,
    shortcuts: [ITEMS_GROUP, GLOBAL_GROUP],
  },
};

// ── 只有全域群組（不在項目管理頁時）─────────────────────
export const GlobalOnly: Story = {
  name: '只有全域群組',
  args: {
    isOpen: true,
    shortcuts: [GLOBAL_GROUP],
  },
};

// ── 沒有任何快速鍵（顯示空狀態）────────────────────────
export const Empty: Story = {
  name: '沒有快速鍵（空狀態）',
  args: {
    isOpen: true,
    shortcuts: [],
  },
};

// ── 互動：按按鈕開啟，ESC / backdrop / X 關閉 ───────────────
export const Interactive: Story = {
  name: '互動測試（按按鈕開啟）',
  render: () => ({
    template: `
      <div style="padding:24px;">
        <app-button variant="filled" color="primary" size="M" text="顯示快速鍵說明" (btnClick)="open = true"></app-button>
        <p style="font-size:12px;color:#686868;margin-top:12px;">開啟後可在搜尋框輸入關鍵字篩選；按 ESC、點背景或 X 關閉。</p>
      </div>
      <app-keyboard-help [isOpen]="open" [shortcuts]="shortcuts" (close)="open = false"></app-keyboard-help>
    `,
    props: {
      open: false,
      shortcuts: [ITEMS_GROUP, GLOBAL_GROUP],
    },
    moduleMetadata: { imports: [KeyboardHelpComponent, ButtonComponent] },
  }),
};
