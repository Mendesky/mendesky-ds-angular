/**
 * 範本變數 key 偵測 regex 的**單一真相來源**。
 *
 * key 形式：`concept[|variant][|Scope:frag[|SubScope:frag]]`（例 `StartDate|Scope:a|SubScope:b`、
 * `Amount|exact`、不帶後綴的 `ItemNames`）。字元集含 `|` `:` 以容納 variant 與完全限定身份後綴。
 *
 * ⚠️ 過去 template-editor / 序列化器 / TipTap node 各寫一份 regex，字元集不一致
 * （有的漏 `|:`）曾造成「打得出、reopen 卻消失」的 chip。所有偵測 `%key%` 的 regex 一律由此組成，
 * 改格式時只改這裡。
 */
export const TEMPLATE_VAR_KEY_BODY = '[A-Za-z][A-Za-z0-9|:]*';

/** 完整比對單一段落是否恰為 `%key%`（`^%(key)%$`）；用於 split 後逐段判斷。回捕獲組 [1]=key。 */
export const fullTemplateVarRe = (): RegExp => new RegExp(`^%(${TEMPLATE_VAR_KEY_BODY})%$`);

/** 結尾錨定 `%key%$`；用於游標前偵測 / TipTap InputRule。回捕獲組 [1]=key。 */
export const endTemplateVarRe = (): RegExp => new RegExp(`%(${TEMPLATE_VAR_KEY_BODY})%$`);

/** 全域比對 `%key%`（g）；每次呼叫回新實例，避免 lastIndex 狀態污染。回捕獲組 [1]=key。 */
export const globalTemplateVarRe = (): RegExp => new RegExp(`%(${TEMPLATE_VAR_KEY_BODY})%`, 'g');

/** split 用 whole-match 捕獲 `(%key%)`（含 % 分隔）；`String.split` 會保留捕獲段。 */
export const splitTemplateVarRe = (): RegExp => new RegExp(`(%${TEMPLATE_VAR_KEY_BODY}%)`);
