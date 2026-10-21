import type { ComponentApi } from '../../../../docs/component-doc';

export const processModalDoc: ComponentApi = {
  id: 'process-modal',
  selector: 'app-process-modal',
  summary: 'type: running|congratulation · message [isOpen] · (dismissed)',
  props: [
    {
      name: 'type',
      type: "'running' | 'congratulation'",
      desc: 'running = 白底小卡 + spinner；congratulation = 綠底慶祝卡',
    },
    {
      name: 'message',
      type: 'string',
      desc: '顯示文字（running 預設「執行中請稍候」；congratulation 預設「恭喜！」，使用端應傳入具體的完成訊息）',
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
};
