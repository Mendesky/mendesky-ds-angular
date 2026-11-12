import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, CtrlBarComponent, ModalShellComponent, SearchFieldComponent } from '../../../../index';

const meta: Meta<SearchFieldComponent> = {
  title: '表單元件/Search Field',
  id: 'search-field',
  component: SearchFieldComponent,
  tags: ['autodocs'],
  argTypes: {
    ariaLabel: { control: 'text', description: '報讀名稱（必填）：這個框在搜什麼' },
    appearance: {
      control: 'radio',
      options: ['outline', 'embedded'],
      description: '外觀：outline 放工具列與表單；embedded 放搜尋對話框最上面那一列',
      table: { defaultValue: { summary: "'outline'" } },
    },
    size: {
      control: 'radio',
      options: ['S', 'M', 'L'],
      description: '高度 32／36／40 px（只對 outline 有效）',
      table: { defaultValue: { summary: "'M'" } },
    },
    placeholder: { control: 'text', description: '提示文字', table: { defaultValue: { summary: "'搜尋'" } } },
    value: { control: 'text', description: '框裡的字', table: { defaultValue: { summary: "''" } } },
    disabled: { control: 'boolean', description: '停用', table: { defaultValue: { summary: 'false' } } },
    valueChange: { action: 'valueChange' },
    searchSubmit: { action: 'searchSubmit' },
  },
};

export default meta;
type Story = StoryObj<SearchFieldComponent>;

/** 範例用的假資料：名字、編號、部門都是編的 */
const PEOPLE = [
  { id: 'P1031', name: '林雅婷', team: '設計部' },
  { id: 'P1047', name: '陳志豪', team: '資訊部' },
  { id: 'P1052', name: '黃怡君', team: '行政部' },
  { id: 'P1068', name: '張家豪', team: '設計部' },
  { id: 'P1074', name: '李佩珊', team: '資訊部' },
  { id: 'P1089', name: '王俊傑', team: '人資部' },
];

const filter = (q: string) => {
  const k = (q ?? '').trim().toLowerCase();
  return k ? PEOPLE.filter(p => p.name.includes(k) || p.id.toLowerCase().includes(k) || p.team.includes(k)) : PEOPLE;
};

const ROW = 'display:flex;justify-content:space-between;gap:12px;padding:8px 4px;border-bottom:1px solid #e7e7e7;color:#333';
const MUTED = 'color:#535353;font-size:12px';

// ── 預設：outline、尺寸 M ──────────────────────────────────
export const Default: Story = {
  name: '預設',
  args: { ariaLabel: '搜尋人員', appearance: 'outline', size: 'M', placeholder: '搜尋', value: '', disabled: false },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width:320px">
        <app-search-field [ariaLabel]="ariaLabel" [appearance]="appearance" [size]="size" [placeholder]="placeholder"
          [disabled]="disabled" [(value)]="value" (valueChange)="valueChange($event)"
          (searchSubmit)="searchSubmit($event)"></app-search-field>
      </div>
    `,
  }),
};

// ── 三種尺寸 ──────────────────────────────────────────────
export const Sizes: Story = {
  name: '三種尺寸',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;max-width:320px">
        <app-search-field size="S" ariaLabel="搜尋（S）" placeholder="S 32px"></app-search-field>
        <app-search-field size="M" ariaLabel="搜尋（M）" placeholder="M 36px"></app-search-field>
        <app-search-field size="L" ariaLabel="搜尋（L）" placeholder="L 40px"></app-search-field>
      </div>
    `,
  }),
};

// ── 狀態：空的、有字、停用 ─────────────────────────────────
export const States: Story = {
  name: '空的、有字、停用',
  render: () => ({
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;max-width:320px">
        <app-search-field ariaLabel="空的"></app-search-field>
        <app-search-field ariaLabel="有字" value="王俊傑"></app-search-field>
        <app-search-field ariaLabel="停用" value="王俊傑" [disabled]="true"></app-search-field>
      </div>
    `,
  }),
};

// ── 列表上方的工具列：打字就篩選，Enter 送出 ───────────────
export const Toolbar: Story = {
  name: '放在工具列',
  render: () => ({
    props: { keyword: '', submitted: null as string | null, filter },
    moduleMetadata: { imports: [CtrlBarComponent, ButtonComponent] },
    template: `
      <div style="max-width:640px">
        <app-ctrl-bar>
          <ng-container slot="left">
            <app-button variant="outlined" color="neutral" size="S" text="部門" rightIcon="DownArrow"></app-button>
            <span style="${MUTED}">共 {{ filter(keyword).length }} 筆</span>
          </ng-container>
          <ng-container slot="right">
            <app-search-field size="S" ariaLabel="搜尋人員" placeholder="搜尋姓名、編號、部門"
              style="width:240px"
              [(value)]="keyword" (searchSubmit)="submitted = $event"></app-search-field>
          </ng-container>
        </app-ctrl-bar>
        <div>
          @for (p of filter(keyword); track p.id) {
            <div style="${ROW}"><span>{{ p.name }}</span><span style="${MUTED}">{{ p.id }}・{{ p.team }}</span></div>
          } @empty {
            <div style="${ROW};justify-content:center;${MUTED}">找不到符合「{{ keyword }}」的人員</div>
          }
        </div>
        <p style="${MUTED}">按 Enter 送出：{{ submitted === null ? '（還沒按）' : '「' + submitted + '」' }}</p>
      </div>
    `,
  }),
};

// ── 搜尋對話框：embedded，有字時第一下 Esc 只清空 ──────────
export const InDialog: Story = {
  name: '放在搜尋對話框',
  render: () => ({
    props: { open: false, keyword: '', escCount: 0, filter },
    moduleMetadata: { imports: [ModalShellComponent, ButtonComponent] },
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;max-width:640px">
        <div style="border:1px solid #e7e7e7;border-radius:16px;overflow:hidden;background:#fff">
          <app-search-field appearance="embedded" ariaLabel="搜尋人員（靜態範例）" placeholder="搜尋姓名、編號、部門" value="林">
            <app-button searchFieldEnd variant="outlined" color="primary" size="M" text="搜尋"></app-button>
          </app-search-field>
          <div style="padding:16px 24px;${MUTED}">搜尋結果……</div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <app-button variant="filled" color="primary" size="S" text="打開對話框試 Esc"
            (btnClick)="keyword = '陳'; open = true"></app-button>
          <span style="${MUTED}">對話框收到 Esc 的次數：{{ escCount }}</span>
        </div>
      </div>

      <app-modal-shell [isOpen]="open" variant="search" width="min(640px, calc(100vw - 32px))" ariaLabel="搜尋人員"
        (backdropClick)="open = false" (escapePress)="escCount = escCount + 1; open = false">
        <app-search-field appearance="embedded" ariaLabel="搜尋人員" placeholder="搜尋姓名、編號、部門" [(value)]="keyword"></app-search-field>
        <div style="max-height:320px;overflow-y:auto;padding:8px 0">
          @for (p of filter(keyword); track p.id) {
            <div style="${ROW};padding:8px 24px"><span>{{ p.name }}</span><span style="${MUTED}">{{ p.id }}・{{ p.team }}</span></div>
          } @empty {
            <div style="padding:16px 24px;${MUTED}">找不到符合「{{ keyword }}」的人員</div>
          }
        </div>
        <p style="margin:0;padding:8px 24px 16px;${MUTED}">有字時按 Esc 只清空；清空後再按 Esc 才關掉對話框。</p>
      </app-modal-shell>
    `,
  }),
};
