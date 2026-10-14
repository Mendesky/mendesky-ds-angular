import type { Meta, StoryObj } from '@storybook/angular';
import { BadgeComponent, IconBtnComponent, IconComponent } from '../../../../index';

// 徽章以 position: absolute 凸出宿主右上角，宿主必須自己是 position: relative。
// 宿主樣式比照 dashboard-app header 的 .header-icon-badge。
const HOST_STYLE = 'position:relative;display:inline-flex;align-items:center;justify-content:center;';
const CAPTION_STYLE = 'font-size:11px;color:#686868;margin-top:8px;text-align:center;';

const meta: Meta<BadgeComponent> = {
  title: '展示元件/Badge',
  id: 'badge',
  component: BadgeComponent,
  tags: ['autodocs'],
  argTypes: {
    count: {
      control: 'number',
      description: '未讀數。null 或 <= 0 不渲染（variant="dot" 除外）',
      table: { defaultValue: { summary: 'null' } },
    },
    max: {
      control: 'number',
      description: '超過這個數就走 overflow 規則',
      table: { defaultValue: { summary: '99' } },
    },
    variant: {
      control: 'select',
      options: ['auto', 'dot'],
      description: "'dot' 只表示「有未讀」，不顯示數量",
      table: { defaultValue: { summary: 'auto' } },
    },
    overflow: {
      control: 'select',
      options: ['plus', 'dot'],
      description: '超過 max 時：顯示 `99+` 或退回圓點',
      table: { defaultValue: { summary: 'plus' } },
    },
    ariaLabel: {
      control: 'text',
      description: '讀屏文字。圓點模式沒有文字，一定要給',
      table: { defaultValue: { summary: "''" } },
    },
  },
};

export default meta;
type Story = StoryObj<BadgeComponent>;

// ── 主範例：可用 Controls 調整數量、上限與退化方式 ──────────
// ariaLabel 寫法取自 dashboard-app header 通知鈴：`unreadCount() + ' 則未讀通知'`
export const Default: Story = {
  name: '預設',
  args: {
    count: 5,
    max: 99,
    variant: 'auto',
    overflow: 'plus',
    ariaLabel: '5 則未讀通知',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding:8px;">
        <span style="${HOST_STYLE}">
          <app-icon name="Alerts" size="24"></app-icon>
          <app-badge
            [count]="count"
            [max]="max"
            [variant]="variant"
            [overflow]="overflow"
            [ariaLabel]="ariaLabel">
          </app-badge>
        </span>
      </div>
    `,
    moduleMetadata: { imports: [BadgeComponent, IconComponent] },
  }),
};

// ── 圓點：只表示「有未讀」，不講數量（dashboard-app 版本更新入口） ──
export const Dot: Story = {
  name: '圓點（有未讀）',
  args: {
    variant: 'dot',
    ariaLabel: '有未讀的版本更新',
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="padding:8px;">
        <span style="${HOST_STYLE}">
          <app-icon name="Sparkle" size="24"></app-icon>
          <app-badge [variant]="variant" [ariaLabel]="ariaLabel"></app-badge>
        </span>
      </div>
    `,
    moduleMetadata: { imports: [BadgeComponent, IconComponent] },
  }),
};

// ── 數量呈現規則：邊界值取自 badge.component.spec.ts ──────────
export const CountRules: Story = {
  name: '數量與上限',
  render: () => ({
    template: `
      <div style="display:flex;gap:32px;align-items:flex-start;padding:8px;">
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="${HOST_STYLE}">
            <app-icon name="Alerts" size="24"></app-icon>
            <app-badge [count]="0"></app-badge>
          </span>
          <div style="${CAPTION_STYLE}">count=0<br/>不顯示</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="${HOST_STYLE}">
            <app-icon name="Alerts" size="24"></app-icon>
            <app-badge [count]="5"></app-badge>
          </span>
          <div style="${CAPTION_STYLE}">count=5</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="${HOST_STYLE}">
            <app-icon name="Alerts" size="24"></app-icon>
            <app-badge [count]="99"></app-badge>
          </span>
          <div style="${CAPTION_STYLE}">count=99<br/>等於上限仍顯示數字</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="${HOST_STYLE}">
            <app-icon name="Alerts" size="24"></app-icon>
            <app-badge [count]="100" overflow="plus"></app-badge>
          </span>
          <div style="${CAPTION_STYLE}">count=100<br/>overflow=plus</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="${HOST_STYLE}">
            <app-icon name="Alerts" size="24"></app-icon>
            <app-badge [count]="100" overflow="dot" ariaLabel="100 則未讀通知"></app-badge>
          </span>
          <div style="${CAPTION_STYLE}">count=100<br/>overflow=dot</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;">
          <span style="${HOST_STYLE}">
            <app-icon name="Alerts" size="24"></app-icon>
            <app-badge [count]="100" [max]="999"></app-badge>
          </span>
          <div style="${CAPTION_STYLE}">count=100<br/>max=999</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [BadgeComponent, IconComponent] },
  }),
};

// ── 疊在圖示按鈕上：比照 dashboard-app header 的通知鈴與版本更新入口 ──
export const OnIconButton: Story = {
  name: '疊在圖示按鈕上',
  render: () => ({
    template: `
      <div style="display:flex;gap:16px;align-items:center;padding:16px;">
        <app-icon-btn propClass="Normal" size="24" ariaLabel="通知" tooltip="通知" tooltipPos="Top">
          <span style="${HOST_STYLE}">
            <app-icon name="Alerts" size="24"></app-icon>
            <!-- 超過 99 退回圓點：兩位數以上的數字塞不進按鈕的角落 -->
            <app-badge [count]="5" overflow="dot" ariaLabel="5 則未讀通知"></app-badge>
          </span>
        </app-icon-btn>
        <app-icon-btn propClass="Normal" size="24" ariaLabel="版本更新" tooltip="版本更新" tooltipPos="Top">
          <span style="${HOST_STYLE}">
            <app-icon name="Sparkle" size="24"></app-icon>
            <app-badge variant="dot" ariaLabel="有未讀的版本更新"></app-badge>
          </span>
        </app-icon-btn>
      </div>
    `,
    moduleMetadata: { imports: [BadgeComponent, IconBtnComponent, IconComponent] },
  }),
};
