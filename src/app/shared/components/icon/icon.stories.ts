import type { Meta, StoryObj } from '@storybook/angular';
import { IconComponent, ICON_REGISTRY } from '../../../../index';

const iconNames = Object.keys(ICON_REGISTRY);

const meta: Meta<IconComponent> = {
  title: '展示元件/Icon',
  id: 'icon',
  component: IconComponent,
  tags: ['autodocs'],
  argTypes: {
    name: {
      control: 'select',
      options: iconNames,
      description: 'Icon 名稱（對應 ICON_REGISTRY）',
    },
    size: {
      control: 'select',
      options: ['12', '16', '24', '32', '36', '48'],
      description: '正方形尺寸（px）',
      table: { defaultValue: { summary: '24' } },
    },
  },
};

export default meta;
type Story = StoryObj<IconComponent>;

export const Default: Story = {
  args: { name: 'Plus', size: '24' },
  render: (args) => ({
    props: args,
    template: `
      <app-icon [name]="name" [size]="size" style="color:#3a9ccd;"></app-icon>
    `,
    moduleMetadata: { imports: [IconComponent] },
  }),
};

// ── 尺寸比較 ─────────────────────────────────────────
export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center;padding:12px;">
        <div style="text-align:center;">
          <app-icon name="Plus" size="12" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:10px;color:#686868;margin-top:4px;">12px</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="16" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:10px;color:#686868;margin-top:4px;">16px</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="24" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:10px;color:#686868;margin-top:4px;">24px</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="32" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:10px;color:#686868;margin-top:4px;">32px</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="36" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:10px;color:#686868;margin-top:4px;">36px</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="48" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:10px;color:#686868;margin-top:4px;">48px</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [IconComponent] },
  }),
};

// ── 顏色繼承驗證 ─────────────────────────────────────
export const ColorInheritance: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center;padding:12px;flex-wrap:wrap;">
        <div style="text-align:center;">
          <app-icon name="Plus" size="24" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:11px;color:#686868;margin-top:4px;">#3a9ccd</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="24" style="color:#74ae3e;"></app-icon>
          <div style="font-size:11px;color:#686868;margin-top:4px;">#74ae3e</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="24" style="color:#cc5252;"></app-icon>
          <div style="font-size:11px;color:#686868;margin-top:4px;">#cc5252</div>
        </div>
        <div style="text-align:center;">
          <app-icon name="Plus" size="24" style="color:#686868;"></app-icon>
          <div style="font-size:11px;color:#686868;margin-top:4px;">#686868</div>
        </div>
        <div style="text-align:center;background:#1c1c2e;padding:8px;border-radius:6px;">
          <app-icon name="Plus" size="24" style="color:white;"></app-icon>
          <div style="font-size:11px;color:#939393;margin-top:4px;">white</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [IconComponent] },
  }),
};

// ── 全 Icon 一覽 ─────────────────────────────────────
export const IconGallery: Story = {
  render: () => {
    const names = Object.keys(ICON_REGISTRY);
    const items = names
      .map(
        (n) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;border:1px solid #f0f0f0;border-radius:6px;min-width:72px;">
          <app-icon name="${n}" size="24" style="color:#3a9ccd;"></app-icon>
          <div style="font-size:10px;color:#686868;text-align:center;word-break:break-all;">${n}</div>
        </div>`
      )
      .join('');
    return {
      template: `<div style="display:flex;flex-wrap:wrap;gap:8px;padding:16px;">${items}</div>`,
      moduleMetadata: { imports: [IconComponent] },
    };
  },
};
