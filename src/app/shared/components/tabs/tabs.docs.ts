import type { ComponentApi } from '../../../../docs/component-doc';

export const tabsDoc: ComponentApi = {
  id: 'tabs',
  selector: 'app-tabs',
  summary: 'items: TabItem[]（必填；{ value, label, disabled?, status?: { label } }）· [value] · ariaLabel（必填）· panelId · (valueChange) · 最後一個頁籤右邊可投影按鈕',
  props: [
    {
      name: 'items',
      type: 'TabItem[]',
      desc: '頁籤，依序由左到右。每一項是 { value, label, disabled?, status? }：value 是這個頁籤代表的值（字串或數字，不能重複）；label 是頁籤上的文字；disabled 為 true 時停用；status 是狀態標記 { label }，有值時文字右邊顯示紅色驚嘆號，滑過顯示 label，報讀軟體把 label 接在文字後面念。必填。',
    },
    {
      name: 'value',
      type: 'string | number | null',
      default: 'null',
      desc: '選中的頁籤的 value。null 是都沒選中，這時 Tab 會停在第一個沒停用的頁籤。元件不會自己改這個值，要在 (valueChange) 裡改。',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '頁籤列的名稱，輸出成 role="tablist" 的 aria-label，報讀軟體會念。必填。',
    },
    {
      name: 'panelId',
      type: 'string',
      default: "''",
      desc: '內容外框的 id。給了的話每個頁籤輸出 aria-controls 指向它；內容外框要自己標 role="tabpanel"、id 設成同一個值，aria-labelledby 綁 selectedTabId。空字串不輸出。',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string | number>',
      desc: '選中另一個頁籤時觸發，帶出那個頁籤的 value：點擊、左右方向鍵、Home、End 都會觸發。點已選中的頁籤、點停用的頁籤不觸發。',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法：頁籤切換下方內容，內容外框標成 tabpanel',
      code: `<app-tabs #groupTabs ariaLabel="資料分組" panelId="group-panel"
  [items]="groups" [value]="activeGroup()" (valueChange)="activeGroup.set($event)"></app-tabs>

<div id="group-panel" role="tabpanel" [attr.aria-labelledby]="groupTabs.selectedTabId">
  <!-- activeGroup() 這一組的內容 -->
</div>`,
    },
    {
      label: '狀態標記：有東西要處理的那一組，status 給 { label }',
      code: `groups: TabItem[] = [
  { value: 'a', label: '第一組' },
  { value: 'b', label: '第二組', status: { label: '需處理' } },
  { value: 'c', label: '第三組', disabled: true },
];
// (valueChange) 帶出的值是 string | number，接它的 signal 用同一個型別
activeGroup = signal<string | number>('a');`,
    },
    {
      label: '尾端放按鈕：投影的內容在最後一個頁籤右邊、頁籤清單外面',
      code: `<app-tabs ariaLabel="資料分組" [items]="groups" [value]="activeGroup()"
  (valueChange)="activeGroup.set($event)">
  <app-button variant="ghost" color="neutral" size="S" leftIcon="Plus" text="新增一組"
    (btnClick)="addGroup()"></app-button>
</app-tabs>`,
    },
  ],
  usageNotes: [
    'TabItem 與狀態標記的型別 StatusMark 都從 @mendesky/ds-angular 匯出。',
    'selectedTabId 是元件上的唯讀屬性。用範本參考變數（例如 #groupTabs）取到元件，再把 groupTabs.selectedTabId 綁到內容外框的 aria-labelledby。都沒選中時是 null，aria-labelledby 就不輸出。',
    {
      type: 'warn',
      content: 'value 是單向輸入：元件發 (valueChange) 後不會自己改選中的頁籤，要使用端把新值傳回 [value]。沒傳回去的話，畫面上選中的頁籤不會變，但焦點已經移到新頁籤上。',
    },
    'value 不能重複。重複的兩個頁籤會一起選中、一起取消；其中一個選中時，點另一個不會發 (valueChange)。Angular 17 不會報錯提醒，要使用端自己保證不重複。',
  ],
};
