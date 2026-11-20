import type { Meta, StoryObj } from '@storybook/angular';
import { LabelComponent, ResultListComponent, ResultListGroup, SearchFieldComponent } from '../../../../index';

const meta: Meta<ResultListComponent> = {
  title: '展示元件/Result List',
  id: 'result-list',
  component: ResultListComponent,
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: 'text', description: '清單的報讀名稱（必填）' },
    state: {
      control: 'radio',
      options: ['ready', 'loading', 'empty', 'error'],
      description: '目前的狀態，由使用端指定',
      table: { defaultValue: { summary: "'ready'" } },
    },
    autoActivateFirst: { control: 'boolean', description: '有結果就先選中第一列', table: { defaultValue: { summary: 'false' } } },
    wrap: { control: 'boolean', description: '上下鍵到頭尾時繞回另一端', table: { defaultValue: { summary: 'false' } } },
    loadingText: { control: 'text', description: '載入中的字', table: { defaultValue: { summary: "'搜尋中'" } } },
    emptyText: { control: 'text', description: '沒有結果的字', table: { defaultValue: { summary: "'找不到結果'" } } },
    errorTitle: { control: 'text', description: '載入失敗的標題', table: { defaultValue: { summary: "'載入失敗'" } } },
    errorDescription: { control: 'text', description: '載入失敗的說明', table: { defaultValue: { summary: "''" } } },
    itemSelect: { action: 'itemSelect' },
    retry: { action: 'retry' },
  },
};

export default meta;
type Story = StoryObj<ResultListComponent>;

/** 範例用的假資料：名稱、編號都是編的 */
const ITEMS = [
  { id: 'P1031', label: '項目 A', description: '設計部', data: { code: 'P1031' } },
  { id: 'P1047', label: '項目 B', description: '資訊部', data: { code: 'P1047' } },
  { id: 'P1052', label: '項目 C', description: '行政部', data: { code: 'P1052' } },
  { id: 'P1068', label: '項目 D', description: '設計部', data: { code: 'P1068' } },
];
const ONE_GROUP: ResultListGroup[] = [{ id: 'all', items: ITEMS.map(({ description: _d, ...rest }) => rest) }];
const TWO_GROUPS: ResultListGroup[] = [
  { id: 'recent', label: '最近開啟', items: ITEMS.slice(0, 2) },
  { id: 'all', label: '全部', items: ITEMS.slice(2) },
];

const BOX = 'max-width:480px;border:1px solid #e7e7e7;border-radius:16px;overflow:hidden;background:#fff';
const NOTE = 'color:#535353;font-size:12px;margin:8px 0 0';

// 範例的屬性名稱不能跟元件自己的成員同名（例如 active）：Storybook 會把同名的值直接設到元件上，蓋掉元件的東西

/** 把輸入框的 keydown 轉進清單（範例共用） */
const wire = `(keydown)="$event.target.tagName === 'INPUT' && list.handleKeydown($event)"`;

// ── 預設：跟搜尋框一起用 ──────────────────────────────────
export const Default: Story = {
  name: '預設',
  args: {
    ariaLabel: '搜尋結果', state: 'ready', autoActivateFirst: false, wrap: false,
    loadingText: '搜尋中', emptyText: '找不到結果', errorTitle: '載入失敗', errorDescription: '',
  },
  render: (args) => ({
    props: { ...args, groups: ONE_GROUP, activeOption: null as string | null, picked: '' },
    moduleMetadata: { imports: [SearchFieldComponent] },
    template: `
      <div style="${BOX}" ${wire}>
        <app-search-field appearance="embedded" ariaLabel="搜尋項目" placeholder="點這裡，再按 ↓ ↑ Enter"
          listboxId="rl-default" [listboxExpanded]="state === 'ready'" [activeDescendant]="activeOption"></app-search-field>
        <app-result-list #list listId="rl-default" [ariaLabel]="ariaLabel" [groups]="groups" [state]="state"
          [autoActivateFirst]="autoActivateFirst" [wrap]="wrap" [loadingText]="loadingText" [emptyText]="emptyText"
          [errorTitle]="errorTitle" [errorDescription]="errorDescription"
          (activeOptionIdChange)="activeOption = $event"
          (itemSelect)="picked = $event.label; itemSelect($event)" (retry)="retry()"></app-result-list>
      </div>
      <p style="${NOTE}">選了：{{ picked || '（還沒選）' }}</p>
    `,
  }),
};

// ── 有標題的群組 ──────────────────────────────────────────
export const Groups: Story = {
  name: '有標題的群組',
  render: () => ({
    props: { groups: TWO_GROUPS, activeOption: null as string | null },
    moduleMetadata: { imports: [SearchFieldComponent] },
    template: `
      <div style="${BOX}" ${wire}>
        <app-search-field appearance="embedded" ariaLabel="搜尋項目" placeholder="上下鍵會跨群組移動"
          listboxId="rl-groups" [listboxExpanded]="true" [activeDescendant]="activeOption"></app-search-field>
        <app-result-list #list listId="rl-groups" ariaLabel="搜尋結果" [groups]="groups"
          (activeOptionIdChange)="activeOption = $event"></app-result-list>
      </div>
    `,
  }),
};

// ── 自訂列內容 ────────────────────────────────────────────
export const CustomRow: Story = {
  name: '自訂列內容',
  render: () => ({
    props: { groups: ONE_GROUP, activeOption: null as string | null },
    moduleMetadata: { imports: [SearchFieldComponent, LabelComponent] },
    template: `
      <ng-template #row let-item>
        <app-label color="GreyOutline" size="S" [text]="item.data.code"></app-label>
        <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.label }}</span>
      </ng-template>
      <div style="${BOX}" ${wire}>
        <app-search-field appearance="embedded" ariaLabel="搜尋項目" placeholder="列的內容由使用端畫"
          listboxId="rl-custom" [listboxExpanded]="true" [activeDescendant]="activeOption"></app-search-field>
        <app-result-list #list listId="rl-custom" ariaLabel="搜尋結果" [groups]="groups" [itemTemplate]="row"
          (activeOptionIdChange)="activeOption = $event"></app-result-list>
      </div>
    `,
  }),
};

// ── 三種狀態：載入中、沒有結果、載入失敗 ──────────────────
export const States: Story = {
  name: '載入中、沒有結果、載入失敗',
  render: () => ({
    props: { retried: 0 },
    template: `
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;max-width:820px">
        <div style="${BOX}"><app-result-list ariaLabel="載入中的範例" state="loading"></app-result-list></div>
        <div style="${BOX}"><app-result-list ariaLabel="沒有結果的範例" state="empty"
          emptyText="找不到「項目 Z」的相關結果"></app-result-list></div>
        <div style="${BOX}"><app-result-list ariaLabel="載入失敗的範例" state="error"
          errorTitle="搜尋失敗" errorDescription="請再試一次" (retry)="retried = retried + 1"></app-result-list></div>
      </div>
      <p style="${NOTE}">按了重試 {{ retried }} 次</p>
    `,
  }),
};

// ── 最長內容：名稱一行、放不下用刪節號 ────────────────────
export const LongLabel: Story = {
  name: '很長的名稱',
  render: () => ({
    props: {
      groups: [{
        id: 'g',
        items: [
          { id: 'short', label: '項目 A', icon: 'Search' },
          { id: 'long', label: '名稱很長的項目名稱很長的項目名稱很長的項目名稱很長的項目名稱很長的項目', icon: 'Search', description: '說明也可能很長說明也可能很長說明也可能很長說明也可能很長說明也可能很長' },
        ],
      }] as ResultListGroup[],
    },
    template: `
      <div style="${BOX};max-width:360px">
        <app-result-list ariaLabel="很長的名稱" [groups]="groups" activeId="long"></app-result-list>
      </div>
    `,
  }),
};

// ── 清單很長：放進固定高度的容器，選到看不見的列會自己捲 ──
export const Scrolling: Story = {
  name: '清單很長',
  render: () => ({
    props: {
      groups: [{ id: 'g', items: Array.from({ length: 30 }, (_, i) => ({ id: 'n' + i, label: '項目 ' + (i + 1) })) }] as ResultListGroup[],
      activeOption: null as string | null,
    },
    moduleMetadata: { imports: [SearchFieldComponent] },
    template: `
      <div style="${BOX}" ${wire}>
        <app-search-field appearance="embedded" ariaLabel="搜尋項目" placeholder="按住 ↓ 看清單跟著捲"
          listboxId="rl-scroll" [listboxExpanded]="true" [activeDescendant]="activeOption"></app-search-field>
        <div style="max-height:220px;overflow-y:auto">
          <app-result-list #list listId="rl-scroll" ariaLabel="搜尋結果" [groups]="groups"
            (activeOptionIdChange)="activeOption = $event"></app-result-list>
        </div>
      </div>
    `,
  }),
};
