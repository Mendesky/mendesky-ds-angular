/**
 * DS 互動原則的格式：補齊「元件長什麼樣」之外的「什麼情境用什麼、為什麼這樣選」。
 *
 * 正本在 src/docs/patterns.ts，以 `領域.主題` 為 key（例如 `modal.dismissal`），
 * 每條前面有 `// KEY: <key>` 註解方便搜尋。
 */
export interface PatternScenario {
  type: string;
  description: string;
  rule: string[];
  rationale: string;
  example?: string;
}

export interface PatternReference {
  source: string;
  url: string;
  status: string;
  note: string;
}

export interface PatternDoc {
  name: string;
  principle: string;
  when: string;
  scenarios: PatternScenario[];
  antiPatterns: string[];
  a11y: string | Record<string, string[]>;
  /** 相關元件，以 `#<元件說明 id>` 表示，例如 `#modal-shell` */
  relatedComponents: string[];
  /** 相關原則的 key，可在 key 後面用全形括號補充，例如 `modal.dismissal（savingLocked type）` */
  relatedPatterns?: string[];
  /** 相關的 AI 協作記憶檔名（由使用端維護） */
  relatedMemory?: string[];
  references: PatternReference[];
}
