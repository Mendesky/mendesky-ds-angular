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
  usageNotes: [
    '左右兩區用內容投影放入：在元素加上 slot="left" 或 slot="right" 屬性（元件內是 <ng-content select="[slot=left]"> 與 <ng-content select="[slot=right]">），例如 <ng-container slot="left">。',
  ],
};
