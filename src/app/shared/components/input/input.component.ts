import { Component, Input, OnChanges, Output, EventEmitter, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

export type InputSize = 'S' | 'M' | 'L';
export type InputMode = 'text' | 'numeric' | 'tel' | 'email' | 'decimal' | 'none';
export type InputSanitize = 'none' | 'digits';

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
})
export class InputComponent implements OnChanges {
  /** 輸入框尺寸 */
  @Input() size: InputSize = 'M';

  /** placeholder 文字 */
  @Input() placeholder = 'Placeholder';

  /** 錯誤訊息；有值時切換為 error 狀態 */
  @Input() errorMessage = '';

  /** 錯誤 tooltip 顯示方向 */
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';

  /** 禁用狀態 */
  @Input() disabled = false;

  /** 唯讀狀態：不可編輯，但文字維持正常色、可聚焦選取（展示型欄位用，如分享連結）。 */
  @Input() readonly = false;

  /** 預填值；外部可透過此 Input 設定初始值或同步更新 */
  @Input() initialValue = '';

  /** input type（text / date / email / number / password 等） */
  @Input() type = 'text';

  /** 行動裝置鍵盤型態（透傳至原生 inputmode） */
  @Input() inputMode: InputMode = 'text';

  /** 輸入時自動過濾；'digits' = 只保留數字，自動 strip 非數字字元（含 paste） */
  @Input() sanitize: InputSanitize = 'none';

  @Output() valueChange = new EventEmitter<string>();
  @Output() blur = new EventEmitter<string>();

  protected value = '';
  protected showPassword = false;

  get effectiveType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.value = changes['initialValue'].currentValue ?? '';
    }
  }
  protected focused = false;

  get hasValue(): boolean {
    return this.value.length > 0;
  }

  get wrapClasses(): Record<string, boolean> {
    return {
      [`input-wrap--${this.size.toLowerCase()}`]: true,
      'input-wrap--disabled': this.disabled,
      'input-wrap--readonly': this.readonly && !this.disabled,
      'input-wrap--error':    !this.disabled && !!this.errorMessage,
      'input-wrap--focus':    !this.disabled && !this.errorMessage && this.focused,
      'input-wrap--actived':  !this.disabled && !this.errorMessage && !this.focused && this.hasValue,
    };
  }

  onInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    let raw = inputEl.value;

    if (this.sanitize === 'digits') {
      const cursorPos = inputEl.selectionStart ?? raw.length;
      const nonDigitsBefore = (raw.slice(0, cursorPos).match(/\D/g) ?? []).length;
      const cleaned = raw.replace(/\D/g, '');
      if (cleaned !== raw) {
        inputEl.value = cleaned;
        const newCursor = Math.max(0, cursorPos - nonDigitsBefore);
        inputEl.setSelectionRange(newCursor, newCursor);
      }
      raw = cleaned;
    }

    this.value = raw;
    this.valueChange.emit(raw);
  }

  onFocus(): void {
    this.focused = true;
  }

  onBlur(): void {
    this.focused = false;
    this.blur.emit(this.value);
  }

  clearValue(event: MouseEvent): void {
    event.preventDefault();
    this.value = '';
    this.valueChange.emit('');
  }
}
