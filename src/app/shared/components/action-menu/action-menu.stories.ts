import type { Meta, StoryObj } from '@storybook/angular';
import { ActionMenuComponent, ButtonComponent, CheckChipComponent, MenuItemComponent } from '../../../../index';

const meta: Meta<ActionMenuComponent> = {
  title: '展示元件/Action Menu',
  id: 'action-menu',
  component: ActionMenuComponent,
  tags: ['autodocs'],
  decorators: [
    (storyFn) => ({
      ...storyFn(),
      template: `
        <div style="position:relative;display:inline-block;padding-bottom:220px;">
          ${(storyFn() as any).template}
        </div>
      `,
    }),
  ],
  parameters: {
    docs: {
      description: {
        component: `
頁面操作選單的浮層外殼（Shell Component）。提供 Glass Morphism 視覺樣式、進場動畫與 z-index 層級。

**適用**：卡片「更多」操作選單、排序這類從幾個值裡選一個的選單（選項放 \`app-menu-item\`），以及 ctrl-bar 按鈕點擊後的篩選面板（放 \`app-check-chip\`、\`app-button\`）。

**不適用**：表單類 popover（請用 \`app-select\`、\`app-autocomplete\` 等）。

---

### 內容元件規範

| 使用情境 | 元件 | 寫法 |
|---|---|---|
| 選單的選項（執行一個動作，或從幾個值裡選一個） | \`app-menu-item\` | 一般動作不設 selected；單選項選中的設 true，其他設 false |
| 危險操作（刪除、封存、撤回已送出的申請） | \`app-menu-item\` | \`tone="danger" icon="Trash-Del"\` |
| 篩選面板的一般操作（清除篩選） | \`app-button\` | \`variant="elevated" size="S"\` |
| 搭配 check-chip 的確認動作（套用） | \`app-button\` | \`variant="filled" color="primary" size="S"\` |
| 多選篩選項目 | \`app-check-chip\` | \`theme="transparent-grey"\` |

> 放了 \`app-menu-item\` 才是選單：外框是 role="menu"，名稱用 \`ariaLabel\`，裡面不要再放 \`app-button\`。
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ActionMenuComponent>;

// ── 排序選單：一組單選，「還原預設」放在分隔線下的最後一列 ──────
export const SortOptions: Story = {
  name: '排序選單',
  render: () => ({
    template: `
      <app-action-menu ariaLabel="排序">
        @for (o of options; track o.value) {
          <app-menu-item [label]="o.label" [selected]="sort === o.value" (itemClick)="sort = o.value"></app-menu-item>
        }
        <div role="separator" style="height:1px;background:rgba(0,0,0,0.08);margin:4px 0;"></div>
        <app-menu-item label="還原預設" (itemClick)="sort = 'newest'"></app-menu-item>
      </app-action-menu>
    `,
    props: {
      sort: 'newest',
      options: [
        { value: 'newest', label: '由新到舊' },
        { value: 'oldest', label: '由舊到新' },
        { value: 'name-asc', label: '名稱 A→Z' },
      ],
    },
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent] },
  }),
};

// ── check-chip 篩選 + elevated 清除 + filled primary 套用（沒放 app-menu-item，不是選單） ──
export const CheckChipWithFooter: Story = {
  name: 'Check-chip 篩選（含 footer）',
  render: () => ({
    template: `
      <app-action-menu style="min-width:220px">
        <div style="font-size:11px;font-weight:600;color:#939393;letter-spacing:0.05em;padding:4px 8px 2px;">負責同仁</div>
        <div style="display:flex;flex-direction:column;gap:4px;padding:2px 0;">
          <app-check-chip text="林大明" theme="transparent-grey" size="xs" [ngModel]="true"></app-check-chip>
          <app-check-chip text="廖建明" theme="transparent-grey" size="xs" [ngModel]="false"></app-check-chip>
          <app-check-chip text="胡廷棋" theme="transparent-grey" size="xs" [ngModel]="false"></app-check-chip>
        </div>
        <div style="display:flex;align-items:center;gap:8px;padding:6px 0 0;border-top:1px solid rgba(0,0,0,0.06);margin-top:4px;">
          <app-button variant="elevated" size="S" text="清除篩選"></app-button>
          <app-button variant="filled" color="primary" size="S" text="套用"></app-button>
        </div>
      </app-action-menu>
    `,
    moduleMetadata: { imports: [ActionMenuComponent, ButtonComponent, CheckChipComponent] },
  }),
};

// ── 危險操作（app-menu-item tone="danger"） ─────────────────
export const DangerActions: Story = {
  name: '危險操作（刪除 / 封存 / 撤回）',
  render: () => ({
    template: `
      <app-action-menu ariaLabel="更多操作">
        <app-menu-item label="編輯項目" icon="Edit"></app-menu-item>
        <div role="separator" style="height:1px;background:rgba(0,0,0,0.08);margin:4px 0;"></div>
        <app-menu-item label="封存項目" icon="Archive" tone="danger"></app-menu-item>
        <app-menu-item label="刪除項目" icon="Trash-Del" tone="danger"></app-menu-item>
      </app-action-menu>
    `,
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent] },
  }),
};

// ── 日期快速選項：一組單選，「清除篩選」放在分隔線下的最後一列 ─────
export const DateShortcuts: Story = {
  name: '日期快速選項',
  render: () => ({
    template: `
      <app-action-menu ariaLabel="快速選擇" style="min-width:260px">
        @for (d of ranges; track d) {
          <app-menu-item [label]="'最近 ' + d + ' 天'" [selected]="days === d" (itemClick)="days = d"></app-menu-item>
        }
        <div role="separator" style="height:1px;background:rgba(0,0,0,0.08);margin:4px 0;"></div>
        <app-menu-item label="清除篩選" (itemClick)="days = null"></app-menu-item>
      </app-action-menu>
    `,
    props: { days: 7, ranges: [7, 14, 30] },
    moduleMetadata: { imports: [ActionMenuComponent, MenuItemComponent] },
  }),
};
