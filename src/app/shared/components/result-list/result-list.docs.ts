import type { ComponentApi } from '../../../../docs/component-doc';

export const resultListDoc: ComponentApi = {
  id: 'result-list',
  selector: 'app-result-list',
  summary: 'ariaLabel（必填） · groups: ResultListGroup[] · state: ready|loading|empty|error · listId · [(activeId)] · [autoActivateFirst] [wrap] · itemTemplate · loadingText emptyText errorTitle errorDescription retryText [showRetry] announcement · (itemSelect) (activeOptionIdChange) (retry) · handleKeydown() resetActive()',
  props: [
    {
      name: 'ariaLabel',
      type: 'string',
      desc: '必填。清單的報讀名稱，例如「搜尋結果」。',
    },
    {
      name: 'groups',
      type: 'readonly ResultListGroup[]',
      default: '[]',
      desc: '要列出來的內容。一個群組是 { id, label?, items }；label 有值就畫成有標題的一組，沒有就直接列出來。一列是 { id, label, description?, icon?, data? }，data 放你自己的原始資料。',
    },
    {
      name: 'state',
      type: 'ResultListState',
      default: "'ready'",
      desc: "'ready' | 'loading' | 'empty' | 'error'。元件不打後端，不知道現在在不在載入，要你告訴它。ready 照 groups 畫；其他三種不畫清單，改畫轉圈、沒有結果、載入失敗。",
    },
    {
      name: 'listId',
      type: 'string',
      default: '自動產生',
      desc: '清單元素的 id，給輸入框的 aria-controls 用。每一列的 id 是「listId-o0」「listId-o1」這樣往下排。',
    },
    {
      name: 'activeId',
      type: 'string | null',
      default: 'null',
      desc: '選中那一列的 id（你給的項目 id）。通常不用設，元件自己記；要從外面指定或讀取時跟 activeIdChange 寫成 [(activeId)]。設成清單裡沒有的 id 等於沒選中。',
    },
    {
      name: 'autoActivateFirst',
      type: 'boolean',
      default: 'false',
      desc: '有結果就先選中第一列，使用者直接按 Enter 就選它。這時第一列按 ↑ 不會變成沒選中。',
    },
    {
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      desc: '最後一列按 ↓ 回第一列，第一列按 ↑ 到最後一列。',
    },
    {
      name: 'itemTemplate',
      type: 'TemplateRef<ResultListItemContext> | null',
      default: 'null',
      desc: '每一列的內容範本。範本拿得到那一列（let-item）與它是不是選中（let-active="active"）。不給就顯示圖示、名稱、說明。',
    },
    {
      name: 'loadingText',
      type: 'string',
      default: "'搜尋中'",
      desc: '載入中顯示的字，報讀軟體也念這句。',
    },
    {
      name: 'emptyText',
      type: 'string',
      default: "'找不到結果'",
      desc: '沒有結果時顯示的字，報讀軟體也念這句。',
    },
    {
      name: 'errorTitle',
      type: 'string',
      default: "'載入失敗'",
      desc: '載入失敗的標題：寫哪一塊沒載入。',
    },
    {
      name: 'errorDescription',
      type: 'string',
      default: "''",
      desc: '載入失敗的說明：寫下一步。空字串不顯示。',
    },
    {
      name: 'retryText',
      type: 'string',
      default: "'重試'",
      desc: '重試鈕的字。',
    },
    {
      name: 'showRetry',
      type: 'boolean | null',
      default: 'null',
      desc: '載入失敗時要不要畫重試鈕。不設（null）就看有沒有綁 (retry)。自己包一層、把 retry 轉出去的元件，用它告訴清單外面有沒有人聽。',
    },
    {
      name: 'announcement',
      type: 'string | null',
      default: 'null',
      desc: 'ready 時報讀軟體念的字。不設念「找到 N 筆」（N 是畫出來的列數）；你只列出一部分時自己寫，例如「找到 54 筆，先列出前 20 筆」；設空字串就不念。',
    },
    {
      name: '(activeIdChange)',
      type: 'EventEmitter<string | null>',
      desc: '選中的項目 id 改變。',
      isOutput: true,
    },
    {
      name: '(activeOptionIdChange)',
      type: 'EventEmitter<string | null>',
      desc: '選中那一列在畫面上的 id 改變；沒選中是 null。把它設到輸入框的 aria-activedescendant。',
      isOutput: true,
    },
    {
      name: '(itemSelect)',
      type: 'EventEmitter<ResultListItem>',
      desc: '選了一列：選中時按 Enter，或點那一列。',
      isOutput: true,
    },
    {
      name: '(retry)',
      type: 'EventEmitter<void>',
      desc: '按了載入失敗的重試鈕。有綁這個事件，重試鈕才會出現。',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '跟搜尋框一起用：把輸入框的 keydown 轉進清單，把選中那一列的 id 接回輸入框',
      code: `<div (keydown)="onKeydown($event)">
  <app-search-field ariaLabel="搜尋項目" [(value)]="keyword"
    listboxId="item-results" [listboxExpanded]="rows().length > 0" [activeDescendant]="activeOption()">
  </app-search-field>

  <app-result-list #resultList listId="item-results" ariaLabel="搜尋結果"
    [groups]="groups()" [state]="state()"
    (activeOptionIdChange)="activeOption.set($event)"
    (itemSelect)="open($event)" (retry)="reload()">
  </app-result-list>
</div>

// 元件裡
onKeydown(event: KeyboardEvent): void {
  if (!(event.target instanceof HTMLInputElement)) return;
  this.resultList().handleKeydown(event);
}`,
    },
    {
      label: '有標題的群組，加上自訂的列內容',
      code: `<ng-template #row let-item let-active="active">
  <app-label color="GreyOutline" size="S" [text]="item.data.code"></app-label>
  <span class="row-name">{{ item.label }}</span>
</ng-template>

<app-result-list ariaLabel="搜尋結果" [itemTemplate]="row"
  [groups]="[
    { id: 'recent', label: '最近開啟', items: recentItems },
    { id: 'all', label: '全部', items: allItems },
  ]"
  (itemSelect)="open($event)">
</app-result-list>`,
    },
    {
      label: '四種狀態由使用端切換',
      code: `<app-result-list ariaLabel="搜尋結果" [groups]="groups()"
  [state]="loading() ? 'loading' : failed() ? 'error' : groups().length ? 'ready' : 'empty'"
  [emptyText]="'找不到「' + keyword() + '」的相關結果'"
  errorTitle="搜尋失敗" errorDescription="請再試一次"
  (retry)="reload()">
</app-result-list>`,
    },
  ],
  usageNotes: [
    'handleKeydown(event) 回傳 true 表示這一下元件用掉了：↓↑ 移動選中，選中時 Enter 發 itemSelect；用掉的按鍵已經取消預設動作、不往外傳。沒選中的 Enter、其他按鍵、輸入法選字中、按著 Alt／Ctrl／⌘ 都回傳 false，交給你處理。',
    '只轉輸入框上的按鍵。清除鈕或旁邊按鈕上的 Enter 是按那顆按鈕，轉進來會變成選取清單裡的列。',
    {
      type: 'warn',
      content: '內容或狀態改變造成的選中變化（例如新結果裡沒有原本選中的那一列），activeIdChange 與 activeOptionIdChange 會晚一個 microtask 才送，避免在你的範本檢查到一半時改值。測試裡改完 groups 要 await fixture.whenStable() 再斷言。按鍵與滑鼠造成的變化是同步送的。',
    },
    '查詢的字變了、或面板關掉時呼叫 resetActive()：選中是用項目 id 記的，新結果裡剛好有同一筆時會維持選中，下一次按 Enter 就會選到它。app-command-palette 已經幫你呼叫。',
    '自訂列範本時，放不下怎麼辦由你的範本決定：要截成一行就自己加 overflow: hidden、text-overflow: ellipsis、white-space: nowrap，外層要有 min-width: 0。',
    '元件自己不捲動。把它放進有固定高度、overflow-y: auto 的容器裡，用鍵盤選到看不見的列時會自己捲進來。',
    '項目的 id 要給不重複的值。重複時畫得出來，但選中只認第一筆，後面同 id 的列用鍵盤選不到，上下鍵也走不過那一列；開發模式下主控台會提醒。',
    'listId 請給固定的值，不要在元件畫出來之後再改：列的 id 是照一開始的 listId 排的。',
  ],
};
