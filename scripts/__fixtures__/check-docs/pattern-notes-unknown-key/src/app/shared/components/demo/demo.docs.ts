import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [
    { name: 'text', type: 'string', desc: '文字' },
    { name: '(clicked)', type: 'EventEmitter', desc: '點擊', isOutput: true },
  ],
  usage: [],
  usageNotes: ['只有 Angular 才有的注意事項', { type: 'warn', content: '可以搭配 ngModel' }],
};
