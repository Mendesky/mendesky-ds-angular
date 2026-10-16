import type { ComponentDoc } from '../../../../docs/component-doc';

export const dialogDoc: ComponentDoc = {
  id: 'dialog',
  name: 'Dialog',
  selector: 'app-dialog',
  group: '浮層元件',
  summary: '[isOpen] header content propClass: Warning|Normal confirmText confirmIcon showCancel cancelText loading · (cancel) (confirm)',
  when: '不可逆操作前確認（刪除、封存），或錯誤提示 alert（showCancel:false）。禁止自刻 modal 做確認。title 顏色固定使用 --text/title (#1c1c2e)，禁止 hardcode hex。Warning 只代表「紅色嚴重度」、不等於「刪除動作」：trash 圖示已與 propClass 解耦，僅真正刪除/移除實體才保留預設 Trash-Del，告知型 alert 與非刪除確認（取消封存、復原、送出、匯入）一律 confirmIcon=""。',
  props: [
    {
      name: 'isOpen',
      type: 'boolean',
      desc: '控制顯示/隱藏',
    },
    {
      name: 'header',
      type: 'string',
      desc: '標題文字',
    },
    {
      name: 'content',
      type: 'string',
      desc: '內容說明文字',
    },
    {
      name: 'propClass',
      type: "'Warning' | 'Normal'",
      desc: 'Warning：紅色危險按鈕；Normal：藍色主要按鈕。注意 Warning 僅控制顏色，圖示由 confirmIcon 決定',
    },
    {
      name: 'confirmText',
      type: 'string',
      desc: '確認按鈕文字',
    },
    {
      name: 'confirmIcon',
      type: 'string',
      default: "'Trash-Del'",
      desc: 'Warning 按鈕的 leftIcon。預設垃圾桶供刪除類使用；告知型/非刪除確認 dialog 傳 "" 移除圖示（紅色仍保留）',
    },
    {
      name: 'showCancel',
      type: 'boolean',
      default: 'true',
      desc: '是否顯示取消（次要）按鈕；設為 false 可做單按鈕 alert 模式',
    },
    {
      name: 'cancelText',
      type: 'string',
      default: "'取消並關閉'",
      desc: '取消（次要）按鈕文字。預設「取消並關閉」維持既有外觀；可依情境覆寫（如 wizard 取消新建確認改「繼續新建」）',
    },
    {
      name: 'loading',
      type: 'boolean',
      default: 'false',
      desc: '確認按鈕顯示 loading spinner（API 飛行中），同時 disabled；取消按鈕不受影響',
    },
    {
      name: '(cancel)',
      type: 'EventEmitter<void>',
      desc: '取消/關閉事件',
      isOutput: true,
    },
    {
      name: '(confirm)',
      type: 'EventEmitter<void>',
      desc: '確認事件',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法（confirm 模式）',
      code: `<app-dialog
  [isOpen]="showDialog"
  header="確認刪除"
  content="此操作無法復原，確定要刪除這筆資料嗎？"
  propClass="Warning"
  confirmText="刪除"
  (cancel)="showDialog=false"
  (confirm)="onDelete()"
></app-dialog>`,
    },
    {
      label: 'Alert 模式（單按鈕）',
      code: `<app-dialog
  [isOpen]="showErrorDialog()"
  header="登入失敗"
  [content]="errorMsg()"
  propClass="Normal"
  confirmText="重新登入"
  [showCancel]="false"
  (cancel)="closeDialog()"
  (confirm)="closeDialog()"
></app-dialog>`,
    },
  ],
  notes: [],
  customTables: [
    {
      title: 'Dual-Blur 視覺規格',
      columns: [
        '選擇器',
        '屬性',
        '值',
      ],
      rows: [
        [
          '.dialog-backdrop',
          'background',
          'rgba(0, 0, 0, 0.2)',
        ],
        [
          '.dialog-backdrop',
          'backdrop-filter',
          'blur(8px)',
        ],
        [
          '.dialog-card',
          'background',
          'rgba(255, 255, 255, 0.8)',
        ],
        [
          '.dialog-card',
          'backdrop-filter',
          'blur(10px)',
        ],
      ],
    },
  ],
};
