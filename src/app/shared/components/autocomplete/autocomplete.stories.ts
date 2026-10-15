// 範例資料取自 dashboard-app 主線：src/assets/json/NTB_unitcode.json（國稅局所別，經 src/app/features/quoting-cases/mocks/mock-ntb-units.ts 轉成選項）、
// src/app/features/quoting-cases/components/handover-document-modal/pages/hdm-page3-filing/cards/p3-1-national-tax-bureau-card/（placeholder 與錯誤訊息）
import type { Meta, StoryObj } from '@storybook/angular';
import { action } from '@storybook/addon-actions';
import { AutocompleteComponent, AutocompleteOption } from '../../../../index';

const NTB_UNIT_OPTIONS: AutocompleteOption[] = [
  { value: 'A0300', label: '台北市信義分局﹝信義區﹞' },
  { value: 'A1000', label: '台北市中正分局﹝中正區﹞' },
  { value: 'A1100', label: '台北市松山分局﹝松山區﹞' },
  { value: 'A1400', label: '台北市大安分局﹝大安區﹞' },
  { value: 'F3014', label: '板橋分局﹝板橋區﹞' },
  { value: 'B4801', label: '台中市民權稽徵所﹝中區﹞' },
  { value: 'D7001', label: '台南市台南分局﹝東區﹞' },
  { value: 'E0200', label: '高雄市新興稽徵所﹝新興區﹞' },
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
      description: '選取項目變更時觸發，回傳目前所有已選項目',
      action: 'selectionChange',
    },
  },
  args: {
    size: 'L',
    placeholder: '請輸入縣市或分局名稱搜尋',
    options: NTB_UNIT_OPTIONS,
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
    placeholder: '請輸入縣市或分局名稱搜尋',
    options: NTB_UNIT_OPTIONS,
  },
};

export const WithError: Story = {
  name: '錯誤狀態',
  args: {
    placeholder: '請輸入縣市或分局名稱搜尋',
    options: NTB_UNIT_OPTIONS,
    errorMessage: '請選擇國稅局所別',
  },
};

export const Disabled: Story = {
  name: '禁用狀態',
  args: {
    placeholder: '此欄位已鎖定',
    options: NTB_UNIT_OPTIONS,
    value: [{ value: 'A0300', label: '台北市信義分局﹝信義區﹞' }],
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
          <app-autocomplete size="L" placeholder="L 尺寸 — 請輸入縣市或分局名稱搜尋" [options]="options"></app-autocomplete>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">Medium (M)</p>
          <app-autocomplete size="M" placeholder="M 尺寸 — 請輸入縣市或分局名稱搜尋" [options]="options"></app-autocomplete>
        </div>
        <div>
          <p style="font-size:12px;color:#686868;margin-bottom:4px;">Small (S)</p>
          <app-autocomplete size="S" placeholder="S 尺寸 — 請輸入縣市或分局名稱搜尋" [options]="options"></app-autocomplete>
        </div>
      </div>
    `,
    props: { options: NTB_UNIT_OPTIONS },
  }),
};

export const Interactive: Story = {
  name: '互動示範',
  render: () => ({
    template: `
      <div style="padding:16px; max-width:480px;">
        <p style="font-size:13px;color:#686868;margin-bottom:8px;">
          請搜尋並選擇國稅局所別（可多選），已選項目會顯示於下方：
        </p>
        <app-autocomplete
          size="L"
          placeholder="請輸入縣市或分局名稱搜尋（可多選）"
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
      options: NTB_UNIT_OPTIONS,
      selected: [] as AutocompleteOption[],
      onSelectionChange(items: AutocompleteOption[]) {
        (this as any).selected = items;
        action('selectionChange')(items);
      },
    },
  }),
};
