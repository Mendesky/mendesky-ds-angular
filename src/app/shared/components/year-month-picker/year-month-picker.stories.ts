import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FieldComponent, YearMonthPickerComponent } from '../../../../index';

const WRAP_STYLE = 'width:280px;';
const VALUE_STYLE = 'font-size:12px;color:#686868;margin-top:8px;';

const meta: Meta<YearMonthPickerComponent> = {
  title: '表單元件/Year Month Picker',
  id: 'year-month-picker',
  component: YearMonthPickerComponent,
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['S', 'M', 'L'],
      description: 'trigger 尺寸',
      table: { defaultValue: { summary: 'S' } },
    },
    placeholder: {
      control: 'text',
      description: '空值時顯示的 placeholder 文字',
      table: { defaultValue: { summary: '選擇年月' } },
    },
    minYear: {
      control: 'number',
      description: '可選最小民國年',
      table: { defaultValue: { summary: '110' } },
    },
    maxYear: {
      control: 'number',
      description: '可選最大民國年',
      table: { defaultValue: { summary: '125' } },
    },
    yearOnly: {
      control: 'boolean',
      description: "true：只選年度，值格式為 '114'；false：選年月，值格式為 '114-3'",
      table: { defaultValue: { summary: 'false' } },
    },
    mode: {
      control: 'select',
      options: ['month', 'period'],
      description: "'month'：選年月；'period'：1 期 = 2 個月，起始月為單月",
      table: { defaultValue: { summary: 'month' } },
    },
    disabled: {
      control: 'boolean',
      description: '唯讀：不可開啟面板、不可選',
      table: { defaultValue: { summary: 'false' } },
    },
  },
};

export default meta;
type Story = StoryObj<YearMonthPickerComponent>;

// ── 主範例：可用 Controls 調整尺寸、模式與範圍；以 ngModel 綁值 ──
export const Default: Story = {
  name: '預設',
  args: {
    size: 'S',
    placeholder: '選擇年月',
    minYear: 110,
    maxYear: 125,
    yearOnly: false,
    mode: 'month',
    disabled: false,
  },
  render: (args) => ({
    props: { ...args, pickerValue: '' },
    template: `
      <div style="${WRAP_STYLE}">
        <app-year-month-picker
          [size]="size"
          [placeholder]="placeholder"
          [minYear]="minYear"
          [maxYear]="maxYear"
          [yearOnly]="yearOnly"
          [mode]="mode"
          [disabled]="disabled"
          [(ngModel)]="pickerValue">
        </app-year-month-picker>
        <div style="${VALUE_STYLE}">目前值：'{{ pickerValue }}'</div>
      </div>
    `,
    moduleMetadata: { imports: [YearMonthPickerComponent, FormsModule] },
  }),
};

// ── 只選年度 ───────────────────────────────────────────────
export const YearOnly: Story = {
  name: '只選年度',
  render: () => ({
    props: { pickerValue: '' },
    template: `
      <div style="${WRAP_STYLE}">
        <app-year-month-picker
          [yearOnly]="true"
          size="L"
          placeholder="選擇年度"
          [(ngModel)]="pickerValue">
        </app-year-month-picker>
        <div style="${VALUE_STYLE}">目前值：'{{ pickerValue }}'</div>
      </div>
    `,
    moduleMetadata: { imports: [YearMonthPickerComponent, FormsModule] },
  }),
};

// ── 選期別（雙月為一期） ─────────────────────────────
export const PeriodMode: Story = {
  name: '選期別（1 期 = 2 個月）',
  render: () => ({
    props: { pickerValue: '' },
    template: `
      <div style="${WRAP_STYLE}">
        <app-field label="開始期別">
          <app-year-month-picker
            size="L"
            mode="period"
            placeholder="請選擇開始期別"
            [(ngModel)]="pickerValue">
          </app-year-month-picker>
        </app-field>
        <div style="${VALUE_STYLE}">目前值：'{{ pickerValue }}'（起始月為單月，'114-3' 代表 3~4 月）</div>
      </div>
    `,
    moduleMetadata: { imports: [YearMonthPickerComponent, FieldComponent, FormsModule] },
  }),
};

// ── 已有值：三種顯示文字 ─────────────────────────────────────
export const WithValue: Story = {
  name: '已有值',
  render: () => ({
    props: { yearValue: '114', monthValue: '114-3', periodValue: '114-3' },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;${WRAP_STYLE}">
        <app-year-month-picker [yearOnly]="true" [(ngModel)]="yearValue"></app-year-month-picker>
        <app-year-month-picker [(ngModel)]="monthValue"></app-year-month-picker>
        <app-year-month-picker mode="period" [(ngModel)]="periodValue"></app-year-month-picker>
      </div>
    `,
    moduleMetadata: { imports: [YearMonthPickerComponent, FormsModule] },
  }),
};

// ── 停用（唯讀） ─────────────────────────────────────────────
export const Disabled: Story = {
  name: '停用',
  render: () => ({
    props: { pickerValue: '114-3' },
    template: `
      <div style="${WRAP_STYLE}">
        <app-year-month-picker size="L" mode="period" [disabled]="true" [(ngModel)]="pickerValue"></app-year-month-picker>
      </div>
    `,
    moduleMetadata: { imports: [YearMonthPickerComponent, FormsModule] },
  }),
};
