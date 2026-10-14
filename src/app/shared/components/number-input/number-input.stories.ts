import type { Meta, StoryObj } from '@storybook/angular';
import { NumberInputComponent } from '../../../../index';

const meta: Meta<NumberInputComponent> = {
  title: '表單元件/Number Input',
  id: 'number-input',
  component: NumberInputComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['S', 'M', 'L'],
      description: '輸入框尺寸',
      table: { defaultValue: { summary: 'L' } },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder 文字',
      table: { defaultValue: { summary: '0' } },
    },
    decimalPlaces: {
      control: 'number',
      description: '小數位數（0 = 整數；預留擴充）',
      table: { defaultValue: { summary: '0' } },
    },
    min: {
      control: 'number',
      description: '最小值（null = 無限制）',
    },
    max: {
      control: 'number',
      description: '最大值（null = 無限制）',
    },
    step: {
      control: 'number',
      description: '步距：↑↓ 每次 ±step，Shift+↑↓ 每次 ±step×10',
      table: { defaultValue: { summary: '1' } },
    },
    errorMessage: {
      control: 'text',
      description: '錯誤訊息（有值時切換 error 狀態）',
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    valueChange: { action: 'valueChange' },
  },
};

export default meta;
type Story = StoryObj<NumberInputComponent>;

export const Default: Story = {
  args: { size: 'L', placeholder: '0', disabled: false },
};

// ── 三種尺寸 ─────────────────────────────────────────
export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;width:280px;padding:16px;">
        <app-number-input size="S" placeholder="S size"></app-number-input>
        <app-number-input size="M" placeholder="M size"></app-number-input>
        <app-number-input size="L" placeholder="L size"></app-number-input>
      </div>
    `,
    moduleMetadata: { imports: [NumberInputComponent] },
  }),
};

// ── min / max 限制 ────────────────────────────────────
export const WithMinMax: Story = {
  args: {
    size: 'L',
    placeholder: '0',
    min: 0,
    max: 1000,
  },
};

// ── 自訂步距 ──────────────────────────────────────────
export const WithStep: Story = {
  args: {
    size: 'L',
    placeholder: '0',
    step: 10,
    min: 0,
    max: 1000,
  },
};

// ── 錯誤狀態 ──────────────────────────────────────────
export const WithError: Story = {
  args: {
    size: 'L',
    placeholder: '0',
    min: 0,
    max: 100,
    errorMessage: '數量超過庫存上限（最多 100）',
  },
};

// ── 禁用 ──────────────────────────────────────────────
export const Disabled: Story = {
  args: {
    size: 'L',
    placeholder: '不可輸入',
    disabled: true,
  },
};

// ── 全狀態一覽 ────────────────────────────────────────
export const AllStates: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;width:280px;padding:16px;">
        <div>
          <div style="font-size:11px;color:#939393;margin-bottom:4px;">Normal</div>
          <app-number-input size="L" placeholder="0"></app-number-input>
        </div>
        <div>
          <div style="font-size:11px;color:#939393;margin-bottom:4px;">with min=0, max=9999</div>
          <app-number-input size="L" placeholder="0" [min]="0" [max]="9999"></app-number-input>
        </div>
        <div>
          <div style="font-size:11px;color:#939393;margin-bottom:4px;">Error</div>
          <app-number-input size="L" errorMessage="此欄位為必填" [min]="0"></app-number-input>
        </div>
        <div>
          <div style="font-size:11px;color:#939393;margin-bottom:4px;">Disabled</div>
          <app-number-input size="L" placeholder="不可輸入" [disabled]="true"></app-number-input>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [NumberInputComponent] },
  }),
};
