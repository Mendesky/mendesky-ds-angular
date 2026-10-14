import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent } from '../index';
import { dsCollapseDoc } from './ds-collapse.docs';

// .ds-collapse 是 core.scss 裡的工具 class，沒有元件，所以 meta 不放 component，
// 改用 parameters.dsDoc 指定說明頁要讀的說明檔。
// 範例內容一律用中性佔位文字（這個 class 不綁定任何業務內容）。

interface CollapseArgs {
  /** 是否套用 .ds-collapse--expanded */
  expanded: boolean;
}

/** 佔位內容：幾行文字，讓收合／展開的高度變化看得出來 */
const PLACEHOLDER_CONTENT = `
  <div style="padding:12px 16px;display:flex;flex-direction:column;gap:6px;">
    <span class="noto-14-regular">可收合的內容 第 1 行</span>
    <span class="noto-14-regular">可收合的內容 第 2 行</span>
    <span class="noto-14-regular">可收合的內容 第 3 行</span>
  </div>
`;

/** 外框樣式：只為了在畫面上看得出區塊邊界，不屬於 .ds-collapse 本身 */
const FRAME_STYLE = 'max-width:360px;border:1px solid #e7e7e7;border-radius:8px;background:#fff;';
const HEADER_STYLE = 'padding:10px 16px;border-bottom:1px solid #e7e7e7;';

const meta: Meta<CollapseArgs> = {
  title: '工具/DS Collapse 收合動畫',
  id: 'ds-collapse',
  tags: ['autodocs'],
  parameters: {
    dsDoc: dsCollapseDoc,
  },
  argTypes: {
    expanded: {
      control: 'boolean',
      description: '套用 .ds-collapse--expanded 時展開；移除則收合（300ms 動畫）',
      table: { defaultValue: { summary: 'false' } },
    },
  },
  args: {
    expanded: true,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${FRAME_STYLE}">
        <div class="noto-14-medium" style="${HEADER_STYLE}">區塊標題（{{ expanded ? '展開' : '收合' }}）</div>
        <div class="ds-collapse" [class.ds-collapse--expanded]="expanded">
          <div class="ds-collapse__inner">${PLACEHOLDER_CONTENT}</div>
        </div>
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<CollapseArgs>;

// ── 主範例：用 Controls 切換 expanded，可看到 300ms 收合動畫 ─────
export const Default: Story = {
  name: '預設（用 Controls 切換）',
  parameters: {
    docs: {
      source: {
        code: `<div class="ds-collapse" [class.ds-collapse--expanded]="isExpanded">
  <div class="ds-collapse__inner">
    <!-- 可收合的內容 -->
  </div>
</div>`,
      },
    },
  },
};

// ── 收合狀態 ─────────────────────────────────────────────────────
export const Collapsed: Story = {
  name: '收合狀態',
  args: { expanded: false },
};

// ── 互動：按鈕切換 ───────────────────────────────────────────────
export const Interactive: Story = {
  name: '互動（按鈕切換）',
  render: () => ({
    props: { open: false },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;">
        <app-button
          variant="outlined"
          size="S"
          [text]="open ? '收合' : '展開'"
          (btnClick)="open = !open">
        </app-button>
        <div style="${FRAME_STYLE}width:360px;">
          <div class="noto-14-medium" style="${HEADER_STYLE}">區塊標題</div>
          <div class="ds-collapse" [class.ds-collapse--expanded]="open">
            <div class="ds-collapse__inner">${PLACEHOLDER_CONTENT}</div>
          </div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [ButtonComponent] },
  }),
  parameters: {
    controls: { disable: true },
  },
};

// ── 對照：少了 .ds-collapse__inner ──────────────────────────────
// grid 的列高下限預設是內容高度；內層沒有 overflow: hidden 時，0fr 壓不下去，區塊收不起來。
export const MissingInner: Story = {
  name: '對照：少了 __inner 就收不起來',
  args: { expanded: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;gap:24px;flex-wrap:wrap;align-items:flex-start;">
        <div style="${FRAME_STYLE}width:280px;">
          <div class="noto-14-medium" style="${HEADER_STYLE}">正確：有 __inner</div>
          <div class="ds-collapse" [class.ds-collapse--expanded]="expanded">
            <div class="ds-collapse__inner">${PLACEHOLDER_CONTENT}</div>
          </div>
        </div>
        <div style="${FRAME_STYLE}width:280px;">
          <div class="noto-14-medium" style="${HEADER_STYLE}">錯誤：少了 __inner</div>
          <div class="ds-collapse" [class.ds-collapse--expanded]="expanded">
            <div>${PLACEHOLDER_CONTENT}</div>
          </div>
        </div>
      </div>
    `,
  }),
};
