import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';

/** 寬度：展開 200px（圖示＋名稱）／窄欄 56px（只有圖示）／藏起來 0（整條不能操作） */
export type SideNavMode = 'expanded' | 'rail' | 'hidden';

export interface SideNavItem {
  /** 識別字；`currentId` 對到它就是目前頁 */
  id: string;
  /** 名稱。展開時顯示；窄欄時是報讀名稱與提示文字 */
  label: string;
  /** app-icon 的圖示名稱 */
  icon: string;
  /** 連結網址。Ctrl／⌘／Shift 點擊時瀏覽器照它開新分頁 */
  href: string;
}

export interface SideNavGroup {
  id: string;
  /** 群組標題。展開時顯示；窄欄時只當群組的報讀名稱。不給就不包成群組 */
  heading?: string;
  items: readonly SideNavItem[];
}

let nextUid = 0;

/**
 * SideNavComponent — 側欄導覽
 *
 * 系統的主要導覽，三種寬度由使用端給（`mode`），元件不記狀態、不放切換鈕。
 * 切換鈕放在側欄裡時投影到 `[sideNavHeader]`；會整條藏起來的系統，切換鈕放在側欄外。
 *
 * 用法：
 *   <app-side-nav [groups]="groups" [mode]="mode" [currentId]="current" (navigate)="go($event)"></app-side-nav>
 *
 * 項目是原生連結：左鍵單擊（沒按修飾鍵）時擋掉瀏覽器換頁、改送 `navigate` 給使用端用路由換頁；
 * 按住 Ctrl／⌘／Shift／Alt 點擊照瀏覽器原本的做法（開新分頁、新視窗、下載）。
 *
 * 藏起來時 host 加 `inert`，Tab 進不去、報讀軟體不念。
 * 藏起來沿用上一個看得到的版面，寬度轉場時內容不會先跳成另一種排法；一開始就藏起來時用窄欄的版面。
 * 窄欄的提示文字只在 rail 時給，換成其他寬度時提示文字變空字串，正開著的提示會跟著關掉。
 */
@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [IconComponent, TooltipDirective],
  templateUrl: './side-nav.component.html',
  styleUrls: ['./side-nav.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'side-nav',
    '[class.side-nav--expanded]': 'layout === "expanded"',
    '[class.side-nav--rail]': 'layout === "rail"',
    '[class.side-nav--hidden]': 'mode === "hidden"',
    '[attr.inert]': 'mode === "hidden" ? "" : null',
  },
})
export class SideNavComponent {
  /** 群組與項目。不分群就傳一個不給標題的群組 */
  @Input({ required: true }) groups: readonly SideNavGroup[] = [];

  /** 寬度：expanded（預設）／rail／hidden */
  @Input()
  set mode(value: SideNavMode) {
    this._mode = value;
    if (value !== 'hidden') {
      this.layout = value;
      this._shownOnce = true;
    } else if (!this._shownOnce) {
      this.layout = 'rail';
    }
  }
  get mode(): SideNavMode {
    return this._mode;
  }

  /** 目前頁的項目 id；對到的項目加 aria-current="page" 與選中樣式 */
  @Input() currentId: string | null = null;

  /** 導覽地標的名稱 */
  @Input() ariaLabel = '主要導覽';

  /** 左鍵單擊項目（沒按修飾鍵）時送出，使用端用路由換頁 */
  @Output() navigate = new EventEmitter<SideNavItem>();

  /** 畫面用的版面：藏起來時沿用上一個看得到的版面 */
  layout: Exclude<SideNavMode, 'hidden'> = 'expanded';

  readonly uid = `side-nav-${nextUid++}`;

  private _mode: SideNavMode = 'expanded';
  private _shownOnce = false;

  headingId(groupIndex: number): string {
    return `${this.uid}-h-${groupIndex}`;
  }

  onItemClick(event: MouseEvent, item: SideNavItem): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    this.navigate.emit(item);
  }
}
