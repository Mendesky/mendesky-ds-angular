import type { ComponentDoc } from '../../../../docs/component-doc';

export const carouselDotDoc: ComponentDoc = {
  id: 'carousel-dot',
  name: 'Carousel Dot',
  selector: 'app-carousel-dot',
  group: '互動元件',
  summary: 'variant: Dot|Line|Text · [active] text · (dotClick)',
  when: '圖片輪播指示、kanban 分頁點。多步驟 wizard 請改用 app-stepper。',
  props: [
    {
      name: 'variant',
      type: "'Dot' | 'Line'",
      default: "'Dot'",
      desc: '基礎形狀',
    },
    {
      name: 'active',
      type: 'boolean',
      default: 'false',
      desc: '選中狀態（深藍膠囊）',
    },
    {
      name: 'text',
      type: 'string',
      default: "''",
      desc: '有值時啟用 hover 展開文字行為',
    },
    {
      name: '(dotClick)',
      type: 'EventEmitter<void>',
      desc: '點擊時觸發',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: 'Dot，無文字',
      code: '<app-carousel-dot [active]="i === currentIndex" (dotClick)="currentIndex = i"></app-carousel-dot>',
    },
    {
      label: 'Line，無文字',
      code: '<app-carousel-dot variant="Line" [active]="i === currentIndex" (dotClick)="currentIndex = i"></app-carousel-dot>',
    },
    {
      label: 'Dot + text（hover 展開膠囊）',
      code: `<app-carousel-dot
  [text]="col.label"
  [active]="i === currentIndex"
  (dotClick)="currentIndex = i"
></app-carousel-dot>`,
    },
  ],
  notes: [],
  customTables: [],
};
