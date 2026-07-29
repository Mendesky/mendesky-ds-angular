import {
  Directive, Input, OnChanges, OnDestroy,
  ElementRef, ApplicationRef, EnvironmentInjector,
  createComponent, ComponentRef, Component, HostBinding,
  SimpleChanges, inject, effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Placement, PortalOverlayRef, PortalPositioningService } from '../services/portal-positioning.service';
import { ModalStackService } from '../../core/services/modal-stack.service';

/**
 * 錯誤 tooltip Portal 元件。
 * 由 ErrorTooltipDirective 動態建立並 append 至 document.body，
 * 避免被 modal-card 的 overflow:hidden + transform 裁掉。
 */
@Component({
  selector: 'app-form-error-portal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="errorPosition === 'bottom'" class="form-error-tooltip__arrow--up"></div>
    <div class="form-error-tooltip__box">
      <ng-container *ngIf="isMultiLine; else singleContent">
        <ul class="form-error-tooltip__list">
          <li *ngFor="let item of listItems">{{ item }}</li>
        </ul>
      </ng-container>
      <ng-template #singleContent>{{ textContent }}</ng-template>
    </div>
    <div *ngIf="errorPosition === 'top'" class="form-error-tooltip__arrow--down"></div>
  `,
  styles: [`
    :host {
      position: fixed;
      pointer-events: none;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      max-width: 280px;
      min-width: 100px;
    }
    :host.form-error-portal--bottom { animation: formErrorIn    300ms var(--ease-enter) both; }
    :host.form-error-portal--top    { animation: formErrorInUp  300ms var(--ease-enter) both; }
    .form-error-tooltip__list {
      margin: 0;
      padding: 0 0 0 14px;
      font-size: inherit;
    }
    .form-error-tooltip__list li + li { margin-top: 2px; }
  `],
})
export class FormErrorPortalComponent {
  @Input() errorMessage: string | string[] = '';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';

  @HostBinding('class.form-error-portal--bottom') get isBottom() { return this.errorPosition === 'bottom'; }
  @HostBinding('class.form-error-portal--top') get isTop() { return this.errorPosition === 'top'; }

  get isMultiLine(): boolean {
    return Array.isArray(this.errorMessage) && (this.errorMessage as string[]).length > 1;
  }

  get textContent(): string {
    if (Array.isArray(this.errorMessage)) return (this.errorMessage as string[])[0] || '';
    return this.errorMessage as string;
  }

  get listItems(): string[] {
    return Array.isArray(this.errorMessage) ? this.errorMessage as string[] : [];
  }
}

/**
 * 使用方式：在表單元件包裝層加上
 *   [appErrorTooltip]="errorMessage"
 *   [errorPosition]="errorPosition"
 *   [errorDisabled]="disabled"
 *
 * 指令自動將 tooltip portal 至 body，不受 overflow:hidden 影響。
 * 定位、scroll 監聽、ModalStack 整合由 PortalPositioningService 統一管理。
 */
@Directive({
  selector: '[appErrorTooltip]',
  standalone: true,
})
export class ErrorTooltipDirective implements OnChanges, OnDestroy {
  @Input('appErrorTooltip') errorMessage: string | string[] = '';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';
  @Input() errorDisabled = false;

  @HostBinding('class.has-error-tooltip')
  get hasErrorActive(): boolean {
    return this._hasMessage && !this.errorDisabled;
  }

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly positioning = inject(PortalPositioningService);
  private readonly modalStack = inject(ModalStackService);

  private _portalRef: ComponentRef<FormErrorPortalComponent> | null = null;
  private _overlayRef: PortalOverlayRef | null = null;
  private _hiddenForModal = false;
  private _openedAtStackSize = 0;

  constructor() {
    effect(() => {
      const size = this.modalStack.stackSize();
      if (this._hiddenForModal && size <= this._openedAtStackSize && this._hasMessage && !this.errorDisabled && !this._overlayRef) {
        this._hiddenForModal = false;
        this._openPortal();
      }
    });
  }

  private get _hasMessage(): boolean {
    if (Array.isArray(this.errorMessage)) return this.errorMessage.length > 0;
    return !!this.errorMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this._hasMessage && !this.errorDisabled) {
      if (this._overlayRef) {
        this._syncPortal();
        if (changes['errorPosition']) {
          this._overlayRef.updatePlacement(this._currentPlacement());
        }
      } else if (!this._hiddenForModal) {
        this._openPortal();
      }
      // _hiddenForModal=true：等 modal 關閉後 effect 重開，不提早打開
    } else {
      this._hiddenForModal = false;  // 錯誤消失 → 取消等待重開
      this._closePortal();
    }
  }

  ngOnDestroy(): void {
    this._closePortal();
  }

  private _currentPlacement(): Placement {
    return this.errorPosition === 'top' ? 'top-start' : 'bottom-start';
  }

  private _openPortal(): void {
    this._openedAtStackSize = this.modalStack.stackSize();
    this._portalRef = createComponent(FormErrorPortalComponent, {
      environmentInjector: this.envInjector,
    });
    this._portalRef.setInput('errorMessage',  this.errorMessage);
    this._portalRef.setInput('errorPosition', this.errorPosition);
    this.appRef.attachView(this._portalRef.hostView);
    document.body.appendChild(this._portalRef.location.nativeElement);

    this._overlayRef = this.positioning.attach(
      this.el,
      new ElementRef(this._portalRef.location.nativeElement as HTMLElement),
      {
        placement: this._currentPlacement(),
        gap: 4,
        trackScroll: true,
        scrollContainerStrategy: 'nearest',
        closeOnModalOpen: true,
        closeOnClickOutside: false,
        closeOnEscape: false,
        onClose: (reason) => {
          if (reason === 'manual') return;
          if (reason === 'modal-open') {
            this._hiddenForModal = true;  // modal 開啟時暫存，等 modal 關閉後 effect 重開
          }
          this._closePortal();
        },
        onPlacementChange: (p) => {
          // viewport flip 後同步箭頭方向
          const pos: 'top' | 'bottom' = p.startsWith('top') ? 'top' : 'bottom';
          this._portalRef?.setInput('errorPosition', pos);
          this._portalRef?.changeDetectorRef.markForCheck();
        },
      },
    );
  }

  private _syncPortal(): void {
    if (!this._portalRef) return;
    this._portalRef.setInput('errorMessage', this.errorMessage);
    this._portalRef.changeDetectorRef.markForCheck();
  }

  private _closePortal(): void {
    const ref = this._overlayRef;
    this._overlayRef = null;
    ref?.detach();  // 若 service 已 detach（modal-open 路徑），此為 no-op
    if (!this._portalRef) return;
    this.appRef.detachView(this._portalRef.hostView);
    this._portalRef.destroy();
    this._portalRef = null;
  }
}
