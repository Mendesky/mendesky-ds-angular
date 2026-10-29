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

/** 標了「會打開選單」的按鈕（aria-haspopup="false" 不算） */
const MENU_TRIGGER_SELECTOR = '[aria-haspopup]:not([aria-haspopup="false"])';

/**
 * 按下去之後由瀏覽器自己決定焦點的元素：Chrome 會把焦點給它，Safari 點按鈕不給、焦點清回 body。
 * 兩種情況都是使用者換去操作別的東西了，選單關掉後不該把焦點拉回自己的觸發鈕。
 */
const INTERACTIVE_SELECTOR = [
  'a[href]', 'area[href]', 'button', 'input', 'select', 'textarea', 'summary', 'label', 'iframe',
  '[tabindex]', '[contenteditable]:not([contenteditable="false"])',
].join(', ');

/** 選單外框裡的選單項目，依畫面順序 */
export function menuItemsIn(host: HTMLElement): HTMLElement[] {
  return Array.from(host.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR));
}

/** 打開選單時焦點先停的項目：已選中（aria-checked="true"）的單選項，沒有就第一項 */
export function initialMenuItem(items: HTMLElement[]): HTMLElement | null {
  return items.find((el) => el.getAttribute('aria-checked') === 'true') ?? items[0] ?? null;
}

/**
 * 選單開著時就認得出來的觸發鈕：外層本身標了 aria-haspopup 就是外層；
 * 外層裡有好幾顆時，用標著 aria-expanded="true" 的那顆。認不出來回 null。
 * 要在選單開著時呼叫：關閉的過程中，觸發鈕的 aria-expanded 可能已經先變回 false。
 */
export function expandedMenuTrigger(scope: HTMLElement | null): HTMLElement | null {
  if (!scope || !scope.isConnected) return null;
  if (scope.matches(MENU_TRIGGER_SELECTOR)) return scope;
  return scope.querySelector<HTMLElement>(`${MENU_TRIGGER_SELECTOR}[aria-expanded="true"]`);
}

/**
 * 記不到觸發鈕時（Safari 用滑鼠點按鈕，按鈕不會取得焦點），到選單原本所在的外層元素找
 * 標了 aria-haspopup 的按鈕：先照 expandedMenuTrigger 認，認不出來就用外層裡的第一顆。
 */
export function findMenuTrigger(scope: HTMLElement | null): HTMLElement | null {
  if (!scope || !scope.isConnected) return null;
  return expandedMenuTrigger(scope) ?? scope.querySelector<HTMLElement>(MENU_TRIGGER_SELECTOR);
}

/** 按到的是不是會由瀏覽器自己處理焦點的元素（見 INTERACTIVE_SELECTOR） */
export function isInteractiveTarget(target: Element | null): boolean {
  return !!target?.closest(INTERACTIVE_SELECTOR);
}
