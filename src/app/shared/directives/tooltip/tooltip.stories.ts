import type { Meta, StoryObj } from '@storybook/angular';
import { IconComponent, TooltipDirective } from '../../../../index';
import { tooltipDirectiveDoc } from './tooltip.docs';

// 範例文字來源：
// - 「編輯報價案件」：dashboard-app 主線 case-view-modal（appTooltipDirection="bottom"）
// - 「回報問題」：dashboard-app 主線 header 的回報問題鈕（appTooltipDirection="left"）
// - 「此欄位為必填」：tooltip.docs.ts 的警告樣式範例
// - 截斷與長檔名：tooltip.directive.spec.ts 的 fixture
// - grey 樣式在主線用於「欄位停用原因」，原因文字由資料決定，這裡用中性佔位文字

/** directive 沒有元件可放進 meta.component，Controls 直接對應 directive 的 @Input */
interface TooltipArgs {
  appTooltip: string;
  appTooltipDirection: 'top' | 'bottom' | 'left' | 'right';
  appTooltipStyle: 'default' | 'warning' | 'grey';
  appTooltipOnlyWhenTruncated: boolean;
  appTooltipWrap: boolean;
}

// 觸發元素：比照主線的 icon 按鈕（hover 或 Tab 聚焦後 300ms 顯示）
const TRIGGER_STYLE =
  'display:inline-flex;align-items:center;justify-content:center;width:32px;height:32px;' +
  'border:1px solid #d9d9d9;border-radius:6px;background:#fff;color:#686868;cursor:pointer;';

const IMPORTS = [TooltipDirective, IconComponent];

const meta: Meta<TooltipArgs> = {
  title: '浮層元件/Tooltip Directive (Portal)',
  id: 'tooltip-directive',
  tags: ['autodocs'],
  parameters: { dsDoc: tooltipDirectiveDoc },
  argTypes: {
    appTooltip: {
      control: 'text',
      description: 'tooltip 顯示文字，空字串時不顯示',
    },
    appTooltipDirection: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: '顯示方向（溢出時自動翻轉）',
      table: { defaultValue: { summary: "'top'" } },
    },
    appTooltipStyle: {
      control: 'inline-radio',
      options: ['default', 'warning', 'grey'],
      description: '外觀主題',
      table: { defaultValue: { summary: "'default'" } },
    },
    appTooltipOnlyWhenTruncated: {
      control: 'boolean',
      description: '只在 host 文字真的被截斷時顯示（host 自己負責 ellipsis）',
      table: { defaultValue: { summary: 'false' } },
    },
    appTooltipWrap: {
      control: 'boolean',
      description: '長文字換行：tooltip 文字最寬 520px',
      table: { defaultValue: { summary: 'false' } },
    },
  },
};

export default meta;
type Story = StoryObj<TooltipArgs>;

// ── 主範例：滑鼠移到按鈕上（或 Tab 聚焦）看 tooltip ─────────────
export const Default: Story = {
  name: '基本用法',
  args: {
    appTooltip: '編輯報價案件',
    appTooltipDirection: 'bottom',
    appTooltipStyle: 'default',
    appTooltipOnlyWhenTruncated: false,
    appTooltipWrap: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;justify-content:center;padding:56px 24px;">
        <button
          type="button"
          aria-label="編輯報價案件"
          style="${TRIGGER_STYLE}"
          [appTooltip]="appTooltip"
          [appTooltipDirection]="appTooltipDirection"
          [appTooltipStyle]="appTooltipStyle"
          [appTooltipOnlyWhenTruncated]="appTooltipOnlyWhenTruncated"
          [appTooltipWrap]="appTooltipWrap">
          <app-icon name="Edit" size="16"></app-icon>
        </button>
      </div>
    `,
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 四個方向 ─────────────────────────────────────────
export const Directions: Story = {
  name: '四個方向',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="display:flex;gap:64px;justify-content:center;flex-wrap:wrap;padding:56px 80px;">
        @for (dir of directions; track dir) {
          <div style="display:flex;flex-direction:column;align-items:center;gap:8px;">
            <button type="button" aria-label="回報問題" style="${TRIGGER_STYLE}"
              appTooltip="回報問題" [appTooltipDirection]="dir">
              <app-icon name="Info-Logs" size="16"></app-icon>
            </button>
            <span style="font-size:12px;color:#888;">{{ dir }}</span>
          </div>
        }
      </div>
    `,
    props: { directions: ['top', 'bottom', 'left', 'right'] },
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 三種外觀 ─────────────────────────────────────────
export const Styles: Story = {
  name: '三種外觀',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="display:flex;gap:48px;justify-content:center;flex-wrap:wrap;padding:56px 24px;font-size:14px;color:#3e3e3e;">
        <span tabindex="0" appTooltip="編輯報價案件" appTooltipStyle="default">default</span>
        <span tabindex="0" appTooltip="此欄位為必填" appTooltipStyle="warning">warning</span>
        <span tabindex="0" appTooltip="提示文字" appTooltipStyle="grey">grey</span>
      </div>
    `,
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 只在文字被截斷時顯示 ───────────────────────────────
export const OnlyWhenTruncated: Story = {
  name: '只在截斷時顯示（appTooltipOnlyWhenTruncated）',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;padding:48px 24px;font-size:14px;color:#3e3e3e;">
        <div>
          <div style="font-size:12px;color:#888;margin-bottom:4px;">寬度不足、文字被截斷 → hover 顯示全文</div>
          <span style="display:block;width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            [appTooltip]="text" [appTooltipOnlyWhenTruncated]="true">{{ text }}</span>
        </div>
        <div>
          <div style="font-size:12px;color:#888;margin-bottom:4px;">寬度足夠、全文已在畫面上 → 不顯示</div>
          <span style="display:block;width:480px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;"
            [appTooltip]="text" [appTooltipOnlyWhenTruncated]="true">{{ text }}</span>
        </div>
      </div>
    `,
    props: { text: '一段會被截斷的很長很長很長很長很長很長的文字' },
    moduleMetadata: { imports: IMPORTS },
  }),
};

// ── 長文字換行 ───────────────────────────────────────
export const Wrap: Story = {
  name: '長文字換行（appTooltipWrap）',
  parameters: { controls: { disable: true } },
  render: () => ({
    template: `
      <div style="display:flex;gap:48px;justify-content:center;flex-wrap:wrap;padding:120px 24px 56px;font-size:14px;color:#3e3e3e;">
        <span tabindex="0" [appTooltip]="fileName">不換行（預設）</span>
        <span tabindex="0" [appTooltip]="fileName" [appTooltipWrap]="true">換行（最寬 520px）</span>
      </div>
    `,
    props: { fileName: 'Bank_Statement_2024Q1_TWD_USD_FixedDeposit_Reconciliation_final_v3_with_bank_seal_scan.pdf' },
    moduleMetadata: { imports: IMPORTS },
  }),
};
