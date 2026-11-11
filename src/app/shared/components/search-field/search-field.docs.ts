import type { ComponentApi } from '../../../../docs/component-doc';

export const searchFieldDoc: ComponentApi = {
  id: 'search-field',
  selector: 'app-search-field',
  summary: 'ariaLabel（必填） · appearance: outline|embedded · size: S|M|L · placeholder value [disabled] · (valueChange) (searchSubmit) · focus() · [searchFieldEnd]',
  props: [
    {
      name: 'ariaLabel',
      type: 'string',
      desc: '必填。報讀軟體念的名稱，落在內層 input 的 aria-label。寫這個框在搜什麼，例如「搜尋人員」。',
    },
    {
      name: 'appearance',
      type: 'SearchFieldAppearance',
      default: "'outline'",
      desc: "'outline' | 'embedded'。outline 有外框，放工具列與表單；embedded 是搜尋對話框最上面那一列，沒有外框，元件自己畫留白與底線。",
    },
    {
      name: 'size',
      type: 'SearchFieldSize',
      default: "'M'",
      desc: "'S' | 'M' | 'L'，高 32／36／40 px，跟 app-input 一樣。只對 outline 有效；embedded 的高度由留白決定。",
    },
    {
      name: 'placeholder',
      type: 'string',
      default: "'搜尋'",
      desc: '提示文字。不能拿來代替 ariaLabel。',
    },
    {
      name: 'value',
      type: 'string',
      default: "''",
      desc: '框裡的字。頁面改它會同步到輸入框；跟 valueChange 一起可以寫成 [(value)]。',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '停用：不能打字、沒有清除鈕，按 Esc 也不清空。',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string>',
      desc: '每次輸入、清除都送出目前的字。用輸入法選字時不送，選好字送一次。',
      isOutput: true,
    },
    {
      name: '(searchSubmit)',
      type: 'EventEmitter<string>',
      desc: '按 Enter 時送出目前的字（空字串也送）。選字中、按住連發不送。Enter 事件照常往外傳。',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '列表上方的工具列：打字就篩選，旁邊放篩選鈕',
      code: `<app-ctrl-bar>
  <ng-container slot="left">
    <app-search-field size="S" ariaLabel="搜尋人員" placeholder="搜尋姓名、編號"
      style="flex: 0 1 240px; min-width: 140px"
      [(value)]="keyword"></app-search-field>
    <app-button variant="outlined" color="neutral" size="S" text="部門" rightIcon="DownArrow"></app-button>
  </ng-container>
</app-ctrl-bar>`,
    },
    {
      label: '按 Enter 才查：資料要從後端拿時',
      code: `<app-search-field ariaLabel="搜尋檔案名稱" [(value)]="keyword"
  (searchSubmit)="load($event)"></app-search-field>`,
    },
    {
      label: '搜尋對話框最上面那一列：embedded，右側位置放「搜尋」按鈕；打開時把焦點放進去',
      code: `<app-modal-shell [isOpen]="open" variant="search" ariaLabel="搜尋人員"
  (backdropClick)="open = false" (escapePress)="open = false">
  <app-search-field #search appearance="embedded" ariaLabel="搜尋人員" [(value)]="keyword"
    (searchSubmit)="load($event)">
    <app-button searchFieldEnd variant="outlined" color="primary" size="M" text="搜尋"
      (btnClick)="load(keyword)"></app-button>
  </app-search-field>
  <!-- 搜尋結果 -->
</app-modal-shell>

// 打開對話框之後
@ViewChild('search') search?: SearchFieldComponent;
afterOpen(): void { this.search?.focus(); }`,
    },
  ],
  usageNotes: [
    '右側位置用屬性 searchFieldEnd 投影，只在 appearance="embedded" 時顯示；outline 不會顯示投影進來的內容。',
    {
      type: 'warn',
      content: '頁面會改值（例如換頁時清空）就用 [(value)]，不要只用 [value]。只綁單向時，使用者打字後頁面的值沒跟著變；頁面再設成同一個值，Angular 認為沒變，輸入框不會更新。',
    },
    '輸出叫 searchSubmit，不叫 search：type="search" 的原生 search 事件會冒泡到元件外層，同名輸出會觸發兩次。',
    '放在 app-modal-shell 裡不用另外處理 Esc：有字時元件攔下 Esc 只清空，空了才讓 app-modal-shell 的 escapePress 收到。',
    '寬度跟著外層走。放在 flex 列裡時，在 app-search-field 上給 flex 與 min-width，例如 flex: 0 1 240px、min-width: 140px。',
  ],
};
