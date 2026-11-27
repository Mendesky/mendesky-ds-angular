import type { ComponentApi } from '../../../../docs/component-doc';

export const sideNavDoc: ComponentApi = {
  id: 'side-nav',
  selector: 'app-side-nav',
  summary: "[groups] · mode: expanded|rail|hidden · [currentId] · ariaLabel · (navigate)",
  props: [
    {
      name: 'groups',
      type: 'readonly SideNavGroup[]',
      desc: '必填。群組與項目：SideNavGroup 是 { id, heading?, items }，SideNavItem 是 { id, label, icon, href, children? }，children 是子頁面 SideNavLink { id, label, icon, href }，只有一層。不分群就傳一個不給 heading 的群組',
    },
    {
      name: 'mode',
      type: "'expanded' | 'rail' | 'hidden'",
      default: "'expanded'",
      desc: '寬度：展開 200px、窄欄 56px、藏起來 0。藏起來時整條加 inert',
    },
    {
      name: 'currentId',
      type: 'string | null',
      default: 'null',
      desc: '目前頁的項目或子頁面 id。對到的換成選中樣式，加 aria-current="page"。目前頁是子頁面時，窄欄的母項目也換成選中樣式',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "'主要導覽'",
      desc: '導覽地標的名稱',
    },
    {
      name: '(navigate)',
      type: 'EventEmitter<SideNavLink>',
      desc: '左鍵單擊項目或子頁面、沒按修飾鍵時送出；元件已擋掉瀏覽器換頁',
      isOutput: true,
    },
  ],
  events: [
    {
      name: 'navigate',
      type: 'EventEmitter<SideNavLink>',
      description: '左鍵單擊項目或子頁面、沒按 Ctrl／⌘／Shift／Alt 時送出，元件已擋掉瀏覽器換頁。使用端在這裡用路由換頁',
    },
  ],
  usage: [
    {
      label: '窄欄和藏起來兩種，切換鈕放在側欄外面',
      code: `<button type="button" aria-controls="main-nav" [attr.aria-expanded]="!hidden()" (click)="hidden.set(!hidden())">
  切換側欄
</button>
<app-side-nav
  id="main-nav"
  [groups]="groups"
  [mode]="hidden() ? 'hidden' : 'rail'"
  [currentId]="currentId()"
  (navigate)="router.navigateByUrl($event.href)">
</app-side-nav>`,
    },
    {
      label: '展開和窄欄兩種，切換鈕放進頂端區',
      code: `<app-side-nav [groups]="groups" [mode]="collapsed() ? 'rail' : 'expanded'" [currentId]="currentId()"
              (navigate)="router.navigateByUrl($event.href)">
  <button sideNavHeader type="button" [attr.aria-expanded]="!collapsed()" (click)="collapsed.set(!collapsed())">
    {{ collapsed() ? '展開側欄' : '收合側欄' }}
  </button>
</app-side-nav>`,
    },
    {
      label: '窄螢幕：同一份項目用展開的寬度放進抽屜',
      code: `<app-drawer-shell [isOpen]="drawerOpen()" side="left" width="min(280px, 85vw)" (close)="drawerOpen.set(false)">
  <app-side-nav style="width:100%;height:auto" [groups]="groups" mode="expanded" [currentId]="currentId()"
                (navigate)="router.navigateByUrl($event.href); drawerOpen.set(false)">
  </app-side-nav>
</app-drawer-shell>`,
    },
  ],
  usageNotes: [
    '子頁面放在項目的 `children`。母項目的 `href` 給第一個子頁面的網址，`currentId` 給子頁面的 id。',
    '`navigate` 送出的是 `SideNavLink`（項目或子頁面）。原本把參數型別寫成 `SideNavItem` 的處理函式不用改。',
    '頂端區用 `sideNavHeader` 屬性標記要投影的元素。',
    '`currentId` 由使用端從路由算出來，例如網址開頭對到哪個項目的 href。',
    '元件高度是外層的 100%，項目多到放不下時側欄自己捲動。',
    '放進抽屜時，在外層對元件設 `width: 100%; height: auto;`，填滿抽屜寬度、高度跟著內容，捲動交給抽屜。元件不知道自己在抽屜裡，漏設就停在 200px 寬。',
    '沒接 `(navigate)` 時，點項目照連結換頁（整頁重新載入）。用路由的系統都要接。',
    '觸控裝置（`pointer: coarse`）上，展開的項目至少 44px 高；滑鼠操作維持 36px。',
    '`groups` 換成新陣列才會重畫（OnPush）。',
  ],
};
