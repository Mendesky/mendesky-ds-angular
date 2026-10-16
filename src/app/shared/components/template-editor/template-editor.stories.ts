import { componentWrapperDecorator } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { TemplateEditorComponent, TemplateVarDef } from '../../../../index';

// 範例內容是通用的示意資料，不代表任何使用端產品的實際欄位。

const LETTER_CONTENT_TEMPLATE =
  '附上 %DocumentTitle% 的 %ItemNames% 清單，請參考。\n' +
  '若內容沒有問題，請回覆確認，謝謝。';

const NOTICE_SUBJECT_TEMPLATE =
  '%RecipientName% 您好：關於 %ItemNames% 的安排，請查照。';

/** 「基本資訊」分組的四個變數 */
const BASIC_VAR_DEFS: TemplateVarDef[] = [
  { key: 'SenderName', label: '寄件者', group: 'basic' },
  { key: 'DocumentTitle', label: '文件標題', group: 'basic' },
  { key: 'RecipientName', label: '收件者', group: 'basic' },
  { key: 'ItemNames', label: '項目清單', group: 'basic' },
];

const BASIC_VARIABLES: Record<string, string> = {
  SenderName: '範例團隊',
  DocumentTitle: '年度活動企劃',
  RecipientName: '王小明',
  ItemNames: '場地、餐飲',
};

/** 可切換版本的變數（glance）：選項 value 是變體 key，選擇結果寫回範本字串裡 */
const PERIOD_NOTE_DEF: TemplateVarDef = {
  key: 'PeriodNote',
  label: '期間說明',
  group: 'detail',
  options: [
    { label: '系統依情境判斷', value: 'PeriodNote' },
    { label: '以全年計算', value: 'PeriodNote|1' },
  ],
};

const meta: Meta<TemplateEditorComponent> = {
  title: '表單元件/Template Editor',
  id: 'template-editor',
  component: TemplateEditorComponent,
  tags: ['autodocs'],
  argTypes: {
    template: {
      control: 'text',
      description: '範本字串，含 %key% 標記',
      table: { defaultValue: { summary: "''" } },
    },
    variables: {
      control: 'object',
      description: '變數 map：key 對應 %key%，值為 badge 顯示文字',
      table: { defaultValue: { summary: '{}' } },
    },
    variableDefs: {
      control: 'object',
      description: '變數定義；有值的變數會出現在 ⓘ 面板，有 options 的渲染成可下拉切換的 chip',
      table: { defaultValue: { summary: '[]' } },
    },
    minRows: {
      control: { type: 'number', min: 1 },
      description: '最小顯示行數（1 ≈ input 高度，4–5 ≈ textarea 高度）',
      table: { defaultValue: { summary: '2' } },
    },
    placeholder: {
      control: 'text',
      description: '空白時顯示的佔位文字',
      table: { defaultValue: { summary: "''" } },
    },
    errorMessage: {
      control: 'text',
      description: '有值時切換為錯誤狀態',
      table: { defaultValue: { summary: "''" } },
    },
    disabled: {
      control: 'boolean',
      description: '禁用狀態',
      table: { defaultValue: { summary: 'false' } },
    },
    varContexts: { control: false, description: '變數面板的兩層 context 清單，範例不示範' },
    defaultContextId: { control: false, description: '變數面板預設 context，範例不示範' },
    defaultOptionId: { control: false, description: '變數面板預設 option，範例不示範' },
    templateChange: { action: 'templateChange', description: '編輯後 emit 帶 %key% 的範本字串' },
    textChange: { action: 'textChange', description: '編輯後 emit 純文字' },
    blurChange: { action: 'blurChange', description: '失焦時 emit 目前的範本字串' },
    optionSelect: { action: 'optionSelect', description: '下拉 chip 切換選項後 emit { key, value }' },
    contextChange: { action: 'contextChange', description: '變數面板切換 context／option 時 emit' },
  },
  args: {
    template: LETTER_CONTENT_TEMPLATE,
    variables: BASIC_VARIABLES,
    variableDefs: BASIC_VAR_DEFS,
    minRows: 5,
    placeholder: '請輸入信件內容',
    errorMessage: '',
    disabled: false,
  },
  decorators: [componentWrapperDecorator((story) => `<div style="max-width:560px;">${story}</div>`)],
};

export default meta;
type Story = StoryObj<TemplateEditorComponent>;

// ── 主範例：信件內容（多變數混合範本）───────────────────────────
export const Default: Story = {
  name: '預設（信件內容）',
};

// ── 單行：信件收件人 ─────────────────────────────────────────────
export const SingleLine: Story = {
  name: '單行（信件收件人）',
  args: {
    template: '%RecipientName%',
    minRows: 1,
    placeholder: '請輸入收件者',
  },
};

// ── 可切換版本的變數（下拉 chip）──────────────────────────────────
// 元件只 emit optionSelect，不自己換字；由父層把範本裡的 %Key% 換成選到的變體 key 再傳回來
export const SelectChip: Story = {
  name: '可切換版本的變數（下拉 chip）',
  args: {
    template: '費用%PeriodNote%。',
    variables: { PeriodNote: '以實際使用月份計算', 'PeriodNote|1': '以全年計算' },
    variableDefs: [PERIOD_NOTE_DEF],
    minRows: 1,
    placeholder: '',
  },
  render: (args) => ({
    props: {
      ...args,
      onOptionSelect(this: { template: string }, e: { key: string; value: string }) {
        this.template = this.template.replace(`%${e.key}%`, `%${e.value}%`);
      },
    },
    template: `
      <app-template-editor
        [template]="template"
        [variables]="variables"
        [variableDefs]="variableDefs"
        [minRows]="minRows"
        (templateChange)="template = $event; templateChange($event)"
        (optionSelect)="onOptionSelect($event); optionSelect($event)">
      </app-template-editor>
      <p class="noto-12-regular" style="color:#686868;margin-top:8px;">目前範本字串：{{ template }}</p>
    `,
    moduleMetadata: { imports: [TemplateEditorComponent] },
  }),
};

// ── 錯誤狀態：必填未填 ───────────────────────────────────────────
export const ErrorState: Story = {
  name: '錯誤狀態（必填未填）',
  args: {
    template: '',
    minRows: 3,
    placeholder: '請輸入備註內容',
    errorMessage: '此為必填欄位',
  },
};

// ── 停用：信件資料載入中 ─────────────────────────────────────────
export const Disabled: Story = {
  name: '停用（信件載入中）',
  args: {
    template: NOTICE_SUBJECT_TEMPLATE,
    minRows: 3,
    placeholder: '請輸入主旨',
    disabled: true,
  },
};
