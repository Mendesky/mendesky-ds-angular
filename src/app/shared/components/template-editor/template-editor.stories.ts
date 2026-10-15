import { componentWrapperDecorator } from '@storybook/angular';
import type { Meta, StoryObj } from '@storybook/angular';
import { TemplateEditorComponent, TemplateVarDef } from '../../../../index';

// 範例內容一律取自 dashboard-app 主線（Github/main）的實際用法與 spec fixture，不自行編寫：
// - 範本字串、placeholder、minRows：
//     src/app/features/quoting-cases/components/case-edit-modal/pages/p5-letter/p5-letter.component.{ts,html}
//     （LETTER_CONTENT_TEMPLATE、CONSENT_SUBJECT_TEMPLATE、信件 To 的 %DefaultToName%）
//     p4-6-notes.component.html（備註：placeholder「請輸入備註內容」、minRows 3）
// - 變數定義（key / label / group）：src/app/features/quoting-cases/models/p4-contract.model.ts 的 GLOBAL_TEMPLATE_VAR_DEFS
// - 變數值：p5-letter.component.spec.ts（DefaultToName）、template-variable-node.spec.ts（DefaultFromName）、
//     template-text.util.spec.ts（QuotingCaseName）、template-var-context.spec.ts（ServiceItemNames）
// - 可切換版本的變數（AccountingPeriod）：本元件 template-editor.component.spec.ts 的 glance fixture
// - 錯誤訊息「此為必填欄位」：p5-letter / p4-6-notes 的 fieldError / getNoteError

const LETTER_CONTENT_TEMPLATE =
  '茲將附上 %QuotingCaseName% %ServiceItemNames% 之專業服務公費報價單。\n' +
  '我們希望以最專業多元的服務與 貴公司長久配合，公費內容若經確認，煩請將最後一頁同意函簽章並回傳至敝事務所，謝謝您的合作。';

const CONSENT_SUBJECT_TEMPLATE =
  '本公司同意委託 貴事務所執行本公司有關 %ServiceItemNames% 之專業報價項目及公費，請查照。';

/** GLOBAL_TEMPLATE_VAR_DEFS 中「基本資訊」群組的四個變數 */
const BASIC_VAR_DEFS: TemplateVarDef[] = [
  { key: 'DefaultFromName', label: '預設信件寄件者', group: 'basic' },
  { key: 'QuotingCaseName', label: '案件名稱', group: 'basic' },
  { key: 'DefaultToName', label: '預設信件收件者', group: 'basic' },
  { key: 'ServiceItemNames', label: '報價服務', group: 'basic' },
];

const BASIC_VARIABLES: Record<string, string> = {
  DefaultFromName: '嘉威聯合會計師事務所',
  QuotingCaseName: '中華大雄股份有限公司',
  DefaultToName: '嘉威股份有限公司',
  ServiceItemNames: '記帳、稅簽',
};

/** 可切換版本的變數（glance）：選項 value 是變體 key，選擇結果寫回範本字串裡 */
const ACCOUNTING_PERIOD_DEF: TemplateVarDef = {
  key: 'AccountingPeriod',
  label: '記帳收費說明',
  group: 'accounting',
  options: [
    { label: '系統依情境判斷', value: 'AccountingPeriod' },
    { label: '以全年計算', value: 'AccountingPeriod|1' },
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
    varContexts: { control: false, description: '集團案件的公司／方案清單，範例不示範' },
    defaultCaseId: { control: false, description: '變數面板預設公司，範例不示範' },
    defaultBundleId: { control: false, description: '變數面板預設方案，範例不示範' },
    templateChange: { action: 'templateChange', description: '編輯後 emit 帶 %key% 的範本字串' },
    textChange: { action: 'textChange', description: '編輯後 emit 純文字' },
    blurChange: { action: 'blurChange', description: '失焦時 emit 目前的範本字串' },
    optionSelect: { action: 'optionSelect', description: '下拉 chip 切換選項後 emit { key, value }' },
    contextChange: { action: 'contextChange', description: '變數面板切換公司／方案時 emit' },
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

// ── 主範例：P5 信件內容（多變數混合範本）─────────────────────────
export const Default: Story = {
  name: '預設（信件內容）',
};

// ── 單行：信件收件人 ─────────────────────────────────────────────
export const SingleLine: Story = {
  name: '單行（信件收件人）',
  args: {
    template: '%DefaultToName%',
    minRows: 1,
    placeholder: '請輸入公司名稱',
  },
};

// ── 可切換版本的變數（下拉 chip）──────────────────────────────────
// 元件只 emit optionSelect，不自己換字；由父層把範本裡的 %Key% 換成選到的變體 key 再傳回來
// （與 dashboard-app p5-letter 的做法相同）。
export const SelectChip: Story = {
  name: '可切換版本的變數（下拉 chip）',
  args: {
    template: '記帳公費%AccountingPeriod%。',
    variables: { AccountingPeriod: '一年以十四個月計算', 'AccountingPeriod|1': '以全年計算' },
    variableDefs: [ACCOUNTING_PERIOD_DEF],
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
    template: CONSENT_SUBJECT_TEMPLATE,
    minRows: 3,
    placeholder: '請輸入同意函主旨',
    disabled: true,
  },
};
