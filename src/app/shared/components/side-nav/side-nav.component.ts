import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  QueryList,
  ViewChildren,
  inject,
  signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';
import { NavLinkPanelComponent, NavPanelDismissReason, NavPanelLink } from '../nav-link-panel/nav-link-panel.component';

/** 寬度：展開 200px（圖示＋名稱）／窄欄 56px（只有圖示）／藏起來 0（整條不能操作） */
export type SideNavMode = 'expanded' | 'rail' | 'hidden';

/** 一個連結：項目或子頁面 */
export interface SideNavLink {
  /** 識別字；`currentId` 對到它就是目前頁 */
  id: string;
  /** 名稱。展開時顯示；窄欄時是報讀名稱與提示文字（母項目改由子選單第一行顯示） */
  label: string;
  /** app-icon 的圖示名稱 */
  icon: string;
  /** 連結網址。Ctrl／⌘／Shift 點擊時瀏覽器照它開新分頁。母項目通常給第一個子頁面的網址 */
  href: string;
}

export interface SideNavItem extends SideNavLink {
  /**
   * 子頁面，只能一層（子頁面的 children 不會顯示）。帶了就是母項目：
   * 展開時子頁面列在下方、縮排；窄欄時滑過或焦點在母項目，右邊浮出子選單
   */
  children?: readonly SideNavLink[];
}

export interface SideNavGroup {
  id: string;
  /** 群組標題。展開時顯示；窄欄時只當群組的報讀名稱。不給就不包成群組 */
  heading?: string;
  items: readonly SideNavItem[];
}

/** 窄欄的一個子選單。換母項目時舊的標成 leaving，播完收起動畫才移除 */
interface Flyout {
  key: number;
  item: SideNavItem;
  anchor: HTMLAnchorElement;
  leaving: boolean;
}

/** 子選單動畫長度（Micro 等級），跟 nav-link-panel 的 animation 一致 */
const FLYOUT_MS = 150;
/** 滑鼠離開母項目和子選單後等多久才收起：兩者之間有 8px 空隙，滑過去的途中不收 */
const CLOSE_DELAY_MS = 250;

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
 * 使用端沒接 `navigate` 時不擋，照連結換頁。
 * 按住 Ctrl／⌘／Shift／Alt 點擊照瀏覽器原本的做法（開新分頁、新視窗、下載）。
 *
 * 放進抽屜時，使用端要在外層對元件設 `width: 100%; height: auto;`：元件不知道自己在抽屜裡，
 * 不設就停在展開的 200px，捲動也留在元件自己身上。
 *
 * 藏起來時 host 加 `inert`，Tab 進不去、報讀軟體不念。
 * 藏起來沿用上一個看得到的版面，寬度轉場時內容不會先跳成另一種排法；一開始就藏起來時用窄欄的版面。
 * 窄欄的提示文字只在 rail 時給，換成其他寬度時提示文字變空字串，正開著的提示會跟著關掉。
 *
 * 子頁面（項目的 children，只有一層）：
 * - 展開：列在母項目下方、縮排，包成以母項目為名的 group。
 * - 窄欄：滑過或焦點在母項目時，右邊浮出子選單（app-nav-link-panel，搬到 body、層級由浮層定位服務給）。
 *   母項目不出現名稱提示（子選單第一行就是名稱）。滑鼠離開母項目和子選單 250ms 後收起；
 *   換母項目時舊的播完收起動畫才移除。捲動、改大小、點外面、Esc、點子頁面、換寬度都收起。
 *   子選單在 body 底下，Tab 順序接不上母項目，所以由這裡接：母項目 Tab 進第一個子頁面、
 *   第一個子頁面 Shift＋Tab 回母項目、最後一個子頁面 Tab 到母項目的下一個項目。
 * - 目前頁是子頁面時：展開時那個子頁面選中；窄欄時母項目選中、aria-current="true"。
 */
@Component({
  selector: 'app-side-nav',
  standalone: true,
  imports: [IconComponent, TooltipDirective, NavLinkPanelComponent],
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
export class SideNavComponent implements OnDestroy {
  /** 群組與項目。不分群就傳一個不給標題的群組 */
  @Input({ required: true }) groups: readonly SideNavGroup[] = [];

  /** 寬度：expanded（預設）／rail／hidden */
  @Input()
  set mode(value: SideNavMode) {
    this._mode = value;
    // 子選單只在窄欄：換成其他寬度直接移除，不等收起動畫
    if (value !== 'rail') this.dropFlyouts();
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

  /** 左鍵單擊項目或子頁面（沒按修飾鍵）時送出，使用端用路由換頁。沒接時照連結換頁 */
  @Output() navigate = new EventEmitter<SideNavLink>();

  /** 畫面用的版面：藏起來時沿用上一個看得到的版面 */
  layout: Exclude<SideNavMode, 'hidden'> = 'expanded';

  readonly uid = `side-nav-${nextUid++}`;

  /** 窄欄的子選單（含正在播收起動畫的） */
  readonly flyouts = signal<readonly Flyout[]>([]);

  @ViewChildren(NavLinkPanelComponent) private panelRefs?: QueryList<NavLinkPanelComponent>;

  private readonly hostEl = inject<ElementRef<HTMLElement>>(ElementRef);
  private _mode: SideNavMode = 'expanded';
  private _shownOnce = false;
  private nextFlyoutKey = 0;
  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly removeTimers = new Set<ReturnType<typeof setTimeout>>();
  /** 滑鼠在母項目或子選單上 */
  private pointerInside = false;

  headingId(groupIndex: number): string {
    return `${this.uid}-h-${groupIndex}`;
  }

  onItemClick(event: MouseEvent, item: SideNavLink): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    // 使用端沒接 navigate 時照連結換頁，不然點了沒反應
    if (!this.navigate.observed) return;
    event.preventDefault();
    this.navigate.emit(item);
  }

  hasChildren(item: SideNavItem): boolean {
    return !!item.children?.length;
  }

  /** 目前頁是這個母項目底下的子頁面 */
  hasCurrentChild(item: SideNavItem): boolean {
    return !!this.currentId && !!item.children?.some(c => c.id === this.currentId);
  }

  /** 選中樣式：自己是目前頁；窄欄時子頁面是目前頁也算（子頁面看不到） */
  isCurrent(item: SideNavItem): boolean {
    return item.id === this.currentId || (this.layout === 'rail' && this.hasCurrentChild(item));
  }

  ariaCurrent(item: SideNavItem): 'page' | 'true' | null {
    if (item.id === this.currentId) return 'page';
    return this.layout === 'rail' && this.hasCurrentChild(item) ? 'true' : null;
  }

  /** 窄欄的母項目：開著子選單時回傳那一個 */
  openFlyout(item: SideNavItem): Flyout | undefined {
    return this.flyouts().find(f => f.item.id === item.id && !f.leaving);
  }

  flyoutId(f: Flyout): string {
    return `${this.uid}-sub-${f.key}`;
  }

  ariaExpanded(item: SideNavItem): 'true' | 'false' | null {
    if (this.layout !== 'rail' || !this.hasChildren(item)) return null;
    return this.openFlyout(item) ? 'true' : 'false';
  }

  ariaControls(item: SideNavItem): string | null {
    const f = this.layout === 'rail' ? this.openFlyout(item) : undefined;
    return f ? this.flyoutId(f) : null;
  }

  // ── 窄欄子選單：滑鼠 ──

  onItemEnter(item: SideNavItem, anchor: EventTarget | null): void {
    if (this.mode !== 'rail') return;
    this.pointerInside = true;
    this.activate(item, anchor as HTMLAnchorElement);
  }

  onPanelEnter(): void {
    this.pointerInside = true;
    this.cancelClose();
  }

  onPointerLeave(): void {
    this.pointerInside = false;
    this.scheduleClose();
  }

  // ── 窄欄子選單：焦點與鍵盤 ──

  onItemFocus(item: SideNavItem, anchor: EventTarget | null): void {
    if (this.mode !== 'rail') return;
    this.activate(item, anchor as HTMLAnchorElement);
  }

  /** 焦點離開母項目或子選單：去的地方不是這組、滑鼠也不在上面，就收起 */
  onFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const open = this.flyouts().filter(f => !f.leaving);
    if (!open.length) return;
    const stays = open.some(f => f.anchor === next || this.panelFor(f)?.contains(next));
    if (stays || this.pointerInside) return;
    // 焦點移到側欄的其他項目時，那一項的 focus 會自己處理（開它的子選單或收起）
    if (next && this.hostEl.nativeElement.contains(next)) return;
    this.closeFlyouts();
  }

  onItemKeydown(event: KeyboardEvent, item: SideNavItem): void {
    if (event.key !== 'Tab' || event.shiftKey) return;
    const f = this.openFlyout(item);
    const panel = f && this.panelFor(f);
    if (!panel) return;
    event.preventDefault();
    panel.focusFirst();
  }

  onPanelTabOut(e: { direction: 'forward' | 'backward'; event: KeyboardEvent }, f: Flyout): void {
    if (e.direction === 'backward') {
      e.event.preventDefault();
      f.anchor.focus();
      return;
    }
    const items = Array.from(this.hostEl.nativeElement.querySelectorAll<HTMLAnchorElement>('a.side-nav__item'));
    const next = items[items.indexOf(f.anchor) + 1];
    this.closeFlyouts();
    if (next) {
      e.event.preventDefault();
      next.focus();
    } else {
      // 母項目是最後一項：焦點放回母項目、不擋預設，瀏覽器接著把焦點移到側欄後面
      f.anchor.focus();
    }
  }

  onPanelLinkClick(e: { link: NavPanelLink; event: MouseEvent }): void {
    this.closeFlyouts();
    if (!this.navigate.observed) return;
    e.event.preventDefault();
    this.navigate.emit(e.link as SideNavLink);
  }

  onPanelDismiss(reason: NavPanelDismissReason, f: Flyout): void {
    // Esc：焦點在子選單裡要先還給母項目，不然會留在播收起動畫的子選單上
    if (reason === 'escape' && this.panelFor(f)?.contains(document.activeElement)) f.anchor.focus();
    this.closeFlyouts();
  }

  ngOnDestroy(): void {
    this.cancelClose();
    this.removeTimers.forEach(t => clearTimeout(t));
    this.removeTimers.clear();
  }

  private activate(item: SideNavItem, anchor: HTMLAnchorElement): void {
    this.cancelClose();
    if (!this.hasChildren(item)) {
      this.closeFlyouts();
      return;
    }
    const current = this.openFlyout(item);
    if (current && current.anchor === anchor) return;
    this.closeFlyouts();
    this.flyouts.update(list => [...list, { key: this.nextFlyoutKey++, item, anchor, leaving: false }]);
  }

  private panelFor(f: Flyout): NavLinkPanelComponent | undefined {
    return this.panelRefs?.find(p => p.panelId === this.flyoutId(f));
  }

  private scheduleClose(): void {
    if (!this.flyouts().some(f => !f.leaving)) return;
    this.cancelClose();
    this.closeTimer = setTimeout(() => {
      this.closeTimer = null;
      this.closeFlyouts();
    }, CLOSE_DELAY_MS);
  }

  private cancelClose(): void {
    if (this.closeTimer !== null) clearTimeout(this.closeTimer);
    this.closeTimer = null;
  }

  /** 開著的子選單標成 leaving，播完收起動畫再移除；減少動態時直接移除 */
  private closeFlyouts(): void {
    this.cancelClose();
    const open = this.flyouts().filter(f => !f.leaving);
    if (!open.length) return;
    const keys = open.map(f => f.key);
    this.flyouts.update(list => list.map(f => (keys.includes(f.key) ? { ...f, leaving: true } : f)));
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const t = setTimeout(() => {
      this.removeTimers.delete(t);
      this.flyouts.update(list => list.filter(f => !keys.includes(f.key)));
    }, reduce ? 0 : FLYOUT_MS);
    this.removeTimers.add(t);
  }

  private dropFlyouts(): void {
    this.cancelClose();
    this.pointerInside = false;
    if (this.flyouts().length) this.flyouts.set([]);
  }
}
