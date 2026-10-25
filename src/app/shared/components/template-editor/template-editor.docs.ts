import type { ComponentApi } from '../../../../docs/component-doc';

export const templateEditorDoc: ComponentApi = {
  id: 'template-editor',
  selector: 'app-template-editor',
  summary: 'contenteditable 富文字編輯器，%PascalCase% 範本變數渲染為藍色 badge。template variables minRows · placeholder errorMessage disabled · (templateChange) (textChange)',
  props: [
    {
      name: 'template',
      type: 'string',
      default: "''",
      desc: '範本字串，含 %key% 標記，例：「附上 %DocumentTitle% 的 %ItemNames% 清單…」；有哪些變數由使用端定義',
    },
    {
      name: 'variables',
      type: 'Record<string, string>',
      default: '{}',
      desc: '變數 map，key 對應 %key% 標記，值為藍色 badge 顯示文字',
    },
    {
      name: 'variableDefs',
      type: 'TemplateVarDef[]',
      default: '[]',
      desc: '變數定義陣列；有 options 的變數渲染為可點擊的 select chip（.tpl--select），點擊展開 app-action-menu 供切換；沒有 options 的維持 readonly badge。def 查找含 parent-key fallback：variant chip（%Key|N%，後綴允許英數）找不到 exact def 時繼承 %Key% 的 def（glance 變體不需逐一建 def，插入面板也不會被 variant 灌噪音）。defs 動態變更（語意簽章 key+options 數變化）時自動重渲染做 plain↔select 升降級；編輯中擱置、blur 後補渲染',
    },
    {
      name: 'minRows',
      type: 'number',
      default: '2',
      desc: '最小顯示行數（1 ≈ input 高度，4–5 ≈ textarea 高度）',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "''",
      desc: '空白時顯示的佔位文字（CSS ::before 模擬）',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '錯誤訊息；有值時切換 error 狀態（appErrorTooltip）',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '禁用狀態（contenteditable="false"）',
    },
    {
      name: '(templateChange)',
      type: 'EventEmitter<string>',
      desc: '使用者編輯後 emit 帶 %key% 標記的 template 字串',
      isOutput: true,
    },
    {
      name: '(textChange)',
      type: 'EventEmitter<string>',
      desc: '使用者編輯後 emit 純文字（用於 filled 驗證）',
      isOutput: true,
    },
    {
      name: '(optionSelect)',
      type: 'EventEmitter<{ key: string; value: string }>',
      desc: 'select chip 選項切換後 emit；key 為變數 key，value 為所選 option.value（例：fuzzy|precise）',
      isOutput: true,
    },
    {
      name: 'varContexts',
      type: 'TemplateVarContext[]',
      default: '[]',
      desc: '變數面板頂部的兩層選擇清單（先選 context，再選它底下的 option）；空陣列時不顯示下拉。兩層的文字由使用端以 TEMPLATE_VAR_CONTEXT_TEXT 提供',
    },
    {
      name: 'defaultContextId',
      type: 'string | undefined',
      desc: '變數面板預設選取的 context id',
    },
    {
      name: 'defaultOptionId',
      type: 'string | undefined',
      desc: '變數面板預設選取的 option id',
    },
    {
      name: '(contextChange)',
      type: 'EventEmitter<{ contextId: string; optionId: string }>',
      desc: '變數面板切換 context／option 時觸發，讓父層重算變數定義與值',
      isOutput: true,
    },
    {
      name: '(blurChange)',
      type: 'EventEmitter<string>',
      desc: '失焦時送出目前的範本字串，供父層在失焦後儲存',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '搭配 app-field，收件者（單一變數）',
      code: `<app-field label="收件者" [required]="true">
  <app-template-editor
    template="%RecipientName%"
    [variables]="templateVars()"
    [minRows]="1"
    placeholder="請輸入收件者"
    [errorMessage]="fieldError('letter-to')"
    (textChange)="onTextChange('letter-to', $event)">
  </app-template-editor>
</app-field>`,
    },
    {
      label: '多變數混合範本（信件內容）',
      code: `<app-field label="信件內容" [required]="true">
  <app-template-editor
    [template]="letterContentTemplate"
    [variables]="templateVars()"
    [minRows]="5"
    placeholder="請輸入信件內容"
    [errorMessage]="fieldError('letter-content')"
    (textChange)="onTextChange('letter-content', $event)">
  </app-template-editor>
</app-field>

<!-- TS: templateVars = computed(() => ({
  DocumentTitle: this.documentTitle,
  ItemNames: this.itemNames,
})) -->`,
    },
  ],
  usageNotes: [
    '變數面板的分組標題與順序用 TEMPLATE_VAR_GROUPS 提供，兩層選擇器的文字用 TEMPLATE_VAR_CONTEXT_TEXT 提供，兩者皆在 app config 以 provider 設定一次。',
  ],
};
