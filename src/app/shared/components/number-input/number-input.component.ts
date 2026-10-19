import { Component, Input, Output, EventEmitter, OnChanges, OnDestroy, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

export type NumberInputSize = 'S' | 'M' | 'L';

@Component({
  selector: 'app-number-input',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './number-input.component.html',
  styleUrls: ['./number-input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberInputComponent implements OnChanges, OnDestroy {
  @Input() size: NumberInputSize = 'M';
  @Input() placeholder = '0';
  /** 小數位數，0 = 整數；預留擴充性，目前預設為 0 */
  @Input() decimalPlaces = 0;
  @Input() min: number | null = null;
  @Input() max: number | null = null;
  /** 基本步距；鍵盤 ↑↓ 每次增減 step，Shift+↑↓ 增減 step×10 */
  @Input() step = 1;
  @Input() disabled = false;
  @Input() errorMessage = '';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';
  @Input() initialValue: number | null = null;
  @Input() suffix = '';
  /** false = 必填欄位不可被清空：隱藏清除鈕，且鍵盤刪空後 blur 時還原為上次值（baseline）。
   *  預設 true 維持既有行為。用於後端無法持久化「空值」的欄位（如必填的金額）。 */
  @Input() allowEmpty = true;

  @Output() valueChange = new EventEmitter<number | null>();
  @Output() valueCommit = new EventEmitter<number | null>();
  @Output() inputBlur = new EventEmitter<void>();

  displayValue = '';
  numericValue: number | null = null;
  focused = false;

  private readonly COMMIT_DEBOUNCE_MS = 600;
  private commitTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingValue: number | null = null;
  private isDirty = false;
  private baselineValue: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['initialValue']) {
      const val = changes['initialValue'].currentValue as number | null;
      if (val !== null && val !== undefined) {
        this.numericValue = val;
        this.displayValue = this.format(val);
      } else {
        this.numericValue = null;
        this.displayValue = '';
      }
      if (!this.focused) {
        this.isDirty = false;
        this.baselineValue = this.numericValue;
      }
    }
  }

  get hasValue(): boolean {
    return this.numericValue !== null;
  }

  get atMax(): boolean {
    return this.max !== null && this.numericValue !== null && this.numericValue >= this.max;
  }

  get atMin(): boolean {
    return this.min !== null && this.numericValue !== null && this.numericValue <= this.min;
  }

  get wrapClasses(): Record<string, boolean> {
    return {
      [`number-input-wrap--${this.size.toLowerCase()}`]: true,
      'number-input-wrap--disabled': this.disabled,
      'number-input-wrap--error':   !this.disabled && !!this.errorMessage,
      'number-input-wrap--focus':   !this.disabled && !this.errorMessage && this.focused,
      'number-input-wrap--actived': !this.disabled && !this.errorMessage && !this.focused && this.hasValue,
    };
  }

  ngOnDestroy(): void {
    if (this.flushCommit()) return;
    if (this.isDirty && this.numericValue !== this.baselineValue) {
      this.valueCommit.emit(this.numericValue);
    }
  }

  // ── Debounce commit ───────────────────────────────────

  private scheduleCommit(val: number | null): void {
    if (this.commitTimer !== null) {
      clearTimeout(this.commitTimer);
    }
    this.pendingValue = val;
    this.commitTimer = setTimeout(() => {
      const commitValue = this.pendingValue;
      this.commitTimer = null;
      this.pendingValue = null;
      this.isDirty = false;
      this.baselineValue = commitValue;
      this.valueCommit.emit(commitValue);
    }, this.COMMIT_DEBOUNCE_MS);
  }

  private flushCommit(overrideValue: number | null = this.pendingValue): boolean {
    if (this.commitTimer === null) {
      return false;
    }

    clearTimeout(this.commitTimer);
    this.commitTimer = null;
    this.pendingValue = null;
    this.isDirty = false;
    this.baselineValue = overrideValue;
    this.valueCommit.emit(overrideValue);
    return true;
  }

  // ── 格式化 ──────────────────────────────────────────

  private format(n: number): string {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: this.decimalPlaces,
    }).format(n);
  }

  private clamp(n: number): number {
    let result = n;
    if (this.max !== null) result = Math.min(result, this.max);
    if (this.min !== null) result = Math.max(result, this.min);
    return result;
  }

  // ── 游標還原工具 ─────────────────────────────────────

  /** 計算字串 [0, pos) 之間有幾個數字字元 */
  private digitsBeforePos(str: string, pos: number): number {
    return str.slice(0, pos).replace(/\D/g, '').length;
  }

  /** 找到格式化字串中第 n 個數字字元之後的索引 */
  private posAfterNthDigit(str: string, n: number): number {
    if (n <= 0) return 0;
    let count = 0;
    for (let i = 0; i < str.length; i++) {
      if (/\d/.test(str[i])) count++;
      if (count === n) return i + 1;
    }
    return str.length;
  }

  // ── 事件處理 ─────────────────────────────────────────

  onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    const cursor = el.selectionStart ?? el.value.length;

    // 濾掉所有非數字字元（日後支援小數時在此擴充）
    const raw = el.value.replace(/\D/g, '');

    if (!raw) {
      this.displayValue = '';
      this.numericValue = null;
      this.valueChange.emit(null);
      this.isDirty = true;
      setTimeout(() => { el.value = ''; el.setSelectionRange(0, 0); });
      return;
    }

    const num = parseInt(raw, 10);
    const formatted = this.format(num);

    // 游標左側的「數字個數」在加/減千分位逗號前後是不變量，
    // 以它為錨點把游標映射回格式化後字串 → 逗號插入時不再漂移。
    // 注意：須用「瀏覽器插入字元後的新值 el.value + 新游標 cursor」計算，
    // 不可用舊的 displayValue，否則座標系不一致且會重複計數剛輸入的字元。
    const digitsLeft = this.digitsBeforePos(el.value, cursor);
    const newCursor = this.posAfterNthDigit(formatted, digitsLeft);

    this.displayValue = formatted;
    this.numericValue = num;
    this.isDirty = true;
    this.valueChange.emit(num);

    // 等 Angular change detection 更新 DOM 後再還原游標
    setTimeout(() => {
      el.value = formatted;
      el.setSelectionRange(newCursor, newCursor);
    });
  }

  onFocus(): void {
    this.focused = true;
    this.baselineValue = this.numericValue;
  }

  onBlur(): void {
    this.focused = false;
    // allowEmpty=false：必填欄位不可被清空。離開時若被清成 null 但 focus 前有值，
    // 還原為 baselineValue（=上次 commit/後端值），確保畫面永遠等於後端、不 emit null。
    // 還原後 numericValue === baselineValue，會走下方既有 early-return 分支收尾。
    if (!this.allowEmpty && this.numericValue === null && this.baselineValue !== null) {
      this.numericValue = this.baselineValue;
      this.displayValue = this.format(this.baselineValue);
      this.valueChange.emit(this.baselineValue);
    }
    if (this.numericValue !== null) {
      const clamped = this.clamp(this.numericValue);
      if (clamped !== this.numericValue) {
        this.numericValue = clamped;
        this.displayValue = this.format(clamped);
        this.valueChange.emit(clamped);
      }
    }
    // 值回到 focus 快照（未實質改變）→ 取消 pending，不 emit valueCommit
    if (this.numericValue === this.baselineValue) {
      if (this.commitTimer !== null) {
        clearTimeout(this.commitTimer);
        this.commitTimer = null;
        this.pendingValue = null;
      }
      this.isDirty = false;
      this.inputBlur.emit();
      return;
    }
    if (this.flushCommit(this.numericValue)) {
      // flushCommit 已 emit + 重置
    } else if (this.isDirty) {
      this.isDirty = false;
      this.baselineValue = this.numericValue;
      this.valueCommit.emit(this.numericValue);
    }
    this.inputBlur.emit();
  }

  stepUp(): void {
    if (!this.disabled && !this.atMax) {
      this.adjust(this.step, true);
    }
  }

  stepDown(): void {
    if (!this.disabled && !this.atMin) {
      this.adjust(-this.step, true);
    }
  }

  clearValue(event: MouseEvent): void {
    event.preventDefault();
    if (this.commitTimer !== null) {
      clearTimeout(this.commitTimer);
      this.commitTimer = null;
    }
    this.pendingValue = null;
    this.numericValue = null;
    this.displayValue = '';
    this.valueChange.emit(null);
    this.valueCommit.emit(null);
    this.baselineValue = null;
    this.isDirty = false;
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === '-' && this.min !== null && this.min >= 0) {
      event.preventDefault();
      return;
    }
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      const dir = event.key === 'ArrowUp' ? 1 : -1;
      const mult = event.shiftKey ? 10 : 1;
      this.adjust(dir * this.step * mult, false);
    }
  }

  private adjust(delta: number, schedule: boolean): void {
    const current = this.numericValue ?? 0;
    const newVal = this.clamp(current + delta);
    this.numericValue = newVal;
    this.displayValue = this.format(newVal);
    this.isDirty = true;
    this.valueChange.emit(newVal);
    if (schedule) {
      this.scheduleCommit(newVal);
    }
  }
}
