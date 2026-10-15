import type { Meta, StoryObj } from '@storybook/angular';
import { ActionMenuComponent, ButtonComponent, CheckChipComponent } from '../../../../index';

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

**適用**：ctrl-bar 按鈕點擊後的篩選選單、卡片「更多」操作選單。

**不適用**：表單類 popover（請用 \`app-select\`、\`app-autocomplete\` 等）。

---

### 內容元件規範

| 使用情境 | 元件 | variant / theme |
|---|---|---|
| 一般操作（清除、還原預設） | \`app-button\` | \`variant="elevated"\` |
| 搭配 check-chip 的確認動作（套用） | \`app-button\` | \`variant="filled" color="primary"\` |
| 危險操作（刪除、封存、撤回成交） | \`app-button\` | \`variant="ghost" color="danger"\` |
| 多選篩選項目 | \`app-check-chip\` | \`theme="transparent-grey"\` |

> \`app-button\` 尺寸統一用 **\`size="S"\`**（28px）
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<ActionMenuComponent>;

// ── 排序選單（純選項列表，無 footer） ─────────────────
export const SortOptions: Story = {
  name: '排序選單',
  render: () => ({
    template: `
      <app-action-menu>
        <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:5px;font-size:14px;color:#3a9ccd;font-weight:500;cursor:pointer;">
          <span style="width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;">✓</span>
          由新到舊
        </div>
        <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:5px;font-size:14px;color:#686868;cursor:pointer;">
          <span style="width:16px;height:16px;"></span>
          由舊到新
        </div>
        <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:5px;font-size:14px;color:#686868;cursor:pointer;">
          <span style="width:16px;height:16px;"></span>
          持續性費用 高→低
        </div>
      </app-action-menu>
    `,
    moduleMetadata: { imports: [ActionMenuComponent] },
  }),
};

// ── check-chip 篩選 + elevated 清除 + filled primary 套用 ──
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

// ── 危險操作（ghost danger） ─────────────────────────
export const DangerActions: Story = {
  name: '危險操作（刪除 / 封存 / 撤回）',
  render: () => ({
    template: `
      <app-action-menu>
        <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:5px;font-size:14px;color:#686868;cursor:pointer;">
          <span style="width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;">✏️</span>
          編輯案件
        </div>
        <div style="height:1px;background:rgba(0,0,0,0.08);margin:4px 0;"></div>
        <div style="padding:3px 0;display:flex;flex-direction:column;gap:2px;">
          <app-button variant="ghost" color="danger" size="S" text="封存案件" leftIcon="Archive" [fullWidth]="true"></app-button>
          <app-button variant="ghost" color="danger" size="S" text="刪除案件" leftIcon="Trash-Del" [fullWidth]="true"></app-button>
        </div>
      </app-action-menu>
    `,
    moduleMetadata: { imports: [ActionMenuComponent, ButtonComponent] },
  }),
};

// ── 日期快速選項（elevated 清除） ─────────────────────
export const DateShortcuts: Story = {
  name: '日期快速選項（elevated 清除）',
  render: () => ({
    template: `
      <app-action-menu style="min-width:260px">
        <div style="font-size:11px;font-weight:600;color:#939393;letter-spacing:0.05em;padding:4px 8px 2px;">快速選擇</div>
        <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:5px;font-size:14px;color:#3a9ccd;font-weight:500;cursor:pointer;">
          <span style="width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;font-size:12px;">✓</span>最近 7 天
        </div>
        <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:5px;font-size:14px;color:#686868;cursor:pointer;">
          <span style="width:16px;height:16px;"></span>最近 14 天
        </div>
        <div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:5px;font-size:14px;color:#686868;cursor:pointer;">
          <span style="width:16px;height:16px;"></span>最近 30 天
        </div>
        <div style="height:1px;background:rgba(0,0,0,0.08);margin:4px 0;"></div>
        <div style="display:flex;align-items:center;justify-content:flex-end;padding:6px 0 0;border-top:1px solid rgba(0,0,0,0.06);margin-top:4px;">
          <app-button variant="elevated" size="S" text="清除篩選"></app-button>
        </div>
      </app-action-menu>
    `,
    moduleMetadata: { imports: [ActionMenuComponent, ButtonComponent] },
  }),
};
