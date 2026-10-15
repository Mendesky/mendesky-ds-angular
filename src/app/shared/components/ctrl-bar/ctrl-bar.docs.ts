import type { ComponentDoc } from '../../../../docs/component-doc';

export const ctrlBarDoc: ComponentDoc = {
  id: 'ctrl-bar',
  name: 'Ctrl Bar',
  selector: 'app-ctrl-bar',
  group: '展示元件',
  summary: 'slot=left · slot=right · flex 佈局容器，左右分佈操作列內容',
  when: '頁面或區塊頂部的操作列，左側放篩選/toggle，右側放搜尋/切換。',
  props: [],
  usage: [
    {
      label: '基本用法',
      code: `<app-ctrl-bar>
  <ng-container slot="left">
    <!-- 篩選、排序等左側控制項 -->
    <app-icon-btn propClass="Normal" size="24" ...></app-icon-btn>
  </ng-container>
  <ng-container slot="right">
    <!-- 搜尋、POV 切換等右側控制項 -->
    <app-input ...></app-input>
  </ng-container>
</app-ctrl-bar>`,
    },
  ],
  notes: [],
  customTables: [
    {
      title: 'Content Projection Slots',
      columns: [
        'Slot',
        '說明',
      ],
      rows: [
        [
          '[slot=left]',
          '左對齊區塊，items flex-wrap，適合篩選 chips、toggle、排序按鈕',
        ],
        [
          '[slot=right]',
          '右對齊區塊，flex-shrink: 0，適合搜尋欄、視角切換',
        ],
      ],
    },
  ],
};
