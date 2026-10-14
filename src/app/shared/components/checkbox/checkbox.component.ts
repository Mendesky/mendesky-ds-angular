import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, Output, forwardRef,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';

export type CheckboxSize = 's' | 'm' | 'l';
export type CheckboxState = 'off' | 'on' | 'mixed';

/**
 * 框的大小跟著圖示尺寸走：CheckBox 系列的框佔 viewBox 中間 20/24，
 * 所以 s＝20 號圖示（框約 16.7px）、m＝24 號（框 20px）、l＝28 號（框約 23.3px）。
 */
const ICON_SIZE: Record<CheckboxSize, '20' | '24' | '28'> = { s: '20', m: '24', l: '28' };
const ICON_NAME: Record<CheckboxState, string> = { off: 'CheckBox', on: 'CheckBoxOn', mixed: 'CheckBoxMixed' };

/**
 * app-checkbox — 三態勾選框：沒有 / 全有 / 部分（2026-10-14 定案）。
 *
 * 跟 app-check-chip 的分工：check-chip 是「勾選框＋文字」的按鈕，只有兩態；
 * 這裡是單純的勾選框，文字可有可無，多了「部分」，給「一組裡選了一些」的地方用
 * （例如權限清單的分類列）。兩者的圖示來自同一組 registry（CheckBox / CheckBoxOn / CheckBoxMixed）。
 *
 * 「部分」只由呼叫端算出來（indeterminate），使用者點不出來：
 * 沒有 → 全有、全有 → 沒有、部分 → 全有。點擊後元件先自己清掉 indeterminate，
 * 之後以呼叫端傳入的值為準。
 *
 * 顏色：沒有＝text/body；全有、部分＝Color/Green/80。
 * 不用 button/success（#74ae3e）：白色放在上面只有 2.67:1，達不到 WCAG 1.4.11 的 3:1。
 */
@Component({
  selector: 'app-checkbox',
  standalone: true,
  imports: [IconComponent],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => CheckboxComponent),
    multi: true,
  }],
  templateUrl: './checkbox.component.html',
  styleUrls: ['./checkbox.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckboxComponent implements ControlValueAccessor {
  /** 全有 */
  @Input() set checked(v: boolean) { this.isChecked = !!v; }
  get checked(): boolean { return this.isChecked; }
  /** 部分；為 true 時優先顯示「部分」，不管 checked 是什麼 */
  @Input() set indeterminate(v: boolean) { this.isIndeterminate = !!v; }
  get indeterminate(): boolean { return this.isIndeterminate; }
  /** s（框約 16.7px）/ m（框 20px，預設）/ l（框約 23.3px） */
  @Input() size: CheckboxSize = 'm';
  /** 框右邊的文字；點文字也算點勾選框。可省略 */
  @Input() label = '';
  /** 沒有 label 時一定要給，讀螢幕軟體才唸得出這是什麼（例：「報價案件管理 整組檢視」） */
  @Input() ariaLabel = '';
  /** Template 直接 disable；與 ngModel 一起用時 setDisabledState 不會觸發，比照 check-chip 補這個入口 */
  @Input() set disabled(d: boolean) { this.isDisabled = !!d; }
  get disabled(): boolean { return this.isDisabled; }

  /** 使用者點擊後的新值（部分被點一律是 true） */
  @Output() checkedChange = new EventEmitter<boolean>();

  isChecked = false;
  isIndeterminate = false;
  isDisabled = false;

  private onChange = (_: boolean) => {};
  private onTouched = () => {};

  constructor(private readonly cdr: ChangeDetectorRef) {}

  writeValue(v: boolean): void { this.isChecked = !!v; this.cdr.markForCheck(); }
  registerOnChange(fn: (v: boolean) => void): void { this.onChange = fn; }
  registerOnTouched(fn: () => void): void { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled = d; this.cdr.markForCheck(); }

  get state(): CheckboxState {
    if (this.isIndeterminate) return 'mixed';
    return this.isChecked ? 'on' : 'off';
  }

  get ariaChecked(): 'true' | 'false' | 'mixed' {
    const st = this.state;
    return st === 'mixed' ? 'mixed' : st === 'on' ? 'true' : 'false';
  }

  get iconName(): string { return ICON_NAME[this.state]; }
  get iconSize(): '20' | '24' | '28' { return ICON_SIZE[this.size] ?? ICON_SIZE.m; }

  toggle(): void {
    if (this.isDisabled) return;
    const next = this.isIndeterminate || !this.isChecked;
    this.isIndeterminate = false;
    this.isChecked = next;
    this.onChange(next);
    this.onTouched();
    this.checkedChange.emit(next);
  }
}
