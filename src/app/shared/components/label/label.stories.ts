import type { Meta, StoryObj } from '@storybook/angular';
import { LabelComponent } from '../../../../index';

const meta: Meta<LabelComponent> = {
  title: '展示元件/Label',
  id: 'label',
  component: LabelComponent,
  tags: ['autodocs'],
  argTypes: {
    color: {
      control: 'select',
      options: [
        'White', 'Transparent', 'GreyOutline', 'LightWhite',
        'SoftBlue', 'Red', 'Salmon', 'Green',
        'Grey25', 'Blue', 'SeaGreen', 'Grey70',
        'Grey16', 'Error', 'GreenAll', 'Golden',
      ],
      description: '顏色語意',
      table: { defaultValue: { summary: 'LightWhite' } },
    },
    size: {
      control: 'select',
      options: ['S', 'M', 'L'],
      description: '尺寸',
      table: { defaultValue: { summary: 'L' } },
    },
    text: {
      control: 'text',
      description: 'Label 文字',
    },
    showLeftIcon: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    showRightIcon: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    showNumberedList: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
  },
};

export default meta;
type Story = StoryObj<LabelComponent>;

export const Default: Story = {
  args: { color: 'SoftBlue', size: 'L', text: '標籤' },
};

// ── 全色票 ───────────────────────────────────────────
export const AllColors: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:8px;padding:16px;background:#f8f9fa;">
        <app-label color="LightWhite"  size="L" text="LightWhite"></app-label>
        <app-label color="White"       size="L" text="White"></app-label>
        <app-label color="GreyOutline" size="L" text="GreyOutline"></app-label>
        <app-label color="SoftBlue"    size="L" text="SoftBlue"></app-label>
        <app-label color="Blue"        size="L" text="Blue"></app-label>
        <app-label color="SeaGreen"    size="L" text="SeaGreen"></app-label>
        <app-label color="GreenAll"    size="L" text="GreenAll"></app-label>
        <app-label color="Green"       size="L" text="Green"></app-label>
        <app-label color="Golden"      size="L" text="Golden"></app-label>
        <app-label color="Salmon"      size="L" text="Salmon"></app-label>
        <app-label color="Grey70"      size="L" text="Grey70"></app-label>
        <app-label color="Grey25"      size="L" text="Grey25"></app-label>
        <app-label color="Grey16"      size="L" text="Grey16"></app-label>
        <app-label color="Red"         size="L" text="Red（回補）"></app-label>
        <app-label color="Error"       size="L" text="Error"></app-label>
        <app-label color="Transparent" size="L" text="Transparent"></app-label>
      </div>
    `,
    moduleMetadata: { imports: [LabelComponent] },
  }),
};

// ── 類別標籤（實際使用場景）────────────────────────────
export const CaseTypeTags: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:6px;flex-wrap:wrap;padding:12px;">
        <app-label color="Grey70"    size="L" text="一般"></app-label>
        <app-label color="SoftBlue"  size="L" text="群組 (3)"></app-label>
        <app-label color="SeaGreen"  size="L" text="新成員"></app-label>
        <app-label color="Golden"    size="L" text="VIP"></app-label>
        <app-label color="Red"       size="L" text="優先"></app-label>
      </div>
    `,
    moduleMetadata: { imports: [LabelComponent] },
  }),
};

// ── 三種尺寸 ─────────────────────────────────────────
export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:8px;align-items:center;padding:12px;">
        <app-label color="SoftBlue" size="S" text="S size"></app-label>
        <app-label color="SoftBlue" size="M" text="M size"></app-label>
        <app-label color="SoftBlue" size="L" text="L size"></app-label>
      </div>
    `,
    moduleMetadata: { imports: [LabelComponent] },
  }),
};
