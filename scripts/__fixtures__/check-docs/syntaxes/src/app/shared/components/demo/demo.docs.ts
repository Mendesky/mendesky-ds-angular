import type { ComponentDoc } from '../../../../docs/component-doc';
export const demoDoc: ComponentDoc = {
  id: 'demo', name: 'Demo', selector: 'app-demo', group: '展示元件',
  props: [
    { name: 'aliasA', type: 'string' },
    { name: 'aliasB', type: 'string' },
    { name: 'c', type: 'string' },
    { name: 'r', type: 'string' },
    { name: 'd', type: 'string' },
    { name: 'e', type: 'string' },
    { name: 'f', type: 'number' },
    { name: '(g)', type: 'void', isOutput: true },
    { name: '(h)', type: 'void', isOutput: true },
    { name: 'aliasI', type: 'number' },
  ],
  usage: [], notes: [],
};
