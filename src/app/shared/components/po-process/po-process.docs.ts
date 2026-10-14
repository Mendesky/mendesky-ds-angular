import type { ComponentDoc } from '../../../../docs/component-doc';

export const poProcessDoc: ComponentDoc = {
  id: 'po-process',
  name: 'Po Process',
  selector: 'app-po-process',
  group: '展示元件',
  summary: 'status: Running|Success|Error|Congratulation · message',
  when: '採購/流程節點狀態顯示。',
  props: [
    {
      name: 'status',
      type: 'PoProcessStatus',
      default: "'Running'",
      desc: 'Running | Success | Error | Congratulation',
    },
    {
      name: 'message',
      type: 'string',
      default: "''",
      desc: '狀態文字；空字串時顯示各狀態的預設文字',
    },
  ],
  usage: [],
  notes: [
    {
      type: 'info',
      content: '採購訂單流程元件，顯示 PO 審核狀態步驟條。Props 與狀態定義待業務確認後補充。',
    },
  ],
  customTables: [],
};
