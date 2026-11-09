import type { Meta, StoryObj } from '@storybook/angular';
import { ButtonComponent, TabsComponent } from '../../../../index';
import type { TabItem } from '../../../../index';

const GROUPS: TabItem[] = [
  { value: 'a', label: '第一組' },
  { value: 'b', label: '第二組' },
  { value: 'c', label: '第三組' },
];

const meta: Meta<TabsComponent> = {
  title: '互動元件/Tabs',
  id: 'tabs',
  component: TabsComponent,
  tags: ['autodocs'],
  argTypes: {
    items: { control: 'object', description: '頁籤：{ value, label, disabled?, status?: { label } }（必填）' },
    value: { control: 'text', description: '選中的頁籤的 value；null＝都沒選中', table: { defaultValue: { summary: 'null' } } },
    ariaLabel: { control: 'text', description: '頁籤列的名稱（必填）' },
    panelId: { control: 'text', description: '內容外框的 id；給了每個頁籤用 aria-controls 指向它', table: { defaultValue: { summary: "''" } } },
    valueChange: { action: 'valueChange' },
  },
};

export default meta;
type Story = StoryObj<TabsComponent>;

/** 範例用：點頁籤或用方向鍵切換時，把新值寫回 value，下方內容跟著換 */
const interactive = (extra = '', tabsAttrs = '') => `
  <div style="max-width:560px">
    <app-tabs #t ariaLabel="資料分組" panelId="story-panel" [items]="items" [value]="value"
      (valueChange)="value = $event; valueChange($event)" ${tabsAttrs}>${extra}</app-tabs>
    <div id="story-panel" role="tabpanel" [attr.aria-labelledby]="t.selectedTabId"
      style="padding:16px 4px;color:#686868">目前顯示：{{ value }}</div>
  </div>
`;

// ── 一般：左右方向鍵、Home、End 移動並選中 ─────────────────
export const Default: Story = {
  name: '一般',
  args: { items: GROUPS, value: 'a', ariaLabel: '資料分組', panelId: 'story-panel' },
  render: (args) => ({ props: args, template: interactive() }),
};

// ── 狀態標記：有東西要處理的那一組，文字右邊是紅色驚嘆號 ─────
export const WithStatus: Story = {
  name: '狀態標記',
  args: {
    items: [
      { value: 'a', label: '第一組', status: { label: '需處理' } },
      { value: 'b', label: '第二組', status: { label: '需處理' } },
      { value: 'c', label: '第三組' },
    ],
    value: 'a',
    ariaLabel: '資料分組',
  },
  render: (args) => ({ props: args, template: interactive() }),
};

// ── 停用：點了、方向鍵都選不到 ─────────────────────────────
export const Disabled: Story = {
  name: '停用',
  args: {
    items: [
      { value: 'a', label: '第一組' },
      { value: 'b', label: '第二組', disabled: true },
      { value: 'c', label: '第三組' },
    ],
    value: 'a',
    ariaLabel: '資料分組',
  },
  render: (args) => ({ props: args, template: interactive() }),
};

// ── 尾端自訂內容：「新增一組」按鈕在頁籤清單外面 ──────────────
export const WithTrailing: Story = {
  name: '尾端自訂內容',
  args: { items: GROUPS, value: 'a', ariaLabel: '資料分組' },
  render: (args) => ({
    props: args,
    template: interactive(`
      <app-button variant="ghost" color="neutral" size="S" leftIcon="Plus" text="新增一組"></app-button>
    `),
    moduleMetadata: { imports: [ButtonComponent] },
  }),
};

// ── 放不下：頁籤列左右捲動，不換行 ──────────────────────────
export const Overflow: Story = {
  name: '放不下時捲動',
  args: {
    items: Array.from({ length: 10 }, (_, i) => ({ value: i, label: `第 ${i + 1} 組` })),
    value: 0,
    ariaLabel: '資料分組',
  },
  render: (args) => ({
    props: args,
    template: `<div style="max-width:320px">${interactive()}</div>`,
  }),
};
