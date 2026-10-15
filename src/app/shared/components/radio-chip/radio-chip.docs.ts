import type { ComponentDoc } from '../../../../docs/component-doc';

export const radioChipDoc: ComponentDoc = {
  id: 'radio-chip',
  name: 'Radio Chip',
  selector: 'app-radio-chip',
  group: '互動元件',
  summary: 'text size: s|m · [showRadio] [showCancel] · (cancelClick) · CVA 控制 selected/isDisabled',
  when: '篩選條件單選、可取消的選項。',
  props: [
    {
      name: 'text',
      type: 'string',
      default: "''",
      desc: '顯示文字',
    },
    {
      name: 'size',
      type: 'RadioChipSize',
      default: "'s'",
      desc: "'m' | 's' | 'xs'",
    },
    {
      name: 'showRadio',
      type: 'boolean',
      default: 'true',
      desc: '是否顯示左側 Radio 圓圈圖示',
    },
    {
      name: 'showCancel',
      type: 'boolean',
      default: 'false',
      desc: '選中後右側顯示 × 取消按鈕',
    },
    {
      name: '(cancelClick)',
      type: 'EventEmitter<void>',
      desc: '點擊 × 按鈕時觸發，由父層清空選中值',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '單選篩選群組',
      code: `<app-radio-chip
  *ngFor="let opt of statusOptions"
  [text]="opt.label"
  [showCancel]="true"
  [(ngModel)]="opt.selected"
  (cancelClick)="clearStatus()"
></app-radio-chip>

// 清除群組：
clearStatus() { this.statusOptions.forEach(o => o.selected = false); }`,
    },
  ],
  notes: [
    {
      type: 'info',
      content: 'app-radio-chip 實作單選語意：點擊後 selected → true，不支援自身再次點擊取消（Radio 語意）。若需取消選中，開啟 [showCancel]="true"，並監聽 (cancelClick) 事件由父元件清空整個群組的選中值。',
    },
  ],
  customTables: [],
};
