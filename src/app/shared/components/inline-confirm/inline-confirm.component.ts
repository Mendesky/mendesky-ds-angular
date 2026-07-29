import { Component, input, model } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

@Component({
  selector: 'app-inline-confirm',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './inline-confirm.component.html',
  styleUrls: ['./inline-confirm.component.scss'],
})
export class InlineConfirmComponent {
  label = input.required<string>();
  description = input<string | undefined>(undefined);
  checkLabel = input.required<string>();
  requirement = input<'required' | 'optional'>('required');
  size = input<'md' | 'lg'>('md');
  confirmed = model<boolean>(false);
  fullWidth = input<boolean>(false);
  hideRequiredIcon = input<boolean>(false);
  disabled = input<boolean>(false);
  error = input<boolean>(false);
  /** 欄位驗證錯誤訊息；有值時在 chip 正上方顯示 tooltip（空字串 = 不顯示）*/
  errorMessage = input<string>('');

  private static _seq = 0;
  readonly uid = `inline-confirm-${++InlineConfirmComponent._seq}`;

  toggle(): void {
    this.confirmed.update((v) => !v);
  }
}
