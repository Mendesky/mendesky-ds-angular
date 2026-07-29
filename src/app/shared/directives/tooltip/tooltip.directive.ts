import {
  Directive, Input, HostListener,
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
 */
@Directive({
  selector: '[appTooltip]',
  standalone: true,
})
export class TooltipDirective {
  /** Tooltip 文字；空字串 = 停用 */
  @Input('appTooltip') text = '';

  /** Tooltip 顯示方向（相對於 trigger），預設在上方 */
  @Input() appTooltipDirection: TooltipPortalDirection = 'top';

  /** 視覺風格 */
  @Input() appTooltipStyle: TooltipPortalStyle = 'default';

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly destroyRef = inject(DestroyRef);
  private readonly positioning = inject(PortalPositioningService);

  private _portalRef: ComponentRef<TooltipPortalComponent> | null = null;
  private _overlayRef: PortalOverlayRef | null = null;
  private _showTimeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.destroyRef.onDestroy(() => this._hide());
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

  private _scheduleShow(): void {
    if (!this.text || this._showTimeoutId !== null || this._portalRef) return;
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
