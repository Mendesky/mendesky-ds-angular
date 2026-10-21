import type { ComponentApi } from '../../../../docs/component-doc';

export const ctrlBarDoc: ComponentApi = {
  id: 'ctrl-bar',
  selector: 'app-ctrl-bar',
  summary: 'slot=left · slot=right · flex 佈局容器，左右分佈操作列內容',
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
};
