import type { ComponentApi } from '../../../../docs/component-doc';

export const listTagDoc: ComponentApi = {
  id: 'list-tag',
  selector: 'app-list-tag',
  summary: 'itemNumber [showBadge] [showBadgeB] [showBadgeC] text',
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
};
