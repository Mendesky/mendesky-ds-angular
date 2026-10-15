import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { InlineConfirmComponent, ButtonComponent } from '../../../../index';

const meta: Meta<InlineConfirmComponent> = {
  title: '互動元件/Inline Confirm',
  id: 'inline-confirm',
  component: InlineConfirmComponent,
  tags: ['autodocs'],
  decorators: [
    moduleMetadata({
      imports: [FormsModule, InlineConfirmComponent, ButtonComponent],
    }),
  ],
  argTypes: {
    label: {
      description: '前提聲明主訴（必填）',
      control: { type: 'text' },
    },
    description: {
      description: '補充說明（選填）',
      control: { type: 'text' },
    },
    checkLabel: {
      description: '勾選項文案（必填，宣告句式）',
      control: { type: 'text' },
    },
    requirement: {
      description:
        'required = 父層主按鈕依賴簽名；optional = 複核式，主按鈕常 enabled，元件額外渲染「（選填）」',
      control: { type: 'select' },
      options: ['required', 'optional'],
    },
  },
  args: {
    label: '請確認事務所已承接客戶帳務帳',
    checkLabel: '我已確認承接客戶帳務帳',
    requirement: 'required',
  },
};

export default meta;
type Story = StoryObj<InlineConfirmComponent>;

export const RequiredPremise: Story = {
  name: 'Required — 開管理帳前確認（阻塞主按鈕）',
  render: () => ({
    template: `
      <div style="padding:16px; max-width:520px; display:flex; flex-direction:column; gap:16px;">
        <app-inline-confirm
          requirement="required"
          label="請確認事務所已承接客戶帳務帳，否則無法開立管理帳。"
          description="管理帳一旦開立，後續的稅務申報與核對流程將以此為依據。"
          checkLabel="我已確認承接客戶帳務帳"
          [(confirmed)]="accounted">
        </app-inline-confirm>
        <div style="display:flex; gap:8px;">
          <app-button text="下一步" [disabled]="!accounted"></app-button>
        </div>
        <p style="font-size:12px;color:#686868;margin:0;">
          confirmed = {{ accounted }}；主按鈕 disabled = {{ !accounted }}
        </p>
      </div>
    `,
    props: {
      accounted: false,
    },
  }),
};

export const OptionalReview: Story = {
  name: 'Optional — 成交前複核（主按鈕常 enabled）',
  render: () => ({
    template: `
      <div style="padding:16px; max-width:520px; display:flex; flex-direction:column; gap:16px;">
        <app-inline-confirm
          requirement="optional"
          label="成交前設定複核"
          checkLabel="我已複核以上設定"
          [(confirmed)]="reviewed">
          <ul inlineConfirmDetails style="margin:0; padding-left:20px; display:flex; flex-direction:column; gap:4px;">
            <li>報價金額：<strong>NT$ 120,000</strong></li>
            <li>連絡窗口：王小姐</li>
            <li>合約條款：標準版</li>
          </ul>
        </app-inline-confirm>
        <div style="display:flex; gap:8px;">
          <app-button text="確認成交"></app-button>
        </div>
        <p style="font-size:12px;color:#686868;margin:0;">
          confirmed = {{ reviewed }}；主按鈕永遠 enabled
        </p>
      </div>
    `,
    props: {
      reviewed: false,
    },
  }),
};

export const SideBySide: Story = {
  name: 'Required vs Optional — 視覺對照',
  render: () => ({
    template: `
      <div style="padding:16px; display:grid; grid-template-columns:1fr 1fr; gap:16px; max-width:960px;">
        <div style="display:flex; flex-direction:column; gap:8px;">
          <p style="font-size:12px;color:#686868;margin:0;">requirement="required"</p>
          <app-inline-confirm
            requirement="required"
            label="請確認已承接客戶帳務帳"
            description="未確認前無法開立管理帳。"
            checkLabel="我已確認承接客戶帳務帳"
            [(confirmed)]="a">
          </app-inline-confirm>
        </div>
        <div style="display:flex; flex-direction:column; gap:8px;">
          <p style="font-size:12px;color:#686868;margin:0;">requirement="optional"</p>
          <app-inline-confirm
            requirement="optional"
            label="成交前設定複核"
            checkLabel="我已複核以上設定"
            [(confirmed)]="b">
            <ul inlineConfirmDetails style="margin:0; padding-left:20px;">
              <li>報價 NT$ 120,000</li>
              <li>王小姐</li>
            </ul>
          </app-inline-confirm>
        </div>
      </div>
    `,
    props: {
      a: false,
      b: false,
    },
  }),
};

// 錯誤狀態：取自 mendesky-web 成交視窗（closed-deal-modal）「成交前確認」——未勾選就送出時
// [error] 打開警示框、[errorMessage] 顯示「請勾選確認後再送出」。勾選後錯誤自動消失。
export const ErrorState: Story = {
  name: '錯誤狀態（未勾選就送出）',
  render: () => ({
    template: `
      <div style="padding:48px 16px 16px; max-width:520px;">
        <app-inline-confirm
          label=""
          checkLabel="我已確認報價內容皆正確無誤"
          requirement="required"
          [error]="!confirmed"
          [errorMessage]="confirmed ? '' : '請勾選確認後再送出'"
          [(confirmed)]="confirmed">
        </app-inline-confirm>
      </div>
    `,
    props: { confirmed: false },
  }),
};

// 版面放不下時：錯誤提示改到上方（例如勾選框下方緊接著主按鈕）
export const ErrorStateTop: Story = {
  name: '錯誤狀態：提示改在上方（版面放不下時）',
  render: () => ({
    template: `
      <div style="padding:48px 16px 16px; max-width:520px;">
        <app-inline-confirm
          label=""
          checkLabel="我已確認報價內容皆正確無誤"
          requirement="required"
          errorPosition="top"
          [error]="!confirmed"
          [errorMessage]="confirmed ? '' : '請勾選確認後再送出'"
          [(confirmed)]="confirmed">
        </app-inline-confirm>
      </div>
    `,
    props: { confirmed: false },
  }),
};
