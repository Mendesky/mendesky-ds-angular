import type { Meta, StoryObj } from '@storybook/angular';
import { SortHeaderComponent, nextSort, type SortState } from '../../../../index';

// 欄名與 key 取自 dashboard-app 主線案件列表表頭（quoting-cases.component.html 的 .lt-hd--sortable），
// 本元件的外觀即比照該表頭：
// company「統一編號及案件名稱」、status「狀態」、recurring「持續性費用」、onetime「一次性費用」、
// person「負責人員」、time「最後修改時間」
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
      description: '列表目前的排序狀態 { key, dir }；null 表示沒有排序。key 與本欄相同時顯示方向箭頭',
      table: { defaultValue: { summary: 'null' } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'end'],
      description: '文字靠左（預設）或靠右（數字欄）',
      table: { defaultValue: { summary: "'start'" } },
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
    label: '負責人員',
    key: 'person',
    sort: null,
    align: 'start',
  },
};

// ── 正在排序：升冪 ────────────────────────────────────
export const Ascending: Story = {
  name: '升冪（作用中）',
  args: {
    label: '統一編號及案件名稱',
    key: 'company',
    sort: { key: 'company', dir: 'asc' },
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
    label: '持續性費用',
    key: 'recurring',
    sort: { key: 'recurring', dir: 'desc' },
    align: 'end',
  },
};

// ── 互動：整列表頭搭配 nextSort 切換 ─────────────────────
export const HeaderRow: Story = {
  name: '互動測試（整列表頭 + nextSort）',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div style="display:grid;grid-template-columns:minmax(0,2fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:12px;align-items:center;font-size:13px;">
          <app-sort-header label="統一編號及案件名稱" key="company" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="狀態" key="status" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="持續性費用" key="recurring" align="end" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="一次性費用" key="onetime" align="end" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="負責人員" key="person" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
          <app-sort-header label="最後修改時間" key="time" [sort]="sort" (sortChange)="onSort($event)"></app-sort-header>
        </div>
        <span style="font-size:12px;color:#686868;">
          目前排序：{{ sort ? labels[sort.key] + '（' + (sort.dir === 'asc' ? '升冪' : '降冪') + '）' : '無' }}
        </span>
      </div>
    `,
    props: {
      sort: null as SortState | null,
      labels: {
        company: '統一編號及案件名稱',
        status: '狀態',
        recurring: '持續性費用',
        onetime: '一次性費用',
        person: '負責人員',
        time: '最後修改時間',
      } as Record<string, string>,
      onSort(key: string) {
        const self = this as { sort: SortState | null };
        // 費用與時間欄第一次點就「多到少 / 新到舊」
        const defaultDir = ['recurring', 'onetime', 'time'].includes(key) ? 'desc' : 'asc';
        self.sort = nextSort(self.sort, key, defaultDir);
      },
    },
    moduleMetadata: { imports: [SortHeaderComponent] },
  }),
};
