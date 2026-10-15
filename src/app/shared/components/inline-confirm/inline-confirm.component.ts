import { Component, input, model, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

@Component({
  selector: 'app-inline-confirm',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './inline-confirm.component.html',
  styleUrls: ['./inline-confirm.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  /** 欄位驗證錯誤訊息；有值時顯示 tooltip（空字串 = 不顯示）*/
  errorMessage = input<string>('');
  /** 錯誤提示位置：預設 bottom（欄位錯誤統一放下方）；版面放不下時才改 top */
  errorPosition = input<'top' | 'bottom'>('bottom');

  private static _seq = 0;
  readonly uid = `inline-confirm-${++InlineConfirmComponent._seq}`;

  toggle(): void {
    this.confirmed.update((v) => !v);
  }
}
