import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [
    { name: 'text', type: 'string', desc: '文字' },
    { name: '(clicked)', type: 'EventEmitter', desc: '點擊', isOutput: true },
  ],
  usage: [
    { label: '一般', code: `<app-demo [text]="title" [appDemoTip]="tip"></app-demo>` },
    { label: '寫錯的屬性', code: `<app-demo [text]="title" [ghost]="true"></app-demo>` },
  ]
};
