import type { Meta, StoryObj } from '@storybook/angular';
import { SortHeaderComponent, nextSort, type SortState } from '../../../../index';

// 欄名與 key 為示意的列表表頭：
// name「編號及名稱」、status「狀態」、count「數量」、amount「金額」、
// person「承辦人員」、time「最後修改時間」
const meta: Meta<SortHeaderComponent> = {
  title: '展示元件/Sort Header',
  id: 'sort-header',
  component: SortHeaderComponent,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: '表頭文字',
      table: { defaultValue: { summary: "''" } },
    },
    key: {
      control: 'text',
      description: '這欄的識別字，點擊時原樣發出；也用來產生 data-testid="sort-<key>"',
      table: { defaultValue: { summary: "''" } },
    },
    sort: {
      control: 'object',
      description: '列表目前的排序狀態 { key, dir }；null 表示沒有排序。key 與本欄相同時顯示方向圖示',
      table: { defaultValue: { summary: 'null' } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: '文字靠左（預設）、置中或靠右（數字欄）',
      table: { defaultValue: { summary: "'start'" } },
    },
    leftIcon: {
      control: 'text',
      description: '欄名前面的圖示名稱；空字串＝不放',
      table: { defaultValue: { summary: "''" } },
    },
    sortChange: { action: 'sortChange' },
  },
};

export default meta;
type Story = StoryObj<SortHeaderComponent>;

// ── 主範例：沒有排序（滑過才出現排序圖示）────────────────
export const Default: Story = {
  name: '基本用法',
  args: {
    label: '承辦人員',
    key: 'person',
    sort: null,
    align: 'start',
  },
};

// ── 正在排序：升冪 ────────────────────────────────────
export const Ascending: Story = {
  name: '升冪（作用中）',
  args: {
    label: '編號及名稱',
    key: 'name',
    sort: { key: 'name', dir: 'asc' },
  },
};

// ── 正在排序：降冪 ────────────────────────────────────
export const Descending: Story = {
  name: '降冪（作用中）',
  args: {
    label: '最後修改時間',
    key: 'time',
    sort: { key: 'time', dir: 'desc' },
  },
};

// ── 數字欄靠右 ────────────────────────────────────────
export const AlignEnd: Story = {
  name: '數字欄靠右（align="end"）',
  render: (args) => ({
    props: args,
    template: `
      <div style="width:160px;border:1px dashed #d9d9d9;padding:4px 8px;">
        <app-sort-header [label]="label" [key]="key" [sort]="sort" [align]="align" (sortChange)="sortChange($event)"></app-sort-header>
      </div>
    `,
  }),
  args: {
    label: '數量',
    key: 'count',
    sort: { key: 'count', dir: 'desc' },
    align: 'end',
  },
};

// ── 置中 ──────────────────────────────────────────────
export const AlignCenter: Story = {
  name: '置中（align="center"）',
  render: (args) => ({
    props: args,
    template: `
      <div style="width:160px;border:1px dashed #d9d9d9;padding:4px 8px;">
        <app-sort-header [label]="label" [key]="key" [sort]="sort" [align]="align" (sortChange)="sortChange($event)"></app-sort-header>
      </div>
    `,
  }),
  args: {
    label: '狀態',
    key: 'status',
    sort: { key: 'status', dir: 'asc' },
    align: 'center',
  },
};

// ── 欄名前面放圖示 ────────────────────────────────────
export const WithLeftIcon: Story = {
  name: '欄名前面放圖示（leftIcon）',
  render: (args) => ({
    props: args,
    template: `
      <div style="width:160px;border:1px dashed #d9d9d9;padding:4px 8px;">
        <app-sort-header [label]="label" [key]="key" [sort]="sort" [align]="align" [leftIcon]="leftIcon" (sortChange)="sortChange($event)"></app-sort-header>
      </div>
    `,
  }),
  args: {
    label: '金額',
    key: 'amount',
    sort: null,
    align: 'end',
    leftIcon: 'Money',
  },
};

// ── 欄名太長 ──────────────────────────────────────────
export const LongLabel: Story = {
  name: '欄名太長（尾端刪節號）',
  render: (args) => ({
    props: args,
    template: `
      <div style="width:120px;border:1px dashed #d9d9d9;padding:4px 8px;">
        <app-sort-header [label]="label" [key]="key" [sort]="sort" [leftIcon]="leftIcon" (sortChange)="sortChange($event)"></app-sort-header>
      </div>
    `,
  }),
  args: {
    label: '這是一個很長很長的欄位名稱',
    key: 'long',
    sort: { key: 'long', dir: 'desc' },
    leftIcon: 'Date',
  },
};

// ── 放在有表格結構的列表裡 ────────────────────────────
export const InTableRow: Story = {
  name: '放在表格列裡（role="row"）',
  render: () => ({
    template: `
      <div role="table" aria-label="人員" style="font-size:13px;">
        <div role="row" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;">
          <app-sort-header label="姓名" key="name" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="部門" key="dept" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
        </div>
        <div role="row" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;padding-top:8px;">
          <span role="cell">範例人員</span><span role="cell">範例部門</span>
        </div>
      </div>
    `,
    props: {
      sort: { key: 'name', dir: 'asc' } as SortState | null,
      onSort(key: string) {
        const self = this as { sort: SortState | null };
        self.sort = nextSort(self.sort, key);
      },
    },
    moduleMetadata: { imports: [SortHeaderComponent] },
  }),
};

// ── 互動：整列表頭搭配 nextSort 切換 ─────────────────────
export const HeaderRow: Story = {
  name: '互動測試（整列表頭 + nextSort）',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;padding:0 16px;">
        <div style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:center;font-size:13px;">
          <app-sort-header label="編號及名稱" key="name" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="狀態" key="status" align="center" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="數量" key="count" align="end" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="金額" key="amount" align="end" leftIcon="Money" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="承辦人員" key="person" align="center" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="最後修改時間" key="time" align="center" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
        </div>
        <span style="font-size:12px;color:#686868;">
          目前排序：{{ sort ? labels[sort.key] + '（' + (sort.dir === 'asc' ? '升冪' : '降冪') + '）' : '無' }}
        </span>
      </div>
    `,
    props: {
      sort: null as SortState | null,
      labels: {
        name: '編號及名稱',
        status: '狀態',
        count: '數量',
        amount: '金額',
        person: '承辦人員',
        time: '最後修改時間',
      } as Record<string, string>,
      onSort(key: string) {
        const self = this as { sort: SortState | null };
        // 數量、金額與時間欄第一次點就「多到少 / 新到舊」
        const defaultDir = ['count', 'amount', 'time'].includes(key) ? 'desc' : 'asc';
        self.sort = nextSort(self.sort, key, defaultDir);
      },
    },
    moduleMetadata: { imports: [SortHeaderComponent] },
  }),
};
