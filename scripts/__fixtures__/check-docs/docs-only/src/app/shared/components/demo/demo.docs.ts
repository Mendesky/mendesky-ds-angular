import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [
    { name: 'text', type: 'string', desc: '文字' },
    { name: 'bar', type: 'string', desc: '程式碼裡已經沒有' },
  ],
  usage: []
};
