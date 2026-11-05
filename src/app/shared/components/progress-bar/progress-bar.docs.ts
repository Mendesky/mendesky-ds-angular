import type { ComponentApi } from '../../../../docs/component-doc';

export const progressBarDoc: ComponentApi = {
  id: 'progress-bar',
  selector: 'app-progress-bar',
  summary: '[value] [max] · ariaLabel · size: M|S',
  props: [
    {
      name: 'value',
      type: 'number | null',
      default: '0',
      desc: '目前完成量，與 max 同單位；會被夾在 0～max 之間。null ＝ 不定狀態：還不知道總量或對方不回報進度，色段由左往右滑，不輸出 aria-valuenow',
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
    {
      name: 'size',
      type: "'M' | 'S'",
      default: "'M'",
      desc: '粗細：M＝8px；S＝6px，給空間比較擠的地方（例：表單裡的上傳進度）',
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-progress-bar [value]="done" [max]="total" ariaLabel="批次授權進度"></app-progress-bar>
<span>處理中 {{ done }} / {{ total }}</span>`,
    },
    {
      label: '不定狀態：還不知道百分比時傳 null',
      code: `<app-progress-bar [value]="uploadPercent" size="S" ariaLabel="上傳進度"></app-progress-bar>
<!-- uploadPercent 為 null 時跑不定狀態，有數字時顯示比例 -->`,
    },
  ],
};
