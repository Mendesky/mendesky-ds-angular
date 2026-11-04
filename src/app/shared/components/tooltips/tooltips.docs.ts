import type { ComponentApi } from '../../../../docs/component-doc';

export const tooltipsDoc: ComponentApi = {
  id: 'tooltips',
  selector: 'app-tooltips',
  summary: 'propClass: Down|Top|Left|Right · styles: Default|Dark · text',
  props: [
    {
      name: 'propClass',
      type: "'Left' | 'Down' | 'Top' | 'Right'",
      default: "'Down'",
      desc: '箭頭位置（決定 tooltip 顯示方向）',
    },
    {
      name: 'styles',
      type: "'Default' | 'Warning' | 'Grey'",
      default: "'Default'",
      desc: '外觀主題',
    },
    {
      name: 'text',
      type: 'string',
      default: "'Description'",
      desc: 'tooltip 顯示內容',
    },
  ],
  usage: [
    {
      label: '出現在觸發元素上方，白色樣式',
      code: `<app-tooltips
  propClass="Down"
  styles="Default"
  text="這是提示說明文字"
></app-tooltips>`,
    },
  ],
  usageNotes: [
    { type: 'info', content: '觸控裝置（手機、平板，沒有滑鼠的裝置）上 tooltip 不會出現，電腦不論視窗多窄都照常顯示。判斷條件跟滑過提示（appTooltip）一樣。' },
  ],
};
