import type { ComponentDoc } from '../../../../docs/component-doc';

export const processModalDoc: ComponentDoc = {
  id: 'process-modal',
  name: 'Process Modal',
  selector: 'app-process-modal',
  group: '浮層元件',
  summary: 'type: running|congratulation · message [isOpen] · (dismissed)',
  when: '耗時操作的進度顯示（覆蓋整個畫面）。',
  props: [
    {
      name: 'type',
      type: "'running' | 'congratulation'",
      desc: 'running = 白底小卡 + spinner；congratulation = 綠底慶祝卡',
    },
    {
      name: 'message',
      type: 'string',
      desc: '顯示文字（running 預設「執行中請稍候」）',
    },
    {
      name: 'isOpen',
      type: 'boolean',
      desc: '控制顯示/隱藏',
    },
    {
      name: '(dismissed)',
      type: 'EventEmitter<void>',
      desc: '關閉回調（僅 congratulation 觸發）',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-process-modal
  type="running"
  message="執行中請稍候"
  [isOpen]="isProcessing()"
  (dismissed)="onDone()"
></app-process-modal>`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: 'running 狀態不可關閉（系統處理中阻擋操作）；congratulation 點擊背景可觸發 (dismissed)。',
    },
  ],
  customTables: [
    {
      title: '外觀規格',
      columns: [
        '',
        'running',
        'congratulation',
      ],
      rows: [
        [
          '尺寸',
          '333 × 72px',
          '333 × 104px',
        ],
        [
          '背景',
          '#ffffff',
          '--button/success #74ae3e',
        ],
        [
          '圓角',
          '10px',
          '10px',
        ],
        [
          '陰影',
          '0 0 20px rgba(0,0,0,0.2)',
          '0 0 20px rgba(0,0,0,0.2)',
        ],
        [
          '左側',
          'Loading spinner icon (36×36)',
          '彩帶慶祝插圖',
        ],
        [
          '文字色',
          '--text/body #686868',
          '#ffffff',
        ],
      ],
    },
  ],
};
