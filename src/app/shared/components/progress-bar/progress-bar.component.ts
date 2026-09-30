import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

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
 */
@Component({
  selector: 'app-progress-bar',
  standalone: true,
  templateUrl: './progress-bar.component.html',
  styleUrls: ['./progress-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressBarComponent {
  /** 目前完成量，與 max 同單位 */
  @Input() value = 0;

  /** 總量。預設 100，直接傳百分比時不用另外設 */
  @Input() max = 100;

  /** 讀屏文字，例：「批次授權進度」。進度條本身沒有可見文字，建議一定要給 */
  @Input() ariaLabel = '';

  /** 有效的總量；非正數時為 0 */
  get safeMax(): number {
    return Number.isFinite(this.max) && this.max > 0 ? this.max : 0;
  }

  /** 夾在 0～safeMax 之間的完成量 */
  get clampedValue(): number {
    if (!Number.isFinite(this.value) || this.safeMax === 0) return 0;
    return Math.min(Math.max(this.value, 0), this.safeMax);
  }

  /** 填色寬度（0～100） */
  get percent(): number {
    return this.safeMax === 0 ? 0 : (this.clampedValue / this.safeMax) * 100;
  }
}
