import type { ComponentApi } from '../../../../docs/component-doc';

export const tooltipDirectiveDoc: ComponentApi = {
  id: 'tooltip-directive',
  selector: '[appTooltip]',
  summary: '[appTooltip]="text" · appTooltipDirection: top|bottom|left|right · appTooltipStyle: default|warning|grey · appTooltipOnlyWhenTruncated · appTooltipWrap',
  props: [
    {
      name: 'appTooltip',
      type: 'string',
      desc: 'tooltip 顯示文字，空字串時不顯示',
    },
    {
      name: 'appTooltipDirection',
      type: "'top' | 'bottom' | 'left' | 'right'",
      default: "'top'",
      desc: '顯示方向（溢出時自動翻轉）',
    },
    {
      name: 'appTooltipStyle',
      type: "'default' | 'warning' | 'grey'",
      default: "'default'",
      desc: '外觀主題',
    },
    {
      name: 'appTooltipOnlyWhenTruncated',
      type: 'boolean',
      default: 'false',
      desc: '只在 host 文字真的被截斷（scrollWidth > clientWidth）時顯示，也只在那時給 host `tabindex=0`。host 自己負責 ellipsis。用 ResizeObserver＋MutationObserver 追蹤寬度與文字變化（2026-10-13）',
    },
    {
      name: 'appTooltipWrap',
      type: 'boolean',
      default: 'false',
      desc: '長文字換行：tooltip 文字最寬 520px，沒有空白的長字串也會斷行。給檔名、使用者自填標題這類可能很長的文字（2026-10-13）',
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-icon-btn
  [appTooltip]="'編輯此項目'"
  appTooltipDirection="top"
  (btnClick)="onEdit()">
  <app-icon name="Edit" size="16"></app-icon>
</app-icon-btn>`,
    },
    {
      label: '警告樣式',
      code: `<span
  [appTooltip]="'此欄位為必填'"
  appTooltipStyle="warning"
  appTooltipDirection="bottom">
  必填欄位
</span>`,
    },
  ],
  usageNotes: [
    'app-icon-btn 已內建 appTooltip：透過它的 tooltip 與 tooltipPos 兩個 input 設定；disabled 狀態下 tooltip 仍正常顯示，因為 appTooltip 綁在 app-icon-btn 的 wrapper div 上。',
    '本體說的 tooltip「換行選項」在 Angular 是 appTooltipWrap：長字串（檔名、使用者自填標題）在 host 加上 [appTooltipWrap]="true"（2026-10-13 加回，選用、預設 false）。',
    { type: 'warn', content: 'Angular 的單元測試在 Karma 裡跑，視窗比 $bp-desktop 窄；量 tooltip 尺寸的測試要先解除平板以下的自動隱藏（:host { display:none !important }），否則量到的一律是 0。' },
  ],
};
