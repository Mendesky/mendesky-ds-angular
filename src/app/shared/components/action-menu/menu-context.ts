import { InjectionToken } from '@angular/core';

/**
 * 選單模式的登記窗口：app-action-menu 提供，app-menu-item 注入。
 *
 * 動作選單裡只要有一個 app-menu-item 登記，就進入選單模式：外框變成 role="menu"，
 * 鍵盤與焦點改照選單的規則（方向鍵只在選單項目間移動、Home／End、Tab 關閉、打開時停在選中項、
 * 關閉後焦點回到觸發鈕）。沒有 app-menu-item 的動作選單（篩選面板、選項還是 app-button 的選單）
 * 維持原本的行為，不會被念成選單。
 */
export interface MenuContext {
  register(item: object): void;
  unregister(item: object): void;
}

export const MENU_CONTEXT = new InjectionToken<MenuContext>('MENU_CONTEXT');

/** 選單模式下方向鍵走得到的項目：app-menu-item 內層的按鈕，停用的也算 */
const MENU_ITEM_SELECTOR = '[role="menuitem"], [role="menuitemradio"]';

/** 會打開選單的按鈕：aria-haspopup 是 menu 或 true（true 就是 menu）。打開對話框、清單的按鈕不算 */
const MENU_TRIGGER_VALUES = ['menu', 'true'];
const MENU_TRIGGER_SELECTOR = MENU_TRIGGER_VALUES.map((v) => `[aria-haspopup="${v}"]`).join(', ');
/** 上面那些按鈕裡，標著 aria-expanded="true" 的。逗號串起來的選擇器，條件要每一段各自加 */
const EXPANDED_MENU_TRIGGER_SELECTOR = MENU_TRIGGER_VALUES
  .map((v) => `[aria-haspopup="${v}"][aria-expanded="true"]`)
  .join(', ');

/** 本身就是控制項的角色。roving tabindex 的選項、格子這類 tabindex="-1" 的控制項靠它認 */
const WIDGET_ROLES = [
  'button', 'link', 'checkbox', 'radio', 'switch', 'tab', 'option',
  'menuitem', 'menuitemcheckbox', 'menuitemradio', 'gridcell', 'treeitem',
  'slider', 'spinbutton', 'combobox', 'textbox', 'searchbox',
];

/**
 * 按下去之後由瀏覽器自己決定焦點的元素：Chrome 會把焦點給它，Safari 點按鈕不給、焦點清回 body。
 * 兩種情況都是使用者換去操作別的東西了，選單關掉後不該把焦點拉回自己的觸發鈕。
 * tabindex="-1" 本身不算：對話框卡片這類外框點得到焦點，但點它的空白處跟點空白處一樣
 */
const INTERACTIVE_SELECTOR = [
  'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'summary', 'label', 'iframe',
  '[tabindex]:not([tabindex="-1"])', '[contenteditable]:not([contenteditable="false"])',
  ...WIDGET_ROLES.map((r) => `[role="${r}"]`),
].join(', ');

/** 輸入框、下拉、多行輸入框、可編輯區：自己要用方向鍵、空白鍵、Enter，點了也要拿到焦點 */
const FORM_FIELD_SELECTOR = 'input, select, textarea, [contenteditable]:not([contenteditable="false"])';

/** 選單外框裡的選單項目，依畫面順序 */
export function menuItemsIn(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
}

/** 打開選單時焦點先停的項目：已選中（aria-checked="true"）的單選項，沒有就第一項 */
export function initialMenuItem(items: HTMLElement[]): HTMLElement | null {
  return items.find((el) => el.getAttribute('aria-checked') === 'true') ?? items[0] ?? null;
}

/**
 * 在選單原本所在的外層元素認觸發鈕（Safari 用滑鼠點按鈕，按鈕不會取得焦點，要靠這個認）：
 * 外層本身就是會打開選單的按鈕，就是外層；否則用外層裡標著 aria-expanded="true" 的選單按鈕。
 * 標著的有好幾顆時（例如同一個外層裡另一個選單也開著），取包含 hint（打開前有焦點的元素）的那顆，
 * 沒有一顆包含它就不認。認不出來回 null。
 * 外層裡只有一顆選單按鈕、但沒標 aria-expanded="true" 時也不認：用鍵盤快捷鍵、右鍵打開的選單，那顆可能跟它無關。
 * 要在選單開著時呼叫：關閉的過程中，觸發鈕的 aria-expanded 可能已經先變回 false。
 */
export function expandedMenuTrigger(scope: HTMLElement | null, hint: Element | null = null): HTMLElement | null {
  if (!scope || !scope.isConnected) return null;
  if (scope.matches(MENU_TRIGGER_SELECTOR)) return scope;
  const found = Array.from(scope.querySelectorAll<HTMLElement>(EXPANDED_MENU_TRIGGER_SELECTOR));
  if (found.length <= 1) return found[0] ?? null;
  return found.find((el) => !!hint && el.contains(hint)) ?? null;
}

/** 按到的是不是會由瀏覽器自己處理焦點的元素（見 INTERACTIVE_SELECTOR） */
export function isInteractiveTarget(target: Element | null): boolean {
  return !!target?.closest(INTERACTIVE_SELECTOR);
}

/** 事件發生在表單欄位上（見 FORM_FIELD_SELECTOR） */
export function isFormFieldTarget(target: EventTarget | null): boolean {
  return target instanceof Element && !!target.closest(FORM_FIELD_SELECTOR);
}
