// 範例資料取自 dashboard-app 主線：src/app/features/quoting-cases/models/account-type.model.ts（ORG_TYPE_OPTIONS 組織型態、ACCOUNT_TYPE_OPTIONS 帳務類型、OFFSHORE_ALLOWED_ACCOUNT_TYPES）、
// src/app/features/quoting-cases/config/case-type.config.ts（CASE_TYPE_LABELS 客戶設立現況）、src/app/shared/data/taiwan-locations.ts（TAIWAN_CITIES 縣市）、
// placeholder／錯誤訊息見 new-case-wizard.component.html／.ts、client-edit-modal.component.html、shared/components/address-input/address-input.component.html
import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectComponent, SelectOption } from '../../../../index';

const ORG_TYPE_OPTIONS: SelectOption[] = [
  { value: '有限公司',       label: '有限公司' },
  { value: '股份有限公司',   label: '股份有限公司' },
  { value: '獨資合夥',       label: '獨資合夥（行號、企業社、工作室等）' },
  { value: '非營利事務組織', label: '非營利事務組織' },
  { value: '執行業務所得',   label: '執行業務所得' },
  { value: '境外公司',       label: '境外公司' },
];

const CASE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'established',   label: '已設立' },
  { value: 'establishing',  label: '設立中' },
  { value: 'unestablished', label: '新設立' },
];

const meta: Meta<SelectComponent> = {
  title: '表單元件/Select',
  id: 'select',
  component: SelectComponent,
  tags: ['autodocs'],
  argTypes: {
    options: {
      description: '下拉選單的選項清單，每項含 value 與 label',
      control: { type: 'object' },
    },
    placeholder: {
      description: 'Placeholder 提示文字（尚未選擇時顯示）',
      control: { type: 'text' },
      table: { defaultValue: { summary: '請選擇' } },
    },
    errorMessage: {
      description: '錯誤訊息；有值時顯示錯誤樣式',
      control: { type: 'text' },
      table: { defaultValue: { summary: '' } },
    },
  },
  args: {
    options: ORG_TYPE_OPTIONS,
    placeholder: '請選擇組織型態',
    errorMessage: '',
  },
};

export default meta;
type Story = StoryObj<SelectComponent>;

export const Default: Story = {
  name: '預設',
  args: {
    options: ORG_TYPE_OPTIONS,
    placeholder: '請選擇組織型態',
    errorMessage: '',
  },
};

export const WithError: Story = {
  name: '錯誤狀態',
  args: {
    options: ORG_TYPE_OPTIONS,
    placeholder: '請選擇組織型態',
    errorMessage: '請選擇組織型態',
  },
};

export const Interactive: Story = {
  name: '互動示範（顯示已選值）',
  render: () => ({
    template: `
      <div style="padding:16px; max-width:360px;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">
          從下拉選單選擇組織型態，選取結果將顯示於下方：
        </p>
        <app-select
          [options]="options"
          placeholder="請選擇組織型態"
          [(ngModel)]="selectedValue"
        ></app-select>
        <div style="margin-top:12px;font-size:13px;">
          <span style="color:#686868;">目前選取值：</span>
          <strong>{{ selectedValue ?? '（未選取）' }}</strong>
        </div>
        <hr style="margin:16px 0;border:none;border-top:1px solid #e7e7e7;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">客戶設立現況：</p>
        <app-select
          [options]="caseOptions"
          placeholder="請選擇客戶設立現況"
          [(ngModel)]="selectedCase"
        ></app-select>
        <div style="margin-top:12px;font-size:13px;">
          <span style="color:#686868;">目前選取值：</span>
          <strong>{{ selectedCase ?? '（未選取）' }}</strong>
        </div>
      </div>
    `,
    props: {
      options: ORG_TYPE_OPTIONS,
      caseOptions: CASE_TYPE_OPTIONS,
      selectedValue: null as string | null,
      selectedCase: null as string | null,
    },
    moduleMetadata: { imports: [SelectComponent, FormsModule, CommonModule] },
  }),
};

export const DisabledOption: Story = {
  name: '含禁用選項',
  args: {
    // 組織型態為「境外公司」時只允許 財務帳／純簽證（OFFSHORE_ALLOWED_ACCOUNT_TYPES）
    options: [
      { value: '純簽證', label: '純簽證' },
      { value: '稅務帳', label: '稅務帳', disabled: true },
      { value: '管理帳', label: '管理帳', disabled: true },
      { value: '財務帳', label: '財務帳' },
    ],
    placeholder: '請選擇帳務類型',
    errorMessage: '',
  },
};

export const ManyOptions: Story = {
  name: '多選項（可搜尋過濾，顯示 5.5 個）',
  args: {
    options: [
      '台北市', '新北市', '桃園市', '台中市', '台南市', '高雄市',
      '基隆市', '新竹市', '嘉義市', '新竹縣', '苗栗縣', '彰化縣',
      '南投縣', '雲林縣', '嘉義縣', '屏東縣', '宜蘭縣', '花蓮縣',
      '台東縣', '澎湖縣', '金門縣', '連江縣',
    ].map(name => ({ value: name, label: name })),
    placeholder: '請選擇縣市',
    errorMessage: '',
  },
};
