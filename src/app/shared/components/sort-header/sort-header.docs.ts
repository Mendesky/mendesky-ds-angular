import type { ComponentApi } from '../../../../docs/component-doc';

export const sortHeaderDoc: ComponentApi = {
  id: 'sort-header',
  selector: 'app-sort-header',
  summary: 'label · key · [sort]: SortState | null · align: start|end · (sortChange)',
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
};
