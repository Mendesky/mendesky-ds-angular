import type { ComponentApi } from '../../../../docs/component-doc';

export const progressBarDoc: ComponentApi = {
  id: 'progress-bar',
  selector: 'app-progress-bar',
  summary: '[value] [max] · ariaLabel',
  props: [
    {
      name: 'value',
      type: 'number',
      default: '0',
      desc: '目前完成量，與 max 同單位；會被夾在 0～max 之間',
    },
    {
      name: 'max',
      type: 'number',
      default: '100',
      desc: '總量。直接傳百分比時不用另外設；≤ 0 時一律視為 0%',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '讀屏文字，例：「批次授權進度」。進度條本身沒有可見文字，建議一定要給',
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-progress-bar [value]="done" [max]="total" ariaLabel="批次授權進度"></app-progress-bar>
<span>處理中 {{ done }} / {{ total }}</span>`,
    },
  ],
};
