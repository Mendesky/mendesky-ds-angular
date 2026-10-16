import type { ComponentDoc } from '../../../../docs/component-doc';

export const labelDoc: ComponentDoc = {
  id: 'label',
  name: 'Label',
  selector: 'app-label',
  group: '展示元件',
  summary: 'color: White|GreyOutline|Grey70|SoftBlue|Salmon|Golden|SeaGreen|Red|Purple|GreenOutline|Kanban×5 等（完整值域見 props）· size: XXS|XS|S|M|L · text · [showLeftIcon] leftIconName（指定左側 app-icon，覆蓋內建打勾）· [wrap] 長文字折行 / [truncate] 單行省略',
  when: '狀態、分類標籤。禁止用 div 自刻 badge。Badge 只放文字，不加 icon。**放在 ghost 按鈕裡（例如選單選項的編號）用 White（白底灰框），不用 GreyOutline**：GreyOutline 是透明底，滑過時灰字疊在深灰底上看不清。**Purple / GreenOutline** 用來區分兩種類別（例如「推薦」與「精選」）；GreenOutline 的字重 600 由這一格提供，呼叫端不要自己補 CSS。KanbanDraft/Opened/DealClosed/Archiving/Archived 五色為 CornflowerBlue 漸層（淺→深對應流程階段），SSOT 來自 Figma 17248:269232（看板列表的 status pill 專用）。**text 綁使用者自由輸入的欄位時必須明示 [wrap]="true"（折行）或 [truncate]="true"+tooltip（省略），不可留預設 nowrap** — 預設 nowrap 讓 min-content ＝ 整串寬、chip 在 flex 容器內不可收縮，長值會撐破容器或被祖先 overflow:hidden 靜默裁掉。',
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
  notes: [],
  customTables: [],
};
