/**
 * Angular 用法說明檔的格式。
 *
 * 元件說明分成兩份，以同一個 `id` 對應：
 * - 元件規格（何時用、注意事項、選用表格）：跟框架無關，放在本體套件 `@mendesky/ds` 的
 *   `src/docs/components/<id>.ts`（格式 `ComponentSpec`）。
 * - Angular 用法（selector、屬性、事件、範例程式碼、只有 Angular 才需要知道的注意事項）：放在元件旁邊的
 *   `<名稱>.docs.ts`，export 一個 `ComponentApi`。`npm run check:docs` 會比對屬性名稱與元件程式碼是否一致。
 *
 * 互動原則（本體 `src/docs/patterns.ts`）也只寫跨框架的規則；Angular 的實作步驟放在 `src/docs/pattern-notes.ts`，
 * 以原則的 key 對應（格式 `PatternNotes`）。
 *
 * 文件網站、Storybook 說明頁與使用端的 AI 協作索引把兩份合併成 `ComponentDoc` 呈現。
 */
import type { ComponentSpec, DocNote } from '@mendesky/ds';

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

export interface DocEvent {
  name: string;
  type: string;
  description: string;
}

/** Angular 用法（元件旁邊的 `<名稱>.docs.ts`）。 */
export interface ComponentApi {
  /** 對應本體元件規格的 id */
  id: string;
  /** Angular selector，例如 `app-button`、`[appTooltip]` */
  selector: string;
  /** 一行屬性摘要（AI 協作索引 ds-index.md 用） */
  summary?: string;
  props: DocProp[];
  events?: DocEvent[];
  usage: DocUsage[];
  /**
   * 只有 Angular 才需要知道的注意事項，例如怎麼跟表單雙向綁定、要注入哪個服務、內容投影的 select 怎麼寫。
   * 跨框架的注意事項寫在本體規格的 `notes`。
   */
  usageNotes?: Array<DocNote | string>;
}

/** 互動原則的 Angular 做法：key 是本體互動原則的 key（例如 `loading.api-hydration-skeleton`），內容是 Angular 的實作步驟。 */
export type PatternNotes = Record<string, Array<DocNote | string>>;

/** 元件規格＋Angular 用法合併後的完整說明（文件網站、Storybook、AI 協作索引使用；使用端自有元件的說明也用這個格式）。 */
export type ComponentDoc = ComponentSpec & ComponentApi;
