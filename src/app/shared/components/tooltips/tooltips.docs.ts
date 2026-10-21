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
};
