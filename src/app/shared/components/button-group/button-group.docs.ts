import type { ComponentApi } from '../../../../docs/component-doc';

export const buttonGroupDoc: ComponentApi = {
  id: 'button-group',
  selector: 'app-button-group',
  summary: 'type: form|round|view · size: S|M|L · color: neutral|primary（view）· options: ButtonGroupOption[]（可放 icon）· value · [disabled] errorMessage errorPosition: top|bottom · (valueChange)',
  props: [
    {
      name: 'type',
      type: 'ButtonGroupType',
      default: "'form'",
      desc: 'form | round | view',
    },
    {
      name: 'size',
      type: "'S' | 'M' | 'L'",
      default: "'L'",
      desc: 'form / view 皆生效。form: L≈46 / M≈36 / S≈26px；view: 按鈕 L=32 / M=28 / S=24px，外框（白底槽）再加上下各 2px，L=36 / M=32 / S=28px。只放圖示的按鈕是正方形。round 不吃 size。',
    },
    {
      name: 'color',
      type: "'neutral' | 'primary'",
      default: "'neutral'",
      desc: '只對 view 生效：選中的底色。neutral＝深灰，用在中性的設定（例：字級、排版方式）；primary＝深藍，用在功能操作（例：切換畫面的呈現方式）。',
    },
    {
      name: 'options',
      type: 'ButtonGroupOption[]',
      default: '[]',
      desc: '{ value: string; label: string; disabled?: boolean; icon?: string }[]。有 icon（同 app-icon 的 name）時按鈕只放圖示，label 改當報讀名稱與滑過提示，所以 label 仍然必填。建議只在 view 用 icon。只放圖示的選項不要停用：停用的按鈕滑鼠碰不到、鍵盤停不上去，提示出不來，看畫面的人不知道它叫什麼；要停用的選項改放文字（開發模式下會在主控台提醒）。',
    },
    {
      name: 'value',
      type: 'string | null',
      default: 'null',
      desc: '目前選中的值，搭配 [(value)] 雙向綁定',
    },
    {
      name: 'disabled',
      type: 'boolean',
      default: 'false',
      desc: '整組禁用。選項只放圖示時不要整組停用，理由同 options。',
    },
    {
      name: 'errorMessage',
      type: 'string',
      default: "''",
      desc: '非空時顯示 error 狀態（僅 form 有效）',
    },
    {
      name: 'errorPosition',
      type: "'top' | 'bottom'",
      default: "'bottom'",
      desc: '錯誤 tooltip 顯示方向（浮動，不佔版面）',
    },
    {
      name: '(valueChange)',
      type: 'EventEmitter<string>',
      desc: '選項改變時輸出新值',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-button-group
  type="form"
  [options]="[{value:'a', label:'選項A'}, {value:'b', label:'選項B'}]"
  [(value)]="selectedValue"
  errorMessage="請至少選擇一項"
></app-button-group>`,
    },
    {
      label: 'view：只放圖示、選中深藍',
      code: `<app-button-group
  type="view" size="M" color="primary"
  [options]="[
    { value: 'list', label: '清單', icon: 'Table' },
    { value: 'kanban', label: '看板', icon: 'Kanban' },
  ]"
  [value]="mode"
  (valueChange)="mode = $event"
></app-button-group>`,
    },
  ],
};
