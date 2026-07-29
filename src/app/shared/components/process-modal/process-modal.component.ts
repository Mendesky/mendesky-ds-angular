import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ProcessModalType = 'running' | 'congratulation';

@Component({
  selector: 'app-process-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './process-modal.component.html',
  styleUrls: ['./process-modal.component.scss'],
})
export class ProcessModalComponent implements OnChanges {
  @Input() type: ProcessModalType = 'running';
  @Input() message = '';
  @Input() isOpen = false;
  @Output() dismissed = new EventEmitter<void>();

  visible = signal(false);
  isClosing = signal(false);
  private closeTimer?: ReturnType<typeof setTimeout>;

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) return;
    if (this.isOpen) {
      if (this.closeTimer) clearTimeout(this.closeTimer);
      this.visible.set(true);
      this.isClosing.set(false);
    } else if (this.visible()) {
      this.isClosing.set(true);
      this.closeTimer = setTimeout(() => {
        this.visible.set(false);
        this.isClosing.set(false);
      }, 250);
    }
  }

  onBackdropClick(): void {
    // running 狀態不允許關閉（系統處理中）
    if (this.type === 'congratulation') {
      this.dismissed.emit();
    }
  }
}
