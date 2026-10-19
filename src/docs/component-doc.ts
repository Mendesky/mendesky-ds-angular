/**
 * DS 元件說明檔的格式。
 *
 * 每個公開元件旁邊放一個 `<名稱>.docs.ts`，export 一個 `ComponentDoc`。
 * 這是元件說明的正本：文件網站（Storybook）與使用端的 AI 協作索引都從這裡產生，
 * 不要在別處手改說明。改元件時，在同一個 PR 更新對應的說明檔；`npm run check:docs`
 * 會比對說明裡的屬性名稱與元件程式碼是否一致。
 */
export type DocGroup = '互動元件' | '表單元件' | '浮層元件' | '展示元件' | '工具';

export interface DocProp {
  /** @Input／@Output 名稱；Output 以括號包住，例如 `(btnClick)` */
  name: string;
  type: string;
  default?: string;
  desc?: string;
  /** 早期條目用 `description` 而非 `desc`，兩者擇一 */
  description?: string;
  isOutput?: boolean;
}

export interface DocUsage {
  label?: string;
  code: string;
}

export interface DocNote {
  type: 'info' | 'warn' | 'warning';
  content: string;
}

export interface DocTable {
  title: string;
  columns: string[];
  rows: string[][];
}

export interface DocEvent {
  name: string;
  type: string;
  description: string;
}

export interface ComponentDoc {
  /** 說明的識別字；互動原則以 `#<id>` 引用 */
  id: string;
  name: string;
  /** Angular selector，例如 `app-button`、`[appTooltip]` */
  selector: string;
  /** 文件網站側欄分組 */
  group: DocGroup;
  /** 一行屬性摘要（AI 協作索引 ds-index.md 用） */
  summary?: string;
  /** 何時使用／禁止用法（一行） */
  when?: string;
  description?: string;
  props: DocProp[];
  events?: DocEvent[];
  usage: DocUsage[];
  /** 字串為無分類的備註 */
  notes: Array<DocNote | string>;
  customTables?: DocTable[];
}
