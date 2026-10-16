import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, BtnLabelConfig, ICON_REGISTRY } from '../../../../index';

const iconNames = ['', ...Object.keys(ICON_REGISTRY)];

const LABEL_COLOR_OPTIONS = [
  'White', 'Transparent', 'GreyOutline', 'LightWhite',
  'SoftBlue', 'Red', 'Salmon', 'Green',
  'Grey25', 'Blue', 'SeaGreen', 'Grey70',
  'Grey16', 'Error', 'GreenAll', 'Golden',
];

const meta: Meta<ButtonComponent> = {
  title: '互動元件/Button',
  id: 'button',
  component: ButtonComponent,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['filled', 'tonal', 'outlined', 'ghost', 'elevated'],
      description: '按鈕外觀',
      table: { defaultValue: { summary: 'filled' } },
    },
    color: {
      control: 'select',
      options: ['primary', 'success', 'danger', 'neutral'],
      description: '顏色語意（elevated 不需指定）',
      table: { defaultValue: { summary: 'primary' } },
    },
    size: {
      control: 'select',
      options: ['XXS', 'XS', 'S', 'M', 'L'],
      description: '尺寸：XXS=17px / XS=24px / S=28px / M=32px / L=40px',
      table: { defaultValue: { summary: 'M' } },
    },
    text: {
      control: 'text',
      description: '按鈕文字',
    },
    leftIcon: {
      control: 'select',
      options: iconNames,
      description: 'icon registry 名稱（左側），空字串 = 不顯示',
    },
    rightIcon: {
      control: 'select',
      options: iconNames,
      description: 'icon registry 名稱（右側），空字串 = 不顯示',
    },
    leftLabel: {
      control: 'object',
      description: 'leftIcon 之後的 app-label（null = 隱藏）。格式：{ text, color, size? }',
    },
    centerLabel: {
      control: 'object',
      description: 'leftLabel 之後的第二個 app-label（null = 隱藏）',
    },
    rightLabel: {
      control: 'object',
      description: '文字之後的 app-label（null = 隱藏）。格式：{ text, color, size? }',
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    fullWidth: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    btnClick: { action: 'btnClick' },
  },
};

export default meta;
type Story = StoryObj<ButtonComponent>;

// ── 預設 ────────────────────────────────────────────
export const Default: Story = {
  args: {
    variant: 'filled',
    color: 'primary',
    size: 'M',
    text: '確認',
    disabled: false,
    fullWidth: false,
  },
};

// ── Variants × primary ───────────────────────────────
export const FilledPrimary: Story = {
  args: { variant: 'filled', color: 'primary', size: 'M', text: '實心藍' },
};

export const TonalPrimary: Story = {
  args: { variant: 'tonal', color: 'primary', size: 'M', text: '漸層藍' },
};

export const TonalNeutral: Story = {
  args: { variant: 'tonal', color: 'neutral', size: 'S', text: '同上方地址' },
};

export const OutlinedPrimary: Story = {
  args: { variant: 'outlined', color: 'primary', size: 'M', text: '外框藍' },
};

export const GhostPrimary: Story = {
  args: { variant: 'ghost', color: 'primary', size: 'M', text: '透明藍' },
};

export const Elevated: Story = {
  args: { variant: 'elevated', size: 'M', text: '浮起' },
};

// ── Color Semantics ──────────────────────────────────
export const FilledSuccess: Story = {
  args: { variant: 'filled', color: 'success', size: 'M', text: '成功 / 確認' },
};

export const FilledDanger: Story = {
  args: { variant: 'filled', color: 'danger', size: 'M', text: '危險 / 刪除' },
};

export const FilledNeutral: Story = {
  args: { variant: 'filled', color: 'neutral', size: 'M', text: '次要操作' },
};

// ── Sizes ────────────────────────────────────────────
export const AllSizes: Story = {
  render: () => ({
    template: `
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <app-button variant="filled" color="primary" size="XXS" text="XXS 17px"></app-button>
        <app-button variant="filled" color="primary" size="XS"  text="XS 24px"></app-button>
        <app-button variant="filled" color="primary" size="S"   text="S 28px"></app-button>
        <app-button variant="filled" color="primary" size="M"   text="M 32px"></app-button>
        <app-button variant="filled" color="primary" size="L"   text="L 40px"></app-button>
      </div>
    `,
    moduleMetadata: { imports: [ButtonComponent] },
  }),
};

// ── With Icons ───────────────────────────────────────
export const WithLeftIcon: Story = {
  args: {
    variant: 'filled', color: 'primary', size: 'M',
    text: '新增項目', leftIcon: 'Plus',
  },
};

export const WithRightIcon: Story = {
  args: {
    variant: 'outlined', color: 'primary', size: 'M',
    text: '展開', rightIcon: 'DownArrow',
  },
};

export const WithBothIcons: Story = {
  args: {
    variant: 'tonal', color: 'primary', size: 'M',
    text: '篩選', leftIcon: 'Filter', rightIcon: 'DownArrow',
  },
};

// ── With Labels ──────────────────────────────────────
export const WithLeftLabel: Story = {
  args: {
    variant: 'outlined', color: 'primary', size: 'M',
    leftIcon: 'Filter', text: '篩選',
    leftLabel: { text: '3', color: 'SoftBlue' } satisfies BtnLabelConfig,
  },
};

export const WithRightLabel: Story = {
  args: {
    variant: 'tonal', color: 'primary', size: 'M',
    text: '儲存',
    rightLabel: { text: '⌘S', color: 'GreyOutline' } satisfies BtnLabelConfig,
  },
};

export const WithAllLabels: Story = {
  args: {
    variant: 'outlined', color: 'primary', size: 'M',
    leftIcon: 'Briefcase',
    leftLabel:   { text: 'NEW',  color: 'Red'      } satisfies BtnLabelConfig,
    centerLabel: { text: '5',    color: 'SoftBlue'  } satisfies BtnLabelConfig,
    text: '我的項目',
    rightLabel:  { text: '全部', color: 'GreyOutline' } satisfies BtnLabelConfig,
  },
};

// ── States ───────────────────────────────────────────
export const Disabled: Story = {
  args: {
    variant: 'filled', color: 'primary', size: 'M',
    text: '不可操作', disabled: true,
  },
};

export const FullWidth: Story = {
  args: {
    variant: 'filled', color: 'primary', size: 'M',
    text: '撐滿父容器', fullWidth: true,
  },
  decorators: [
    (storyFn) => ({
      ...storyFn(),
      template: `<div style="width:320px;">${(storyFn() as any).template}</div>`,
    }),
  ],
};
