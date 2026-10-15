/**
 * DS 基礎（色彩 token、字型、動效）說明的格式。
 *
 * 正本在 src/docs/foundations/。樣式本身定義在 src/styles/core.scss；
 * `npm run check:docs` 會比對這裡列的 token、字型 class 與 core.scss 是否一致。
 */
export interface TokenEntry {
  /** CSS 變數名稱，與 core.scss 寫法相同（含跳脫的斜線，例如 `--text\/body`） */
  name: string;
  value: string;
  desc?: string;
}

export interface TokenGroup {
  group: string;
  desc: string;
  /** true 時文件網站用色票排列 */
  palette?: boolean;
  tokens: TokenEntry[];
}

export interface TypographyClass {
  /** class 名稱（含開頭的點），例如 `.noto-14-regular` */
  name: string;
  weight: number;
  size: string;
  sizeNote?: string;
}

export interface TypographyFamily {
  family: string;
  cssVar: string;
  role: string;
  classes: TypographyClass[];
}

export interface MotionTier {
  name: string;
  duration: string;
  desc: string;
  examples: string[];
}

export interface MotionEasing {
  name: string;
  value: string;
  token: string;
  desc: string;
}

export interface MotionDoc {
  tiers: MotionTier[];
  easing: { enter: MotionEasing; exit: MotionEasing };
  rule: string;
}
