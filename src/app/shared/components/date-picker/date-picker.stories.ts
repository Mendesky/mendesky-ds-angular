import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent, FieldComponent } from '../../../../index';

// 今天的民國年月日（用於「不可選未來日期」範例，比照 dashboard-app 的 todayRoc）
const now = new Date();
const TODAY_ROC = { year: now.getFullYear() - 1911, month: now.getMonth() + 1, day: now.getDate() };

// host 是 display: block，會撐滿父層；範例統一用固定寬度的外框
const WRAP_STYLE = 'width:280px;';
const VALUE_STYLE = 'font-size:12px;color:#686868;margin-top:8px;';

const meta: Meta<DatePickerComponent> = {
  title: '表單元件/Date Picker',
  id: 'date-picker',
  component: DatePickerComponent,
  tags: ['autodocs'],
  argTypes: {
    mode: {
      control: 'select',
      options: ['year', 'month', 'day'],
      description: '選取粒度：year=只選年、month=選年月、day=選年月日',
      table: { defaultValue: { summary: 'month' } },
    },
    size: {
      control: 'select',
      options: ['S', 'M', 'L'],
      description: 'trigger 高度：S=28px、M=32px、L=40px',
      table: { defaultValue: { summary: 'M' } },
    },
    placeholder: {
      control: 'text',
      description: "空值時的 placeholder；不傳時依 mode 推導（day='選擇日期'、month='選擇月份'、year='選擇年度'）",
    },
    emptyLabel: {
      control: 'text',
      description: '空值時顯示的「實心」語意文字（深色，非灰色 placeholder）',
      table: { defaultValue: { summary: "''" } },
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
    maxMonth: {
      control: 'number',
      description: '不允許選超過此月份，需搭配 maxYear。null 表示無限制',
      table: { defaultValue: { summary: 'null' } },
    },
    maxDate: {
      control: 'object',
      description: '不允許選此日期之後的日期（民國年）：{ year, month, day }。null 表示無限制',
      table: { defaultValue: { summary: 'null' } },
    },
    clearable: {
      control: 'boolean',
      description: '有值且非停用時顯示清除鈕，點擊清空（emit 空字串）',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: '停用：灰底、不可點擊',
      table: { defaultValue: { summary: 'false' } },
    },
    errorMessage: {
      control: 'text',
      description: '錯誤訊息；有值時顯示錯誤樣式與錯誤提示',
      table: { defaultValue: { summary: "''" } },
    },
    errorPosition: {
      control: 'select',
      options: ['top', 'bottom'],
      description: '錯誤提示顯示在欄位上方或下方',
      table: { defaultValue: { summary: 'bottom' } },
    },
  },
};

export default meta;
type Story = StoryObj<DatePickerComponent>;

// ── 主範例：可用 Controls 調整模式、尺寸、範圍與狀態；以 ngModel 綁值 ──
export const Default: Story = {
  name: '預設',
  args: {
    mode: 'month',
    size: 'M',
    placeholder: '',
    emptyLabel: '',
    minYear: 110,
    maxYear: 125,
    maxMonth: null,
    maxDate: null,
    clearable: false,
    disabled: false,
    errorMessage: '',
    errorPosition: 'bottom',
  },
  render: (args) => ({
    props: { ...args, pickerValue: '' },
    template: `
      <div style="${WRAP_STYLE}">
        <app-date-picker
          [mode]="mode"
          [size]="size"
          [placeholder]="placeholder"
          [emptyLabel]="emptyLabel"
          [minYear]="minYear"
          [maxYear]="maxYear"
          [maxMonth]="maxMonth"
          [maxDate]="maxDate"
          [clearable]="clearable"
          [disabled]="disabled"
          [errorMessage]="errorMessage"
          [errorPosition]="errorPosition"
          [(ngModel)]="pickerValue">
        </app-date-picker>
        <div style="${VALUE_STYLE}">目前值：'{{ pickerValue }}'</div>
      </div>
    `,
    moduleMetadata: { imports: [DatePickerComponent, FormsModule] },
  }),
};

// ── 只選年（dashboard-app 過往成本分析需求） ───────────────
export const YearMode: Story = {
  name: '只選年',
  render: () => ({
    props: { pickerValue: '', maxYear: TODAY_ROC.year },
    template: `
      <div style="${WRAP_STYLE}">
        <app-date-picker
          mode="year"
          size="M"
          placeholder="選擇過往年度"
          [maxYear]="maxYear"
          [(ngModel)]="pickerValue">
        </app-date-picker>
        <div style="${VALUE_STYLE}">目前值：'{{ pickerValue }}'</div>
      </div>
    `,
    moduleMetadata: { imports: [DatePickerComponent, FormsModule] },
  }),
};

// ── 選年月日、不可選未來日期（dashboard-app 成交日期） ──────────
export const DayModeWithMaxDate: Story = {
  name: '選年月日（不可選未來日期）',
  render: () => ({
    props: { pickerValue: '', maxYear: TODAY_ROC.year, maxDate: TODAY_ROC },
    template: `
      <div style="${WRAP_STYLE}">
        <app-field label="成交日期" [required]="true">
          <app-date-picker
            mode="day"
            size="L"
            [maxYear]="maxYear"
            [maxDate]="maxDate"
            [(ngModel)]="pickerValue">
          </app-date-picker>
        </app-field>
        <div style="${VALUE_STYLE}">目前值：'{{ pickerValue }}'</div>
      </div>
    `,
    moduleMetadata: { imports: [DatePickerComponent, FieldComponent, FormsModule] },
  }),
};

// ── 空值有業務語意＋可清除（dashboard-app 報價起始日：空＝設立完成後開始） ──
export const EmptyLabelClearable: Story = {
  name: '空值語意文字＋可清除',
  render: () => ({
    props: { pickerValue: '' },
    template: `
      <div style="${WRAP_STYLE}">
        <app-date-picker
          size="M"
          mode="month"
          [clearable]="true"
          emptyLabel="設立完成後開始"
          [(ngModel)]="pickerValue">
        </app-date-picker>
        <div style="${VALUE_STYLE}">選取後欄位內出現清除鈕，清除後回到「設立完成後開始」。目前值：'{{ pickerValue }}'</div>
      </div>
    `,
    moduleMetadata: { imports: [DatePickerComponent, FormsModule] },
  }),
};

// ── 錯誤狀態＋年份跨度大（dashboard-app 核准設立日期，最小民國 40 年） ──
export const ErrorState: Story = {
  name: '錯誤狀態',
  render: () => ({
    props: { pickerValue: '', minYear: 40, maxYear: TODAY_ROC.year, maxDate: TODAY_ROC },
    template: `
      <div style="${WRAP_STYLE}">
        <app-field label="核准設立日期" [required]="true">
          <app-date-picker
            mode="day"
            size="M"
            [minYear]="minYear"
            [maxYear]="maxYear"
            [maxDate]="maxDate"
            [errorMessage]="pickerValue ? '' : '請選擇核准設立日期'"
            [(ngModel)]="pickerValue">
          </app-date-picker>
        </app-field>
      </div>
    `,
    moduleMetadata: { imports: [DatePickerComponent, FieldComponent, FormsModule] },
  }),
};

// ── 停用 ───────────────────────────────────────────────────
export const Disabled: Story = {
  name: '停用',
  render: () => ({
    props: { pickerValue: '114-3' },
    template: `
      <div style="${WRAP_STYLE}">
        <app-date-picker size="M" mode="month" [disabled]="true" [(ngModel)]="pickerValue"></app-date-picker>
      </div>
    `,
    moduleMetadata: { imports: [DatePickerComponent, FormsModule] },
  }),
};
