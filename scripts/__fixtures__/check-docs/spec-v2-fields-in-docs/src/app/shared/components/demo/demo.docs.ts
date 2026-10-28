import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [
    { name: 'text', type: 'string', desc: '文字' },
    { name: '(clicked)', type: 'EventEmitter', desc: '點擊', isOutput: true },
  ],
  usage: [],
  anatomy: [{ name: '外框', description: '可以點的範圍' }],
  states: [{ name: '停用', description: '灰底灰字' }],
  a11y: { keyboard: ['Tab 移到元件'] },
  dos: [{ text: '需要撐滿寬度時用 fullWidth', story: 'full-width' }],
  donts: [{ text: '不要在裡面放另一個可以點的東西' }]
};
