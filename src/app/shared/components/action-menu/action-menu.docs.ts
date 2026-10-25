import type { ComponentApi } from '../../../../docs/component-doc';

export const actionMenuDoc: ComponentApi = {
  id: 'action-menu',
  selector: 'app-action-menu',
  summary: '<ng-content> 投影選項（用 app-button variant="ghost"），內建 backdrop 點擊關閉',
  props: [
    {
      name: 'autoCloseOnAction',
      type: 'boolean',
      default: 'true',
      description: '點擊選單內部子元素時是否自動 emit closeMenu。簡單操作選單用預設 true；含輸入欄或多選的複雜篩選面板設 false。',
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
      description: '打開時是否把焦點移到第一個選項。預設 true（More 選單：開了就用鍵盤選）。錨點是輸入框、使用者還要繼續打字時設 false（如搜尋框下方的「最近開啟」），否則游標會被搶進選單、打的字進不了輸入框；設 false 時由呼叫端負責鍵盤進入選單（如 ↓ 鍵聚焦第一項）。DS v0.1.7 起。',
    },
    {
      name: '(closeMenu)',
      type: 'EventEmitter<void>',
      desc: '應關閉選單時觸發（點擊選單外部，或 autoCloseOnAction=true 時點擊選單內部）',
      isOutput: true,
    },
  ],
  events: [
    {
      name: 'closeMenu',
      type: 'EventEmitter<void>',
      description: '點擊選單外部（backdrop）或 autoCloseOnAction=true 時點擊內部，發射此事件。父層用 @if 控制顯示，監聽此事件設為 false 即可關閉。',
    },
  ],
  usage: [
    {
      label: 'More 操作選單（autoCloseOnAction 預設 true）',
      code: `<!-- 父層需 position:relative -->
<div class="plan-header__more">
  <app-icon-btn (btnClick)="isPlanMenuOpen.set(true)">
    <app-icon name="More" size="16"></app-icon>
  </app-icon-btn>

  @if (isPlanMenuOpen()) {
    <app-action-menu (closeMenu)="isPlanMenuOpen.set(false)">
      <app-button variant="ghost" color="danger" size="S"
        leftIcon="Trash-Del" text="刪除此規劃">
      </app-button>
    </app-action-menu>
  }
</div>`,
    },
    {
      label: '複雜篩選面板（autoCloseOnAction="false"）',
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
  ],
};
