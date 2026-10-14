import type { Meta, StoryObj } from '@storybook/angular';
import { CellBtnComponent } from '../../../../index';

// 格子按鈕的 host 是 display: contents，實際排版由父層 grid 決定。
// 以下網格樣式比照 date-panel 的年份（2 欄）／月份（3 欄）／日期（7 欄）網格。
const GRID_BASE = 'display:grid;font-size:14px;';
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);
const YEARS = Array.from({ length: 8 }, (_, i) => 110 + i);
// 日期網格：前 3 格是空白佔位（該月 1 日落在星期三），之後 1～30 日
const DAY_CELLS: (number | null)[] = [null, null, null, ...Array.from({ length: 30 }, (_, i) => i + 1)];

const meta: Meta<CellBtnComponent> = {
  title: '互動元件/Cell Button',
  id: 'cell-btn',
  component: CellBtnComponent,
  tags: ['autodocs'],
  argTypes: {
    text: {
      control: 'text',
      description: '顯示文字，如 "113 年"、"3 月"、"15"',
    },
    selected: {
      control: 'boolean',
      description: '選中態（藍底白字）',
      table: { defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: '停用態（低透明度，不可點擊）',
      table: { defaultValue: { summary: 'false' } },
    },
    empty: {
      control: 'boolean',
      description: '空白佔位格，渲染 span 非 button（日曆前幾格）',
      table: { defaultValue: { summary: 'false' } },
    },
    cellClick: { action: 'cellClick' },
  },
};

export default meta;
type Story = StoryObj<CellBtnComponent>;

// ── 主範例：可用 Controls 調整文字與狀態 ──────────────────
export const Default: Story = {
  name: '預設',
  args: {
    text: '3 月',
    selected: false,
    disabled: false,
    empty: false,
  },
  render: (args) => ({
    props: args,
    template: `
      <div style="${GRID_BASE}grid-template-columns:80px;">
        <app-cell-btn
          [text]="text"
          [selected]="selected"
          [disabled]="disabled"
          [empty]="empty"
          (cellClick)="cellClick($event)">
        </app-cell-btn>
      </div>
    `,
    moduleMetadata: { imports: [CellBtnComponent] },
  }),
};

// ── 三種狀態並排 ───────────────────────────────────────
export const AllStates: Story = {
  name: '所有狀態',
  render: () => ({
    template: `
      <div style="${GRID_BASE}grid-template-columns:repeat(3,80px);gap:12px;align-items:start;">
        <div style="display:flex;flex-direction:column;align-items:stretch;gap:6px;">
          <app-cell-btn text="3 月"></app-cell-btn>
          <span style="font-size:11px;color:#686868;text-align:center;">一般</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:stretch;gap:6px;">
          <app-cell-btn text="3 月" [selected]="true"></app-cell-btn>
          <span style="font-size:11px;color:#686868;text-align:center;">選中</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:stretch;gap:6px;">
          <app-cell-btn text="3 月" [disabled]="true"></app-cell-btn>
          <span style="font-size:11px;color:#686868;text-align:center;">停用</span>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [CellBtnComponent] },
  }),
};

// ── 月份網格（可點擊切換選中；11、12 月示範停用） ──────────
export const MonthGrid: Story = {
  name: '月份網格（可點擊）',
  render: () => ({
    props: {
      months: MONTHS,
      selected: 3,
    },
    template: `
      <div style="width:240px;">
        <div style="${GRID_BASE}grid-template-columns:repeat(3,1fr);gap:4px;" role="listbox" aria-label="月份">
          @for (m of months; track m) {
            <app-cell-btn
              [text]="m + ' 月'"
              [selected]="m === selected"
              [disabled]="m > 10"
              (cellClick)="selected = m">
            </app-cell-btn>
          }
        </div>
        <p style="font-size:12px;color:#686868;margin-top:12px;">已選：{{ selected }} 月</p>
      </div>
    `,
    moduleMetadata: { imports: [CellBtnComponent] },
  }),
};

// ── 年份網格（2 欄） ─────────────────────────────────────
export const YearGrid: Story = {
  name: '年份網格',
  render: () => ({
    props: {
      years: YEARS,
      selected: 114,
    },
    template: `
      <div style="width:240px;">
        <div style="${GRID_BASE}grid-template-columns:repeat(2,1fr);gap:4px;" role="listbox" aria-label="年份">
          @for (y of years; track y) {
            <app-cell-btn
              [text]="y + ' 年'"
              [selected]="y === selected"
              (cellClick)="selected = y">
            </app-cell-btn>
          }
        </div>
      </div>
    `,
    moduleMetadata: { imports: [CellBtnComponent] },
  }),
};

// ── 日期網格：月初前的空白佔位用 empty ─────────────────────
export const DayGridWithEmpty: Story = {
  name: '日期網格（含空白佔位）',
  render: () => ({
    props: {
      cells: DAY_CELLS,
      selected: 15,
    },
    template: `
      <div style="width:260px;">
        <div style="${GRID_BASE}grid-template-columns:repeat(7,1fr);gap:2px;" role="listbox" aria-label="日期">
          @for (cell of cells; track $index) {
            <app-cell-btn
              [text]="cell !== null ? ('' + cell) : ''"
              [empty]="cell === null"
              [selected]="cell !== null && cell === selected"
              (cellClick)="selected = cell">
            </app-cell-btn>
          }
        </div>
      </div>
    `,
    moduleMetadata: { imports: [CellBtnComponent] },
  }),
};
