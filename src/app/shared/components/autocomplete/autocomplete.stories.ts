// 範例資料：台灣縣市行政區（多選的地區欄位）
import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { AutocompleteComponent, AutocompleteOption } from '../../../../index';

const DISTRICT_OPTIONS: AutocompleteOption[] = [
  { value: 'TPE-XY', label: '台北市信義區' },
  { value: 'TPE-ZZ', label: '台北市中正區' },
  { value: 'TPE-SS', label: '台北市松山區' },
  { value: 'TPE-DA', label: '台北市大安區' },
  { value: 'NTP-BQ', label: '新北市板橋區' },
  { value: 'TXG-ZQ', label: '台中市中區' },
  { value: 'TNN-DQ', label: '台南市東區' },
  { value: 'KHH-XX', label: '高雄市新興區' },
];

const meta: Meta<AutocompleteComponent> = {
  title: '表單元件/Autocomplete',
  id: 'autocomplete',
  component: AutocompleteComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      description: '輸入框尺寸',
      control: { type: 'select' },
      options: ['S', 'M', 'L'],
    },
    placeholder: {
      description: 'Placeholder 提示文字',
      control: { type: 'text' },
    },
    options: {
      description: '可選項目清單',
      control: { type: 'object' },
    },
    value: {
      description: '已選取項目（外部傳入）',
      control: { type: 'object' },
    },
    errorMessage: {
      description: '錯誤訊息；有值時顯示錯誤樣式',
      control: { type: 'text' },
    },
    disabled: {
      description: '禁用狀態',
      control: { type: 'boolean' },
    },
    selectionChange: {
      description: '選取項目變更時觸發，回傳當下所有已選項目',
      action: 'selectionChange',
    },
  },
  args: {
    size: 'L',
    placeholder: '請輸入縣市或行政區名稱搜尋',
    options: DISTRICT_OPTIONS,
    value: [],
    errorMessage: '',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<AutocompleteComponent>;

export const Default: Story = {
  name: '預設',
  args: {
    placeholder: '請輸入縣市或行政區名稱搜尋',
    options: DISTRICT_OPTIONS,
  },
};

export const WithError: Story = {
  name: '錯誤狀態',
  args: {
    placeholder: '請輸入縣市或行政區名稱搜尋',
    options: DISTRICT_OPTIONS,
    errorMessage: '請選擇服務地區',
  },
};

export const Disabled: Story = {
  name: '禁用狀態',
  args: {
    placeholder: '此欄位已鎖定',
    options: DISTRICT_OPTIONS,
    value: [{ value: 'TPE-XY', label: '台北市信義區' }],
    disabled: true,
  },
};

export const AllSizes: Story = {
  name: '所有尺寸',
  render: () => ({
    template: `
      <div style="display:flex; flex-direction:column; gap:16px; padding:16px;">
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">Large (L)</p>
          <app-autocomplete size="L" placeholder="L 尺寸 — 請輸入縣市或行政區名稱搜尋" [options]="options"></app-autocomplete>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">Medium (M)</p>
          <app-autocomplete size="M" placeholder="M 尺寸 — 請輸入縣市或行政區名稱搜尋" [options]="options"></app-autocomplete>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">Small (S)</p>
          <app-autocomplete size="S" placeholder="S 尺寸 — 請輸入縣市或行政區名稱搜尋" [options]="options"></app-autocomplete>
        </div>
      </div>
    `,
    props: { options: DISTRICT_OPTIONS },
  }),
};

export const Interactive: Story = {
  name: '互動示範',
  render: () => ({
    template: `
      <div style="padding:16px; max-width:480px;">
        <p style="font-size:13px;color:#686868;margin-bottom:8px;">
          請搜尋並選擇服務地區（可多選），已選項目會顯示於下方：
        </p>
        <app-autocomplete
          size="L"
          placeholder="請輸入縣市或行政區名稱搜尋（可多選）"
          [options]="options"
          (selectionChange)="onSelectionChange($event)"
        ></app-autocomplete>
        <div *ngIf="selected.length > 0" style="margin-top:12px;font-size:13px;">
          <strong>已選取（{{ selected.length }} 項）：</strong>
          <ul style="margin:4px 0 0 16px;padding:0;">
            <li *ngFor="let item of selected">{{ item.label }}</li>
          </ul>
        </div>
      </div>
    `,
    props: {
      options: DISTRICT_OPTIONS,
      selected: [] as AutocompleteOption[],
      onSelectionChange(items: AutocompleteOption[]) {
        (this as any).selected = items;
        action('selectionChange')(items);
      },
    },
  }),
};
