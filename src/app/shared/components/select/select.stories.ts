// 範例資料：組織類型、目前狀態、使用等級、縣市（皆為示意選項）
import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SelectComponent, SelectOption } from '../../../../index';

const ORG_TYPE_OPTIONS: SelectOption[] = [
  { value: '公司',       label: '公司' },
  { value: '學校',       label: '學校' },
  { value: '個人工作室', label: '個人工作室（自由工作者、接案者等）' },
  { value: '非營利組織', label: '非營利組織' },
  { value: '政府機關',   label: '政府機關' },
  { value: '其他',       label: '其他' },
];

const STATUS_OPTIONS: SelectOption[] = [
  { value: 'active',  label: '啟用中' },
  { value: 'pending', label: '審核中' },
  { value: 'draft',   label: '草稿' },
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
    placeholder: '請選擇組織類型',
    errorMessage: '',
  },
};

export default meta;
type Story = StoryObj<SelectComponent>;

export const Default: Story = {
  name: '預設',
  args: {
    options: ORG_TYPE_OPTIONS,
    placeholder: '請選擇組織類型',
    errorMessage: '',
  },
};

export const WithError: Story = {
  name: '錯誤狀態',
  args: {
    options: ORG_TYPE_OPTIONS,
    placeholder: '請選擇組織類型',
    errorMessage: '請選擇組織類型',
  },
};

export const Interactive: Story = {
  name: '互動示範（顯示已選值）',
  render: () => ({
    template: `
      <div style="padding:16px; max-width:360px;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">
          從下拉選單選擇組織類型，選取結果將顯示於下方：
        </p>
        <app-select
          [options]="options"
          placeholder="請選擇組織類型"
          [(ngModel)]="selectedValue"
        ></app-select>
        <div style="margin-top:12px;font-size:13px;">
          <span style="color:#686868;">目前選取值：</span>
          <strong>{{ selectedValue ?? '（未選取）' }}</strong>
        </div>
        <hr style="margin:16px 0;border:none;border-top:1px solid #e7e7e7;">
        <p style="font-size:13px;color:#686868;margin-bottom:12px;">目前狀態：</p>
        <app-select
          [options]="statusOptions"
          placeholder="請選擇目前狀態"
          [(ngModel)]="selectedStatus"
        ></app-select>
        <div style="margin-top:12px;font-size:13px;">
          <span style="color:#686868;">目前選取值：</span>
          <strong>{{ selectedStatus ?? '（未選取）' }}</strong>
        </div>
      </div>
    `,
    props: {
      options: ORG_TYPE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      selectedValue: null as string | null,
      selectedStatus: null as string | null,
    },
    moduleMetadata: { imports: [SelectComponent, FormsModule, CommonModule] },
  }),
};

export const DisabledOption: Story = {
  name: '含禁用選項',
  args: {
    // 某些條件下（例如個人帳號）只開放部分等級，其餘選項照樣列出但禁用
    options: [
      { value: '免費版', label: '免費版' },
      { value: '團隊版', label: '團隊版', disabled: true },
      { value: '企業版', label: '企業版', disabled: true },
      { value: '個人進階版', label: '個人進階版' },
    ],
    placeholder: '請選擇使用等級',
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
