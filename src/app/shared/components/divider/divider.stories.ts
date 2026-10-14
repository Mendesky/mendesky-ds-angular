import type { Meta, StoryObj } from '@storybook/angular';
import { DividerComponent } from '../../../../index';

const meta: Meta<DividerComponent> = {
  title: '展示元件/Divider',
  id: 'divider',
  component: DividerComponent,
  tags: ['autodocs'],
  argTypes: {
    display: {
      control: 'select',
      options: ['Row', 'Column'],
      description: '方向：Row 水平線 / Column 垂直線',
      table: { defaultValue: { summary: 'Row' } },
    },
    propClass: {
      control: 'select',
      options: ['White', 'Grey20', 'Grey30', 'Grey40'],
      description: '線條顏色深淺',
      table: { defaultValue: { summary: 'Grey20' } },
    },
    showLabel: {
      control: 'boolean',
      description: '是否顯示中央標籤文字（僅 Row 有效）',
      table: { defaultValue: { summary: 'false' } },
    },
    labelText: {
      control: 'text',
      description: '標籤文字',
      table: { defaultValue: { summary: '上滑顯示更多' } },
    },
  },
};

export default meta;
type Story = StoryObj<DividerComponent>;

// ── Row 水平（預設）──────────────────────────────────
export const RowDefault: Story = {
  args: {
    display: 'Row',
    propClass: 'Grey20',
    showLabel: false,
    labelText: '上滑顯示更多',
  },
  decorators: [
    () => ({
      template: `<div style="width:400px;padding:16px;"><app-divider display="Row" propClass="Grey20"></app-divider></div>`,
      moduleMetadata: { imports: [DividerComponent] },
    }),
  ],
};

// ── Column 垂直 ──────────────────────────────────────
export const ColumnDefault: Story = {
  args: {
    display: 'Column',
    propClass: 'Grey20',
  },
  decorators: [
    () => ({
      template: `
        <div style="display:flex;align-items:center;height:64px;padding:0 16px;gap:16px;">
          <span style="font-size:14px;color:#333;">被保人</span>
          <app-divider display="Column" propClass="Grey30"></app-divider>
          <span style="font-size:14px;color:#333;">王小明</span>
        </div>
      `,
      moduleMetadata: { imports: [DividerComponent] },
    }),
  ],
};

// ── With Label ───────────────────────────────────────
export const WithLabel: Story = {
  args: {
    display: 'Row',
    propClass: 'Grey20',
    showLabel: true,
    labelText: '上滑顯示更多',
  },
  decorators: [
    () => ({
      template: `<div style="width:400px;padding:16px;"><app-divider display="Row" propClass="Grey20" [showLabel]="true" labelText="上滑顯示更多"></app-divider></div>`,
      moduleMetadata: { imports: [DividerComponent] },
    }),
  ],
};

// ── AllColors ────────────────────────────────────────
export const AllColors: Story = {
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:24px;padding:24px;background:#f8f9fa;width:400px;">
        <div>
          <p style="font-size:12px;color:#999;margin:0 0 8px;">White</p>
          <div style="background:#555;padding:8px;border-radius:4px;">
            <app-divider display="Row" propClass="White"></app-divider>
          </div>
        </div>
        <div>
          <p style="font-size:12px;color:#999;margin:0 0 8px;">Grey20</p>
          <app-divider display="Row" propClass="Grey20"></app-divider>
        </div>
        <div>
          <p style="font-size:12px;color:#999;margin:0 0 8px;">Grey30</p>
          <app-divider display="Row" propClass="Grey30"></app-divider>
        </div>
        <div>
          <p style="font-size:12px;color:#999;margin:0 0 8px;">Grey40</p>
          <app-divider display="Row" propClass="Grey40"></app-divider>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [DividerComponent] },
  }),
};
