import type { ComponentApi } from '../../../../docs/component-doc';

export const poProcessDoc: ComponentApi = {
  id: 'po-process',
  selector: 'app-po-process',
  summary: 'status: Running|Success|Error|Congratulation · message',
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
};
