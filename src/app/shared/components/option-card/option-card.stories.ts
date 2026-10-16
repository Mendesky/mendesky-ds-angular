import type { Meta, StoryObj } from '@storybook/angular';
import { OptionCardComponent } from '../../../../index';

// 中性的插圖佔位。實際插圖由使用端傳入 120×120 的 SVG 字串
// （各產品的插圖通常很大，不搬進 DS）。
const PLACEHOLDER_ILLUSTRATION = `<svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="24" y="30" width="72" height="60" rx="6" fill="#d6ebf5" stroke="#3a9ccd" stroke-width="2"/>
  <circle cx="46" cy="50" r="7" fill="#3a9ccd"/>
  <path d="M30 84 L52 62 L66 74 L76 66 L90 84 Z" fill="#3a9ccd"/>
</svg>`;

const CARD_WIDTH = 'width:160px;';

const meta: Meta<OptionCardComponent> = {
  title: '表單元件/Option Card',
  id: 'option-card',
  component: OptionCardComponent,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: '此卡代表的值（選取時由 group emit，也組成 data-testid）',
    },
    label: {
      control: 'text',
      description: '卡片主標題',
    },
    description: {
      control: 'text',
      description: 'hover 時淡入取代插圖的說明文字；空字串則不渲染說明區、hover 不做 crossfade',
      table: { defaultValue: { summary: "''" } },
    },
    illustration: {
      control: false,
      description: '120×120 inline SVG 字串，元件內 sanitize 後以 innerHTML 注入',
    },
    selected: {
      control: 'boolean',
      description: '選中態（填色 + check 角標）',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: '停用態（灰階 + not-allowed，不可選取）',
      table: { defaultValue: { summary: 'false' } },
    },
    cardSelect: { action: 'cardSelect' },
  },
};

export default meta;
type Story = StoryObj<OptionCardComponent>;

// ── 主範例：可用 Controls 調整文字與狀態；滑過卡片可看說明 ──────
export const Default: Story = {
  name: '預設',
  args: {
    value: '卡片',
    label: '卡片',
    description: '卡片式排列\n適合看圖辨識',
    illustration: PLACEHOLDER_ILLUSTRATION,
    selected: false,
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CARD_WIDTH}">
        <app-option-card
          [value]="value"
          [label]="label"
          [description]="description"
          [illustration]="illustration"
          [selected]="selected"
          [disabled]="disabled"
          (cardSelect)="cardSelect($event)">
        </app-option-card>
      </div>
    `,
    moduleMetadata: { imports: [OptionCardComponent] },
  }),
};

// ── 一般／選中／停用 ───────────────────────────────────────
export const AllStates: Story = {
  name: '所有狀態',
  render: () => ({
    props: { illus: PLACEHOLDER_ILLUSTRATION },
    template: `
      <div style="display:grid;grid-template-columns:repeat(3,160px);gap:10px;">
        <div>
          <app-option-card value="清單" label="清單" [description]="'逐列顯示\\n適合大量資料'" [illustration]="illus"></app-option-card>
          <div style="font-size:11px;color:#686868;margin-top:6px;text-align:center;">一般（滑過看說明）</div>
        </div>
        <div>
          <app-option-card value="卡片" label="卡片" [description]="'卡片式排列\\n適合看圖辨識'" [illustration]="illus" [selected]="true"></app-option-card>
          <div style="font-size:11px;color:#686868;margin-top:6px;text-align:center;">選中</div>
        </div>
        <div>
          <app-option-card value="看板" label="看板" [description]="'依狀態分欄\\n可拖曳調整順序'" [illustration]="illus" [disabled]="true"></app-option-card>
          <div style="font-size:11px;color:#686868;margin-top:6px;text-align:center;">停用（插圖灰階）</div>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [OptionCardComponent] },
  }),
};

// ── 沒有說明：hover 只浮起，不切換插圖 ─────────────────────────
export const WithoutDescription: Story = {
  name: '沒有說明',
  args: {
    value: '時間軸',
    label: '時間軸',
    description: '',
    illustration: PLACEHOLDER_ILLUSTRATION,
    selected: false,
    disabled: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${CARD_WIDTH}">
        <app-option-card
          [value]="value"
          [label]="label"
          [description]="description"
          [illustration]="illustration"
          [selected]="selected"
          [disabled]="disabled"
          (cardSelect)="cardSelect($event)">
        </app-option-card>
      </div>
    `,
    moduleMetadata: { imports: [OptionCardComponent] },
  }),
};
