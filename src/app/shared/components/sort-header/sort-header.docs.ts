import type { ComponentApi } from '../../../../docs/component-doc';

export const sortHeaderDoc: ComponentApi = {
  id: 'sort-header',
  selector: 'app-sort-header',
  summary: 'label · key · [sort]: SortState | null · align: start|center|end · leftIcon · (sortChange)',
  props: [
    {
      name: 'label',
      type: 'string',
      default: "''",
      desc: '表頭文字',
    },
    {
      name: 'key',
      type: 'string',
      default: "''",
      desc: '這欄的識別字，點擊時原樣發出；也用來產生 data-testid="sort-<key>"',
    },
    {
      name: 'sort',
      type: 'SortState | null',
      default: 'null',
      desc: '列表目前的排序狀態 { key, dir }；null 表示沒有排序',
    },
    {
      name: 'align',
      type: "'start' | 'center' | 'end'",
      default: "'start'",
      desc: '文字靠左（預設）、置中或靠右（數字欄）。靠左、靠右時按鈕往外拉 6px，跟下方內容的邊緣對齊；置中不拉',
    },
    {
      name: 'leftIcon',
      type: 'string',
      default: "''",
      desc: '欄名前面的圖示名稱（app-icon 的 name）。12px、跟著文字色、報讀軟體不念。空字串＝不放',
    },
    {
      name: '(sortChange)',
      type: 'EventEmitter<string>',
      desc: '點擊時發出 key',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '搭配 nextSort 切換方向',
      code: `<app-sort-header class="col-name" label="姓名" key="name" [sort]="sort()" (sortChange)="onSort($event)"></app-sort-header>

// component
sort = signal<SortState | null>(null);
onSort(key: string) { this.sort.set(nextSort(this.sort(), key)); }`,
    },
    {
      label: '數字欄靠右、欄名前面放圖示',
      code: `<app-sort-header class="col-amount" label="金額" key="amount" align="end" leftIcon="Money" [sort]="sort()" (sortChange)="onSort($event)"></app-sort-header>`,
    },
    {
      label: '放在有表格結構的列表裡',
      code: `<div role="table" aria-label="人員">
  <div role="row">
    <app-sort-header class="col-name" label="姓名" key="name" [sort]="sort()" (sortChange)="onSort($event)"></app-sort-header>
  </div>
  <!-- 每一列 role="row"、每一格 role="cell" -->
</div>`,
    },
  ],
  usageNotes: [
    '外層是不是表格列（祖先有 role="row"）只在元件建立時判斷一次。之後才把 role="row" 加上去的話，元件不會跟著變。',
    '[sort] 每次改變都要傳新的物件（nextSort 回的就是新物件）。原地改同一個物件的 key 或 dir，元件收不到變更，不會念、也不會清掉上一句。',
    '點了之後要念出「已依〈欄名〉升冪排序」，需要呼叫端在 (sortChange) 之後一秒內把新的 [sort] 傳回來。先打後端再回來的列表也一樣：超過一秒才傳回來就不念。元件用時間比對，不開計時器，在 fakeAsync 的測試裡點表頭不用另外 flush。',
    '那一句念完會留在 role="status" 區域裡，直到使用者離開這一欄（按鈕失焦，或滑鼠移開）。測試要在點了之後馬上讀，不要先移開焦點。',
    '放在表格列裡時，元件本身的元素另外帶 aria-label，值是欄名。不要自己在 <app-sort-header> 上寫 aria-label、role、aria-sort，會被元件蓋掉。',
  ],
};
