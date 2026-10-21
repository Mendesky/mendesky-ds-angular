import type { ComponentApi } from '../docs/component-doc';

export const dsCollapseDoc: ComponentApi = {
  id: 'ds-collapse',
  selector: '.ds-collapse',
  props: [
    {
      name: 'container',
      type: 'class',
      default: '.ds-collapse',
      description: '動畫外殼，負責 grid-template-rows transition',
    },
    {
      name: 'inner',
      type: 'class',
      default: '.ds-collapse__inner',
      description: '內層，設置 overflow: hidden 讓 grid 收合時確實裁切內容',
    },
    {
      name: 'expanded',
      type: 'modifier',
      default: '.ds-collapse--expanded',
      description: '套用此 class 展開；移除則收合',
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<div class="ds-collapse" [class.ds-collapse--expanded]="isExpanded">
  <div class="ds-collapse__inner">
    <!-- 可收合的內容 -->
  </div>
</div>`,
    },
  ],
};
