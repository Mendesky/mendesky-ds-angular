import type { Meta, StoryObj } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { CheckboxComponent } from '../../../../index';

const CAPTION_STYLE = 'font-size:11px;color:#686868;';

const meta: Meta<CheckboxComponent> = {
  title: '互動元件/Checkbox',
  id: 'checkbox',
  component: CheckboxComponent,
  tags: ['autodocs'],
  argTypes: {
    checked: {
      control: 'boolean',
      description: '全有',
      table: { defaultValue: { summary: 'false' } },
    },
    indeterminate: {
      control: 'boolean',
      description: '部分；為 true 時優先顯示「部分」，不管 checked 是什麼',
      table: { defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'select',
      options: ['s', 'm', 'l'],
      description: 's（框約 16.7px）／m（框 20px）／l（框約 23.3px）',
      table: { defaultValue: { summary: 'm' } },
    },
    label: {
      control: 'text',
      description: '框右邊的文字；點文字也算點勾選框。可省略',
    },
    ariaLabel: {
      control: 'text',
      description: '沒有 label 時一定要給，讀螢幕軟體才唸得出這是什麼',
    },
    disabled: {
      control: 'boolean',
      description: '停用',
      table: { defaultValue: { summary: 'false' } },
    },
    checkedChange: { action: 'checkedChange' },
  },
};

export default meta;
type Story = StoryObj<CheckboxComponent>;

// ── 主範例：可用 Controls 調整狀態、尺寸與文字 ──────────────
// 文字取自 checkbox.docs.ts／checkbox.component.spec.ts 的範例
export const Default: Story = {
  name: '預設',
  args: {
    checked: false,
    indeterminate: false,
    size: 'm',
    label: '報價案件管理',
    ariaLabel: '',
    disabled: false,
  },
};

// ── 三態：沒有／全有／部分 ─────────────────────────────────
export const AllStates: Story = {
  name: '三種狀態',
  render: () => ({
    template: `
      <div style="display:flex;gap:32px;align-items:flex-start;">
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <app-checkbox [checked]="false" ariaLabel="沒有"></app-checkbox>
          <span style="${CAPTION_STYLE}">沒有</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <app-checkbox [checked]="true" ariaLabel="全有"></app-checkbox>
          <span style="${CAPTION_STYLE}">全有</span>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;gap:6px;">
          <app-checkbox [indeterminate]="true" ariaLabel="部分"></app-checkbox>
          <span style="${CAPTION_STYLE}">部分（只能由呼叫端給）</span>
        </div>
      </div>
    `,
    moduleMetadata: { imports: [CheckboxComponent] },
  }),
};

// ── 尺寸 ───────────────────────────────────────────────────
export const Sizes: Story = {
  name: '尺寸',
  render: () => ({
    template: `
      <div style="display:flex;gap:32px;align-items:center;">
        <app-checkbox size="s" [checked]="true" label="s"></app-checkbox>
        <app-checkbox size="m" [checked]="true" label="m（預設）"></app-checkbox>
        <app-checkbox size="l" [checked]="true" label="l"></app-checkbox>
      </div>
    `,
    moduleMetadata: { imports: [CheckboxComponent] },
  }),
};

// ── 停用 ───────────────────────────────────────────────────
export const Disabled: Story = {
  name: '停用',
  render: () => ({
    template: `
      <div style="display:flex;gap:32px;align-items:center;">
        <app-checkbox [disabled]="true" [checked]="false" label="沒有"></app-checkbox>
        <app-checkbox [disabled]="true" [checked]="true" label="全有"></app-checkbox>
        <app-checkbox [disabled]="true" [indeterminate]="true" label="部分"></app-checkbox>
      </div>
    `,
    moduleMetadata: { imports: [CheckboxComponent] },
  }),
};

// ── ngModel 雙向綁定（沒有文字時給 ariaLabel） ──────────────
export const WithNgModel: Story = {
  name: 'ngModel 雙向綁定',
  render: () => ({
    props: { selected: false },
    template: `
      <div style="display:flex;flex-direction:column;gap:12px;align-items:flex-start;">
        <app-checkbox size="s" [(ngModel)]="selected" ariaLabel="選取這一列"></app-checkbox>
        <span style="font-size:12px;color:#686868;">目前值：{{ selected }}</span>
      </div>
    `,
    moduleMetadata: { imports: [CheckboxComponent, FormsModule] },
  }),
};

// ── 分類列：「部分」由呼叫端依子項算出來 ─────────────────────
export const GroupWithChildren: Story = {
  name: '分類列（部分勾選）',
  render: () => {
    const items = [
      { label: '選項一', checked: true },
      { label: '選項二', checked: false },
      { label: '選項三', checked: false },
    ];
    return {
      props: {
        items,
        allChecked: () => items.every((i) => i.checked),
        someChecked: () => items.some((i) => i.checked) && !items.every((i) => i.checked),
        toggleAll: (v: boolean) => items.forEach((i) => (i.checked = v)),
      },
      template: `
        <div style="display:flex;flex-direction:column;gap:8px;">
          <app-checkbox
            label="全選"
            [checked]="allChecked()"
            [indeterminate]="someChecked()"
            (checkedChange)="toggleAll($event)">
          </app-checkbox>
          <div style="display:flex;flex-direction:column;gap:8px;padding-left:28px;">
            @for (item of items; track item.label) {
              <app-checkbox
                size="s"
                [label]="item.label"
                [checked]="item.checked"
                (checkedChange)="item.checked = $event">
              </app-checkbox>
            }
          </div>
        </div>
      `,
      moduleMetadata: { imports: [CheckboxComponent] },
    };
  },
};
