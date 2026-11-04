import type { Meta, StoryObj } from '@storybook/angular';
import { KanbanMinimapComponent } from '../../../../index';
import type { MinimapColumn } from '../../../../index';

// 縮圖平常是隱藏的：要接上一個「寬到需要橫向捲動」的看板（boardContainer）才會出現，
// 而且固定在視窗右下角。所以每個範例都帶一個可以橫向捲動的看板，並把它傳給 boardContainer。
//
// 縮圖用 position: fixed，在說明頁裡直接畫會跑到整頁的右下角、幾個範例疊在一起，
// 所以說明頁改成每個範例各自用一個 iframe 畫（docs.story.inline: false）。
// 範例內容用中性佔位文字（這個元件不綁定任何業務內容）。

const COLUMNS: MinimapColumn[] = [
  { label: '欄位一', color: '#7d7d7d', cardCount: 4 },
  { label: '欄位二', color: '#4ba5b2', cardCount: 2 },
  { label: '欄位三', color: '#af8e4d', cardCount: 5 },
  { label: '欄位四', color: '#b36a56', cardCount: 1 },
  { label: '欄位五', color: '#5da26b', cardCount: 3 },
  { label: '欄位六', color: '#4ba5b2', cardCount: 6 },
];

/** 示意用的看板：每欄固定寬度，欄數多時超出容器、可以橫向捲動。只為了讓縮圖有東西可以對照，不屬於縮圖本身 */
const BOARD_TEMPLATE = `
  <div #board style="display:flex;gap:12px;overflow-x:auto;padding:16px;background:#f0f4f8;height:220px;box-sizing:border-box;">
    @for (col of columns; track col.label) {
      <div style="flex:0 0 200px;display:flex;flex-direction:column;gap:6px;">
        <div class="noto-14-medium" style="padding:6px 8px;border-radius:4px;color:#fff;" [style.background]="col.color">{{ col.label }}</div>
        @for (i of [1, 2, 3]; track i) {
          @if (i <= col.cardCount) {
            <div style="height:28px;border-radius:4px;background:#fff;border:1px solid #e7e7e7;"></div>
          }
        }
      </div>
    }
  </div>
  <app-kanban-minimap [columns]="columns" [boardContainer]="board"></app-kanban-minimap>
`;

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
      description: '可以橫向捲動的看板容器元素。看板寬到需要捲動時縮圖才會出現，並跟著它的捲動位置移動',
      control: false,
    },
  },
  parameters: {
    layout: 'fullscreen',
    docs: {
      story: { inline: false, iframeHeight: 240 },
      description: {
        component: `
看板縮圖導航元件，顯示各欄位色條與卡片堆疊縮圖，固定在視窗右下角。
要把可以橫向捲動的看板容器傳給 \`boardContainer\`；看板寬到需要捲動時縮圖才會出現。
橫向捲動看板、點縮圖、或拖拉縮圖上的框，都會同步移動。
        `,
      },
    },
  },
  render: (args) => ({
    props: args,
    template: BOARD_TEMPLATE,
  }),
};

export default meta;
type Story = StoryObj<KanbanMinimapComponent>;

export const Default: Story = {
  name: '看板需要橫向捲動時出現',
  args: {
    columns: COLUMNS,
  },
  parameters: {
    docs: {
      source: {
        code: `<div #board class="board"><!-- 可以橫向捲動的看板 --></div>
<app-kanban-minimap [columns]="columns" [boardContainer]="board"></app-kanban-minimap>`,
      },
    },
  },
};

export const FitsWithoutScroll: Story = {
  name: '看板放得下時不出現',
  args: {
    columns: COLUMNS.slice(0, 2),
  },
};
