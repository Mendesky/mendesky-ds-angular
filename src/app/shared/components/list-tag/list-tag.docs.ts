import type { ComponentDoc } from '../../../../docs/component-doc';

export const listTagDoc: ComponentDoc = {
  id: 'list-tag',
  name: 'List Tag',
  selector: 'app-list-tag',
  group: '展示元件',
  summary: 'itemNumber [showBadge] [showBadgeB] [showBadgeC] text',
  when: '清單項目附帶徽章標記。',
  props: [
    {
      name: 'itemNumber',
      type: 'string',
      default: "'i'",
      desc: '編號徽章內的文字',
    },
    {
      name: 'showBadge',
      type: 'boolean',
      default: 'true',
      desc: '是否顯示編號徽章',
    },
    {
      name: 'showBadgeB',
      type: 'boolean',
      default: 'false',
      desc: '文字後方是否顯示「B」徽章',
    },
    {
      name: 'showBadgeC',
      type: 'boolean',
      default: 'false',
      desc: '文字後方是否顯示「C」徽章',
    },
    {
      name: 'text',
      type: 'string',
      default: "'Text'",
      desc: '標籤文字',
    },
  ],
  usage: [],
  notes: [
    {
      type: 'info',
      content: '用於 app-list 行中的標籤插槽，搭配 app-label 使用。',
    },
  ],
  customTables: [],
};
