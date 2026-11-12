import type { Meta, StoryObj } from '@storybook/angular';
import {
  CheckboxComponent, CollapsibleComponent, IconBtnComponent, IconComponent, LabelComponent,
} from '../../../../index';

const meta: Meta<CollapsibleComponent> = {
  title: '互動元件/Collapsible',
  id: 'collapsible',
  component: CollapsibleComponent,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text', description: '標題文字（必填）' },
    appearance: {
      control: 'radio',
      options: ['section', 'card', 'accent'],
      description: '外觀：section 大段落、card 卡片標頭、accent 可以拖曳排序的段落',
      table: { defaultValue: { summary: "'section'" } },
    },
    chevronPosition: {
      control: 'radio',
      options: ['start', 'end'],
      description: '箭頭位置',
      table: { defaultValue: { summary: "'start'" } },
    },
    disabled: { control: 'boolean', description: '停用', table: { defaultValue: { summary: 'false' } } },
    headingLevel: { control: 'number', description: '標題層級 1–6；null 不包 role="heading"', table: { defaultValue: { summary: 'null' } } },
    expanded: { control: 'boolean', description: '是否展開', table: { defaultValue: { summary: 'false' } } },
    expandedChange: { action: 'expandedChange' },
  },
};

export default meta;
type Story = StoryObj<CollapsibleComponent>;

/** 範例用的內容區：頁面自己決定內距 */
const BODY = `<div style="padding:12px 16px;color:#686868">這一段的內容。收起來時鍵盤進不去、報讀軟體不念。</div>`;
/** 卡片外框：8px 圓角、1px 外框，不裁切超出的部分。卡片、綠色的標頭自己是 7px 圓角，底色和焦點框順著轉角 */
const CARD = 'border:1px solid #e7e7e7;border-radius:8px;background:#fff';

// ── 一般：頁面上的大段落 ─────────────────────────────────
export const Default: Story = {
  name: '一般',
  args: { title: '第一段', appearance: 'section', chevronPosition: 'start', disabled: false, headingLevel: null, expanded: true },
  render: (args) => ({
    props: args,
    template: `
      <div style="max-width:560px">
        <app-collapsible [title]="title" [appearance]="appearance" [chevronPosition]="chevronPosition"
          [disabled]="disabled" [headingLevel]="headingLevel" [(expanded)]="expanded"
          (expandedChange)="expandedChange($event)">${BODY}</app-collapsible>
        <app-collapsible title="第二段">${BODY}</app-collapsible>
        <app-collapsible title="第三段">${BODY}</app-collapsible>
      </div>
    `,
  }),
};

// ── 三種外觀：區段、卡片、綠色 ─────────────────────────────
export const Appearances: Story = {
  name: '三種外觀',
  render: () => ({
    template: `
      <div style="max-width:560px;display:flex;flex-direction:column;gap:24px">
        <div>
          <app-collapsible title="區段：頁面上的大段落" [expanded]="true">${BODY}</app-collapsible>
          <app-collapsible title="區段：第二段">${BODY}</app-collapsible>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px">
          <div style="${CARD}"><app-collapsible appearance="card" title="卡片：項目 A" [expanded]="true">${BODY}</app-collapsible></div>
          <div style="${CARD}"><app-collapsible appearance="card" title="卡片：項目 B">${BODY}</app-collapsible></div>
        </div>
        <div style="${CARD}">
          <app-collapsible appearance="accent" title="綠色：可以拖曳排序的段落">${BODY}</app-collapsible>
        </div>
      </div>
    `,
  }),
};

// ── 前置與尾端：點它們不會開合 ──────────────────────────────
export const WithActions: Story = {
  name: '前置與尾端',
  render: () => ({
    props: { picked: false },
    moduleMetadata: { imports: [CheckboxComponent, IconBtnComponent, IconComponent, LabelComponent] },
    template: `
      <div style="max-width:560px;display:flex;flex-direction:column;gap:8px">
        <div style="${CARD}">
          <app-collapsible appearance="card" title="項目 A">
            <app-checkbox collapsibleLeading size="s" [checked]="picked" ariaLabel="選取項目 A"
              (checkedChange)="picked = $event"></app-checkbox>
            <app-label collapsibleMeta size="S" text="3 項"></app-label>
            <span collapsibleSummary>收合時的一行摘要</span>
            <span collapsibleValue>$ 1,200</span>
            <app-icon-btn collapsibleTrailing size="16" propClass="SectionBtn" ariaLabel="更多操作">
              <app-icon name="More" size="16"></app-icon>
            </app-icon-btn>
            ${BODY}
          </app-collapsible>
        </div>
        <div style="${CARD}">
          <app-collapsible appearance="accent" title="段落一">
            <span collapsibleLeading aria-hidden="true" style="display:inline-flex;cursor:grab">
              <app-icon name="DragDrop" size="16" style="color:currentColor"></app-icon>
            </span>
            <span collapsibleSummary>段落一的第一行預覽</span>
            <app-icon-btn collapsibleTrailing size="16" propClass="SectionBtn" ariaLabel="刪除段落一">
              <app-icon name="Trash-Del" size="16"></app-icon>
            </app-icon-btn>
            ${BODY}
          </app-collapsible>
        </div>
      </div>
    `,
  }),
};

// ── 箭頭在右邊：同一頁放同一邊 ─────────────────────────────
export const ChevronEnd: Story = {
  name: '箭頭在右邊',
  render: () => ({
    template: `
      <div style="max-width:560px">
        <app-collapsible chevronPosition="end" title="第一段" [expanded]="true">${BODY}</app-collapsible>
        <app-collapsible chevronPosition="end" title="第二段">${BODY}</app-collapsible>
      </div>
    `,
  }),
};

// ── 停用：點了、按鍵都不開合，維持原來的開合 ────────────────
export const Disabled: Story = {
  name: '停用',
  render: () => ({
    template: `
      <div style="max-width:560px;display:flex;flex-direction:column;gap:16px">
        <div>
          <app-collapsible title="一般的段落">${BODY}</app-collapsible>
          <app-collapsible title="停用的段落" [disabled]="true">${BODY}</app-collapsible>
        </div>
        <div style="${CARD}">
          <app-collapsible appearance="card" title="停用的卡片" [disabled]="true">${BODY}</app-collapsible>
        </div>
        <div style="${CARD}">
          <app-collapsible appearance="accent" title="停用的綠色段落" [disabled]="true">${BODY}</app-collapsible>
        </div>
      </div>
    `,
  }),
};
