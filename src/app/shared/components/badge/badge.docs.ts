import type { ComponentDoc } from '../../../../docs/component-doc';

export const badgeDoc: ComponentDoc = {
  id: 'badge',
  name: 'Badge',
  selector: 'app-badge',
  group: '展示元件',
  summary: '[count] [max] variant: auto|dot · overflow: plus|dot · ariaLabel',
  when: '未讀徽章：疊在按鈕或項目的右上角，表示「有未讀」或「未讀幾則」。目前用在 header 通知鈴與版本更新入口鈕、版本更新視窗的左欄版本列。',
  props: [
    {
      name: 'count',
      type: 'number | null',
      default: 'null',
      desc: '未讀數。null 或 <= 0 不渲染（variant="dot" 除外）',
    },
    {
      name: 'max',
      type: 'number',
      default: '99',
      desc: '超過這個數就走 overflow 規則。站內通知之類可調高',
    },
    {
      name: 'variant',
      type: "'auto' | 'dot'",
      default: "'auto'",
      desc: "'dot' 只表示「有未讀」，不顯示數量",
    },
    {
      name: 'overflow',
      type: "'plus' | 'dot'",
      default: "'plus'",
      desc: "超過 max 時：顯示 `99+` 或退回圓點。通知鈴用 'dot'",
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "''",
      desc: '讀屏文字。圓點模式沒有文字，一定要給',
    },
  ],
  usage: [
    {
      label: '有未讀（圓點）',
      code: `<span class="host">   <!-- 宿主需 position: relative -->
  <app-icon name="Sparkle" size="24"></app-icon>
  <app-badge variant="dot" ariaLabel="有未讀的版本更新"></app-badge>
</span>`,
    },
    {
      label: '未讀數（超過 99 退回圓點）',
      code: `<app-badge
  [count]="unreadCount()"
  overflow="dot"
  [ariaLabel]="unreadCount() + ' 則未讀通知'">
</app-badge>`,
    },
  ],
  notes: [
    '徽章以 position: absolute 凸出宿主，宿主必須自己是 position: relative。元件的 host 是 display: contents，不會在 flex/grid 裡多出一個項目。',
    '宿主若位在 overflow 非 visible 的容器（例如可捲動清單），容器上緣要留白 >= 6px，否則第一列的徽章會被裁掉。',
    '底色用 --badge/unread，不借用 --button/error：未讀既不是錯誤也不是警告，綁在一起日後改錯誤紅會連帶改到未讀點。',
    'class 前綴是 .ds-badge，不是 .badge——core.scss 已有一個全域 .badge 標籤工具類，撞名會在 border-box 下把 10px 圓點撐成 18px。',
  ],
  customTables: [],
};
