import { InjectionToken } from '@angular/core';

/** 範本變數的一個分組。`key` 對應 `TemplateVarDef.group`，`label` 是面板上的分組標題。 */
export interface TemplateVarGroup {
  key: string;
  label: string;
}

/**
 * 範本變數面板的分組清單，由使用端提供（DS 不內建任何分組）。
 * - 有提供：只顯示清單內的分組，順序＝陣列順序。
 * - 沒提供（預設空陣列）：依變數出現順序顯示全部分組，標題用分組 key。
 */
export const TEMPLATE_VAR_GROUPS = new InjectionToken<readonly TemplateVarGroup[]>('TEMPLATE_VAR_GROUPS', {
  providedIn: 'root',
  factory: () => [],
});

/** 變數面板頂部兩層選擇器的文字（第一層選 context，第二層選該 context 底下的 option）。 */
export interface TemplateVarContextText {
  contextLabel: string;
  contextPlaceholder: string;
  optionLabel: string;
  optionPlaceholder: string;
}

/** 兩層選擇器的文字，由使用端依自己的資料命名提供；預設為通用字。 */
export const TEMPLATE_VAR_CONTEXT_TEXT = new InjectionToken<TemplateVarContextText>('TEMPLATE_VAR_CONTEXT_TEXT', {
  providedIn: 'root',
  factory: () => ({
    contextLabel: '資料',
    contextPlaceholder: '選擇資料',
    optionLabel: '版本',
    optionPlaceholder: '選擇版本',
  }),
});
