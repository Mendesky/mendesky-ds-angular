import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [
    { name: 'size', type: "'S' | 'M' | 'L'", default: "'L'", desc: '尺寸（說明寫錯：程式是 M）' },
    { name: 'on', type: 'boolean', default: 'true', desc: '開關（說明寫錯：程式是 false）' },
    { name: 'label', type: 'string', default: "''", desc: '一致' },
    { name: 'count', type: 'number', default: '3', desc: '一致（signal input）' },
    { name: 'tone', type: 'string', default: '依外層而定', desc: '不是字面值，不比對' },
  ],
  usage: []
};
