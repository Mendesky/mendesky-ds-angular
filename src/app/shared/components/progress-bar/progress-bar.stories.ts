import { componentWrapperDecorator } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { ProgressBarComponent } from '../../../../index';

// 範例數值取自 progress-bar.docs.ts 與 progress-bar.component.spec.ts（批次授權「處理中 12 / 40」）。
// 元件只畫比例、不內建文字，旁邊的說明文字由呼叫端自己排，所以範例裡一併示範。

const meta: Meta<ProgressBarComponent> = {
  title: '展示元件/Progress Bar',
  id: 'progress-bar',
  component: ProgressBarComponent,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: { type: 'number' },
      description: '目前完成量，與 max 同單位；會被夾在 0～max 之間',
      table: { defaultValue: { summary: '0' } },
    },
    max: {
      control: { type: 'number' },
      description: '總量。直接傳百分比時不用另外設；≤ 0 時一律視為 0%',
      table: { defaultValue: { summary: '100' } },
    },
    ariaLabel: {
      control: 'text',
      description: '讀屏文字。進度條本身沒有可見文字，建議一定要給',
      table: { defaultValue: { summary: "''" } },
    },
  },
  args: {
    value: 12,
    max: 40,
    ariaLabel: '批次授權進度',
  },
  // 進度條寬度跟著容器走，限制寬度方便看比例
  decorators: [componentWrapperDecorator((story) => `<div style="max-width:360px;">${story}</div>`)],
};

export default meta;
type Story = StoryObj<ProgressBarComponent>;

// ── 主範例：可用 Controls 調整 value / max / ariaLabel ─────────────
export const Default: Story = {
  name: '預設（處理中 12 / 40）',
};

// ── 搭配呼叫端文字 ───────────────────────────────────────────────
export const WithCaption: Story = {
  name: '搭配說明文字',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:6px;">
        <app-progress-bar [value]="12" [max]="40" ariaLabel="批次授權進度"></app-progress-bar>
        <span class="noto-12-regular" style="color:#686868;">處理中 12 / 40</span>
      </div>
    `,
    moduleMetadata: { imports: [ProgressBarComponent] },
  }),
};

// ── 已完成 ───────────────────────────────────────────────────────
export const Completed: Story = {
  name: '已完成（40 / 40）',
  args: { value: 40, max: 40, ariaLabel: '批次授權進度' },
};

// ── 直接傳百分比 ─────────────────────────────────────────────────
export const Percent: Story = {
  name: '直接傳百分比（max 用預設 100）',
  args: { value: 30, max: 100, ariaLabel: '批次授權進度' },
};

// ── 防呆：總數還沒算出來 ─────────────────────────────────────────
export const ZeroMax: Story = {
  name: '總數尚未算出（max = 0 → 0%）',
  args: { value: 5, max: 0, ariaLabel: '批次授權進度' },
};

// ── 防呆：超過總量時夾在 100% ────────────────────────────────────
export const Overflow: Story = {
  name: '超過總量（55 / 40 → 夾在 100%）',
  args: { value: 55, max: 40, ariaLabel: '批次授權進度' },
};
