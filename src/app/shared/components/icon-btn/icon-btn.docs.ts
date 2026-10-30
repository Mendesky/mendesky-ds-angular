import type { ComponentApi } from '../../../../docs/component-doc';

export const iconBtnDoc: ComponentApi = {
  id: 'icon-btn',
  selector: 'app-icon-btn',
  summary: 'size: 16-|16|24|32|36|48 · propClass: Normal|Warning|CardBtn|CardBtnPdSmall|Modal|SectionBtn|Drag|Block|Block-Transparent|Icon+Text · label · [active] [toggle] [disabled] tooltip tooltipPos · ariaLabel · ariaHaspopup [ariaExpanded] · (btnClick)',
  props: [
    {
      name: 'size',
      type: 'IconBtnSize',
      desc: "'16-' | '16' | '24' | '32' | '36' | '48'（對應 icon px）",
    },
    {
      name: 'propClass',
      type: 'IconBtnClass',
      default: "'Normal'",
      desc: 'Normal | Warning | CardBtn | CardBtnPdSmall | Modal | SectionBtn | Drag | Block | Block-Transparent | Icon+Text。**沒有 Floating**（2026-08-18 撤除）：DS 外部化成 @mendesky/ds-angular 後該 variant 不存在。要「浮在 backdrop 上的白底圓鈕」請用 SectionBtn（size=24 剛好 44×44、透明底），白底圓形與落影由消費端的 wrapper 出（外包一層白底圓形容器並加落影）。',
    },
    {
      name: 'active',
      type: 'boolean',
      desc: '啟用/高亮狀態（Normal / CardBtnPdSmall 轉綠）',
    },
    {
      name: 'toggle',
      type: 'boolean',
      default: 'false',
      desc: '切換按鈕模式；啟用後輸出 aria-pressed（隨 active 同步 true/false）。用於格式化、filter on/off 等可切換開關。',
    },
    {
      name: 'disabled',
      type: 'boolean',
      desc: '禁用狀態（opacity 0.5，cursor not-allowed）',
    },
    {
      name: 'label',
      type: 'string',
      desc: '文字標籤（僅 Icon+Text 模式顯示）',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      desc: '無障礙標籤，建議每顆按鈕都設定',
    },
    {
      name: 'ariaHaspopup',
      type: "IconBtnAriaHaspopup | null",
      default: 'null',
      desc: "這顆按鈕會打開選單，套在內層 button 的 aria-haspopup。目前只接受 'menu'，用在打開放了 app-menu-item 的 app-action-menu 的按鈕，例如 More；null 不輸出。Safari 關閉選單後也是靠它找回觸發鈕、把焦點還給它。",
    },
    {
      name: 'ariaExpanded',
      type: 'boolean | null',
      default: 'null',
      desc: '選單現在開著沒，套在內層 button 的 aria-expanded。綁選單的開關狀態，true／false 照實輸出；null 不輸出。',
    },
    {
      name: 'tooltip',
      type: 'string',
      default: "''",
      desc: 'tooltip 文字，有值才顯示',
    },
    {
      name: 'tooltipPos',
      type: "'Down' | 'Top' | 'Left' | 'Right'",
      default: "'Down'",
      desc: 'tooltip 箭頭方向（Down = tooltip 在上方，Top = 在下方）',
    },
    {
      name: 'shortcutHint',
      type: 'string',
      default: "''",
      desc: '鍵盤快速鍵提示（e.g. "⌘N"），有值時自動 append 到 tooltip，顯示為「tooltip（shortcutHint）」。',
    },
    {
      name: '(btnClick)',
      type: 'EventEmitter<void>',
      desc: '點擊事件（disabled 時不觸發）',
      isOutput: true,
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-icon-btn
  size="16"
  propClass="Normal"
  ariaLabel="編輯"
  (btnClick)="onEdit()">
  <app-icon name="Edit" size="16"></app-icon>
</app-icon-btn>`,
    },
    {
      label: '打開選單的 More 按鈕：設 ariaHaspopup，ariaExpanded 綁選單開關',
      code: `<app-icon-btn
  size="16"
  ariaLabel="更多操作"
  ariaHaspopup="menu"
  [ariaExpanded]="moreOpen()"
  (btnClick)="moreOpen.set(!moreOpen())">
  <app-icon name="More" size="16"></app-icon>
</app-icon-btn>`,
    },
    {
      label: 'Icon+Text 模式',
      code: `<app-icon-btn
  size="32"
  propClass="Icon+Text"
  label="篩選"
  ariaLabel="篩選"
  (btnClick)="onFilter()">
  <app-icon name="Filter" size="32"></app-icon>
</app-icon-btn>`,
    },
  ],
};
