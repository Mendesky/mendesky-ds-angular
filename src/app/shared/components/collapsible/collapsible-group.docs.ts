import type { ComponentApi } from '../../../../docs/component-doc';

export const collapsibleGroupDoc: ComponentApi = {
  id: 'collapsible-group',
  selector: 'app-collapsible-group',
  summary: '[single] · 包住 app-collapsible（可以隔著卡片等元素）',
  props: [
    {
      name: 'single',
      type: 'boolean',
      default: 'false',
      desc: '一次只開一段。設了之後，使用者打開一段時，同一組裡原本開著的段落收起來，並各自發 (expandedChange) 帶出 false。',
    },
  ],
  usage: [
    {
      label: '一次只開一段',
      code: `<app-collapsible-group single>
  <app-collapsible title="第一組設定">…</app-collapsible>
  <app-collapsible title="第二組設定">…</app-collapsible>
  <app-collapsible title="第三組設定">…</app-collapsible>
</app-collapsible-group>`,
    },
    {
      label: '段落包在卡片裡也算同一組',
      code: `<app-collapsible-group single>
  @for (item of items; track item.id) {
    <div class="card">
      <app-collapsible appearance="card" [title]="item.name">…</app-collapsible>
    </div>
  }
</app-collapsible-group>`,
    },
  ],
  usageNotes: [
    'app-collapsible 往外找最近的群組，中間隔著幾層元素都算。段落內容裡再放的 app-collapsible 不算這一組，打開它不會收掉外層。',
    {
      type: 'warn',
      content: '群組只在使用者打開一段時收起其他段。頁面自己用 [(expanded)] 打開某一段時，群組不會收其他段，要一次只開一段就由頁面自己把其他段設成 false。',
    },
    '停用的段落不會被群組收起來，維持原來的開合。',
  ],
};
