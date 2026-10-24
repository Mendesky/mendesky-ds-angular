import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [{ name: 'text', type: 'string', desc: '文字' }],
  usage: [{ label: '一般', code: `<app-demo [nope]="x"></app-demo>` }]
};
