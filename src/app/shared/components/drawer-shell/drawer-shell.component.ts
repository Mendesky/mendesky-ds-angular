import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnChanges,
  SimpleChanges,
  OnDestroy,
  HostListener,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalStackService } from '../../../core/services/modal-stack.service';

@Component({
  selector: 'app-drawer-shell',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drawer-shell.component.html',
  styleUrls: ['./drawer-shell.component.scss'],
})
export class DrawerShellComponent implements OnChanges, OnDestroy {
  /** 控制顯示 / 隱藏 */
  @Input() isOpen = false;

  /** 滑出方向：left（左側）| right（右側，預設）| bottom（底部） */
  @Input() side: 'left' | 'right' | 'bottom' = 'right';

  /** Panel 寬度，支援任意 CSS 值（預設 280px，bottom 模式忽略） */
  @Input() width = '280px';

  /** 點擊 overlay 或按 ESC 時觸發，父層負責將 isOpen 設為 false */
  @Output() close = new EventEmitter<void>();

  protected visible = signal(false);
  protected isClosing = signal(false);

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private modalStack = inject(ModalStackService);

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) return;

    const opened = changes['isOpen'].currentValue as boolean;
    if (opened) {
      if (this.closeTimer) {
        clearTimeout(this.closeTimer);
        this.closeTimer = null;
      }
      this.isClosing.set(false);
      this.visible.set(true);
    } else {
      this.isClosing.set(true);
      this.closeTimer = setTimeout(() => {
        this.visible.set(false);
        this.isClosing.set(false);
        this.closeTimer = null;
      }, 300);
    }
  }

  ngOnDestroy(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    // 有 modal 開啟時，ESC 交給最上層 modal 處理，不連帶關掉底下的 drawer
    if (this.modalStack.hasAny()) return;
    if (this.visible()) this.close.emit();
  }

  protected onOverlayClick(): void {
    this.close.emit();
  }
}
