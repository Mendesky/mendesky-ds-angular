import type { ComponentDoc } from '../../../../docs/component-doc';
export const demoDoc: ComponentDoc = {
  id: 'demo', name: 'Demo', selector: 'app-demo', group: '展示元件',
  props: [
    { name: 'text', type: 'string', desc: '文字' },
    { name: '(clicked)', type: 'EventEmitter', desc: '點擊', isOutput: true },
  ],
  usage: [], notes: [],
};
