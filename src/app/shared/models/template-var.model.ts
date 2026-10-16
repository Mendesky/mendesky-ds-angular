/** 範本變數定義（template-editor info panel + p4-contract.model 共用） */
export interface TemplateVarDef {
  /** 變數 key，對應 %key% 語法 */
  key: string;
  /** 中文顯示標籤 */
  label: string;
  /** 分組 */
  group: string;
  /** 同位置可切換的多版本選項（glance），由後端 TemplateVariableEntry.glance 映射而來 */
  glance?: { optionName: string; groupKey: string; isDefault: boolean };
  /** 若存在，此變數在 template-editor 內渲染為可下拉切換的 select chip（參考 app-template-editor） */
  options?: { label: string; value: string }[];
}

/**
 * 範本變數面板頂部的兩層選擇：先選一個 context，再選它底下的一個 option。
 * 使用端決定兩層各代表什麼，面板上的文字見 TEMPLATE_VAR_CONTEXT_TEXT。
 * id 只當內部 metadata，畫面一律顯示 label。
 */
export interface TemplateVarContext {
  id: string;
  label: string;
  /** 這個 context 底下可選的 option */
  options: { id: string; label: string }[];
}
