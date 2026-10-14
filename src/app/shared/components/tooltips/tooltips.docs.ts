import type { ComponentDoc } from '../../../../docs/component-doc';

export const tooltipsDoc: ComponentDoc = {
  id: 'tooltips',
  name: 'Tooltips',
  selector: 'app-tooltips',
  group: '浮層元件',
  summary: 'propClass: Down|Top|Left|Right · styles: Default|Dark · text',
  when: 'hover 時顯示說明文字。',
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
  notes: [
    {
      type: 'warning',
      content: '（2026-04 更新）新開發建議改用 [appTooltip] directive（portal 模式），自動 portal 到 document.body 避免 overflow:hidden 裁切。app-tooltips component 保留向後相容，但新功能不再使用。',
    },
  ],
  customTables: [
    {
      title: '樣式說明',
      columns: [
        'styles',
        '背景',
        '文字色',
      ],
      rows: [
        [
          'Default',
          '#ffffff（白色）',
          '#686868（--text/body）',
        ],
        [
          'Grey',
          '#939393（--button/neutral）',
          '#ffffff',
        ],
        [
          'Warning',
          '#cc5252（--icon/warning）',
          '#ffffff',
        ],
      ],
    },
    {
      title: '方向說明（propClass）',
      columns: [
        '值',
        '箭頭位置',
        'tooltip 相對觸發元素的位置',
      ],
      rows: [
        [
          'Top',
          '頂部',
          '出現在元素下方',
        ],
        [
          'Down',
          '底部',
          '出現在元素上方',
        ],
        [
          'Left',
          '左側',
          '出現在元素右側',
        ],
        [
          'Right',
          '右側',
          '出現在元素左側',
        ],
      ],
    },
  ],
};
