import { globalTemplateVarRe } from './template-var-key';

/**
 * 將模板字串中的 %key% 變數替換為 vars 中對應的實際值。
 * 舊 key 的改名遷移屬於使用端的資料規則，由使用端在呼叫前自行處理。
 * 無對應值時保留 [key] 預設格式（與 TemplateEditorComponent.buildHTML 行為一致）。
 */
export function renderTemplateAsText(tpl: string, vars: Record<string, string>): string {
  // key 可含 `|variant` 及身份後綴（字元集見 template-var-key）
  return tpl.replace(globalTemplateVarRe(), (_, key: string) => vars[key] || `[${key}]`);
}
