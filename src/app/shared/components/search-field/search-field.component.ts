import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, SimpleChanges, ViewChild,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';

export type SearchFieldSize = 'S' | 'M' | 'L';

/** 同 @angular/forms 的 _isAndroid：Android 上組字事件跟 iOS、桌機不同，不能等選字結束才送值 */
function isAndroid(): boolean {
  return typeof navigator !== 'undefined' && /android (\d+)/.test(navigator.userAgent.toLowerCase());
}
export type SearchFieldAppearance = 'outline' | 'embedded';

/**
 * 搜尋框：左邊放大鏡、有字就有清除鈕，處理好 Esc、Enter 與輸入法。
 *
 * 按鍵處理掛在內層 input 與清除鈕的 keydown／keyup（不掛在外框，免得攔到右側位置投影進來的按鈕）：
 * - Esc 選字中：只 stopPropagation，讓輸入法自己取消選字，也不讓外層對話框關掉。
 * - Esc 有字：清空、preventDefault＋stopPropagation，並記下「吞連發」，放開（keyup）前的連發一律攔下。
 * - Esc 空的：不處理，事件照常冒泡給外層（例如 app-modal-shell 關閉）。
 * - Enter：送 searchSubmit，不攔；選字中、連發不送。
 * - 右側位置投影進來的按鈕上按 Esc：不處理，照常交給外層。
 *
 * valueChange 選字中不送，選好字送一次；Android 例外，每次 input 都送。
 * Android 的鍵盤（例如 Gboard）打英文也走組字，等選字結束才送的話，要打完整個字列表才會篩選。
 * 做法同 Angular 表單的 DefaultValueAccessor（Android 上不緩衝組字）。
 *
 * 輸出叫 searchSubmit 不叫 search：type="search" 的原生 search 事件會冒泡到 host，
 * 若輸出也叫 search，Angular 會同時收到原生事件與輸出，觸發兩次。
 */
@Component({
  selector: 'app-search-field',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './search-field.component.html',
  styleUrls: ['./search-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchFieldComponent implements OnChanges {
  @ViewChild('input', { static: true }) private inputRef!: ElementRef<HTMLInputElement>;

  /** 報讀名稱，落在內層 input 的 aria-label。寫這個框在搜什麼，例如「搜尋人員」 */
  @Input({ required: true }) ariaLabel = '';

  /** outline：有外框，放工具列、表單；embedded：搜尋對話框最上面那一列，沒有外框，元件自己畫留白與底線 */
  @Input() appearance: SearchFieldAppearance = 'outline';

  /** 高度 S 32／M 36／L 40 px，跟 app-input 一樣；只對 outline 有效 */
  @Input() size: SearchFieldSize = 'M';

  /** 提示文字 */
  @Input() placeholder = '搜尋';

  /** 停用：不能打字、沒有清除鈕 */
  @Input() disabled = false;

  /** 框裡的字；跟 valueChange 一起可以寫成 [(value)] */
  @Input() value = '';

  /** 每次輸入、清除都送；選字中不送，選好字送一次（Android 例外：每次輸入都送） */
  @Output() valueChange = new EventEmitter<string>();

  /** 按 Enter 時送出目前的字；選字中、按住連發不送 */
  @Output() searchSubmit = new EventEmitter<string>();

  protected current = '';
  protected focused = false;
  private composing = false;
  private swallowEsc = false;
  /** 最後一次送出（或從外面收到）的值；選字結束時 compositionend 與 input 可能各來一次，同值不重送 */
  private lastEmitted = '';

  protected get embedded(): boolean {
    return this.appearance === 'embedded';
  }

  protected get boxClasses(): Record<string, boolean> {
    return {
      [`search-field--${this.size.toLowerCase()}`]: !this.embedded,
      'search-field--embedded': this.embedded,
      'search-field--disabled': this.disabled,
      'search-field--focus': this.focused && !this.disabled,
      'search-field--filled': !!this.current && !this.focused && !this.disabled,
    };
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['value']) {
      this.current = this.value ?? '';
      this.lastEmitted = this.current;
    }
  }

  /** 把焦點移進輸入框。放在 app-modal-shell 裡不用呼叫：對話框打開約 0.45 秒後會自己把焦點放進第一個可 Tab 的元素 */
  focus(): void {
    this.inputRef.nativeElement.focus();
  }

  /** 點外框、放大鏡、留白都等於點輸入框；點按鈕與右側位置不搶焦點 */
  protected onBoxClick(event: MouseEvent): void {
    if (this.disabled) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a, input, .search-field__end')) return;
    this.focus();
  }

  protected onInput(event: Event): void {
    this.current = (event.target as HTMLInputElement).value;
    if (((event as InputEvent).isComposing || this.composing) && !isAndroid()) return;
    this.emit(this.current);
  }

  protected onCompositionStart(): void {
    this.composing = true;
  }

  protected onCompositionEnd(): void {
    this.composing = false;
    this.current = this.inputRef.nativeElement.value;
    this.emit(this.current);
  }

  protected onKeydown(event: KeyboardEvent): void {
    const ime = event.isComposing || event.keyCode === 229;
    if (event.key === 'Escape') {
      if (ime) {
        event.stopPropagation();
        return;
      }
      if (event.repeat && this.swallowEsc) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      if (this.current && !this.disabled) {
        event.preventDefault();
        event.stopPropagation();
        this.swallowEsc = true;
        const fromButton = event.target !== this.inputRef.nativeElement;
        this.clear();
        // 焦點在清除鈕上時，清除鈕會消失；把焦點放回輸入框，不讓它掉到 body
        if (fromButton) this.focus();
      }
      return;
    }
    if (event.key === 'Enter' && event.target === this.inputRef.nativeElement) {
      if (ime || event.repeat) return;
      this.searchSubmit.emit(this.current);
    }
  }

  protected onKeyup(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.swallowEsc = false;
  }

  protected onClearClick(): void {
    this.clear();
    this.focus();
  }

  private clear(): void {
    this.current = '';
    this.inputRef.nativeElement.value = '';
    this.emit('');
  }

  private emit(value: string): void {
    if (value === this.lastEmitted) return;
    this.lastEmitted = value;
    this.valueChange.emit(value);
  }
}
