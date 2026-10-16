import type { Meta, StoryObj } from '@storybook/angular';
import { OptionCardGroupComponent, OptionCardItem } from '../../../../index';

// 中性的插圖佔位。實際插圖由使用端傳入 120×120 的 SVG 字串
// （各產品的插圖通常很大，不搬進 DS）。
const PLACEHOLDER_ILLUSTRATION = `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="24" y="30" width="72" height="60" rx="6" fill="#d6ebf5" stroke="#3a9ccd" stroke-width="2"/>
  <circle cx="46" cy="50" r="7" fill="#3a9ccd"/>
  <path d="M30 84 L52 62 L66 74 L76 66 L90 84 Z" fill="#3a9ccd"/>
</svg>`;

// 版面樣式（4 張）
const LAYOUT_OPTIONS: OptionCardItem[] = [
  { value: '清單', label: '清單', description: '逐列顯示\n適合大量資料', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: '卡片', label: '卡片', description: '卡片式排列\n適合看圖辨識', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: '看板', label: '看板', description: '依狀態分欄\n可拖曳調整順序', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: '時間軸', label: '時間軸', description: '依日期排序\n適合追蹤進度', illustration: PLACEHOLDER_ILLUSTRATION },
];

// 主題外觀（3 張）
const THEME_OPTIONS: OptionCardItem[] = [
  { value: 'light', label: '淺色', description: '白底深字\n適合明亮環境', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: 'dark', label: '深色', description: '深底淺字\n適合昏暗環境', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: 'system', label: '跟隨系統', description: '依作業系統設定\n自動切換', illustration: PLACEHOLDER_ILLUSTRATION },
];

const meta: Meta<OptionCardGroupComponent> = {
  title: '表單元件/Option Card Group',
  id: 'option-card-group',
  component: OptionCardGroupComponent,
  tags: ['autodocs'],
  argTypes: {
    options: {
      control: 'object',
      description: '卡片資料 { value; label; description?; illustration?; disabled? }',
      table: { defaultValue: { summary: '[]' } },
    },
    value: {
      control: 'text',
      description: '目前選中的 value（完全受控，元件不持有內部選取狀態）',
      table: { defaultValue: { summary: 'null' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'radiogroup 的 aria-label',
      table: { defaultValue: { summary: "''" } },
    },
    disabledValues: {
      control: 'object',
      description: '額外停用的 value（疊加在 option.disabled 之上）',
      table: { defaultValue: { summary: '[]' } },
    },
    valueChange: { action: 'valueChange' },
  },
};

export default meta;
type Story = StoryObj<OptionCardGroupComponent>;

// ── 主範例：版面樣式（4 張）。點卡片或用方向鍵切換；父層把 valueChange 寫回 value ──
export const Default: Story = {
  name: '預設',
  args: {
    options: LAYOUT_OPTIONS,
    value: '卡片',
    ariaLabel: '版面樣式',
    disabledValues: [],
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width:680px;">
        <app-option-card-group
          [options]="options"
          [value]="value"
          [ariaLabel]="ariaLabel"
          [disabledValues]="disabledValues"
          (valueChange)="value = $event; valueChange($event)">
        </app-option-card-group>
      </div>
    `,
    moduleMetadata: { imports: [OptionCardGroupComponent] },
  }),
};

// ── 主題外觀（3 張） ─────────────────────────────────────────
export const Establishment: Story = {
  name: '主題外觀（3 張）',
  render: () => ({
    props: { options: THEME_OPTIONS, value: null as string | null },
    template: `
      <div style="max-width:520px;">
        <app-option-card-group
          ariaLabel="主題外觀"
          [options]="options"
          [value]="value"
          (valueChange)="value = $event">
        </app-option-card-group>
        <p style="font-size:12px;color:#686868;margin-top:12px;">已選：{{ value ?? '（未選）' }}</p>
      </div>
    `,
    moduleMetadata: { imports: [OptionCardGroupComponent] },
  }),
};

// ── 部分停用：例如資料量太大時只開放清單／時間軸 ──
export const WithDisabledValues: Story = {
  name: '部分停用',
  render: () => ({
    props: {
      options: LAYOUT_OPTIONS,
      value: '清單',
      disabledValues: ['卡片', '看板'],
    },
    template: `
      <div style="max-width:680px;">
        <app-option-card-group
          ariaLabel="版面樣式"
          [options]="options"
          [value]="value"
          [disabledValues]="disabledValues"
          (valueChange)="value = $event">
        </app-option-card-group>
        <p style="font-size:12px;color:#686868;margin-top:12px;">停用的卡片點了不會選取，方向鍵也會跳過。</p>
      </div>
    `,
    moduleMetadata: { imports: [OptionCardGroupComponent] },
  }),
};
