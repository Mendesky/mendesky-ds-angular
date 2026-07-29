import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export type RadioChipSize = 'm' | 's' | 'xs';

@Component({
  selector: 'app-radio-chip',
  standalone: true,
  imports: [CommonModule, IconComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => RadioChipComponent),
    multi: true,
  }],
  templateUrl: './radio-chip.component.html',
  styleUrls: ['./radio-chip.component.scss'],
})
export class RadioChipComponent implements ControlValueAccessor {
  /** 顯示文字 */
  @Input() text = '';
  /** 尺寸：m / s（預設）/ xs */
  @Input() size: RadioChipSize = 's';
  /** 是否顯示左側 Radio 圓圈圖示 */
  @Input() showRadio = true;
  /** 選中後是否顯示右側取消（×）按鈕 */
  @Input() showCancel = false;

  /** 點擊取消按鈕時觸發（父層可清空整個篩選群組） */
  @Output() cancelClick = new EventEmitter<void>();

  /* ── CVA 狀態 ── */
  selected   = false;
  isDisabled = false;

  private onChange  = (_: boolean) => {};
  private onTouched = () => {};

  writeValue(val: boolean): void       { this.selected   = !!val; }
  registerOnChange(fn: any): void      { this.onChange   = fn; }
  registerOnTouched(fn: any): void     { this.onTouched  = fn; }
  setDisabledState(d: boolean): void   { this.isDisabled = d; }

  select(): void {
    if (this.isDisabled || this.selected) return;
    this.selected = true;
    this.onChange(true);
    this.onTouched();
  }

  onCancel(e: MouseEvent): void {
    e.stopPropagation();
    if (this.isDisabled) return;
    this.selected = false;
    this.onChange(false);
    this.onTouched();
    this.cancelClick.emit();
  }

  get radioIcon(): string {
    return this.selected ? 'Round-Circle-Selected' : 'Round-Circle';
  }

  get hostClasses(): Record<string, boolean> {
    return {
      [`chip--${this.size}`]:  true,
      'chip--selected':        this.selected,
      'chip--disabled':        this.isDisabled,
    };
  }
}
