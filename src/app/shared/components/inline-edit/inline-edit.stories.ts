import type { Meta, StoryObj } from '@storybook/angular';
import { InlineEditComponent } from '../../../../index';

const meta: Meta<InlineEditComponent> = {
  title: '互動元件/Inline Edit',
  id: 'inline-edit',
  component: InlineEditComponent,
  tags: ['autodocs'],
  argTypes: {
    value: { control: 'text', description: '目前的值，由使用端持有' },
    ariaLabel: { control: 'text', description: '這段文字是什麼，例如「名稱」' },
    placeholder: { control: 'text', description: '值是空的時候顯示的提示文字' },
    size: {
      control: 'select',
      options: ['S', 'M'],
      description: '輸入框尺寸',
      table: { defaultValue: { summary: 'S' } },
    },
    errorMessage: { control: 'text', description: '有值就擋住送出並顯示訊息' },
    saving: { control: 'boolean', description: '使用端正在存檔', table: { defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', description: '停用', table: { defaultValue: { summary: 'false' } } },
    editing: { control: 'boolean', description: '是否在編輯中', table: { defaultValue: { summary: 'false' } } },
    commit: { action: 'commit' },
    cancel: { action: 'cancel' },
    draftChange: { action: 'draftChange' },
    editingChange: { action: 'editingChange' },
  },
};

export default meta;
type Story = StoryObj<InlineEditComponent>;

// ── 主範例：點文字 → 原地變輸入框 → Enter 或點到別處送出、Esc 放棄 ──
export const Default: Story = {
  name: '預設',
  render: () => ({
    props: { name: '第一季' },
    template: `
      <div class="noto-14-regular" style="color:#1c1c2e;">
        <app-inline-edit ariaLabel="名稱" [value]="name" (commit)="name = $event"></app-inline-edit>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};

// ── 尺寸：S、M。顯示文字的最小高度跟輸入框一樣，切換時那一列不會跳 ──
export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    props: { a: '尺寸 S', b: '尺寸 M' },
    template: `
      <div class="noto-14-regular" style="display:flex;flex-direction:column;gap:12px;color:#1c1c2e;">
        <app-inline-edit ariaLabel="名稱" size="S" [value]="a" (commit)="a = $event"></app-inline-edit>
        <app-inline-edit ariaLabel="名稱" size="M" [value]="b" (commit)="b = $event"></app-inline-edit>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};

// ── 沿用外層的字：放在標題裡就是標題的樣子 ──
export const InheritsTypography: Story = {
  name: '沿用外層的字',
  render: () => ({
    props: { title: '區塊標題', row: '清單項目' },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <div class="noto-16-medium" style="color:#1c1c2e;">
          <app-inline-edit ariaLabel="標題" [value]="title" (commit)="title = $event"></app-inline-edit>
        </div>
        <div class="noto-14-regular" style="color:#686868;">
          <app-inline-edit ariaLabel="名稱" [value]="row" (commit)="row = $event"></app-inline-edit>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};

// ── 儲存中：等伺服器成功才換值的使用端。送出後顯示新文字加轉圈，這裡用 1.5 秒模擬 ──
export const Saving: Story = {
  name: '儲存中',
  render: () => ({
    // 範例裡的函式會掛到範例元件上執行，所以用 this 讀寫狀態
    props: {
      name: '第一季',
      saving: false,
      rename(this: { name: string; saving: boolean }, next: string): void {
        this.saving = true;
        setTimeout(() => {
          this.name = next;
          this.saving = false;
        }, 1500);
      },
    },
    template: `
      <div class="noto-14-regular" style="display:flex;flex-direction:column;gap:12px;color:#1c1c2e;">
        <app-inline-edit ariaLabel="名稱" [value]="name" [saving]="saving" (commit)="rename($event)"></app-inline-edit>
        <app-inline-edit ariaLabel="名稱" value="固定顯示儲存中的樣子" [saving]="true"></app-inline-edit>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};

// ── 擋不合格的內容：清空後按 Enter 或點到別處都不會送出 ──
export const WithError: Story = {
  name: '有錯誤',
  render: () => ({
    props: {
      name: '第一季',
      error: '',
      check(this: { error: string }, draft: string): void {
        this.error = draft.trim() ? '' : '名稱不能空白';
      },
    },
    template: `
      <div class="noto-14-regular" style="color:#1c1c2e;padding-bottom:32px;">
        <app-inline-edit ariaLabel="名稱" [value]="name" [errorMessage]="error"
          (draftChange)="check($event)"
          (cancel)="check(name)"
          (commit)="name = $event">
        </app-inline-edit>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};

// ── 長文字：外層給最大寬度，文字用刪節號截斷，旁邊的按鈕不被擠掉 ──
export const LongText: Story = {
  name: '長文字',
  render: () => ({
    props: { name: '這是一段很長很長的名稱用來確認放不下的時候會用刪節號截斷' },
    template: `
      <div class="noto-14-regular" style="display:flex;align-items:center;gap:8px;max-width:280px;color:#1c1c2e;">
        <app-inline-edit style="flex:1;min-width:0;" ariaLabel="名稱" [value]="name" (commit)="name = $event"></app-inline-edit>
        <span style="flex:none;color:#686868;">旁邊的東西</span>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};

// ── 空值與停用 ──
export const EmptyAndDisabled: Story = {
  name: '空值與停用',
  render: () => ({
    props: { empty: '' },
    template: `
      <div class="noto-14-regular" style="display:flex;flex-direction:column;gap:12px;color:#1c1c2e;">
        <app-inline-edit ariaLabel="名稱" placeholder="未命名" [value]="empty" (commit)="empty = $event"></app-inline-edit>
        <app-inline-edit ariaLabel="名稱" value="沒有編輯權限時" [disabled]="true"></app-inline-edit>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};

// ── 從別的入口進入：由使用端控制 editing ──
export const ExternalTrigger: Story = {
  name: '從別的入口進入',
  render: () => ({
    props: { name: '第一季', editing: false },
    template: `
      <div class="noto-14-regular" style="display:flex;align-items:center;gap:12px;color:#1c1c2e;">
        <app-inline-edit ariaLabel="名稱" [value]="name" [(editing)]="editing" (commit)="name = $event"></app-inline-edit>
        <button type="button" (click)="editing = true">重新命名</button>
      </div>
    `,
    moduleMetadata: { imports: [InlineEditComponent] },
  }),
};
