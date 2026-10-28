import { Component, Input, forwardRef, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export type CheckChipSize  = 'm' | 's' | 'xs';
export type CheckChipTheme = 'default' | 'transparent' | 'transparent-grey';

@Component({
  selector: 'app-check-chip',
  standalone: true,
  imports: [CommonModule, IconComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CheckChipComponent),
    multi: true,
  }],
  templateUrl: './check-chip.component.html',
  styleUrls: ['./check-chip.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckChipComponent implements ControlValueAccessor {
  /** 顯示文字 */
  @Input() text = '';
  /** 尺寸：m（表單大）/ s（表單小，預設）/ xs（緊湊場景） */
  @Input() size: CheckChipSize = 's';
  /**
   * 選中後的色彩主題：
   *  - green        → 綠底白字（表單多選主要用途）
   *  - grey         → 深灰底白字（較低調的多選）
   *  - ghost-green  → 透明底綠字（輕量標籤場景）
   *  - ghost-grey   → 透明底→深灰底白字（次要篩選）
   */
  @Input() theme: CheckChipTheme = 'default';
  /**
   * Template 直接 disable（權限 gating 用；CVA setDisabledState 之外的 additive 入口）。
   * 與 ngModel 一起用時 setDisabledState 不會觸發，故補此 input；預設 false、向後相容。
   */
  @Input() set disabled(d: boolean) { this.isDisabled = d; }
  get disabled(): boolean { return this.isDisabled; }
  /** 報讀軟體念的名稱，落在內層 button 的 aria-label；沒設時念 text */
  @Input() ariaLabel = '';

  /* ── CVA 狀態 ── */
  selected   = false;
  isDisabled = false;

  private onChange  = (_: boolean) => {};
  private onTouched = () => {};

  writeValue(val: boolean): void        { this.selected   = !!val; }
  registerOnChange(fn: any): void       { this.onChange   = fn; }
  registerOnTouched(fn: any): void      { this.onTouched  = fn; }
  setDisabledState(d: boolean): void    { this.isDisabled = d; }

  toggle(): void {
    if (this.isDisabled) return;
    this.selected = !this.selected;
    this.onChange(this.selected);
    this.onTouched();
  }

  get hostClasses(): Record<string, boolean> {
    return {
      [`chip--${this.size}`]:       true,
      [`chip--${this.theme}`]:      true,
      'chip--selected':             this.selected,
      'chip--disabled':             this.isDisabled,
    };
  }

  get iconName(): string {
    return this.selected ? 'CheckedBox' : 'CheckBox';
  }
}
