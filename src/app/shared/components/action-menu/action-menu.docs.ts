import type { ComponentApi } from '../../../../docs/component-doc';

export const actionMenuDoc: ComponentApi = {
  id: 'action-menu',
  selector: 'app-action-menu',
  summary: '<ng-content> 直接放 app-menu-item 就是選單（要寫在同一個範本；ariaLabel 取名、選單的鍵盤與焦點規則）；篩選面板放 app-button、app-check-chip。點外面會發 (closeMenu)，由父層關閉',
  props: [
    {
      name: 'autoCloseOnAction',
      type: 'boolean',
      default: 'true',
      description: '點擊選單內部子元素時是否自動 emit closeMenu。簡單操作選單用預設 true；含輸入欄或多選的複雜篩選面板設 false。放了 app-menu-item 時，只有點到可以用的選項才發，點到分隔線、空白處或停用的選項都不發。',
    },
    {
      name: 'align',
      type: "'left' | 'right' | 'center'",
      default: "'left'",
      description: '選單相對觸發元素的水平對齊方向：left 左對齊 trigger、right 右對齊 trigger、center 水平置中 trigger。取代手動 style="right:0; left:auto" 寫法。**用綁定 [align]="\'right\'"，不要寫靜態 align="right"**：靜態屬性會留在 DOM，Chrome 當舊式 HTML 對齊，選單裡的純文字整個靠右（2026-10-02）。',
    },
    {
      name: 'anchorEl',
      type: 'HTMLElement | null',
      default: 'null',
      description: '外部 anchor element；用於 trigger 不是 host.parentElement 的情境（如 contenteditable 內的 inline chip）。傳入後走 element-anchored 模式，PortalPositioningService 自動 track scroll/resize 並即時 reposition。',
    },
    {
      name: 'fixedMode',
      type: 'boolean',
      default: 'false',
      description: '改走座標定位（attachAtPoint）而非 element-anchored。有傳 fixedTop / fixedLeft 等任一座標值時自動走此模式。此模式不追蹤捲動。',
    },
    {
      name: 'fixedTop',
      type: 'number | null',
      default: 'null',
      description: 'fixedMode 的垂直座標，與 fixedBottom 二擇一。',
    },
    {
      name: 'fixedBottom',
      type: 'number | null',
      default: 'null',
      description: 'fixedMode 的垂直座標，與 fixedTop 二擇一。',
    },
    {
      name: 'fixedRight',
      type: 'number | null',
      default: 'null',
      description: 'fixedMode 的水平座標，與 fixedLeft 二擇一。',
    },
    {
      name: 'fixedLeft',
      type: 'number | null',
      default: 'null',
      description: 'fixedMode 的水平座標，與 fixedRight 二擇一。',
    },
    {
      name: 'fixedWidth',
      type: 'number | null',
      default: 'null',
      description: 'fixedMode 下指定選單寬度。',
    },
    {
      name: 'ancestorAnchorEl',
      type: 'HTMLElement | null',
      default: 'null',
      description: '巢狀 flyout 用：帶入父選單的 anchor 後，點此 flyout 內容時 click-outside 的 ancestor-protection 不會誤關父選單。',
    },
    {
      name: 'autoFocusFirst',
      type: 'boolean',
      default: 'true',
      description: '打開時是否把焦點移到第一個選項。預設 true（More 選單：開了就用鍵盤選）。錨點是輸入框、使用者還要繼續打字時設 false（如搜尋框下方的「最近開啟」），否則游標會被搶進選單、打的字進不了輸入框；設 false 時由呼叫端負責鍵盤進入選單（如 ↓ 鍵聚焦第一項）。放了 app-menu-item 時，焦點停在 selected 為 true 的那一項，沒有選中項才停第一項；設 false 一樣不移。放了 app-menu-item、觸發鈕又是輸入框時，點外面關掉不會把焦點還給輸入框（游標不跳回去，一拿到焦點就打開的下拉也不會被重新打開），按 Esc 照樣還。DS v0.1.7 起。',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      description: '選單的名稱。放了 app-menu-item 時輸出成外框的 aria-label，報讀軟體打開選單會先念它；用畫面上看得到的字，例如「排序」「每頁顯示筆數」。沒放 app-menu-item 時不輸出。',
    },
    {
      name: '(closeMenu)',
      type: 'EventEmitter<void>',
      desc: '應關閉選單時觸發：點選單外面、按 Esc，或 autoCloseOnAction=true 時點選單內部。放了 app-menu-item 時，按 Tab 也會觸發，點內部則只有點到可以用的選項才算。',
      isOutput: true,
    },
  ],
  events: [
    {
      name: 'closeMenu',
      type: 'EventEmitter<void>',
      description: '點選單外面（backdrop）、按 Esc，或 autoCloseOnAction=true 時點選單內部，發射此事件；放了 app-menu-item 時按 Tab 也會發。父層用 @if 控制顯示，監聽此事件設為 false 即可關閉。',
    },
  ],
  usage: [
    {
      label: 'More 操作選單：選項用 app-menu-item（autoCloseOnAction 預設 true）',
      code: `<div class="plan-header__more">
  <app-icon-btn size="16" ariaLabel="更多操作" ariaHaspopup="menu" [ariaExpanded]="isPlanMenuOpen()"
    (btnClick)="isPlanMenuOpen.set(!isPlanMenuOpen())">
    <app-icon name="More" size="16"></app-icon>
  </app-icon-btn>

  @if (isPlanMenuOpen()) {
    <app-action-menu ariaLabel="更多操作" (closeMenu)="isPlanMenuOpen.set(false)">
      <app-menu-item label="編輯此規劃" icon="Edit" (itemClick)="editPlan()"></app-menu-item>
      <app-menu-item label="刪除此規劃" icon="Trash-Del" tone="danger" (itemClick)="deletePlan()"></app-menu-item>
    </app-action-menu>
  }
</div>`,
    },
    {
      label: '複雜篩選面板（autoCloseOnAction="false"）：不放 app-menu-item，不會變成選單',
      code: `<div class="filter-wrap">
  <button (click)="toggleFilter('kanban', $event)">看板</button>

  <app-action-menu *ngIf="activeFilter() === 'kanban'"
    style="min-width:220px"
    [autoCloseOnAction]="false"
    (closeMenu)="activeFilter.set(null)">
    <!-- 含勾選、輸入等互動元素 -->
    <app-check-chip *ngFor="let s of columns" ...></app-check-chip>
    <app-button variant="elevated" size="S" text="還原預設"></app-button>
  </app-action-menu>
</div>`,
    },
  ],
  usageNotes: [
    '本體說明裡負責 anchor 追蹤與 z-index 遞增的「浮層定位服務」，在 Angular 是 PortalPositioningService；app-action-menu 內部用它做定位與 anchor 追蹤。',
    '父層不需要額外寫 @HostListener 處理 click-outside：PortalPositioningService 在 document 上以 capture-phase pointerdown 偵測外部點擊，點到外部時 app-action-menu emit (closeMenu)。',
    'z-index 的下限是 PortalPositioningService 裡的常數 Z_INDEX_FLOOR（9999），每開一個 portal +1。',
    '「是不是選單」不用另外設定：app-menu-item 透過注入（MENU_CONTEXT）向外層的 app-action-menu 登記，有一個登記就進選單模式。哪些 app-menu-item 登記得到，見下一條。',
    {
      type: 'warn',
      content: '只有跟 app-action-menu 寫在同一個範本、包在它標籤裡面的 app-menu-item 才會登記（包在 @if、@for、*ngFor 裡也算）。下面三種不會登記，app-menu-item 會變回選單外的按鈕，外框也不會變成選單：寫在你自己元件的範本裡、再把那個元件放進 app-action-menu；用 ng-template 宣告在 app-action-menu 外面、再用 ngTemplateOutlet 插進去；用 ViewContainerRef.createComponent 或 NgComponentOutlet 動態建立。要做選單時，app-menu-item 直接寫在 app-action-menu 裡。',
    },
    {
      type: 'warn',
      content: '選單的名稱寫成元件設定 ariaLabel。沒放 app-menu-item 時 ariaLabel 不會輸出，外框也沒有角色。',
    },
    {
      type: 'info',
      content: '放了 app-menu-item 的選單關掉後，焦點要還給觸發鈕。Safari 用滑鼠點按鈕時不會把焦點給它，這時要靠 aria-haspopup 和 aria-expanded 認出觸發鈕，兩個都要設：觸發鈕是 app-button 或 app-icon-btn 就設 ariaHaspopup="menu" 和 [ariaExpanded]（屬性會落在它們裡面那顆 button 上），原生 <button> 直接寫 aria-haspopup="menu" 和 [attr.aria-expanded]，aria-expanded 跟著選單開關變。認的範圍是 app-action-menu 原本的上一層元素；有傳 anchorEl 時改成 anchorEl 本身與它裡面，anchorEl 本身就是 aria-haspopup 為 menu 或 true 的按鈕時直接用它。範圍裡認的是 aria-haspopup 為 menu 或 true、選單開著時標著 aria-expanded="true" 的那顆；打開對話框（dialog）、清單（listbox）的按鈕不算。同時有好幾顆標著時（例如同一個外層裡另一個選單也開著），取打開前有焦點的那顆；打開前的焦點不在其中任何一顆上，就不從裡面挑。只有一顆標著、但打開前的焦點在範圍裡別的地方時，也不認它：例如上一層的浮層一直開著，打開浮層的按鈕（aria-haspopup 是 menu）一直標著，這個選單是從浮層裡的元素打開的。焦點停在包著那顆標著的按鈕的外框上，不算別的地方：只開一個選單時，Safari 點觸發鈕，焦點會停在這種外框上（例如加了 tabindex="-1" 的 role="gridcell" 格子）。這一條要打開前的焦點落在打開選單的元素上才認得出來，也就是用 Chrome 滑鼠點、用鍵盤打開，或點的是 tabindex="0" 這類 Safari 也會給焦點的元素。Safari 用滑鼠點、iPhone 用手指點原生按鈕時，按鈕拿不到焦點，這一條認不出來，焦點可能跳到打開浮層的按鈕。所以打開選單的按鈕一定要照規格設 aria-expanded：設了就有兩顆標著，照前面好幾顆標著的規則挑，不會還到打開浮層的按鈕。認出來的觸發鈕優先於打開前有焦點的元素：Safari 點按鈕時，焦點會落到外面那層點得到焦點的元素（例如 tabindex="-1" 的對話框卡片），打開前有焦點的可能是那一層。認不出來時，才還給打開前有焦點的元素；Safari 用滑鼠點、打開前沒有元素有焦點時，焦點就不還。沒有一顆標著 aria-expanded="true" 就不猜，範圍裡只有一顆選單按鈕也一樣，因為用 fixedMode 放在範本最外層、由鍵盤快捷鍵或右鍵打開的選單，那顆可能跟它無關。用 Chrome 滑鼠點、或用鍵盤打開時，打開前焦點就在觸發鈕上，漏設 aria-expanded 看不出來，要用 Safari 滑鼠點來驗。同一個外層裡放好幾個選單、用同一個狀態切換（打開 B 就關掉 A）時，按 B 的觸發鈕關掉 A 不會把焦點拉回 A 的觸發鈕，B 關掉後焦點回到 B 的觸發鈕。',
    },
  ],
};
