import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { NavLinkPanelComponent, NavPanelDismissReason, NavPanelLink } from '../nav-link-panel/nav-link-panel.component';

/** 麵包屑的一節，也用在最後一節的同區頁面 */
export interface BreadcrumbItem {
  /** 識別字。帶同區頁面時，用它認出哪一頁是目前頁（沒給時用 href 比對） */
  id?: string;
  /** 名稱 */
  label: string;
  /** 連結網址。前面的節與同區頁面要給；最後一節不是連結，可以不給 */
  href?: string;
  /** app-icon 的圖示名稱，16px。建議每一節都給 */
  icon?: string;
}

/** 選單收起動畫長度（Micro 等級），跟 nav-link-panel 的 animation 一致 */
const MENU_MS = 150;

let nextUid = 0;

/**
 * BreadcrumbComponent — 麵包屑
 *
 * 頁首的「區 › 頁」路徑。每一節圖示＋名稱，節和節之間是向右的箭頭（報讀不念）。
 * 前面的節是連結：左鍵單擊（沒按修飾鍵）時擋掉瀏覽器換頁、改送 `navigate`；使用端沒接 `navigate` 時照連結換頁。
 * 最後一節是目前頁（aria-current="page"），不是連結。
 *
 * 最後一節帶兩頁以上的同區頁面（`siblings`）時變成切換鈕：按下打開切換選單（app-nav-link-panel，搬到 body），
 * 列出同區頁面的連結，目前頁綠底。打開時焦點移到目前頁；Esc 收起並還焦點給切換鈕；
 * 第一頁 Shift＋Tab 回切換鈕；最後一頁 Tab 收起、焦點交回切換鈕不擋預設，瀏覽器接著往下走。
 * `items` 換成新陣列（換頁了）時，開著的選單直接移除。
 *
 * 名稱放不下時，前面的節先縮成刪節號，目前頁最後才縮。
 */
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [IconComponent, NavLinkPanelComponent],
  templateUrl: './breadcrumb.component.html',
  styleUrls: ['./breadcrumb.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'breadcrumb' },
})
export class BreadcrumbComponent implements OnChanges, OnDestroy {
  /** 由上層到目前頁的每一節。最後一節是目前頁 */
  @Input({ required: true }) items: readonly BreadcrumbItem[] = [];

  /** 最後一節的同區頁面（含目前頁）。兩頁以上時最後一節變成切換鈕 */
  @Input() siblings: readonly BreadcrumbItem[] = [];

  /** 導覽地標的名稱 */
  @Input() ariaLabel = '目前位置';

  /** 左鍵單擊前面的節或選單的頁面（沒按修飾鍵）時送出，使用端用路由換頁。沒接時照連結換頁 */
  @Output() navigate = new EventEmitter<BreadcrumbItem>();

  /** 切換選單：null 是沒開；leaving 是正在播收起動畫 */
  readonly menu = signal<{ key: number; leaving: boolean } | null>(null);

  readonly uid = `breadcrumb-${nextUid++}`;

  @ViewChild('switchBtn') private switchBtn?: ElementRef<HTMLButtonElement>;

  private panel?: NavLinkPanelComponent;
  private focusOnOpen = false;
  private nextKey = 0;
  private removeTimer: ReturnType<typeof setTimeout> | null = null;

  @ViewChild(NavLinkPanelComponent)
  private set panelRef(p: NavLinkPanelComponent | undefined) {
    this.panel = p;
    if (p && this.focusOnOpen) {
      this.focusOnOpen = false;
      // 這時面板已經搬到 body；等這一輪畫面更新跑完再搬焦點，避免在更新途中觸發 focus 事件
      queueMicrotask(() => p.focusCurrentOrFirst());
    }
  }

  /** 切換鈕的 DOM（選單的錨點） */
  get switchEl(): HTMLButtonElement | null {
    return this.switchBtn?.nativeElement ?? null;
  }

  get hasSwitch(): boolean {
    return this.siblings.length >= 2;
  }

  get last(): BreadcrumbItem | undefined {
    return this.items[this.items.length - 1];
  }

  get panelId(): string {
    return `${this.uid}-menu`;
  }

  /** 選單的連結：沒給 id 的用 href 當識別字 */
  get menuLinks(): NavPanelLink[] {
    return this.siblings.map(s => ({ id: this.keyOf(s), label: s.label, icon: s.icon, href: s.href ?? '' }));
  }

  get currentKey(): string | null {
    return this.last ? this.keyOf(this.last) : null;
  }

  get menuOpen(): boolean {
    return !!this.menu() && !this.menu()!.leaving;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 換頁了：選單直接移除，不等收起動畫
    if (changes['items'] && !changes['items'].firstChange) this.dropMenu();
  }

  ngOnDestroy(): void {
    if (this.removeTimer !== null) clearTimeout(this.removeTimer);
  }

  onLinkClick(event: MouseEvent, item: BreadcrumbItem): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!this.navigate.observed) return;
    event.preventDefault();
    this.navigate.emit(item);
  }

  toggleMenu(): void {
    if (this.menuOpen) {
      this.closeMenu();
      return;
    }
    this.clearRemoveTimer();
    this.focusOnOpen = true;
    this.menu.set({ key: this.nextKey++, leaving: false });
  }

  onPanelLinkClick(e: { link: NavPanelLink; event: MouseEvent }): void {
    const target = this.siblings.find(s => this.keyOf(s) === e.link.id);
    this.closeMenu();
    if (!target || !this.navigate.observed) return;
    e.event.preventDefault();
    this.navigate.emit(target);
  }

  onPanelDismiss(reason: NavPanelDismissReason): void {
    if (reason === 'escape' && this.panel?.contains(document.activeElement)) this.switchBtn?.nativeElement.focus();
    this.closeMenu();
  }

  onPanelTabOut(e: { direction: 'forward' | 'backward'; event: KeyboardEvent }): void {
    // 兩個方向都先把焦點交回切換鈕。往後：擋預設，停在切換鈕；往前：不擋，瀏覽器從切換鈕往下一個
    if (e.direction === 'backward') e.event.preventDefault();
    this.switchBtn?.nativeElement.focus();
    this.closeMenu();
  }

  /** 焦點離開切換鈕與選單、去了別的地方：收起 */
  onFocusOut(event: FocusEvent): void {
    if (!this.menuOpen) return;
    const next = event.relatedTarget as Node | null;
    if (next && (this.switchBtn?.nativeElement.contains(next) || this.panel?.contains(next))) return;
    // relatedTarget 是 null：點到不能聚焦的地方，交給點外面處理
    if (!next) return;
    this.closeMenu();
  }

  private keyOf(item: BreadcrumbItem): string {
    return item.id ?? item.href ?? item.label;
  }

  private closeMenu(): void {
    const m = this.menu();
    if (!m || m.leaving) return;
    this.focusOnOpen = false;
    this.menu.set({ ...m, leaving: true });
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.clearRemoveTimer();
    this.removeTimer = setTimeout(() => {
      this.removeTimer = null;
      if (this.menu()?.key === m.key) this.menu.set(null);
    }, reduce ? 0 : MENU_MS);
  }

  private dropMenu(): void {
    this.clearRemoveTimer();
    this.focusOnOpen = false;
    if (this.menu()) this.menu.set(null);
  }

  private clearRemoveTimer(): void {
    if (this.removeTimer !== null) clearTimeout(this.removeTimer);
    this.removeTimer = null;
  }
}
