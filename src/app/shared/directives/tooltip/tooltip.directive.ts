import {
  Directive, Input, HostListener, AfterViewInit,
  ElementRef, ApplicationRef, EnvironmentInjector, DestroyRef,
  createComponent, ComponentRef,
  inject,
} from '@angular/core';
import { TooltipPortalComponent, TooltipPortalDirection, TooltipPortalStyle } from './tooltip-portal.component';
import { Placement, PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';

/**
 * [appTooltip] — 通用 Tooltip Directive
 *
 * Portal 模式：tooltip 直接 append 至 document.body，使用 position: fixed 定位，
 * 完全不受父容器 overflow:hidden 影響。定位邏輯由 PortalPositioningService 統一管理。
 *
 * 用法：
 *   <div [appTooltip]="'提示文字'"
 *        appTooltipDirection="top"
 *        appTooltipStyle="default">
 *   </div>
 *
 * 截斷文字的全文提示：host 自己負責 ellipsis（overflow:hidden + text-overflow:ellipsis），
 * 加上 [appTooltipOnlyWhenTruncated]="true" 後，只有真的被截斷時才顯示 tooltip，
 * 且只有被截斷時 host 才可被鍵盤聚焦（tabindex=0）。沒被截斷時全文已在畫面上，再講一次是噪音。
 *   <span class="ellipsis" [appTooltip]="fileName" [appTooltipOnlyWhenTruncated]="true">{{ fileName }}</span>
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective implements AfterViewInit {
  /** Tooltip 文字；空字串 = 停用 */
  @Input('appTooltip') text = '';

  /** Tooltip 顯示方向（相對於 trigger），預設在上方 */
  @Input() appTooltipDirection: TooltipPortalDirection = 'top';

  /** 視覺風格 */
  @Input() appTooltipStyle: TooltipPortalStyle = 'default';

  /**
   * 只在 host 文字真的被截斷（scrollWidth > clientWidth）時顯示，並只在截斷時讓 host 可聚焦。
   * 截斷與否在顯示當下量；可聚焦與否靠 ResizeObserver / MutationObserver 追蹤寬度與文字變化。
   */
  @Input() appTooltipOnlyWhenTruncated = false;

  /** 長文字換行：tooltip 文字最寬 520px，超過就換行（給檔名、使用者自填標題這類可能很長的文字）；預設關閉 */
  @Input() appTooltipWrap = false;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly positioning = inject(PortalPositioningService);

  private _portalRef: ComponentRef<TooltipPortalComponent> | null = null;
  private _overlayRef: PortalOverlayRef | null = null;
  private _showTimeoutId: ReturnType<typeof setTimeout> | null = null;

  /** tabindex 是否由本 directive 掛上（host 原本自帶 tabindex 時不碰它） */
  private _ownsTabindex = false;

  constructor() {
    this.destroyRef.onDestroy(() => this._hide());
  }

  ngAfterViewInit(): void {
    if (!this.appTooltipOnlyWhenTruncated) return;
    const host = this.el.nativeElement as HTMLElement;
    if (host.hasAttribute('tabindex')) return;
    this._ownsTabindex = true;

    const sync = () => this._syncFocusable();
    const resizeObserver = new ResizeObserver(sync);
    resizeObserver.observe(host);
    // 欄寬不變、文字變長也會變成截斷（例如 flex:1 的檔名欄），所以文字變化也要重量
    const mutationObserver = new MutationObserver(sync);
    mutationObserver.observe(host, { characterData: true, childList: true, subtree: true });
    this.destroyRef.onDestroy(() => {
      resizeObserver.disconnect();
      mutationObserver.disconnect();
    });
    sync();
  }

  @HostListener('mouseenter')
  @HostListener('focus')
  onShow(): void {
    this._scheduleShow();
  }

  @HostListener('mouseleave')
  @HostListener('blur')
  onHide(): void {
    this._hide();
  }

  private _isTruncated(): boolean {
    const host = this.el.nativeElement as HTMLElement;
    return host.scrollWidth > host.clientWidth + 1; // +1 吸收 subpixel 誤差
  }

  private _syncFocusable(): void {
    if (!this._ownsTabindex) return;
    const host = this.el.nativeElement as HTMLElement;
    if (this._isTruncated()) {
      host.setAttribute('tabindex', '0');
    } else {
      host.removeAttribute('tabindex');
    }
  }

  private _scheduleShow(): void {
    if (!this.text || this._showTimeoutId !== null || this._portalRef) return;
    if (this.appTooltipOnlyWhenTruncated && !this._isTruncated()) return;
    this._showTimeoutId = setTimeout(() => {
      this._showTimeoutId = null;
      this._openPortal();
    }, 300);
  }

  private _openPortal(): void {
    if (this._portalRef || !this.text) return;

    this._portalRef = createComponent(TooltipPortalComponent, {
      environmentInjector: this.envInjector,
    });
    this._portalRef.setInput('text', this.text);
    this._portalRef.setInput('tooltipStyle', this.appTooltipStyle);
    this._portalRef.setInput('direction', this.appTooltipDirection);
    this._portalRef.setInput('wrap', this.appTooltipWrap);

    this.appRef.attachView(this._portalRef.hostView);
    document.body.appendChild(this._portalRef.location.nativeElement);

    const panelRef = new ElementRef(this._portalRef.location.nativeElement as HTMLElement);
    this._overlayRef = this.positioning.attach(this.el, panelRef, {
      placement: this.appTooltipDirection,
      gap: 8,
      trackScroll: true,
      scrollContainerStrategy: 'nearest',
      closeOnClickOutside: false,
      closeOnEscape: true,
      onClose: () => this._destroyPortal(),
      onPlacementChange: (p) => this._syncDirection(p),
    });
  }

  private _hide(): void {
    if (this._showTimeoutId !== null) {
      clearTimeout(this._showTimeoutId);
      this._showTimeoutId = null;
    }
    this._overlayRef?.detach();
    // _destroyPortal 透過 onClose callback 觸發
  }

  private _destroyPortal(): void {
    if (!this._portalRef) return;
    this.appRef.detachView(this._portalRef.hostView);
    this._portalRef.destroy();
    this._portalRef = null;
    this._overlayRef = null;
  }

  private _syncDirection(placement: Placement): void {
    if (!this._portalRef) return;
    this._portalRef.setInput('direction', placement as TooltipPortalDirection);
    this._portalRef.changeDetectorRef.detectChanges();
  }
}
