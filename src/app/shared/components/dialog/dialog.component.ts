import {
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  Renderer2,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { ModalStackService } from '../../../core/services/modal-stack.service';

@Component({
  selector: 'app-dialog',
  standalone: true,
  imports: [CommonModule, ButtonComponent, A11yModule],
  templateUrl: './dialog.component.html',
  styleUrls: ['./dialog.component.scss'],
})
export class DialogComponent implements OnChanges, OnDestroy {
  @Input() isOpen = false;
  @Input() header = 'Header';
  @Input() content = 'Content';
  @Input() propClass: 'Warning' | 'Normal' = 'Warning';
  @Input() confirmText = '確認封存';
  /**
   * Warning confirm 按鈕的 leftIcon。預設 'Trash-Del' 保留刪除類 dialog 既有外觀；
   * 非刪除/告知型 dialog 傳 '' 即可移除圖示（紅色仍保留作為警示）。
   * 註：Warning 代表「紅色嚴重度」，不等於「刪除動作」，故圖示與 propClass 解耦。
   */
  @Input() confirmIcon = 'Trash-Del';
  @Input() showCancel = true;
  /** 取消（次要）按鈕文字。預設「取消並關閉」維持既有 dialog 外觀；可依情境覆寫（如 wizard 放棄確認用「繼續新建」）。 */
  @Input() cancelText = '取消並關閉';
  @Input() loading = false;

  @Output() cancel = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<void>();

  visible = signal(false);
  isClosing = signal(false);
  private closeTimer?: ReturnType<typeof setTimeout>;

  private static counter = 0;
  private readonly dialogId = `dialog-${++DialogComponent.counter}`;
  private modalStack = inject(ModalStackService);
  private elRef = inject(ElementRef);
  private renderer = inject(Renderer2);

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (!this.isOpen) return;
    if (!this.modalStack.isTopmost(this.dialogId)) return;
    event.preventDefault();
    this.onCancel();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) return;
    if (this.isOpen) {
      if (this.closeTimer) clearTimeout(this.closeTimer);
      this.visible.set(true);
      this.isClosing.set(false);
      // 搬到 document.body 根層，脫離父 modal-shell card 的 transform stacking context，
      // 確保 dialog（含 wizard 放棄編輯的二次確認）永遠浮在最上層，不被父 modal 蓋住
      this.renderer.appendChild(document.body, this.elRef.nativeElement);
      this.modalStack.register(this.dialogId);
    } else if (this.visible()) {
      this.modalStack.unregister(this.dialogId);
      this.isClosing.set(true);
      this.closeTimer = setTimeout(() => {
        this.visible.set(false);
        this.isClosing.set(false);
      }, 250);
    }
  }

  ngOnDestroy(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    this.modalStack.unregister(this.dialogId);
    const host = this.elRef.nativeElement as HTMLElement;
    if (host.parentNode === document.body) {
      document.body.removeChild(host);
    }
  }

  onCancel(): void {
    this.cancel.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}
