import { Component, Input, Output, EventEmitter, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { IconComponent } from '../icon/icon.component';

/**
 * 可選擇的「插圖卡片」（radio 卡）。展示型元件——資料由外部傳入，自身不持有業務狀態。
 *
 * 四態（視覺 SSOT：Figma node 15881-1697526）：
 * - rest：無卡片底、插圖全彩
 * - hover：浮起白底＋陰影；有說明時插圖淡出、說明淡入（150ms crossfade，純 CSS）
 * - selected（activity）：填色＋角落 check
 * - disabled：插圖灰階＋不可互動
 *
 * 鍵盤導航（方向鍵 roving）由父層 app-option-card-group 負責；本卡只處理 click / Enter / Space 選取。
 */
@Component({
  selector: 'app-option-card',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './option-card.component.html',
  styleUrls: ['./option-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardComponent {
  /** 選項值（識別用，亦組成 data-testid） */
  @Input() value = '';
  /** 卡片標籤（常駐顯示） */
  @Input() label = '';
  /** 說明文字；有值才渲染對應節點，預設隱藏、hover 時揭露（見 scss） */
  @Input() description = '';
  /** 插圖 SVG 字串（inline 注入） */
  @Input() illustration = '';
  /** 選中（activity）狀態 */
  @Input() selected = false;
  /** 停用狀態 */
  @Input() disabled = false;

  /** 點選（click / Enter / Space）且非 disabled 時觸發 */
  @Output() cardSelect = new EventEmitter<void>();

  private readonly sanitizer = inject(DomSanitizer);

  private _illustrationRaw: string | null = null;
  private _safeIllustration: SafeHtml = '';
  /**
   * sanitize 結果以原字串為快取鍵 — 避免每次 CD 重建 SafeHtml（新 reference 會讓 [innerHTML]
   * 反覆重繪，對應 angular-freeze L2 反模式）。
   */
  get safeIllustration(): SafeHtml {
    if (this.illustration !== this._illustrationRaw) {
      this._illustrationRaw = this.illustration;
      this._safeIllustration = this.sanitizer.bypassSecurityTrustHtml(this.illustration ?? '');
    }
    return this._safeIllustration;
  }

  get hostClasses(): Record<string, boolean> {
    return {
      'option-card--selected': this.selected,
      'option-card--disabled': this.disabled,
      'option-card--has-desc': !!this.description,
    };
  }

  onSelect(event?: Event): void {
    if (this.disabled) return;
    event?.preventDefault();
    this.cardSelect.emit();
  }
}
