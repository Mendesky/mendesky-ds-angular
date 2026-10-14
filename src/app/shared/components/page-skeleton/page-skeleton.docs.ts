import type { ComponentDoc } from '../../../../docs/component-doc';

export const pageSkeletonDoc: ComponentDoc = {
  id: 'page-skeleton',
  name: 'Page Skeleton',
  selector: 'app-page-skeleton',
  group: '展示元件',
  summary: '（無 Input/Output）',
  when: '頁面 loading 時的佔位符。',
  props: [],
  usage: [],
  notes: [
    {
      type: 'info',
      content: '頁面資料載入前的 shimmer 佔位動畫，防止 layout shift。',
    },
  ],
  customTables: [],
};
