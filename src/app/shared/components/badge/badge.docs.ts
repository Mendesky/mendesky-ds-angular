import type { ComponentApi } from '../../../../docs/component-doc';

export const badgeDoc: ComponentApi = {
  id: 'badge',
  selector: 'app-badge',
  summary: '[count] [max] variant: auto|dot · overflow: plus|dot · ariaLabel',
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
};
