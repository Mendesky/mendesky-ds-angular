import type { ComponentDoc } from '../../../../docs/component-doc';

export const sortHeaderDoc: ComponentDoc = {
  id: 'sort-header',
  name: 'Sort Header',
  selector: 'app-sort-header',
  group: '展示元件',
  summary: 'label · key · [sort]: SortState | null · align: start|end · (sortChange)',
  when: '列表表頭裡可點擊排序的一格。點了發出這欄的 key，由呼叫端決定怎麼排、並把新的排序狀態傳回來；本元件不持有狀態，也不排序資料。',
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
      type: "'start' | 'end'",
      default: "'start'",
      desc: '文字靠左（預設）或靠右（數字欄）',
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
  ],
  notes: [
    { type: 'info', content: '沒在排序的欄：跟一般表頭一樣是淺灰字，滑過或鍵盤聚焦時才出現排序圖示。正在排序的欄：動作色、半粗，一直顯示上／下箭頭。' },
    { type: 'info', content: '欄寬由呼叫端放在 host 上的 class（例：col-name）決定。' },
    { type: 'info', content: 'nextSort(目前狀態, key, 預設方向)：點同一欄反轉方向，點別欄從預設方向開始。數量、日期欄通常傳 \'desc\'，第一次點就「多到少／新到舊」。' },
    { type: 'info', content: 'host 帶 role="columnheader" 與 aria-sort，讀屏會唸出目前的排序方向。' },
  ],
};
