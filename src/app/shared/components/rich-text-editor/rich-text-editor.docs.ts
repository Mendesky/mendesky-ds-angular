import type { ComponentApi } from '../../../../docs/component-doc';

export const richTextEditorDoc: ComponentApi = {
  id: 'rich-text-editor',
  selector: 'app-rich-text-editor',
  summary: 'Tiptap base 富文字編輯器。toolbar（標題/粗體/斜體/底線/刪除線/文字顏色/清單/表格，hiddenTools 可縮減）+ readOnly + placeholder + paste pipeline。一般富文字欄位直接用，需要圖片上傳或範本變數時在外面包一層 wrapper。',
  props: [
    {
      name: 'value',
      type: 'ProseMirrorJSON | null',
      default: 'null',
      desc: 'Tiptap 文件 JSON（見 prosemirror.model.ts 的 ProseMirrorJSON）；null 時顯示空編輯器',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "''",
      desc: '空白時顯示的佔位文字',
    },
    {
      name: 'readOnly',
      type: 'boolean',
      default: 'false',
      desc: '唯讀模式：隱藏 toolbar、禁用 contenteditable、paste、drop',
    },
    {
      name: 'extraExtensions',
      type: 'Extension[]',
      default: '[]',
      desc: '額外 Tiptap extension（如 ImageAssetNode、TemplateVariableNode）；由 wrapper 注入',
    },
    {
      name: 'ignoredAttrs',
      type: 'string[]',
      default: '[]',
      desc: "docEquals 比對時忽略的 attr key（例如會把 blob URL 寫進 displayUrl 的圖片上傳 wrapper 傳 ['displayUrl']）",
    },
    {
      name: 'hiddenTools',
      type: "ReadonlyArray<'underline' | 'color' | 'table'>",
      default: '[]',
      desc: '要隱藏的工具：按鈕 + 對應 extension 一併關閉（快捷鍵/貼上也進不了 schema）。消費端序列化目標不支援某格式時傳入——例如要轉成 Notion blocks 時傳全部三個（Notion 轉換不支援）；須於 editor 初始化前設定',
    },
    {
      name: 'tableStructureEditing',
      type: 'boolean',
      default: 'false',
      desc: 'opt-in 開啟 Notion 式表格結構編輯：hover/tap 列或欄邊緣浮出情境把手（app-rte-table-grip，portal 到 body），點開得增刪列欄 / 建立複本 / 清除內容選單，選單開啟時以 ProseMirror Decoration 高亮該列/欄操作範圍（整塊外框 + 淡底）。表頭列不出「上方插入列」、整表刪除不放選單。只在需要讓使用者調整表格結構的欄位傳 true；唯讀 view 不開。設計原則見 ds-patterns interaction.contextual-selection-toolbar',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<ProseMirrorJSON>',
      desc: 'Tiptap onUpdate 觸發；已排除 suppressEmit 情境',
      isOutput: true,
    },
    {
      name: '(composedBlur)',
      type: 'EventEmitter<void>',
      desc: '焦點離開整個 editor 元件時 emit（含 toolbar、panel）',
      isOutput: true,
    },
    {
      name: '(imagePasted)',
      type: 'EventEmitter<File>',
      desc: '剪貼簿或 drop 有圖片 File 時 emit；wrapper 自行處理上傳',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '一般段落欄位',
      code: `<app-rich-text-editor
  [value]="situationDoc"
  placeholder="請輸入背景說明…"
  [readOnly]="readOnly"
  (valueChange)="onSituationChange($event)"
  (composedBlur)="onBlur()">
</app-rich-text-editor>`,
    },
    {
      label: 'wrapper 注入額外按鈕',
      code: `<app-rich-text-editor [value]="draft?.docJson" ...>
  <ng-container extraToolbar>
    <app-icon-btn size="16" propClass="SectionBtn" tooltip="插入圖片" tooltipPos="Top" ariaLabel="插入圖片" (btnClick)="triggerImageUpload()">
      <app-icon name="Image" size="16"></app-icon>
    </app-icon-btn>
  </ng-container>
  <ng-container toolbarRight>
    <app-button variant="ghost" color="danger" size="S" leftIcon="Recover" text="重設" (btnClick)="restoreClick.emit()"></app-button>
  </ng-container>
</app-rich-text-editor>`,
    },
  ],
};
