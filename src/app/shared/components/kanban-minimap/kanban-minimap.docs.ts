import type { ComponentApi } from '../../../../docs/component-doc';

export const kanbanMinimapDoc: ComponentApi = {
  id: 'kanban-minimap',
  selector: 'app-kanban-minimap',
  summary: 'columns: MinimapColumn[] · boardContainer: HTMLElement',
  props: [
    {
      name: 'boardContainer',
      type: 'HTMLElement | null',
      default: 'null',
      desc: '看板的捲動容器（傳入 ViewChild 的 nativeElement）',
    },
    {
      name: 'columns',
      type: 'MinimapColumn[]',
      default: '[]',
      desc: '欄位資料，每項含 label、color、cardCount',
    },
  ],
  usage: [
    {
      label: '看板視圖整合',
      code: `<!-- 在 kanban 視圖區塊內 -->
<div class="kb-area" #kbArea *ngIf="isKanban">
  <!-- kanban board ... -->
  <app-kanban-minimap
    [boardContainer]="kbAreaRef?.nativeElement"
    [columns]="minimapColumns()"
  ></app-kanban-minimap>
</div>

// TS: minimapColumns
minimapColumns = computed(() =>
  columns().map(col => ({
    label: col.label,
    color: col.dotColor,
    cardCount: col.cards.length,
  }))
);`,
    },
  ],
};
