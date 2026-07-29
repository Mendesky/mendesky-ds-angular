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
 * 範本變數面板的「公司 / 方案」選擇 context（集團案件用）。
 * 由 quotingCase（公司）+ 其 standard bundles（方案）組成；panel 頂部兩個下拉的資料來源。
 * caseId / bundleId 只當內部 metadata，UI 一律顯示 companyName / bundleName（不顯示 id）。
 */
export interface TemplateVarContext {
  /** quotingCaseId（完整） */
  caseId: string;
  /** 公司顯示名（groupClients.companyName；缺值時 fallback caseId） */
  companyName: string;
  /** 該公司的 standard 方案清單 */
  bundles: { bundleId: string; bundleName: string }[];
}
