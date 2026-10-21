import type { ComponentApi } from '../../../../docs/component-doc';

export const dividerDoc: ComponentApi = {
  id: 'divider',
  selector: 'app-divider',
  summary: 'display: Row|Column · propClass: White|Grey20|Grey30|Grey40 · [showLabel] labelText',
  props: [
    {
      name: 'display',
      type: "'Row' | 'Column'",
      desc: '水平或垂直分隔線',
    },
    {
      name: 'propClass',
      type: 'DividerClass',
      default: "'Grey20'",
      desc: 'White | Grey20 | Grey30 | Grey40。**沒有 Grey10**（2026-08-18 撤除，DS 外部化後不存在）——需要更淡時只能用 Grey20',
    },
    {
      name: 'showLabel',
      type: 'boolean',
      desc: '是否顯示中間文字',
    },
    {
      name: 'labelText',
      type: 'string',
      desc: '中間顯示文字',
    },
  ],
  usage: [
    {
      label: '帶標籤的水平分隔線',
      code: `<app-divider
  display="Row"
  propClass="Grey20"
  [showLabel]="true"
  labelText="或"
></app-divider>`,
    },
  ],
};
