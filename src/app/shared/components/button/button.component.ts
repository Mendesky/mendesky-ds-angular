import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, signal, ChangeDetectionStrategy, AfterViewInit, ElementRef, ViewChild, isDevMode } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { LabelComponent, LabelColor, LabelSize } from '../label/label.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

export type ButtonVariant = 'filled' | 'tonal' | 'outlined' | 'ghost' | 'elevated';
export type ButtonColor = 'primary' | 'success' | 'danger' | 'neutral';
export type ButtonSize = 'XXS' | 'XS' | 'S' | 'M' | 'L';
/** aria-current 的值：'true' 用在清單裡的目前項目，其餘依 WAI-ARIA 定義 */
export type ButtonAriaCurrent = 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false';
/** aria-haspopup 的值：這顆按鈕會打開哪一種浮層。目前只開放 'menu'（打開放了 app-menu-item 的 app-action-menu） */
export type ButtonAriaHaspopup = 'menu';

/** Button 內嵌 label 的設定 */
export interface BtnLabelConfig {
  text: string;
  color: LabelColor;
  size?: LabelSize;
}

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule, IconComponent, LabelComponent, ErrorTooltipDirective],
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonComponent implements OnChanges, AfterViewInit {
  @Input() variant: ButtonVariant = 'filled';
  @Input() color: ButtonColor = 'primary';
  @Input() size: ButtonSize = 'M';
  @Input() text = '';
  @Input() leftIcon = '';
  @Input() rightIcon = '';
  /** leftIcon 之後、文字之前的 app-label（null = 隱藏） */
  @Input() leftLabel: BtnLabelConfig | null = null;
  /** leftLabel 之後、文字之前的第二個 app-label */
  @Input() centerLabel: BtnLabelConfig | null = null;
  /** 文字之後、rightIcon 之前的 app-label */
  @Input() rightLabel: BtnLabelConfig | null = null;
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() loading = false;
  @Input() loadingText = '';
  /** 雙行模式：名稱下方的說明文字（選填）。有值時按鈕變 auto height、文字靠左 */
  @Input() description = '';

  /**
   * 鍵盤快速鍵提示文字（e.g. "⌘N"），顯示在按鈕右側。
   * 主要用於 app-action-menu 內的選項，對應業界 Fluent UI secondaryContent 模式。
   * 只顯示提示，不負責綁定快速鍵行為。
   */
  @Input() shortcut = '';

  /** true 時用 aria-disabled 取代原生 disabled，讓 click 事件仍可穿透。*/
  @Input() clickableWhenDisabled = false;
  /** disabled 狀態點擊時顯示在按鈕正上方的 tooltip。單條傳 string，多條傳 string[]。*/
  @Input() disabledMessage: string | string[] = [];

  /** 報讀軟體念的名稱，落在內層 button 的 aria-label。只有圖示、沒有文字時必填 */
  @Input() ariaLabel = '';
  /** 按下／未按下狀態（aria-pressed）；null＝不是切換鈕，不輸出 */
  @Input() ariaPressed: boolean | null = null;
  /** 清單或導覽中的「目前這一項」（aria-current）；null＝不輸出 */
  @Input() ariaCurrent: ButtonAriaCurrent | null = null;
  /** 這顆按鈕會打開選單（aria-haspopup）；null＝不輸出。Safari 關閉選單後也靠它找回觸發鈕 */
  @Input() ariaHaspopup: ButtonAriaHaspopup | null = null;
  /** 選單現在開著沒（aria-expanded）；null＝不輸出，true／false 照實輸出 */
  @Input() ariaExpanded: boolean | null = null;

  @Output() btnClick = new EventEmitter<void>();
  /** clickableWhenDisabled=true 且 disabled=true 時，點擊觸發。*/
  @Output() disabledClick = new EventEmitter<void>();

  @ViewChild('btn', { static: true }) private btnRef!: ElementRef<HTMLButtonElement>;

  private _disabledClickedOnce = signal(false);

  get iconSize(): number {
    const map: Record<ButtonSize, number> = {
      XXS: 12, XS: 12, S: 14, M: 16, L: 24,
    };
    return map[this.size];
  }

  get iconSizeStr(): '12' | '16' | '24' | '32' | '36' | '48' {
    const px = this.iconSize;
    if (px <= 14) return '12';
    if (px <= 20) return '16';
    if (px <= 28) return '24';
    if (px <= 34) return '32';
    if (px <= 42) return '36';
    return '48';
  }

  get labelSize(): LabelSize {
    const map: Record<ButtonSize, LabelSize> = {
      XXS: 'S', XS: 'S', S: 'S', M: 'M', L: 'M',
    };
    return map[this.size];
  }

  get sizeClass(): string {
    const map: Record<ButtonSize, string> = {
      XXS: 'btn--xxs', XS: 'btn--xs', S: 'btn--s', M: 'btn--m', L: 'btn--l',
    };
    return map[this.size];
  }

  get variantClass(): string {
    if (this.variant === 'elevated') return 'btn--elevated';
    return `btn--${this.variant}-${this.color}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const d = changes['disabled'];
    if (d && d.previousValue === true && d.currentValue === false) {
      this._disabledClickedOnce.set(false);
    }
  }

  ngAfterViewInit(): void {
    // 只看第一次渲染：內層 button 沒有任何文字（只有圖示）又沒給 ariaLabel，報讀軟體念不出名稱
    if (!isDevMode() || this.ariaLabel || this.loading) return;
    if (this.btnRef.nativeElement.textContent?.trim()) return;
    console.warn('[app-button] 按鈕沒有文字也沒有 ariaLabel，報讀軟體念不出名稱。只有圖示時改用 app-icon-btn，或設定 ariaLabel。');
  }

  get disabledTooltipInput(): string | string[] {
    if (!this.clickableWhenDisabled || !this.disabled) return '';
    if (!this._disabledClickedOnce()) return '';
    return this.disabledMessage;
  }

  onClick(): void {
    if (this.loading) return;
    if (this.disabled) {
      if (this.clickableWhenDisabled) {
        this._disabledClickedOnce.set(true);
        this.disabledClick.emit();
      }
      return;
    }
    this.btnClick.emit();
  }
}
