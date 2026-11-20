import type { Meta, StoryObj } from '@storybook/angular';
import {
  ButtonComponent, CommandPaletteComponent, LabelComponent, ResultListGroup, ResultListItem, ResultListState,
} from '../../../../index';

const meta: Meta<CommandPaletteComponent> = {
  title: '浮層元件/Command Palette',
  id: 'command-palette',
  component: CommandPaletteComponent,
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: 'text', description: '對話框的報讀名稱（必填）' },
    placeholder: { control: 'text', description: '輸入框的提示文字', table: { defaultValue: { summary: "'搜尋'" } } },
    autoActivateFirst: { control: 'boolean', description: '有結果就先選中第一列', table: { defaultValue: { summary: 'false' } } },
    wrap: { control: 'boolean', description: '上下鍵到頭尾時繞回另一端', table: { defaultValue: { summary: 'false' } } },
    showHints: { control: 'boolean', description: '底部的按鍵提示', table: { defaultValue: { summary: 'true' } } },
    selectHint: { control: 'text', description: '按鍵提示裡 Enter 後面的字', table: { defaultValue: { summary: "'選取'" } } },
    itemSelect: { action: 'itemSelect' },
    querySubmit: { action: 'querySubmit' },
    closeRequest: { action: 'closeRequest' },
  },
};

export default meta;
type Story = StoryObj<CommandPaletteComponent>;

/** 範例用的假資料：名稱、編號都是編的 */
const ITEMS: ResultListItem<{ code: string }>[] = [
  { id: 'P1031', label: '項目 A', data: { code: 'P1031' } },
  { id: 'P1047', label: '項目 B', data: { code: 'P1047' } },
  { id: 'P1052', label: '項目 C', data: { code: 'P1052' } },
  { id: 'P1068', label: '項目 D', data: { code: 'P1068' } },
  { id: 'P1074', label: '項目 E', data: { code: 'P1074' } },
];

const find = (q: string): ResultListGroup[] => {
  const k = (q ?? '').trim().toLowerCase();
  if (!k) return [];
  const hit = ITEMS.filter(i => i.label.toLowerCase().includes(k) || i.id.toLowerCase().includes(k));
  return hit.length ? [{ id: 'results', items: hit }] : [];
};
const stateOf = (q: string): ResultListState => (!(q ?? '').trim() || find(q).length ? 'ready' : 'empty');

const NOTE = 'color:#535353;font-size:12px;margin:8px 0 0';

// ── 預設：打字就篩選 ──────────────────────────────────────
export const Default: Story = {
  name: '預設',
  args: { ariaLabel: '搜尋項目', placeholder: '輸入名稱或編號，例如「項目」或 P10', autoActivateFirst: false, wrap: false, showHints: true, selectHint: '選取' },
  render: (args) => ({
    props: { ...args, open: false, keyword: '', picked: '', find, stateOf },
    moduleMetadata: { imports: [ButtonComponent] },
    template: `
      <app-button variant="outlined" color="neutral" size="M" text="搜尋項目" leftIcon="Search"
        ariaHaspopup="dialog" (btnClick)="open = true"></app-button>
      <p style="${NOTE}">選了：{{ picked || '（還沒選）' }}</p>

      <app-command-palette [ariaLabel]="ariaLabel" [placeholder]="placeholder" [isOpen]="open"
        [(query)]="keyword" [groups]="find(keyword)" [state]="stateOf(keyword)"
        [emptyText]="'找不到「' + keyword + '」的相關結果'"
        [autoActivateFirst]="autoActivateFirst" [wrap]="wrap" [showHints]="showHints" [selectHint]="selectHint"
        (itemSelect)="picked = $event.label; open = false; itemSelect($event)"
        (querySubmit)="querySubmit($event)"
        (closeRequest)="open = false; closeRequest($event)"></app-command-palette>
    `,
  }),
};

// ── 還沒打字時列出最近開啟；列的內容自己畫；右邊放按鈕 ────
export const RecentAndCustomRow: Story = {
  name: '最近開啟、自訂列、右邊放按鈕',
  render: () => ({
    props: {
      open: false, keyword: '', picked: '', find, stateOf,
      recent: [{ id: 'recent', label: '最近開啟', items: ITEMS.slice(0, 2) }] as ResultListGroup[],
    },
    moduleMetadata: { imports: [ButtonComponent, LabelComponent] },
    template: `
      <ng-template #row let-item>
        <app-label color="GreyOutline" size="S" [text]="item.data.code"></app-label>
        <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">{{ item.label }}</span>
      </ng-template>

      <app-button variant="outlined" color="neutral" size="M" text="搜尋項目" leftIcon="Search"
        ariaHaspopup="dialog" (btnClick)="open = true"></app-button>
      <p style="${NOTE}">選了：{{ picked || '（還沒選）' }}</p>

      <app-command-palette ariaLabel="搜尋項目" placeholder="輸入名稱或編號" [isOpen]="open"
        [(query)]="keyword" [groups]="keyword.trim() ? find(keyword) : recent" [state]="stateOf(keyword)"
        [emptyText]="'找不到「' + keyword + '」的相關結果'" [itemTemplate]="row" selectHint="開啟"
        (itemSelect)="picked = $event.label; open = false"
        (closeRequest)="open = false">
        <app-button paletteEnd variant="outlined" color="primary" size="M" text="搜尋"></app-button>
      </app-command-palette>
    `,
  }),
};

// ── 載入中與載入失敗 ──────────────────────────────────────
export const LoadingAndError: Story = {
  name: '載入中、載入失敗',
  render: () => ({
    props: { open: false, state: 'loading' as ResultListState, retried: 0 },
    moduleMetadata: { imports: [ButtonComponent] },
    template: `
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <app-button variant="outlined" color="neutral" size="M" text="打開：載入中"
          ariaHaspopup="dialog" (btnClick)="state = 'loading'; open = true"></app-button>
        <app-button variant="outlined" color="neutral" size="M" text="打開：載入失敗"
          ariaHaspopup="dialog" (btnClick)="state = 'error'; open = true"></app-button>
      </div>
      <p style="${NOTE}">按了重試 {{ retried }} 次</p>

      <app-command-palette ariaLabel="搜尋項目" [isOpen]="open" query="項目" [state]="state"
        errorTitle="搜尋失敗" errorDescription="請再試一次"
        (retry)="retried = retried + 1" (closeRequest)="open = false"></app-command-palette>
    `,
  }),
};
