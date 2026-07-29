import { globalTemplateVarRe } from './template-var-key';

/**
 * 舊範本 key → 新 key 的遷移表（單一 SSOT）。
 *
 * 後端持久化的範本字串（如使用者編輯過的信件內容）可能仍含已改名的舊 key，
 * 前端變數系統已不再產生這些 key 的值 → 顯示時會殘留灰底 [oldKey]。
 * 在 read-side 統一遷移成新 key，讓現有值能正確替換。
 *
 * - CompanyName → QuotingCaseName：PR #203 改名（正式公司名僅 deliver 時使用，未開放範本變數）
 * - EstimatedRevenue → EstimatedAnnualRevenue：與 TemplateVariableResolver._expandValue 既有 sanitize 對齊
 */
export const LEGACY_TEMPLATE_KEY_MIGRATIONS: Record<string, string> = {
  CompanyName: 'QuotingCaseName',
  EstimatedRevenue: 'EstimatedAnnualRevenue',
};

/**
 * 將範本字串中的舊 key placeholder（%oldKey% / %oldKey|variant%）遷移為新 key，
 * 保留 glance variant 後綴。無舊 key 時原樣返回。
 */
export function migrateLegacyTemplateKeys(raw: string): string {
  let result = raw;
  for (const [oldKey, newKey] of Object.entries(LEGACY_TEMPLATE_KEY_MIGRATIONS)) {
    result = result.replace(
      new RegExp(`%${oldKey}(\\|[A-Za-z]+)?%`, 'g'),
      (_m, variant: string | undefined) => `%${newKey}${variant ?? ''}%`,
    );
  }
  return result;
}

/**
 * 將模板字串中的 %key% 變數替換為 vars 中對應的實際值。
 * 替換前先做舊 key 遷移（讓含舊 key 的後端範本能用新 key 的值替換）。
 * 無對應值時保留 [key] 預設格式（與 TemplateEditorComponent.buildHTML 行為一致）。
 */
export function renderTemplateAsText(tpl: string, vars: Record<string, string>): string {
  // key 可含 `|variant` 及 `|Case:frag|Bundle:frag` 身份後綴（字元集見 template-var-key）
  return migrateLegacyTemplateKeys(tpl)
    .replace(globalTemplateVarRe(), (_, key: string) => vars[key] || `[${key}]`);
}
