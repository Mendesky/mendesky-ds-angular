import { Component, Input, Output, EventEmitter, OnInit, OnChanges, OnDestroy, SimpleChanges, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type ToastType = 'success' | 'error' | 'loading';
export type ToastSize = 'S' | 'M';

export interface ToastAction {
  label: string;
  onClick: () => void;
}

@Component({
  selector: 'app-process-toast',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './process-toast.component.html',
  styleUrls: ['./process-toast.component.scss'],
})
export class ProcessToastComponent implements OnInit, OnChanges, OnDestroy {
  @Input() type: ToastType = 'error';
  @Input() message = '';
  @Input() duration?: number;
  @Input() size: ToastSize = 'S';
  @Input() stackMode = false;
  /** When true, triggers the exit animation from outside (e.g. from ToastService). */
  @Input() requestHide = false;
  readonly action = input<ToastAction | undefined>(undefined);
  @Output() dismissed = new EventEmitter<void>();

  hiding = false;

  /** 目前實際顯示的內容（緩衝）；update() 轉場時先播 out、再換成新的 @Input 值播 in，避免內容硬切 */
  displayType: ToastType = 'error';
  displayMessage = '';
  /** 內容轉場階段：out＝舊內容往右淡出、in＝新內容從左淡入、idle＝穩定 */
  swapPhase: 'idle' | 'out' | 'in' = 'idle';
  private static readonly SWAP_MS = 160;

  private hideTimer?: ReturnType<typeof setTimeout>;
  private dismissTimer?: ReturnType<typeof setTimeout>;
  private swapOutTimer?: ReturnType<typeof setTimeout>;
  private swapInTimer?: ReturnType<typeof setTimeout>;
  private actionFired = false;

  get iconName(): string {
    switch (this.displayType) {
      case 'success': return 'Done-OK';
      case 'error':   return 'Info-Logs';
      case 'loading': return ''; // loading 以 CSS spinner 呈現，不用 app-icon
    }
  }

  /** loading 型別以旋轉 spinner 取代 icon */
  get isLoading(): boolean {
    return this.displayType === 'loading';
  }

  get iconSize(): '24' | '36' {
    return this.size === 'S' ? '24' : '36';
  }

  /** 與 `ToastService.resolveDuration()` 對齊：error 5000、有 action 5000、其餘 3000。
   *  只在「裸用 app-process-toast」（不經 app-toast-container）時生效——容器會硬帶
   *  `[duration]="999999999"` 並用 `[requestHide]` 驅動消失，時長由 ToastService 決定。 */
  private get effectiveDuration(): number {
    return this.duration ?? ((this.action() || this.type === 'error') ? 5000 : 3000);
  }

  ngOnInit(): void {
    this.displayType = this.type;
    this.displayMessage = this.message;
    this.hideTimer = setTimeout(() => {
      this.hiding = true;
      this.dismissTimer = setTimeout(() => this.dismissed.emit(), 300);
    }, this.effectiveDuration);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestHide']?.currentValue === true && !this.hiding) {
      clearTimeout(this.hideTimer);
      this.hiding = true;
      this.dismissTimer = setTimeout(() => this.dismissed.emit(), 300);
    }

    // update() 造成 type/message 變更（非首次、非退場中）→ 舊內容往右淡出 → 換新值 → 從左淡入
    const typeChanged = !!changes['type'] && !changes['type'].firstChange && changes['type'].previousValue !== changes['type'].currentValue;
    const msgChanged = !!changes['message'] && !changes['message'].firstChange && changes['message'].previousValue !== changes['message'].currentValue;
    if ((typeChanged || msgChanged) && !this.hiding) {
      this.startContentSwap();
    }
  }

  /** 內容原地轉場：out（往右淡出 SWAP_MS）→ 換成新 @Input 內容 → in（從左淡入 SWAP_MS）。 */
  private startContentSwap(): void {
    clearTimeout(this.swapOutTimer);
    clearTimeout(this.swapInTimer);
    this.swapPhase = 'out';
    this.swapOutTimer = setTimeout(() => {
      this.displayType = this.type;
      this.displayMessage = this.message;
      this.swapPhase = 'in';
      this.swapInTimer = setTimeout(() => { this.swapPhase = 'idle'; }, ProcessToastComponent.SWAP_MS);
    }, ProcessToastComponent.SWAP_MS);
  }

  ngOnDestroy(): void {
    clearTimeout(this.hideTimer);
    clearTimeout(this.dismissTimer);
    clearTimeout(this.swapOutTimer);
    clearTimeout(this.swapInTimer);
  }

  onActionClick(): void {
    if (this.actionFired) return;
    this.actionFired = true;
    clearTimeout(this.hideTimer);
    this.action()?.onClick();
    this.hiding = true;
    this.dismissTimer = setTimeout(() => this.dismissed.emit(), 300);
  }
}
