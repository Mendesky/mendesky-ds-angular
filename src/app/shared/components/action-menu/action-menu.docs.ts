import type { ComponentApi } from '../../../../docs/component-doc';

export const actionMenuDoc: ComponentApi = {
  id: 'action-menu',
  selector: 'app-action-menu',
  summary: '<ng-content> 放 app-menu-item 就是選單（ariaLabel 取名、選單的鍵盤與焦點規則）；篩選面板放 app-button、app-check-chip。點外面會發 (closeMenu)，由父層關閉',
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
      description: '打開時是否把焦點移到第一個選項。預設 true（More 選單：開了就用鍵盤選）。錨點是輸入框、使用者還要繼續打字時設 false（如搜尋框下方的「最近開啟」），否則游標會被搶進選單、打的字進不了輸入框；設 false 時由呼叫端負責鍵盤進入選單（如 ↓ 鍵聚焦第一項）。放了 app-menu-item 時，焦點停在 selected 為 true 的那一項，沒有選中項才停第一項；設 false 一樣不移。DS v0.1.7 起。',
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
  <app-button variant="ghost" color="neutral" size="S" leftIcon="More" ariaLabel="更多操作"
    ariaHaspopup="menu" [ariaExpanded]="isPlanMenuOpen()"
    (btnClick)="isPlanMenuOpen.set(!isPlanMenuOpen())"></app-button>

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
    '「是不是選單」不用另外設定：app-menu-item 透過注入（MENU_CONTEXT）向外層的 app-action-menu 登記，內容裡有 app-menu-item 就進選單模式。',
    {
      type: 'warn',
      content: '選單的名稱寫成元件設定 ariaLabel。沒放 app-menu-item 時 ariaLabel 不會輸出，外框也沒有角色。',
    },
    {
      type: 'info',
      content: '放了 app-menu-item 的選單關掉後，焦點要還給觸發鈕。Safari 用滑鼠點按鈕時不會把焦點給它，這時要靠 aria-haspopup 找回觸發鈕：觸發鈕是 app-button 就設 ariaHaspopup="menu"，原生 <button> 直接寫 aria-haspopup="menu"。找的範圍是 app-action-menu 原本的上一層元素；有傳 anchorEl 時改成 anchorEl 本身與它裡面。範圍裡有好幾顆時，用選單開著時標著 aria-expanded="true" 的那顆，所以觸發鈕也要跟著選單開關綁 aria-expanded（app-button 是 ariaExpanded）。打開前有焦點的元素不在這個範圍裡時（例如 Safari 上從另一個選單直接點過來，焦點還停在上一顆觸發鈕），一樣改用範圍裡的觸發鈕；範圍裡找不到才還給那個元素。',
    },
  ],
};
