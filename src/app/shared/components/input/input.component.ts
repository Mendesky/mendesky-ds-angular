import { Component, Input, OnChanges, Output, EventEmitter, SimpleChanges, ChangeDetectionStrategy, AfterViewInit, inject, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { FieldComponent } from '../field/field.component';

export type InputSize = 'S' | 'M' | 'L';
export type InputMode = 'text' | 'numeric' | 'tel' | 'email' | 'decimal' | 'none';
export type InputSanitize = 'none' | 'digits';

/** placeholder 的預設值；沒改過時不算有意義的提示文字 */
const DEFAULT_PLACEHOLDER = 'Placeholder';

/** 瀏覽器會拿提示文字當名稱的 type；日期、時間類不會 */
const HINT_NAMED_TYPES = new Set(['text', 'search', 'url', 'tel', 'email', 'password', 'number']);

@Component({
  selector: 'app-input',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './input.component.html',
  styleUrls: ['./input.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InputComponent implements OnChanges, AfterViewInit {
  /**
   * 外層的 app-field；它的標題自動成為這個輸入框的報讀名稱。
   * host：只找同一個模板裡直接包住它的 app-field。包在別的元件裡（例如 app-inline-add）不連，
   * 不然那個元件裡的輸入框會念外層標題、被標成必填。
   */
  private readonly field = inject(FieldComponent, { optional: true, host: true });

  /** 輸入框尺寸 */
  @Input() size: InputSize = 'M';

  /** placeholder 文字 */
  @Input() placeholder = DEFAULT_PLACEHOLDER;

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

  /**
   * 報讀軟體念的名稱，落在內層 input 的 aria-label。
   * 放在有標題的 app-field 裡不用設（會念欄位標題）；沒有欄位標題時才設。設了就只念它，不念欄位標題。
   */
  @Input() ariaLabel = '';

  /** 透傳到內層 input 的 autocomplete（如 username、current-password、new-password、off）；空字串不輸出 */
  @Input() autocomplete = '';

  /** 透傳到內層 input 的 name；空字串不輸出 */
  @Input() name = '';

  /**
   * 內層 input 的 id，給外面自己寫的 label for 指向。
   * 不叫 id：寫在 app-input 上的 id 會同時留在外框上，畫面就有兩個相同的 id。
   */
  @Input() inputId = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() blur = new EventEmitter<string>();
  /** 按眼睛按鈕切換密碼顯示時發出；true＝切成明文 */
  @Output() passwordVisibilityChange = new EventEmitter<boolean>();

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
    this.passwordVisibilityChange.emit(this.showPassword);
  }

  /** ariaLabel 去掉前後空白；只有空白、或沒開嚴格檢查的 template 傳進 undefined，都當成沒設 */
  protected get labelText(): string {
    return (this.ariaLabel ?? '').trim();
  }

  /** 指向欄位標題的 id；有 ariaLabel 或欄位沒有標題時是 null（同一時間只輸出一種名稱屬性） */
  protected get labelledBy(): string | null {
    if (this.labelText || !this.field?.labelText()) return null;
    return this.field.labelId;
  }

  /** inputId 去掉前後空白；只有空白當成沒設 */
  protected get idText(): string {
    return (this.inputId ?? '').trim();
  }

  protected get ariaRequired(): 'true' | null {
    return this.field?.isRequired() ? 'true' : null;
  }

  ngAfterViewInit(): void {
    // 只看第一次渲染：完全沒有名稱時，報讀軟體只會念「編輯文字」
    if (!isDevMode() || this.hasAccessibleName()) return;
    console.warn('[app-input] 輸入框沒有報讀名稱。請放進有 label 的 app-field，或設定 ariaLabel；外面有自己的 label 時設定 inputId。');
  }

  /** inputId 有值時當作外面有自己的 label 指向它 */
  private hasAccessibleName(): boolean {
    if (this.labelText || this.field?.labelText() || this.idText) return true;
    if (!HINT_NAMED_TYPES.has(this.type)) return false;
    const hint = (this.placeholder ?? '').trim();
    return hint !== '' && hint !== DEFAULT_PLACEHOLDER;
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
