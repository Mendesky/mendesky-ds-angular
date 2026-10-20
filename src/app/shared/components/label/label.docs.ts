import type { ComponentApi } from '../../../../docs/component-doc';

export const labelDoc: ComponentApi = {
  id: 'label',
  selector: 'app-label',
  summary: 'color: White|GreyOutline|Grey70|SoftBlue|Salmon|Golden|SeaGreen|Red|Purple|GreenOutline|Kanban×5 等（完整值域見 props）· size: XXS|XS|S|M|L · text · [showLeftIcon] leftIconName（指定左側 app-icon，覆蓋內建打勾）· [wrap] 長文字折行 / [truncate] 單行省略',
  props: [
    {
      name: 'color',
      type: 'LabelColor',
      default: "'SoftBlue'",
      desc: 'White | Transparent | GreyOutline | LightWhite | SoftBlue | Red | Salmon | Green | Grey25 | Blue | SeaGreen | Grey70 | Grey16 | Error | GreenAll | Golden | Purple (#8b5c91 實心白字) | GreenOutline (白底 #5a8c2c 框與字、字重 600) | KanbanDraft (#d3d3d3) | KanbanOpened (#bac6fd) | KanbanDealClosed (#8293da) | KanbanArchiving (#5866a0) | KanbanArchived (#333d66)',
    },
    {
      name: 'size',
      type: 'LabelSize',
      default: "'L'",
      desc: 'XXS（12px/500，欄位 badge 用）| XS | S | M | L',
    },
    {
      name: 'text',
      type: 'string',
      default: "''",
      desc: '顯示文字',
    },
    {
      name: 'showLeftIcon',
      type: 'boolean',
      default: 'false',
      desc: '顯示內建左側打勾 icon（Done-OK 樣式）',
    },
    {
      name: 'leftIconName',
      type: 'string',
      default: "''",
      desc: '指定左側 icon（icon.registry key，如 Alert-Info）；設定時以 app-icon 渲染、覆蓋內建打勾',
    },
    {
      name: 'showRightIcon',
      type: 'boolean',
      default: 'false',
      desc: '顯示右側 More（三點）icon',
    },
    {
      name: 'showNumberedList',
      type: 'boolean',
      default: 'false',
      desc: '顯示左側編號圓形 badge（01）',
    },
    {
      name: 'wrap',
      type: 'boolean',
      default: 'false',
      desc: '長文字折行（white-space: normal + max-width: 100% + word-break: break-word），取代預設 nowrap。**text 來自使用者自由輸入時必須開啟**（或改用 truncate）',
    },
    {
      name: 'truncate',
      type: 'boolean',
      default: 'false',
      desc: '單行截斷（max-width: 100% + overflow hidden + ellipsis）。在無 flex-wrap 的 flex row 內需另給 chip min-width: 0 才生效；建議搭配 appTooltip 讓使用者看得到全文',
    },
  ],
  usage: [
    {
      label: '基本用法',
      code: `<app-label
  color="SoftBlue"
  size="M"
  text="已發布"
></app-label>`,
    },
  ],
};
