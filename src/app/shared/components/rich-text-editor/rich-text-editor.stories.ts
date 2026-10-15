import type { Meta, StoryObj } from '@storybook/angular';
import { ProseMirrorJSON, RichTextEditorComponent, RichTextEditorTool } from '../../../../index';

// 範例內容一律取自 dashboard-app 主線（Github/main）的實際用法與 spec fixture，不自行編寫：
// - 客戶狀況文件（標題／清單／粗斜刪底線／文字顏色）：
//     src/app/features/quoting-cases/services/situation-markdown.spec.ts
// - 酬金補充文件（標題＋清單＋含 rowspan 的表格）：
//     src/app/features/quoting-cases/services/fee-supplement-serializer.spec.ts
//     （原 fixture 內的 templateVariable / imageAsset 節點屬於 wrapper 注入的 extension，base 不認得，已拿掉）
// - 服務內容清單：p2-custom-wizard.component.spec.ts（「每月帳務」）
// - placeholder 與 hiddenTools：
//     P4-4 客戶狀況卡 p4-4-customer-situation-card.component.ts、
//     P2 服務內容 p2-item-card.component.ts（contentHiddenTools）、
//     回報問題 issue-report-dialog.component.html

/** P4-4「未來預期及追蹤事項」：標題 + 項目符號 + 編號列表 */
const situationDoc: ProseMirrorJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '追蹤事項' }] },
    {
      type: 'bulletList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '增資' }] }] },
      ],
    },
    {
      type: 'orderedList',
      content: [
        { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '廢棄物申報' }] }] },
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

/** 酬金補充：標題 + 清單 + 含 rowspan 的表格 */
const feeSupplementDoc: ProseMirrorJSON = {
  type: 'doc',
  content: [
    { type: 'heading', attrs: { level: 3 }, content: [{ type: 'text', text: '酬金說明' }] },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [{ type: 'paragraph', content: [{ type: 'text', text: '財務簽證', marks: [{ type: 'bold' }] }] }],
        },
        {
          type: 'listItem',
          content: [{
            type: 'paragraph',
            content: [{ type: 'text', text: '稅務簽證', marks: [{ type: 'textStyle', attrs: { color: '#cc5252' } }] }],
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
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '年度' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '簽證' }] }] },
            { type: 'tableHeader', content: [{ type: 'paragraph', content: [{ type: 'text', text: '報價' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', attrs: { rowspan: 2 }, content: [{ type: 'paragraph', content: [{ type: 'text', text: '5億' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '財簽' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '130000' }] }] },
          ],
        },
        {
          type: 'tableRow',
          content: [
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '稅簽' }] }] },
            { type: 'tableCell', content: [{ type: 'paragraph', content: [{ type: 'text', text: '160000' }] }] },
          ],
        },
      ],
    },
  ],
};

/** P2 服務內容：只有項目符號 */
const serviceContentDoc: ProseMirrorJSON = {
  type: 'doc',
  content: [{
    type: 'bulletList',
    content: [
      { type: 'listItem', content: [{ type: 'paragraph', content: [{ type: 'text', text: '每月帳務' }] }] },
    ],
  }],
};

const P4_4_TRACKING_PLACEHOLDER =
  '請輸入未來預期及追蹤事項，公司的發展方向、潛在的風險、以及需要進一步確認的問題，如：未來會有工廠（目前還在確認地點）、老闆有 3 個已成年的小孩、今年上市櫃公司預計增資 3,000 萬…目前尚有未報價部分 1.廢棄物容積申報 2.先進後退(進出口貿易)…';
const P4_4_BACKGROUND_PLACEHOLDER =
  '請輸入客戶背景概況，如：以生鮮食品為主的電商公司、主要業務為B2C，需要處理商品的進貨、銷售、庫存等相關事宜…';
const P2_SERVICE_PLACEHOLDER = '說明此服務項目的內容，會顯示在報價單與公費合約的服務範圍';

const ALL_TOOLS: RichTextEditorTool[] = ['heading', 'bold', 'italic', 'strike', 'underline', 'color', 'table'];
/** P2 服務內容的 contentHiddenTools：只留清單 */
const P2_CONTENT_HIDDEN_TOOLS: RichTextEditorTool[] = ['heading', 'bold', 'italic', 'strike', 'underline', 'color', 'table'];

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
    placeholder: P4_4_TRACKING_PLACEHOLDER,
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
  placeholder="請輸入客戶背景概況…"
  [readOnly]="readOnly"
  (valueChange)="onSituationChange($event)"
  (composedBlur)="onBlur()">
</app-rich-text-editor>`,
      },
    },
  },
};

/** 變體的程式碼範例（取自 dashboard-app 實際用法） */
const sourceOf = (code: string) => ({ docs: { source: { code } } });

export default meta;
type Story = StoryObj<RichTextEditorComponent>;

// ── 主範例：P4-4 客戶狀況（未來預期及追蹤事項）───────────────────
export const Default: Story = {
  name: '預設（客戶狀況段落）',
};

// ── 空白：顯示佔位文字 ───────────────────────────────────────────
export const Empty: Story = {
  name: '空白（顯示佔位文字）',
  args: { value: null, placeholder: P4_4_BACKGROUND_PLACEHOLDER },
};

// ── 唯讀檢視 ─────────────────────────────────────────────────────
export const ReadOnly: Story = {
  name: '唯讀（客戶檢視頁）',
  args: { value: formattedDoc, readOnly: true },
  // client-view-modal view-tab4
  parameters: sourceOf(`<app-rich-text-editor
  [readOnly]="true"
  [value]="section.doc">
</app-rich-text-editor>`),
};

// ── 精簡工具列：回報問題（Notion 不支援底線／顏色／表格）──────────
export const IssueReport: Story = {
  name: '隱藏底線／顏色／表格（回報問題）',
  args: { value: null, placeholder: '請詳細描述問題', hiddenTools: ['underline', 'color', 'table'] },
  // issue-report-dialog
  parameters: sourceOf(`<app-rich-text-editor
  [value]="descriptionDoc()"
  placeholder="請詳細描述問題"
  [hiddenTools]="['underline', 'color', 'table']"
  (valueChange)="onDescriptionChange($event)"
  (composedBlur)="onDescriptionBlur()"
  (imagePasted)="onEditorImagePasted($event)">
</app-rich-text-editor>`),
};

// ── 只留清單：P2 服務內容 ────────────────────────────────────────
export const ListOnly: Story = {
  name: '只留清單工具（服務內容）',
  args: { value: serviceContentDoc, placeholder: P2_SERVICE_PLACEHOLDER, hiddenTools: P2_CONTENT_HIDDEN_TOOLS },
  // p2-item-card（contentHiddenTools = ['heading', 'bold', 'italic', 'strike', 'underline', 'color', 'table']）
  parameters: sourceOf(`<app-rich-text-editor
  [value]="serviceContentDoc()"
  placeholder="說明此服務項目的內容，會顯示在報價單與公費合約的服務範圍"
  [hiddenTools]="contentHiddenTools"
  (valueChange)="onServiceContentInput($event)"
  (composedBlur)="onServiceContentBlur()">
</app-rich-text-editor>`),
};

// ── 表格結構編輯：酬金補充 ───────────────────────────────────────
export const TableStructureEditing: Story = {
  name: '表格結構編輯（酬金補充）',
  args: { value: feeSupplementDoc, placeholder: '', tableStructureEditing: true },
  // fee-supplement-editor（base 部分）
  parameters: sourceOf(`<app-rich-text-editor
  [value]="draft?.docJson ?? null"
  [placeholder]="placeholder"
  [readOnly]="readOnly"
  [tableStructureEditing]="true"
  (valueChange)="onBaseValueChange($event)"
  (composedBlur)="onBaseComposedBlur()">
</app-rich-text-editor>`),
};
