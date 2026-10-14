import type { ComponentDoc } from '../../../../docs/component-doc';

export const listDoc: ComponentDoc = {
  id: 'list',
  name: 'List',
  selector: 'app-list',
  group: '展示元件',
  summary: 'level: 1|2|3|4 · title value itemNumber · [showItemNumber] [showTitle] [showValue] [hasChildren] status: Default|Hover',
  when: '階層式資料展示。',
  props: [
    {
      name: 'level',
      type: "'1'|'2'|'3'|'4'",
      desc: '層級縮排深度',
    },
    {
      name: 'title',
      type: 'string',
      desc: '左側標題文字',
    },
    {
      name: 'value',
      type: 'string',
      desc: '右側數值文字',
    },
    {
      name: 'itemNumber',
      type: 'number',
      desc: '序號（showItemNumber=true 時顯示）',
    },
    {
      name: 'showItemNumber',
      type: 'boolean',
      desc: '是否顯示序號',
    },
    {
      name: 'showTitle',
      type: 'boolean',
      desc: '是否顯示標題',
    },
    {
      name: 'showValue',
      type: 'boolean',
      desc: '是否顯示數值',
    },
    {
      name: 'hasChildren',
      type: 'boolean',
      desc: '是否有子項目（展開 icon）',
    },
    {
      name: 'status',
      type: "'Default'|'Hover'",
      desc: '視覺狀態',
    },
  ],
  usage: [],
  notes: [],
  customTables: [],
};
