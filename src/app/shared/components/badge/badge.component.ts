import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

/** `auto` 依 count 決定圓點或數字；`dot` 強制只顯示圓點（不講數量） */
export type BadgeVariant = 'auto' | 'dot';

/** 超過 max 時的退化方式：顯示 `${max}+`，或退回不講數量的圓點 */
export type BadgeOverflow = 'plus' | 'dot';

/**
 * AppBadgeComponent — 未讀徽章
 *
 * 疊在宿主元素右上角，表示「有未讀」或「未讀幾則」。
 *
 * 用法：
 *   <button class="host">          <!-- 宿主需 position: relative -->
 *     <app-icon name="Alerts" />
 *     <app-badge [count]="unread" overflow="dot" ariaLabel="未讀通知" />
 *   </button>
 *
 * 語意：未讀**不是**錯誤也不是警告，所以底色用 `--badge/unread`，
 * 不借用 `--button/error`（兩者目前同值，但日後可分開調）。
 *
 * ⚠️ 徽章以 `position: absolute` 凸出宿主邊界。若宿主位於 `overflow` 非 `visible`
 * 的容器（例如可捲動清單），**容器上緣需留白 ≥ 6px**，否則第一列的徽章會被裁掉。
 */
@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './badge.component.html',
  styleUrls: ['./badge.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BadgeComponent {
  /** 未讀數量。null 或 <= 0 時不渲染（variant='dot' 除外） */
  @Input() count: number | null = null;

  /** 數字上限，超過依 overflow 退化。呼叫端可調高（例：站內通知用 999） */
  @Input() max = 99;

  /** 'dot' 時不論 count 一律只顯示圓點 */
  @Input() variant: BadgeVariant = 'auto';

  /** count 超過 max 時的退化方式 */
  @Input() overflow: BadgeOverflow = 'plus';

  /** 讀屏文字。未給時數字模式以數量代替；圓點模式沒有文字，建議一定要給 */
  @Input() ariaLabel = '';

  /** 是否渲染。沒有未讀就不該佔位。 */
  get visible(): boolean {
    return this.variant === 'dot' || (this.count !== null && this.count > 0);
  }

  /** 是否以圓點呈現（無文字） */
  get isDot(): boolean {
    if (this.variant === 'dot') return true;
    return this.count !== null && this.count > this.max && this.overflow === 'dot';
  }

  /** 徽章上的文字。圓點模式為空字串。 */
  get label(): string {
    if (this.isDot || this.count === null) return '';
    return this.count > this.max ? `${this.max}+` : String(this.count);
  }

  /** aria-label 未給時退回數量；兩者皆空則不輸出屬性 */
  get computedAriaLabel(): string {
    return this.ariaLabel || this.label;
  }
}
