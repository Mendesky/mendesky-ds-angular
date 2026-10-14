import type { Meta, StoryObj } from '@storybook/angular';
import { OptionCardGroupComponent, OptionCardItem } from '../../../../index';

// 中性的插圖佔位。實際插圖由使用端傳入 120×120 的 SVG 字串
// （dashboard-app 的帳務類型／設立現況插圖很大，不搬進 DS）。
const PLACEHOLDER_ILLUSTRATION = `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="24" y="30" width="72" height="60" rx="6" fill="#d6ebf5" stroke="#3a9ccd" stroke-width="2"/>
  <circle cx="46" cy="50" r="7" fill="#3a9ccd"/>
  <path d="M30 84 L52 62 L66 74 L76 66 L90 84 Z" fill="#3a9ccd"/>
</svg>`;

// 帳務類型：取自 dashboard-app models/account-type.model.ts 的 ACCOUNT_TYPE_CARDS
const ACCOUNT_TYPE_OPTIONS: OptionCardItem[] = [
  { value: '純簽證', label: '純簽證', description: '無記帳服務\n會計師簽證', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: '稅務帳', label: '稅務帳', description: '稅務帳\n會計師簽證', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: '管理帳', label: '管理帳', description: '客戶內部使用\n，金流及管理性報表等內容', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: '財務帳', label: '財務帳', description: '金流一套帳\n，包括稅務及財務用途', illustration: PLACEHOLDER_ILLUSTRATION },
];

// 客戶設立現況：value／說明取自 dashboard-app models/establishment-status.svgs.ts 的 ESTABLISHMENT_STATUS_CARDS，
// 標籤取自 config/case-type.config.ts 的 CASE_TYPE_LABELS
const ESTABLISHMENT_OPTIONS: OptionCardItem[] = [
  { value: 'established', label: '已設立', description: '客戶已完成公司設立、已有統一編號', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: 'establishing', label: '設立中', description: '客戶正在跑工商設立流程，尚未取得統編', illustration: PLACEHOLDER_ILLUSTRATION },
  { value: 'unestablished', label: '新設立', description: '客戶尚未設立，需辦理工商登記等處理作業', illustration: PLACEHOLDER_ILLUSTRATION },
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

// ── 主範例：帳務類型（4 張）。點卡片或用方向鍵切換；父層把 valueChange 寫回 value ──
export const Default: Story = {
  name: '預設',
  args: {
    options: ACCOUNT_TYPE_OPTIONS,
    value: '稅務帳',
    ariaLabel: '帳務類型',
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

// ── 客戶設立現況（3 張） ─────────────────────────────────────
export const Establishment: Story = {
  name: '客戶設立現況（3 張）',
  render: () => ({
    props: { options: ESTABLISHMENT_OPTIONS, value: null as string | null },
    template: `
      <div style="max-width:520px;">
        <app-option-card-group
          ariaLabel="客戶設立現況"
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

// ── 部分停用：境外公司只能選純簽證／財務帳（dashboard-app OFFSHORE_ALLOWED_ACCOUNT_TYPES） ──
export const WithDisabledValues: Story = {
  name: '部分停用',
  render: () => ({
    props: {
      options: ACCOUNT_TYPE_OPTIONS,
      value: '純簽證',
      disabledValues: ['稅務帳', '管理帳'],
    },
    template: `
      <div style="max-width:680px;">
        <app-option-card-group
          ariaLabel="帳務類型"
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
