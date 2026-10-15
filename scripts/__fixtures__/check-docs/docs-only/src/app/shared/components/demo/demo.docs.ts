import type { ComponentDoc } from '../../../../docs/component-doc';
export const demoDoc: ComponentDoc = {
  id: 'demo', name: 'Demo', selector: 'app-demo', group: '展示元件',
  props: [
    { name: 'text', type: 'string', desc: '文字' },
    { name: 'bar', type: 'string', desc: '程式碼裡已經沒有' },
  ],
  usage: [], notes: [],
};
