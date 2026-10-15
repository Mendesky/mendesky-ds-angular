import type { ComponentDoc } from '../../../../docs/component-doc';

export const keyboardHelpDoc: ComponentDoc = {
  id: 'keyboard-help',
  name: 'Keyboard Help 快速鍵說明',
  selector: 'app-keyboard-help',
  group: '浮層元件',
  summary: 'isOpen · shortcuts: ShortcutGroup[] · (close) · 內建搜尋篩選 · 基於 modal-shell 建構',
  when: '集中展示目前畫面可用的鍵盤快速鍵。慣例以 ? 開啟。快速鍵資料由父層傳入，元件不自己蒐集——因為哪些快速鍵有效取決於當前路由與權限。',
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
  notes: [
    {
      type: 'info',
      content: '內建搜尋框，輸入關鍵字即時篩選 items（比對 description）。搜尋無結果時顯示 app-empty-state。',
    },
    {
      type: 'warning',
      content: '登記進 shortcuts 的組合必須是本專案實際綁定的。⌘N / ⌘T / ⌘W 等會被瀏覽器攔截的 modifier combo 不得使用，也不要列進說明面板。',
    },
    {
      type: 'info',
      content: '面板本身用 app-modal-shell + app-modal-close-btn 組成，所以 ESC 與 backdrop 行為直接沿用 modal.dismissal pattern。',
    },
  ],
};
