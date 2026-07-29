import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

export type TextareaSize = 'M' | 'L';

@Component({
  selector: 'app-textarea',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './textarea.component.html',
  styleUrls: ['./textarea.component.scss'],
})
export class TextareaComponent implements OnChanges, AfterViewInit {
  /** 輸入框尺寸 */
  @Input() size: TextareaSize = 'L';

  /** 初始值（外部設定，支援非同步綁定） */
  @Input() initialValue = '';

  /** placeholder 文字 */
  @Input() placeholder = 'Placeholder';

  /** 錯誤訊息；有值時切換 error 狀態並顯示在下方 */
  @Input() errorMessage = '';

  /** 錯誤 tooltip 顯示方向 */
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';

  /** 禁用狀態 */
  @Input() disabled = false;

  /** 高度隨內容自動撐開（適用於系統組合的長文字，禁用手動 resize） */
  @Input() autoResize = false;

  @Output() valueChange = new EventEmitter<string>();
  /** 失焦時發出當前值；用於「變更時即時持久化」要等使用者打完再存的情境（對齊 app-input）。 */
  @Output() blur = new EventEmitter<string>();

  @ViewChild('textareaEl') textareaRef!: ElementRef<HTMLTextAreaElement>;

  protected value = '';
  protected focused = false;

  get hasValue(): boolean {
    return this.value.length > 0;
  }

  get wrapClasses(): Record<string, boolean> {
    return {
      [`textarea-wrap--${this.size.toLowerCase()}`]: true,
      'textarea-wrap--disabled': this.disabled,
      'textarea-wrap--error':    !this.disabled && !!this.errorMessage,
      'textarea-wrap--focus':    !this.disabled && !this.errorMessage && this.focused,
      'textarea-wrap--actived':  !this.disabled && !this.errorMessage && !this.focused && this.hasValue,
    };
  }

  ngAfterViewInit(): void {
    if (this.autoResize) {
      setTimeout(() => this.adjustHeight());
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      this.value = changes['initialValue'].currentValue ?? '';
      if (this.autoResize) {
        setTimeout(() => this.adjustHeight());
      }
    }
  }

  onInput(event: Event): void {
    this.value = (event.target as HTMLTextAreaElement).value;
    this.valueChange.emit(this.value);
    if (this.autoResize) this.adjustHeight();
  }

  private adjustHeight(): void {
    const el = this.textareaRef?.nativeElement;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
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
