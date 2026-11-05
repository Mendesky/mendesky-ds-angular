import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/** 粗細：M＝8px（預設）；S＝6px，給空間比較擠的地方（例：表單裡的上傳進度） */
export type ProgressBarSize = 'S' | 'M';

/**
 * ProgressBarComponent — 進度條
 *
 * 顯示一件分批進行的工作做到哪裡（例：批次授權「處理中 12 / 40」）。
 *
 * 用法：
 *   <app-progress-bar [value]="done" [max]="total" ariaLabel="批次授權進度" />
 *   <span>處理中 {{ done }} / {{ total }}</span>
 *
 * 只負責畫出比例，不內建文字：「處理中 12 / 40」「已完成」這類說明由呼叫端排在旁邊，
 * 因為每個情境的措辭與單位（項、人、檔案）都不同。
 *
 * value 會被夾在 0～max 之間；max ≤ 0 或 value 不是有限數字時一律視為 0%，
 * 不會因為呼叫端還沒算出總數（total = 0）而除以零變成 NaN 寬度。
 *
 * value 是 null ＝ 不定狀態：還不知道總量、或對方不回報進度。一段 40% 長的色段由左往右滑，
 * 不輸出 aria-valuenow。跟原生 <progress> 不給 value 就是不定狀態的規則一致。
 *   <app-progress-bar [value]="percent" size="S" ariaLabel="上傳進度" />   ← percent 為 null 時跑不定狀態
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  /** 目前完成量，與 max 同單位；null ＝ 不定狀態 */
  @Input() value: number | null = 0;

  /** 總量。預設 100，直接傳百分比時不用另外設 */
  @Input() max = 100;

  /** 讀屏文字，例：「批次授權進度」。進度條本身沒有可見文字，建議一定要給 */
  @Input() ariaLabel = '';

  /** 粗細：M＝8px（預設）；S＝6px */
  @Input() size: ProgressBarSize = 'M';

  /** 不定狀態：value 是 null */
  get indeterminate(): boolean {
    return this.value === null;
  }

  /** 有效的總量；非正數時為 0 */
  get safeMax(): number {
    return Number.isFinite(this.max) && this.max > 0 ? this.max : 0;
  }

  /** 夾在 0～safeMax 之間的完成量 */
  get clampedValue(): number {
    const value = this.value;
    if (value === null || !Number.isFinite(value) || this.safeMax === 0) return 0;
    return Math.min(Math.max(value, 0), this.safeMax);
  }

  /** 填色寬度（0～100） */
  get percent(): number {
    return this.safeMax === 0 ? 0 : (this.clampedValue / this.safeMax) * 100;
  }
}
