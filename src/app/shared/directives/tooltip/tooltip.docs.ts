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
    { type: 'info', content: '觸控裝置（手機、平板，沒有滑鼠的裝置）上 tooltip 不會出現，電腦不論視窗多窄都照常顯示。判斷條件是 (hover: none) and (pointer: coarse)，跟 mendesky-web 判斷觸控裝置的條件一樣。只靠 tooltip 傳達的資訊，在觸控裝置上要另外找地方放。' },
    { type: 'warn', content: 'Karma 跑在有滑鼠的桌機 Chrome，tooltip 會正常出現，量得到尺寸。量尺寸的測試要加「寬度大於 0」的檢查：量到 0 代表 tooltip 被藏起來了，「寬度 ≤ N」這類斷言會恆真。' },
  ],
};
