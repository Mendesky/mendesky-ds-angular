// 範例資料：唯讀「欄位名稱＋欄位值」清單（帳號資料的各層欄位）
import type { Meta, StoryObj } from '@storybook/angular';
import { ListComponent } from '../../../../index';

const meta: Meta<ListComponent> = {
  title: '展示元件/List',
  id: 'list',
  component: ListComponent,
  tags: ['autodocs'],
  argTypes: {
    level: {
      control: 'select',
      options: ['1', '2', '3', '4'],
      description: '層級深度，影響縮排與樣式',
      table: { defaultValue: { summary: '1' } },
    },
    title: {
      control: 'text',
      description: '欄位名稱／標題',
      table: { defaultValue: { summary: 'Title' } },
    },
    value: {
      control: 'text',
      description: '欄位值',
      table: { defaultValue: { summary: 'Value' } },
    },
    itemNumber: {
      control: 'text',
      description: '項目編號（配合 showItemNumber 使用）',
      table: { defaultValue: { summary: '1' } },
    },
    showItemNumber: {
      control: 'boolean',
      description: '是否顯示項目編號',
      table: { defaultValue: { summary: 'true' } },
    },
    showTitle: {
      control: 'boolean',
      description: '是否顯示標題',
      table: { defaultValue: { summary: 'true' } },
    },
    showValue: {
      control: 'boolean',
      description: '是否顯示值',
      table: { defaultValue: { summary: 'true' } },
    },
    hasChildren: {
      control: 'boolean',
      description: '是否有子項目（影響展開箭頭顯示）',
      table: { defaultValue: { summary: 'false' } },
    },
    status: {
      control: 'select',
      options: ['Default', 'Hover'],
      description: '互動狀態',
      table: { defaultValue: { summary: 'Default' } },
    },
  },
};

export default meta;
type Story = StoryObj<ListComponent>;

// ── Level 1 ───────────────────────────────────────────
export const Level1: Story = {
  args: {
    level: '1',
    title: '帳號狀態',
    value: '啟用中',
    itemNumber: '1',
    showItemNumber: true,
    showTitle: true,
    showValue: true,
    hasChildren: false,
    status: 'Default',
  },
};

// ── Level 2 ───────────────────────────────────────────
export const Level2: Story = {
  args: {
    level: '2',
    title: '所屬部門',
    value: '產品設計部',
    itemNumber: '1',
    showItemNumber: true,
    showTitle: true,
    showValue: true,
    hasChildren: false,
    status: 'Default',
  },
};

// ── Level 3 ───────────────────────────────────────────
export const Level3: Story = {
  args: {
    level: '3',
    title: '職稱',
    value: '資深設計師',
    itemNumber: '1',
    showItemNumber: true,
    showTitle: true,
    showValue: true,
    hasChildren: false,
    status: 'Default',
  },
};

// ── Level 4 ───────────────────────────────────────────
export const Level4: Story = {
  args: {
    level: '4',
    title: '通知方式',
    value: '電子郵件',
    itemNumber: '1',
    showItemNumber: true,
    showTitle: true,
    showValue: true,
    hasChildren: false,
    status: 'Default',
  },
};

// ── 含子項目（展開箭頭）──────────────────────────────
export const WithChildren: Story = {
  args: {
    level: '1',
    title: '權限設定',
    value: '檢視＋編輯',
    itemNumber: '1',
    showItemNumber: true,
    showTitle: true,
    showValue: true,
    hasChildren: true,
    status: 'Default',
  },
};

// ── Hover 狀態 ────────────────────────────────────────
export const HoverStatus: Story = {
  args: {
    level: '1',
    title: '所屬部門',
    value: '行銷部',
    itemNumber: '2',
    showItemNumber: true,
    showTitle: true,
    showValue: true,
    hasChildren: false,
    status: 'Hover',
  },
};

// ── 所有層級並排對比 ──────────────────────────────────
export const AllLevels: Story = {
  render: () => ({
    template: `
      <div style="width:480px;padding:16px;background:#fff;border:1px solid #e7e7e7;border-radius:8px;">
        <app-list
          level="1"
          title="帳號狀態"
          value="啟用中"
          itemNumber="1"
          [showItemNumber]="true">
        </app-list>
        <app-list
          level="2"
          title="所屬部門"
          value="產品設計部"
          itemNumber="1"
          [showItemNumber]="true">
        </app-list>
        <app-list
          level="3"
          title="職稱"
          value="資深設計師"
          itemNumber="1"
          [showItemNumber]="true">
        </app-list>
        <app-list
          level="4"
          title="通知方式"
          value="電子郵件"
          itemNumber="1"
          [showItemNumber]="true">
        </app-list>
      </div>
    `,
    moduleMetadata: { imports: [ListComponent] },
  }),
};
