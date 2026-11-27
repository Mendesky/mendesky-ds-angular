import type { ComponentApi } from '../../../../docs/component-doc';

export const breadcrumbDoc: ComponentApi = {
  id: 'breadcrumb',
  selector: 'app-breadcrumb',
  summary: '[items] · [siblings] · ariaLabel · (navigate)',
  props: [
    {
      name: 'items',
      type: 'readonly BreadcrumbItem[]',
      desc: '必填。由上層到目前頁的每一節：BreadcrumbItem 是 { id?, label, href?, icon? }。最後一節是目前頁，不是連結',
    },
    {
      name: 'siblings',
      type: 'readonly BreadcrumbItem[]',
      default: '[]',
      desc: '最後一節的同區頁面（含目前頁）。兩頁以上時最後一節變成切換鈕；目前頁用 id 比對（沒給 id 用 href）',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "'目前位置'",
      desc: '導覽地標的名稱',
    },
    {
      name: '(navigate)',
      type: 'EventEmitter<BreadcrumbItem>',
      desc: '左鍵單擊前面的節或切換選單的頁面、沒按修飾鍵時送出；元件已擋掉瀏覽器換頁',
      isOutput: true,
    },
  ],
  events: [
    {
      name: 'navigate',
      type: 'EventEmitter<BreadcrumbItem>',
      description: '左鍵單擊前面的節或切換選單的頁面、沒按 Ctrl／⌘／Shift／Alt 時送出，元件已擋掉瀏覽器換頁。使用端在這裡用路由換頁',
    },
  ],
  usage: [
    {
      label: '三層：區 › 項目 › 目前頁',
      code: `<app-breadcrumb
  [items]="[
    { label: '總覽', icon: 'Dashboard', href: '/overview' },
    { label: '專案 A', icon: 'AppWindow', href: '/overview/a' },
    { label: 'v2.4.0', icon: 'VersionTag' }
  ]"
  (navigate)="router.navigateByUrl($event.href!)">
</app-breadcrumb>`,
    },
    {
      label: '最後一節切換同區頁面（取代頁面上方的分頁）',
      code: `<app-breadcrumb
  [items]="[{ id: 'team', label: '團隊', icon: 'CustomerManagement', href: '/team' }, current()]"
  [siblings]="teamPages"
  (navigate)="router.navigateByUrl($event.href!)">
</app-breadcrumb>`,
    },
  ],
  usageNotes: [
    '`items` 由使用端從路由算出來。換頁時給新陣列，開著的切換選單會直接收掉。',
    '同區頁面跟 app-side-nav 的子頁面通常是同一份資料，從同一份導覽設定產生，加一頁只改一處。',
    '沒接 `(navigate)` 時，點連結照網址換頁（整頁重新載入）。用路由的系統都要接。',
    '元件寬度跟著外層；外層要給它可以縮的空間（例如放在 flex 列裡時設 `min-width: 0`），前面的節才會縮成刪節號。',
  ],
};
