import type { Meta, StoryObj } from '@storybook/angular';
import { ProseMirrorJSON, RichTextEditorComponent, RichTextEditorTool } from '../../../../index';

// 範例內容是中性的示意文字，用來展示各種格式（標題／清單／行內格式／文字顏色／含 rowspan 的表格）
// 與工具列組合。templateVariable / imageAsset 這類節點屬於 wrapper 注入的 extension，base 不認得，範例不放。

/** 標題 + 項目符號 + 編號列表 */
const situationDoc: ProseMirrorJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '追蹤事項' }] },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '確認上線時程' }] }] },
      ],
    },
    {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '整理需求清單' }] }] },
      ],
    },
  ],
};

/** 唯讀檢視：純文字段落 + 各種行內格式 */
const formattedDoc: ProseMirrorJSON = {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: '以生鮮食品為主的電商公司' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: '粗', marks: [{ type: 'bold' }] },
        { type: 'text', text: '斜', marks: [{ type: 'italic' }] },
        { type: 'text', text: '刪', marks: [{ type: 'strike' }] },
        { type: 'text', text: '底線', marks: [{ type: 'underline' }] },
        { type: 'text', text: '紅', marks: [{ type: 'textStyle', attrs: { color: '#cc5252' } }] },
      ],
    },
  ],
};

/** 標題 + 清單 + 含 rowspan 的表格 */
const tableDoc: ProseMirrorJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '費用說明' }] },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '基本版', marks: [{ type: 'bold' }] }] }],
        },
        {
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: '進階版', marks: [{ type: 'textStyle', attrs: { color: '#cc5252' } }] }],
          }],
        },
      ],
    },
    {
      type: 'table',
      content: [
        {
          type: 'tableRow',
          content: [
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '規模' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '項目' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '金額' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', attrs: { rowspan: 2 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '大型' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '設計' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '130000' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '開發' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '160000' }] }] },
          ],
        },
      ],
    },
  ],
};

/** 只有項目符號 */
const serviceContentDoc: ProseMirrorJSON = {
  type: 'doc',
  content: [{
    type: 'bulletList',
    content: [
      { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '每月例行維護' }] }] },
    ],
  }],
};

const TRACKING_PLACEHOLDER =
  '請輸入未來預期及追蹤事項，例如後續的發展方向、潛在的風險、以及需要進一步確認的問題：下一季預計擴編團隊、新據點還在確認地點…目前尚待確認的部分 1.上線時程 2.預算上限…';
const BACKGROUND_PLACEHOLDER =
  '請輸入背景說明，例如：以生鮮食品為主的電商公司、主要業務為 B2C，需要處理商品的進貨、銷售、庫存等相關事宜…';
const LIST_PLACEHOLDER = '列出這個項目包含的內容，會顯示在匯出的文件裡';

const ALL_TOOLS: RichTextEditorTool[] = ['heading', 'bold', 'italic', 'strike', 'underline', 'color', 'table'];
/** 只留清單的 hiddenTools */
const LIST_ONLY_HIDDEN_TOOLS: RichTextEditorTool[] = ['heading', 'bold', 'italic', 'strike', 'underline', 'color', 'table'];

const meta: Meta<RichTextEditorComponent> = {
  title: '表單元件/Rich Text Editor',
  id: 'rich-text-editor',
  component: RichTextEditorComponent,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'object',
      description: 'Tiptap 文件 JSON（ProseMirrorJSON）；null 時顯示空編輯器',
      table: { defaultValue: { summary: 'null' } },
    },
    placeholder: {
      control: 'text',
      description: '空白時顯示的佔位文字（初始化時讀取）',
      table: { defaultValue: { summary: "''" } },
    },
    readOnly: {
      control: 'boolean',
      description: '唯讀：隱藏 toolbar、禁止編輯／貼上／拖放（初始化時讀取）',
      table: { defaultValue: { summary: 'false' } },
    },
    hiddenTools: {
      control: { type: 'check' },
      options: ALL_TOOLS,
      description: '要隱藏的工具；按鈕與對應 extension 一併關閉（初始化時讀取）',
      table: { defaultValue: { summary: '[]' } },
    },
    tableStructureEditing: {
      control: 'boolean',
      description: 'opt-in 表格結構編輯：hover 列／欄邊緣浮出把手（初始化時讀取）',
      table: { defaultValue: { summary: 'false' } },
    },
    extraExtensions: { control: false, description: '由 wrapper 注入的額外 Tiptap extension，範例不示範' },
    ignoredAttrs: { control: false, description: 'docEquals 比對時忽略的 attr key，範例不示範' },
    valueChange: { action: 'valueChange', description: '內容變更時 emit 新的 ProseMirrorJSON' },
    composedBlur: { action: 'composedBlur', description: '焦點離開整個編輯器（含 toolbar、浮層）時 emit' },
  },
  args: {
    value: situationDoc,
    placeholder: TRACKING_PLACEHOLDER,
    readOnly: false,
    hiddenTools: [],
    tableStructureEditing: false,
  },
  // placeholder / readOnly / hiddenTools / tableStructureEditing 只在 editor 建立時讀取。
  // 範例用 @for 的 track key：這幾個值改變時重建元件，Controls 調整才看得到效果；
  // value 有 ngOnChanges 處理，直接改就會更新。實際使用時直接綁定即可（見「程式碼範例」）。
  render: (args) => ({
    props: {
      ...args,
      remountKey: JSON.stringify([args.placeholder, args.readOnly, args.hiddenTools, args.tableStructureEditing]),
    },
    template: `
      <div style="max-width:640px;">
        @for (k of [remountKey]; track k) {
          <app-rich-text-editor
            [value]="value"
            [placeholder]="placeholder"
            [readOnly]="readOnly"
            [hiddenTools]="hiddenTools"
            [tableStructureEditing]="tableStructureEditing"
            (valueChange)="valueChange($event)"
            (composedBlur)="composedBlur()">
          </app-rich-text-editor>
        }
      </div>
    `,
    moduleMetadata: { imports: [RichTextEditorComponent] },
  }),
  // 範例 template 多包了一層 @for 重建殼，不適合當程式碼範例；改列實際用法（各變體另有覆寫）
  parameters: {
    docs: {
      source: {
        code: `<app-rich-text-editor
  [value]="situationDoc"
  placeholder="請輸入背景說明…"
  [readOnly]="readOnly"
  (valueChange)="onSituationChange($event)"
  (composedBlur)="onBlur()">
</app-rich-text-editor>`,
      },
    },
  },
};

/** 變體的程式碼範例 */
const sourceOf = (code: string) => ({ docs: { source: { code } } });

export default meta;
type Story = StoryObj<RichTextEditorComponent>;

// ── 主範例：標題＋清單的一般段落 ─────────────────────────────────
export const Default: Story = {
  name: '預設（一般段落）',
};

// ── 空白：顯示佔位文字 ───────────────────────────────────────────
export const Empty: Story = {
  name: '空白（顯示佔位文字）',
  args: { value: null, placeholder: BACKGROUND_PLACEHOLDER },
};

// ── 唯讀檢視 ─────────────────────────────────────────────────────
export const ReadOnly: Story = {
  name: '唯讀（檢視頁）',
  args: { value: formattedDoc, readOnly: true },
  parameters: sourceOf(`<app-rich-text-editor
  [readOnly]="true"
  [value]="section.doc">
</app-rich-text-editor>`),
};

// ── 精簡工具列：回報問題（Notion 不支援底線／顏色／表格）──────────
export const IssueReport: Story = {
  name: '隱藏底線／顏色／表格（回報問題）',
  args: { value: null, placeholder: '請詳細描述問題', hiddenTools: ['underline', 'color', 'table'] },
  parameters: sourceOf(`<app-rich-text-editor
  [value]="descriptionDoc()"
  placeholder="請詳細描述問題"
  [hiddenTools]="['underline', 'color', 'table']"
  (valueChange)="onDescriptionChange($event)"
  (composedBlur)="onDescriptionBlur()"
  (imagePasted)="onEditorImagePasted($event)">
</app-rich-text-editor>`),
};

// ── 只留清單 ─────────────────────────────────────────────────────
export const ListOnly: Story = {
  name: '只留清單工具',
  args: { value: serviceContentDoc, placeholder: LIST_PLACEHOLDER, hiddenTools: LIST_ONLY_HIDDEN_TOOLS },
  parameters: sourceOf(`<app-rich-text-editor
  [value]="serviceContentDoc()"
  placeholder="列出這個項目包含的內容，會顯示在匯出的文件裡"
  [hiddenTools]="contentHiddenTools"
  (valueChange)="onServiceContentInput($event)"
  (composedBlur)="onServiceContentBlur()">
</app-rich-text-editor>`),
};

// ── 表格結構編輯 ─────────────────────────────────────────────────
export const TableStructureEditing: Story = {
  name: '表格結構編輯',
  args: { value: tableDoc, placeholder: '', tableStructureEditing: true },
  // 包在 wrapper 內使用時的 base 部分
  parameters: sourceOf(`<app-rich-text-editor
  [value]="draft?.docJson ?? null"
  [placeholder]="placeholder"
  [readOnly]="readOnly"
  [tableStructureEditing]="true"
  (valueChange)="onBaseValueChange($event)"
  (composedBlur)="onBaseComposedBlur()">
</app-rich-text-editor>`),
};
