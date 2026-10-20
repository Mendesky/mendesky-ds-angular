import type { ComponentApi } from '../../../../docs/component-doc';

export const iconDoc: ComponentApi = {
  id: 'icon',
  selector: 'app-icon',
  summary: "name（見 icon.registry.ts）· size: 12|16|24|32|36|48 · 顏色透過父層 color CSS 或 style='color:...'",
  props: [
    {
      name: 'name',
      type: 'string',
      desc: 'Icon 名稱（見 Icons 章節完整列表）',
    },
    {
      name: 'size',
      type: "'12'|'16'|'24'|'32'|'36'|'48'",
      default: "'24'",
      desc: '渲染尺寸 px',
    },
  ],
  usage: [
    {
      label: '使用規則',
      code: `<!-- ✅ 正確：用 size input 控制大小 -->
<app-icon name="DownArrow" size="16" style="color:#686868"></app-icon>

<!-- ❌ 禁止：用 inline style 控制大小 -->
<app-icon name="DownArrow" style="width:16px;height:16px"></app-icon>

<!-- 顏色繼承父層 -->
<div style="color:#3a9ccd">
  <app-icon name="Search" size="24"></app-icon>
</div>`,
    },
  ],
};
