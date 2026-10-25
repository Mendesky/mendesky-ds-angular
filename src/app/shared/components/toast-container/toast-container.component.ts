import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProcessToastComponent } from '../process-toast/process-toast.component';
import { ToastService } from '../../services/toast.service';

/**
 * 全域 toast 容器：沒有任何 @Input / @Output，只 inject ToastService，template 以 @for 渲染
 * toasts()，退場（dismissed）時呼叫 removeById()。
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, ProcessToastComponent],
  templateUrl: './toast-container.component.html',
  styleUrls: ['./toast-container.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToastContainerComponent {
  readonly toastService = inject(ToastService);
}
