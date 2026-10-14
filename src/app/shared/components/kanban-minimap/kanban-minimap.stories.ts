import type { Meta, StoryObj } from '@storybook/angular';
import { KanbanMinimapComponent } from '../../../../index';
import type { MinimapColumn } from '../../../../index';

const meta: Meta<KanbanMinimapComponent> = {
  title: '展示元件/Kanban Minimap',
  id: 'kanban-minimap',
  component: KanbanMinimapComponent,
  tags: ['autodocs'],
  argTypes: {
    columns: {
      description: '看板欄位資料，每欄包含標籤、顏色與卡片數量',
      control: { type: 'object' },
    },
    boardContainer: {
      description: '綁定看板捲動容器的 HTMLElement，用於同步捲動位置（Storybook 中不需傳入）',
      control: false,
    },
  },
  parameters: {
    docs: {
      description: {
        component: `
看板縮圖導航元件，顯示各欄位色條與卡片堆疊縮圖。
需透過 \`boardContainer\` input 傳入可水平捲動的看板容器元素，才會顯示捲動視窗（Viewport）。
在 Storybook 中僅展示靜態欄位結構。
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<KanbanMinimapComponent>;

const realisticColumns: MinimapColumn[] = [
  { label: '待聯繫', color: '#7d7d7d', cardCount: 8 },
  { label: '需求確認', color: '#4ba5b2', cardCount: 5 },
  { label: '報價中', color: '#af8e4d', cardCount: 12 },
  { label: '核保審查', color: '#b36a56', cardCount: 3 },
  { label: '等待簽約', color: '#5da26b', cardCount: 6 },
  { label: '已成交', color: '#4ba5b2', cardCount: 20 },
];

export const Default: Story = {
  name: 'Default（六欄位）',
  args: {
    columns: realisticColumns,
  },
};

export const FewColumns: Story = {
  name: '少量欄位（三欄）',
  args: {
    columns: [
      { label: '待報價', color: '#7d7d7d', cardCount: 4 },
      { label: '報價中', color: '#af8e4d', cardCount: 9 },
      { label: '已成交', color: '#5da26b', cardCount: 15 },
    ] satisfies MinimapColumn[],
  },
};

export const Empty: Story = {
  name: '無欄位資料',
  args: {
    columns: [],
  },
};
