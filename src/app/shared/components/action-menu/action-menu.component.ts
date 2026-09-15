import {
  Component, Input, Output, EventEmitter,
  HostListener, ElementRef, AfterViewInit, OnDestroy,
  inject,
 ChangeDetectionStrategy, } from '@angular/core';
import { Placement, PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [],
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionMenuComponent implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly positioning = inject(PortalPositioningService);

  /** 點擊選單內部的子元素時是否自動 emit closeMenu。預設 true（適合 More 操作選單）；複雜篩選面板設 false。 */
  @Input() autoCloseOnAction = true;

  /** 對齊方向：'left' = 左對齊 trigger，'right' = 右對齊 trigger，'center' = 水平置中 trigger。 */
  @Input() align: 'left' | 'right' | 'center' = 'left';

  /**
   * 外部 anchor element：用於 trigger 不是 host.parentElement 的情境（如 contenteditable 內的 inline chip）。
   * 傳入後走 element-anchored 模式，由 PortalPositioningService 自動 track scroll/resize。
   */
  @Input() anchorEl: HTMLElement | null = null;

  /**
   * Legacy fixed 定位模式（向後相容）：
   * 有傳 fixedTop/fixedLeft 等值時，直接走 attachAtPoint；不傳則走 attach（element-anchored）。
   */
  @Input() fixedMode = false;
  @Input() fixedTop: number | null = null;
  @Input() fixedBottom: number | null = null;
  @Input() fixedRight: number | null = null;
  @Input() fixedLeft: number | null = null;
  @Input() fixedWidth: number | null = null;
  /**
   * 邏輯祖先錨點（僅 fixedMode/point-anchored 用）：巢狀 flyout 的觸發元素（位於父選單 panel 內）。
   * 帶入後，點此 flyout 內容時 click-outside 的 ancestor-protection 不會誤關父選單。
   */
  @Input() ancestorAnchorEl: HTMLElement | null = null;

  /** 應關閉選單時發射（點擊外部 或 autoCloseOnAction=true 時點擊內部）。 */
  @Output() closeMenu = new EventEmitter<void>();

  private _overlayRef: PortalOverlayRef | null = null;
  /** 記住開啟 menu 前的 focused 元素，Escape 時還原 focus */
  private _triggerEl: HTMLElement | null = null;
  /** focus-when-ready：等非同步內容（skeleton→內容）出現才種初始焦點用。 */
  private _focusObserver: MutationObserver | null = null;
  private _focusTimer: ReturnType<typeof setTimeout> | null = null;

  ngAfterViewInit(): void {
    this._triggerEl = document.activeElement as HTMLElement | null;
    const host = this.el.nativeElement as HTMLElement;

    if (this.fixedMode && this._hasLegacyCoords()) {
      // position:fixed 在 transform / backdrop-filter 祖先（如 modal-card--glass）內會被
      // containing block 困住、座標改相對容器解析 — 與 element-anchored 模式一致搬到 body，
      // 讓 fixedTop/fixedRight 真正以 viewport 為座標系（ngOnDestroy 已涵蓋自 body 移除）
      document.body.appendChild(host);
      this._attachFixed(host);
      return;
    }

    // Element-anchored：搬到 body → service 接管定位、scroll/resize、click-outside
    const anchorEl = this.anchorEl ?? (host.parentElement as HTMLElement);
    document.body.appendChild(host);
    this._overlayRef = this.positioning.attach(
      new ElementRef(anchorEl),
      this.el,
      {
        placement: this.align === 'right' ? 'bottom-end' : this.align === 'center' ? 'bottom' : 'bottom-start',
        gap: 6,
        trackScroll: true,
        scrollContainerStrategy: 'document',
        closeOnClickOutside: true,
        closeOnEscape: false,
        onClose: (reason) => {
          if (reason !== 'manual') this.closeMenu.emit();
        },
      },
    );
    requestAnimationFrame(() => this._focusFirstWhenReady());
  }

  ngOnDestroy(): void {
    this._teardownFocusWatch();
    this._overlayRef?.detach();
    const host = this.el.nativeElement as HTMLElement;
    if (host.parentNode === document.body) {
      document.body.removeChild(host);
    }
  }

  @HostListener('click')
  onHostClick(): void {
    if (this.autoCloseOnAction) {
      this.closeMenu.emit();
    }
  }

  /** 鍵盤導覽：Arrow Up/Down 移動焦點，Enter/Space 觸發 item，Escape 關閉 */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
        event.preventDefault();
        const items = this._getFocusableItems();
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement as HTMLElement);
        if (event.key === 'ArrowDown') {
          items[(idx + 1) % items.length].focus();
        } else {
          items[idx <= 0 ? items.length - 1 : idx - 1].focus();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        // 跳過表單元素：input/textarea/select 有各自的原生 Enter/Space 行為
        const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
        event.preventDefault();
        // 消費後不再冒泡：否則同一個 Enter 會續傳到 document 層快速鍵（如 kanban Enter 重開卡片選單），
        // 造成選單「關了又被重開、浮在剛開的 modal 上」（比照下方 Escape 分支）。
        event.stopPropagation();
        // WAI-ARIA Menu Pattern：Enter/Space 啟動 focused menuitem。
        // 主動 click 繞過「程式化 .focus() 後原生 Enter 不自動 trigger click」的瀏覽器差異。
        (document.activeElement as HTMLElement)?.click();
        break;
      }
      case 'Escape':
        event.stopPropagation();
        this._triggerEl?.focus();
        this.closeMenu.emit();
        break;
    }
  }

  private _getFocusableItems(): HTMLElement[] {
    const host = this.el.nativeElement as HTMLElement;
    return Array.from(
      host.querySelectorAll<HTMLElement>('button:not(:disabled), [role="menuitem"]:not([disabled])')
    );
  }

  /** 種初始焦點到第一個可聚焦項；成功回 true、無可聚焦項回 false。 */
  private _focusFirst(): boolean {
    const first = this._getFocusableItems()[0];
    if (!first) return false;
    first.focus();
    return true;
  }

  /**
   * 種初始焦點，並容忍「非同步內容」：若當下沒有可聚焦項（如 flyout 正顯示 loading skeleton，
   * 內容尚未由 API 回填），掛 MutationObserver 等內容出現的那一刻立即補種焦點、隨即 disconnect。
   * 同步內容（一般 More 選單）在首次即成功、不會掛 observer。安全上限避免洩漏。
   * （對齊 DS pattern loading.api-hydration-skeleton：skeleton 無 tabindex、內容備妥才進焦點。）
   */
  private _focusFirstWhenReady(): void {
    if (this._focusFirst()) return;
    const host = this.el.nativeElement as HTMLElement;
    this._focusObserver = new MutationObserver(() => {
      if (this._focusFirst()) this._teardownFocusWatch();
    });
    this._focusObserver.observe(host, { childList: true, subtree: true });
    this._focusTimer = setTimeout(() => this._teardownFocusWatch(), 1000);
  }

  private _teardownFocusWatch(): void {
    this._focusObserver?.disconnect();
    this._focusObserver = null;
    if (this._focusTimer) { clearTimeout(this._focusTimer); this._focusTimer = null; }
  }

  private _hasLegacyCoords(): boolean {
    return this.fixedTop !== null || this.fixedBottom !== null ||
           this.fixedLeft !== null || this.fixedRight !== null;
  }

  /**
   * Point-anchored 模式：將 fixedTop/fixedLeft/fixedBottom/fixedRight 轉為
   * viewport 座標，交由 attachAtPoint 定位（含 viewport flip 與 click-outside 偵測）。
   *
   * fixedBottom/fixedRight 的對應：
   *   fixedLeft  + fixedTop    → placement: 'bottom-start'（top-left 錨點）
   *   fixedRight + fixedTop    → placement: 'bottom-end'  （top-right 錨點）
   *   fixedLeft  + fixedBottom → placement: 'top-start'   （bottom-left 錨點）
   *   fixedRight + fixedBottom → placement: 'top-end'     （bottom-right 錨點）
   */
  private _attachFixed(host: HTMLElement): void {
    if (this.fixedWidth !== null) host.style.width = this.fixedWidth + 'px';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = this.fixedLeft  !== null ? this.fixedLeft
             : (this.fixedRight  !== null ? vw - this.fixedRight  : 0);
    const y = this.fixedTop   !== null ? this.fixedTop
             : (this.fixedBottom !== null ? vh - this.fixedBottom : 0);

    let placement: Placement = 'bottom-start';
    if      (this.fixedBottom !== null && this.fixedRight !== null) placement = 'top-end';
    else if (this.fixedBottom !== null)                             placement = 'top-start';
    else if (this.fixedRight  !== null)                             placement = 'bottom-end';

    this._overlayRef = this.positioning.attachAtPoint(x, y, this.el, {
      placement,
      gap: 0,
      trackScroll: false,
      closeOnClickOutside: true,
      closeOnEscape: false,
      ancestorAnchorEl: this.ancestorAnchorEl ?? undefined,
      onClose: (reason) => {
        if (reason !== 'manual') this.closeMenu.emit();
      },
    });
    requestAnimationFrame(() => this._focusFirstWhenReady());
  }
}
