import type { ComponentApi } from '../../../../docs/component-doc';

export const commandPaletteDoc: ComponentApi = {
  id: 'command-palette',
  selector: 'app-command-palette',
  summary: 'isOpen · ariaLabel（必填） · inputLabel placeholder · [(query)] · groups state itemTemplate · [autoActivateFirst] [wrap] · listLabel loadingText emptyText errorTitle errorDescription retryText announcement · [showHints] selectHint · width maxHeight · (itemSelect) (querySubmit) (retry) (closeRequest) (afterLeave) · [paletteEnd] 投影到搜尋框右邊',
  props: [
    {
      name: 'isOpen',
      type: 'boolean',
      default: 'false',
      desc: '開關，由使用端管。收到 closeRequest 或選好一項之後自己設成 false。',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      desc: '必填。對話框的報讀名稱，例如「搜尋項目」。輸入框沒另外設 inputLabel 時也用它。',
    },
    {
      name: 'inputLabel',
      type: 'string',
      default: "''",
      desc: '輸入框的報讀名稱。不設就用 ariaLabel。',
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'搜尋'",
      desc: '輸入框的提示文字：寫可以打什麼來找。',
    },
    {
      name: 'query',
      type: 'string',
      default: "''",
      desc: '輸入框裡的字；跟 queryChange 寫成 [(query)]。',
    },
    {
      name: 'groups',
      type: 'readonly ResultListGroup[]',
      default: '[]',
      desc: '要列出來的結果，格式跟 app-result-list 的 groups 一樣。還沒打字時也可以給，例如一組「最近開啟」。',
    },
    {
      name: 'state',
      type: 'ResultListState',
      default: "'ready'",
      desc: "'ready' | 'loading' | 'empty' | 'error'，跟 app-result-list 的 state 一樣。",
    },
    {
      name: 'itemTemplate',
      type: 'TemplateRef<ResultListItemContext> | null',
      default: 'null',
      desc: '每一列的內容範本，直接交給 app-result-list。',
    },
    {
      name: 'autoActivateFirst',
      type: 'boolean',
      default: 'false',
      desc: '有結果就先選中第一列。',
    },
    {
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      desc: '上下鍵到頭尾時繞回另一端。',
    },
    {
      name: 'listLabel',
      type: 'string',
      default: "'搜尋結果'",
      desc: '清單的報讀名稱。',
    },
    {
      name: 'loadingText',
      type: 'string',
      default: "'搜尋中'",
      desc: '載入中顯示與念出來的字。',
    },
    {
      name: 'emptyText',
      type: 'string',
      default: "'找不到結果'",
      desc: '沒有結果時顯示與念出來的字。',
    },
    {
      name: 'errorTitle',
      type: 'string',
      default: "'載入失敗'",
      desc: '載入失敗的標題。',
    },
    {
      name: 'errorDescription',
      type: 'string',
      default: "''",
      desc: '載入失敗的說明。',
    },
    {
      name: 'retryText',
      type: 'string',
      default: "'重試'",
      desc: '重試鈕的字。',
    },
    {
      name: 'announcement',
      type: 'string | null',
      default: 'null',
      desc: 'ready 時報讀軟體念的字。不設念「找到 N 筆」，設空字串不念。',
    },
    {
      name: 'showHints',
      type: 'boolean',
      default: 'true',
      desc: '底部要不要畫按鍵提示（↑↓ 瀏覽、↵ 選取、esc 關閉）。觸控裝置一律不畫。',
    },
    {
      name: 'selectHint',
      type: 'string',
      default: "'選取'",
      desc: '按鍵提示裡 Enter 後面的字，寫選了之後會怎樣，例如「開啟」。',
    },
    {
      name: 'width',
      type: 'string',
      default: "'min(680px, calc(100vw - 32px))'",
      desc: '對話框寬度。平板以下的螢幕由 app-modal-shell 改成幾乎佔滿畫面寬度，這個設定不生效。',
    },
    {
      name: 'maxHeight',
      type: 'string',
      default: "'72vh'",
      desc: '對話框最高多高。結果超過時，搜尋列與提示列不動，中間的清單自己捲。',
    },
    {
      name: '(queryChange)',
      type: 'EventEmitter<string>',
      desc: '輸入框的字變了，含清空。關掉面板時如果還有字，也會送一次空字串。',
      isOutput: true,
    },
    {
      name: '(itemSelect)',
      type: 'EventEmitter<ResultListItem>',
      desc: '選了一列：選中時按 Enter，或點那一列。面板不會自己關，要關就把 isOpen 設成 false。',
      isOutput: true,
    },
    {
      name: '(querySubmit)',
      type: 'EventEmitter<string>',
      desc: '沒選中任何一列就按 Enter，帶目前的字。輸入法選字中、按住連發不送。',
      isOutput: true,
    },
    {
      name: '(retry)',
      type: 'EventEmitter<void>',
      desc: '按了載入失敗的重試鈕。有綁這個事件，重試鈕才會出現。',
      isOutput: true,
    },
    {
      name: '(closeRequest)',
      type: "EventEmitter<CommandPaletteCloseReason>",
      desc: "使用者想關面板：'escape'（沒字的時候按 Esc）或 'backdrop'（點背景）。收到後把 isOpen 設成 false。",
      isOutput: true,
    },
    {
      name: '(afterLeave)',
      type: 'EventEmitter<void>',
      desc: '退場動畫跑完之後。',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '打字就查：字變了去查，結果回來給 groups 與 state',
      code: `<app-button variant="outlined" color="neutral" size="M" text="搜尋項目" leftIcon="Search"
  (btnClick)="open.set(true)"></app-button>

<app-command-palette ariaLabel="搜尋項目" placeholder="輸入名稱或編號"
  [isOpen]="open()" [query]="keyword()" [groups]="groups()" [state]="state()"
  [emptyText]="'找不到「' + keyword() + '」的相關結果'"
  errorTitle="搜尋失敗" errorDescription="請再試一次"
  (queryChange)="search($event)"
  (itemSelect)="openItem($event); open.set(false)"
  (retry)="search(keyword())"
  (closeRequest)="open.set(false)">
</app-command-palette>`,
    },
    {
      label: '還沒打字時列出最近開啟；列的內容自己畫；右邊放一顆按鈕',
      code: `<ng-template #row let-item>
  <app-label color="GreyOutline" size="S" [text]="item.data.code"></app-label>
  <span class="row-name">{{ item.label }}</span>
</ng-template>

<app-command-palette ariaLabel="搜尋項目" [isOpen]="open()" [(query)]="keyword"
  [groups]="keyword ? results() : [{ id: 'recent', label: '最近開啟', items: recent() }]"
  [state]="state()" [itemTemplate]="row" selectHint="開啟"
  (itemSelect)="openItem($event)" (querySubmit)="openOnlyResult()"
  (closeRequest)="open.set(false)">
  <app-button paletteEnd variant="outlined" color="primary" size="M" text="搜尋"
    (btnClick)="openOnlyResult()"></app-button>
</app-command-palette>`,
    },
  ],
  usageNotes: [
    '元件不打後端，也不決定搜什麼、用哪個快速鍵打開。要用 ⌘K 打開就在頁面自己聽按鍵；⌘N、⌘T、⌘W 這些瀏覽器不讓網頁攔的不要用。',
    '焦點：打開的那一輪畫面更新完就在輸入框，使用者一打開就能打字。關掉、退場動畫結束後，焦點回到打開前的那個元素；這時焦點已經被使用者移到別的元素就不搶。不要自己在打開或關閉時呼叫 focus()。',
    'Esc：輸入框有字時第一下只清空，不會發 closeRequest；沒字才發。焦點在 paletteEnd 的按鈕上時按 Esc 會直接發 closeRequest。',
    '關掉面板時元件會把字清空、把選中清掉，並送一次 queryChange 空字串，重開不會看到上一次的字。你那邊的結果也要跟著清：收到空字串時把 groups 清掉或換回還沒打字時的內容。',
    {
      type: 'warn',
      content: 'itemSelect 之後面板不會自己關。開啟那一筆要等後端時，自己擋住重複觸發（例如加一個「開啟中」的旗標）：使用者連按兩下 Enter 會收到兩次 itemSelect。',
    },
    '「只有一筆結果時按 Enter 直接開」這類規則由使用端在 querySubmit 裡決定，元件不做。',
    '面板要一直留在範本裡，用 isOpen 開關。用 @if 把整個面板拿掉的話，關閉時的清空通知（queryChange 空字串）送不出來，退場動畫也不會跑。',
    '按了重試鈕之後，焦點會回到輸入框：重試鈕接著會消失，焦點不放回去會掉出面板。',
    '不放在 paletteEnd 的投影內容會出現在清單上面，適合放一行說明，例如可以搜尋的範圍。',
    '測試：對話框有 0.45 秒的進場與退場計時器，await fixture.whenStable() 會等它。要驗「打開當下」的狀態就只呼叫 fixture.detectChanges()。',
  ],
};
