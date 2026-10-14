import type { ComponentDoc } from '../../../../docs/component-doc';

export const buttonGroupDoc: ComponentDoc = {
  id: 'button-group',
  name: 'Button Group',
  selector: 'app-button-group',
  group: '互動元件',
  summary: 'type: form|round|view · size: S|M|L · options: ButtonGroupOption[] · value · [disabled] errorMessage errorPosition: top|bottom · (valueChange)',
  when: '2–5 個互斥選項，且視覺需連成一排時用。',
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
      desc: 'form / view 皆生效。form: L≈46 / M≈36 / S≈26px；view: L=32 / M=28 / S=24px（外框高度）。round 不吃 size。',
    },
    {
      name: 'options',
      type: 'ButtonGroupOption[]',
      default: '[]',
      desc: '{ value: string; label: string }[]',
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
      desc: '整組禁用',
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
  ],
  notes: [
    'RWD 指引：手機版（< 768px）若選項文字過長（單一選項 > 4 個中文字，或 ≥ 3 選項且平均字數 > 3），應改用 app-select 替代 button-group。做法：桌面版保留 button-group，手機版加平行的 app-select，用 CSS class 切換顯示（.xxx-desktop-only / .xxx-mobile-only），共用同一組 options 和 change handler。短文字選項（如「月/年/次」「小/中/大」）維持 button-group 不變。',
    '鍵盤行為（對齊 ds-patterns wizard.keyboard）：方向鍵 ← → ↑ ↓ 在選項間循環移動焦點；Space 一律只做切換；Enter 兩段式 —— 未選中的選項按 Enter → 切換為該選項；已選中的選項再按一次 Enter → 事件冒泡給外層 wizard 的 onFormEnter（由 wizard 把焦點丟到下一步按鈕）。非 wizard 場景下第二次 Enter 無外層 handler 接收 → 等同無事發生。',
  ],
  customTables: [],
};
