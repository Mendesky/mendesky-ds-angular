import type { Meta, StoryObj } from '@storybook/angular';
import { IconBtnComponent, IconComponent } from '../../../../index';

const meta: Meta<IconBtnComponent> = {
  title: '互動元件/Icon Button',
  id: 'icon-btn',
  component: IconBtnComponent,
  tags: ['autodocs'],
  argTypes: {
    propClass: {
      control: 'select',
      options: [
        'Normal', 'Warning', 'CardBtn', 'CardBtnPdSmall',
        'Modal', 'SectionBtn', 'Drag', 'Block', 'Block-Transparent',
      ],
      description: '按鈕外觀類型',
      table: { defaultValue: { summary: 'Normal' } },
    },
    size: {
      control: 'select',
      options: ['16-', '16', '24', '32', '36', '48'],
      description: 'Icon 尺寸',
      table: { defaultValue: { summary: '24' } },
    },
    active: {
      control: 'boolean',
      description: '啟用（綠底）狀態',
      table: { defaultValue: { summary: 'false' } },
    },
    toggle: {
      control: 'boolean',
      description: '切換按鈕模式；啟用後輸出 aria-pressed（隨 active 同步）',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { defaultValue: { summary: 'false' } },
    },
    tooltip: {
      control: 'text',
      description: 'Tooltip 文字（空字串則不顯示）',
    },
    tooltipPos: {
      control: 'select',
      options: ['Down', 'Top', 'Left', 'Right'],
      description: 'Tooltip 箭頭方向（Down = tooltip 在上方）',
      table: { defaultValue: { summary: 'Down' } },
    },
    ariaLabel: {
      control: 'text',
      description: '無障礙標籤',
    },
    btnClick: { action: 'btnClick' },
  },
};

export default meta;
type Story = StoryObj<IconBtnComponent>;

// ── 預設 ────────────────────────────────────────────
export const Default: Story = {
  args: {
    propClass: 'Normal',
    size: '24',
    active: false,
    disabled: false,
    tooltip: '更多操作',
    tooltipPos: 'Down',
    ariaLabel: '更多操作',
  },
  render: (args) => ({
    props: args,
    template: `
      <app-icon-btn
        [propClass]="propClass"
        [size]="size"
        [active]="active"
        [disabled]="disabled"
        [tooltip]="tooltip"
        [tooltipPos]="tooltipPos"
        [ariaLabel]="ariaLabel"
        (btnClick)="btnClick($event)">
        <app-icon name="More" [size]="size === '16-' ? '16' : size"></app-icon>
      </app-icon-btn>
    `,
    moduleMetadata: { imports: [IconBtnComponent, IconComponent] },
  }),
};

// ── 所有外觀類型 ─────────────────────────────────────
export const AllPropClasses: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:12px;flex-wrap:wrap;align-items:center;padding:16px;background:#f8f9fa;">
        <div style="text-align:center;">
          <app-icon-btn propClass="Normal" size="24" tooltip="Normal">
            <app-icon name="More" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">Normal</div>
        </div>
        <div style="text-align:center;">
          <app-icon-btn propClass="Warning" size="24" tooltip="Warning（危險）">
            <app-icon name="Trash" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">Warning</div>
        </div>
        <div style="text-align:center;">
          <app-icon-btn propClass="CardBtn" size="24" tooltip="CardBtn">
            <app-icon name="More" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">CardBtn</div>
        </div>
        <div style="text-align:center;">
          <app-icon-btn propClass="SectionBtn" size="24" tooltip="SectionBtn">
            <app-icon name="Plus" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">SectionBtn</div>
        </div>
        <div style="text-align:center;background:#1c1c2e;padding:8px;border-radius:6px;">
          <app-icon-btn propClass="Modal" size="24" tooltip="Modal（深色背景）">
            <app-icon name="No-X-Cancel" size="24" style="color:white"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#939393;margin-top:4px;">Modal</div>
        </div>
        <div style="text-align:center;">
          <app-icon-btn propClass="Block" size="24" tooltip="Block">
            <app-icon name="Filter" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">Block</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [IconBtnComponent, IconComponent] },
  }),
};

// ── Active 狀態 ──────────────────────────────────────
export const ActiveState: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center;">
        <div style="text-align:center;">
          <app-icon-btn propClass="Normal" size="24" [active]="false">
            <app-icon name="Table" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">inactive</div>
        </div>
        <div style="text-align:center;">
          <app-icon-btn propClass="Normal" size="24" [active]="true">
            <app-icon name="Table" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">active（綠底）</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [IconBtnComponent, IconComponent] },
  }),
};

// ── Toggle 模式（aria-pressed） ──────────────────────
export const ToggleMode: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center;padding:16px;">
        <div style="text-align:center;">
          <app-icon-btn propClass="SectionBtn" size="16" [toggle]="true" [active]="false" ariaLabel="粗體" tooltip="粗體">
            <app-icon name="Bold" size="16"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">off<br/>aria-pressed="false"</div>
        </div>
        <div style="text-align:center;">
          <app-icon-btn propClass="SectionBtn" size="16" [toggle]="true" [active]="true" ariaLabel="粗體" tooltip="粗體">
            <app-icon name="Bold" size="16"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">on<br/>aria-pressed="true"</div>
        </div>
        <div style="text-align:center;">
          <app-icon-btn propClass="Normal" size="24" [toggle]="false" [active]="false" ariaLabel="更多">
            <app-icon name="More" size="24"></app-icon>
          </app-icon-btn>
          <div style="font-size:11px;color:#686868;margin-top:4px;">非 toggle<br/>無 aria-pressed</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [IconBtnComponent, IconComponent] },
  }),
};

// ── Tooltip 位置 ─────────────────────────────────────
export const TooltipPositions: Story = {
  render: () => ({
    template: `
      <div style="display:flex;gap:48px;align-items:center;padding:40px;">
        <app-icon-btn propClass="Normal" size="24" tooltip="在上方（Down）" tooltipPos="Down">
          <app-icon name="Search" size="24"></app-icon>
        </app-icon-btn>
        <app-icon-btn propClass="Normal" size="24" tooltip="在下方（Top）" tooltipPos="Top">
          <app-icon name="Search" size="24"></app-icon>
        </app-icon-btn>
        <app-icon-btn propClass="Normal" size="24" tooltip="在左方（Right）" tooltipPos="Right">
          <app-icon name="Search" size="24"></app-icon>
        </app-icon-btn>
        <app-icon-btn propClass="Normal" size="24" tooltip="在右方（Left）" tooltipPos="Left">
          <app-icon name="Search" size="24"></app-icon>
        </app-icon-btn>
      </div>
    `,
    moduleMetadata: { imports: [IconBtnComponent, IconComponent] },
  }),
};
