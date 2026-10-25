import type { ComponentApi } from '../../../../docs/component-doc';
export const demoDoc: ComponentApi = {
  id: 'demo', selector: 'app-demo',
  props: [{ name: 'size', type: 'string', default: "'M'", desc: '程式的初值讀不出字面值（模擬檢查本身失效）' }],
  usage: []
};
