import type { ComponentApi } from '../../../../docs/component-doc';

export const numberListDoc: ComponentApi = {
  id: 'number-list',
  selector: 'app-number-list',
  summary: 'size: S|M|L · background: white|grey · label text number1 number2 avatarText actions: NumberListAction[] · (actionClick)',
  props: [
    {
      name: 'size',
      type: 'NumberListSize',
      default: "'S'",
      desc: 'S | M',
    },
    {
      name: 'background',
      type: 'NumberListBackground',
      default: "'white'",
      desc: 'hover 底色：white | grey10 | grey20',
    },
    {
      name: 'label',
      type: 'string',
      default: "''",
      desc: '左側 chip 文字；空字串時不顯示。放不下時截成「…」，被截斷時才給 tooltip 與 tab 停點；小於 1024px 換行',
    },
    {
      name: 'text',
      type: 'string',
      default: "''",
      desc: '主文字；規則同 label（≥1024 截斷＋截斷才給 tooltip，<1024 換行）',
    },
    {
      name: 'number1',
      type: 'string',
      default: "''",
      desc: '右側數字（Inter SemiBold，靠右）',
    },
    {
      name: 'number2',
      type: 'string',
      default: "''",
      desc: '次要數字（較深色）',
    },
    {
      name: 'actions',
      type: 'NumberListAction[]',
      default: "['download']",
      desc: 'view | download | edit | delete | subview。右側按鈕固定依 檢視／下載／編輯／刪除 排列，與陣列順序無關',
    },
    {
      name: 'avatarText',
      type: 'string',
      default: "''",
      desc: '非空時顯示 Avatar，傳入使用者姓名',
    },
    {
      name: '(actionClick)',
      type: 'EventEmitter<NumberListAction>',
      desc: '按鈕點擊，回傳 action 類型',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-number-list
  size="S"
  background="grey10"
  label="簡報"
  text="季度簡報.pdf"
  number1="1,234"
  [actions]="['download', 'delete']"
  (actionClick)="onAction($event)"
></app-number-list>`,
    },
  ],
};
