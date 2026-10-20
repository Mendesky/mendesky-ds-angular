import type { ComponentApi } from '../../../../docs/component-doc';

export const keyboardHelpDoc: ComponentApi = {
  id: 'keyboard-help',
  selector: 'app-keyboard-help',
  summary: 'isOpen · shortcuts: ShortcutGroup[] · (close) · 內建搜尋篩選 · 基於 modal-shell 建構',
  props: [
    {
      name: 'isOpen',
      type: 'boolean',
      default: 'false',
      desc: '開關狀態。父層自行綁定 ? 鍵的監聽',
    },
    {
      name: 'shortcuts',
      type: 'ShortcutGroup[]',
      default: '[]',
      desc: "ShortcutGroup = { label: string; items: ShortcutItem[] }；ShortcutItem = { description: string; keys: string[] }。keys 的每個元素獨立渲染成一個 <kbd>，例如 ['Shift', '?'] 會畫成兩個鍵帽",
    },
    {
      name: '(close)',
      type: 'EventEmitter<void>',
      desc: 'ESC 或點 backdrop 時 emit。父層負責把 isOpen 設回 false',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-keyboard-help
  [isOpen]="helpOpen()"
  [shortcuts]="SHORTCUT_GROUPS"
  (close)="helpOpen.set(false)"
/>`,
    },
    {
      label: 'shortcuts 資料形狀',
      code: `const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    label: '全域',
    items: [
      { description: '開啟快速鍵說明', keys: ['Shift', '?'] },
      { description: '關閉目前 modal', keys: ['Esc'] },
    ],
  },
];`,
    },
  ],
};
