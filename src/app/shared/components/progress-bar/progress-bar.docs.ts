import type { ComponentDoc } from '../../../../docs/component-doc';

export const progressBarDoc: ComponentDoc = {
  id: 'progress-bar',
  name: 'Progress Bar',
  selector: 'app-progress-bar',
  group: '展示元件',
  summary: '[value] [max] · ariaLabel',
  when: '顯示一件分批進行的工作做到哪裡（例：批次授權「處理中 12 / 40」）。只畫比例，不內建文字；「處理中 12 / 40」這類說明由呼叫端排在旁邊。',
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
  notes: [
    { type: 'info', content: 'max ≤ 0 或 value 不是有限數字時一律顯示 0%，呼叫端還沒算出總數（total = 0）也不會出現 NaN 寬度。' },
    { type: 'info', content: '不內建文字，是因為每個情境的措辭與單位（項、人、檔案）都不同。' },
  ],
};
