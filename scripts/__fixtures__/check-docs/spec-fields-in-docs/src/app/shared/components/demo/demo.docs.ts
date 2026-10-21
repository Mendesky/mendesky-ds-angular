import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [
    { name: 'text', type: 'string', desc: '文字' },
    { name: '(clicked)', type: 'EventEmitter', desc: '點擊', isOutput: true },
  ],
  usage: [], when: '用在這裡', notes: []
};
