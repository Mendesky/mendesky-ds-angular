import type { ComponentDoc } from '../../../../docs/component-doc';

export const templateEditorDoc: ComponentDoc = {
  id: 'template-editor',
  name: 'Template Editor',
  selector: 'app-template-editor',
  group: '表單元件',
  summary: 'contenteditable 富文字編輯器，%PascalCase% 範本變數渲染為藍色 badge。template variables minRows · placeholder errorMessage disabled · (templateChange) (textChange)',
  when: '含範本變數的可編輯文字欄位（如 P5 信件及同意函、P4 合約備註）。與 app-textarea 功能相似但支援 inline badge。',
  props: [
    {
      name: 'template',
      type: 'string',
      default: "''",
      desc: '範本字串，含 %key% 標記，例：「茲將附上 %CompanyName% 有關 %ServiceItemNames% 之…」；canonical 變數清單見 ia-quoting templateVariables / p5TemplateVariables',
    },
    {
      name: 'variables',
      type: 'Record<string, string>',
      default: '{}',
      desc: '變數 map，key 對應 %key% 標記，值為藍色 badge 顯示文字；canonical 清單見 ia-quoting templateVariables',
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
      desc: '公司／方案選擇清單，傳給變數面板；空陣列時不顯示下拉',
    },
    {
      name: 'defaultCaseId',
      type: 'string | undefined',
      desc: '變數面板預設選取的公司',
    },
    {
      name: 'defaultBundleId',
      type: 'string | undefined',
      desc: '變數面板預設選取的方案',
    },
    {
      name: '(contextChange)',
      type: 'EventEmitter<{ caseId: string; bundleId: string }>',
      desc: '變數面板切換公司／方案時觸發，讓父層重算變數定義與值',
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
      label: '搭配 app-field，信件 To（單一變數）',
      code: `<app-field label="信件 To" [required]="true">
  <app-template-editor
    template="%DefaultToName%"
    [variables]="templateVars()"
    [minRows]="1"
    placeholder="請輸入公司名稱"
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
  CompanyName: this.companyName,
  ServiceItemNames: this.serviceModuleNames,
})) -->`,
    },
  ],
  notes: [
    '%key% 標記渲染為藍色圓角 badge（background: rgba(58,156,205,0.1)），contenteditable="false" 讓 badge 成原子元素（整刪不能部分編輯）',
    'variableDefs 中有 options 的變數渲染為 .tpl--select chip（右側顯示下拉 caret），點擊展開 app-action-menu；切換後以 atomic replace 更新該 chip textContent，不影響旁邊的純文字，並 emit (optionSelect)',
    '使用者刪除 badge 後轉為普通文字，失去自動同步效果',
    '打 %% 觸發 inline autocomplete：游標旁彈出 template-var-panel，可打中文/英文過濾、↑↓ 移動、Enter/點擊 選取插入 chip（ⓘ 面板亦保留）；打字輸入已知 %Key% 也會即時轉 chip',
    '插入 chip 以明確 Range 插入「chip + 後置 text node」，確保末尾 contenteditable=false chip 之後有游標落點（勿用 execCommand insertHTML，末尾會卡游標）',
    'variables 變更時只更新 span.textContent，不重建 innerHTML（保留游標位置）',
    'paste 事件攔截，只貼純文字防 XSS',
    '支援 Enter 斷行（white-space: pre-wrap）',
    'canonical 變數清單（23 個 key，三層 scope + glance + noteExtraVarDefs 3 筆）見 ia-quoting.js templateVariables；P5 binding map 見 ia-quoting.js p5TemplateVariables',
  ],
  customTables: [],
};
