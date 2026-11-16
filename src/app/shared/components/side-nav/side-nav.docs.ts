import type { ComponentApi } from '../../../../docs/component-doc';

export const sideNavDoc: ComponentApi = {
  id: 'side-nav',
  selector: 'app-side-nav',
  summary: "[groups] · mode: expanded|rail|hidden · [currentId] · ariaLabel · (navigate)",
  props: [
    {
      name: 'groups',
      type: 'readonly SideNavGroup[]',
      desc: '必填。群組與項目：SideNavGroup 是 { id, heading?, items }，SideNavItem 是 { id, label, icon, href }。不分群就傳一個不給 heading 的群組',
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
      desc: '目前頁的項目 id。對到的項目換成選中樣式，加 aria-current="page"',
    },
    {
      name: 'ariaLabel',
      type: 'string',
      default: "'主要導覽'",
      desc: '導覽地標的名稱',
    },
    {
      name: '(navigate)',
      type: 'EventEmitter<SideNavItem>',
      desc: '左鍵單擊項目、沒按修飾鍵時送出；元件已擋掉瀏覽器換頁',
      isOutput: true,
    },
  ],
  events: [
    {
      name: 'navigate',
      type: 'EventEmitter<SideNavItem>',
      description: '左鍵單擊項目、沒按 Ctrl／⌘／Shift／Alt 時送出，元件已擋掉瀏覽器換頁。使用端在這裡用路由換頁',
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
    '頂端區用 `sideNavHeader` 屬性標記要投影的元素。',
    '`currentId` 由使用端從路由算出來，例如網址開頭對到哪個項目的 href。',
    '元件高度是外層的 100%，項目多到放不下時側欄自己捲動。',
    '放進抽屜時，在外層對元件設 `width: 100%; height: auto;`，填滿抽屜寬度、高度跟著內容，捲動交給抽屜。',
    '`groups` 換成新陣列才會重畫（OnPush）。',
  ],
};
