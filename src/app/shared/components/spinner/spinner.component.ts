import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

/** 寬高（px），對齊 DS 圖示尺寸，轉圈取代圖示時位置不會跳 */
export type SpinnerSize = '12' | '16' | '24' | '36';

/** 各尺寸的線寬（px） */
const STROKE: Record<SpinnerSize, number> = { '12': 1.5, '16': 2, '24': 2.5, '36': 3 };

/**
 * SpinnerComponent — 載入轉圈
 *
 * 一個動作已經送出、正在等結果，又不知道要等多久時用。
 * 造型：一整圈淡軌道（文字色 20%）＋四分之一圈的弧（文字色、圓線頭），0.8 秒轉一圈；
 * 使用者開了「減少動態」時改成 2.4 秒一圈，不完全停下來。
 *
 * 用法：
 *   <app-spinner size="16"></app-spinner>                         ← 報讀軟體念「載入中」
 *   <app-spinner size="16" label="儲存中"></app-spinner>
 *   <app-spinner size="16" [decorative]="true"></app-spinner>     ← 旁邊已有文字時，報讀軟體跳過
 *
 * 顏色跟著外層文字色（currentColor）。按鈕在等結果時，打開 app-button／app-icon-btn 的 loading，
 * 不要自己把轉圈塞進按鈕。
 */
@Component({
  selector: 'app-spinner',
  standalone: true,
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ds-spinner',
    '[attr.role]': 'decorative ? null : "status"',
    '[attr.aria-hidden]': 'decorative ? "true" : null',
  },
})
export class SpinnerComponent {
  /** 寬高：12／16（預設）／24／36 */
  @Input() size: SpinnerSize = '16';

  /** 給報讀軟體念的文字，畫面上看不到 */
  @Input() label = '載入中';

  /** 旁邊已經有文字在講同一件事（按鈕的「儲存中…」、toast 的訊息）時設 true，報讀軟體跳過 */
  @Input() decorative = false;

  get px(): number { return Number(this.size) || 16; }
  get stroke(): number { return STROKE[this.size] ?? 2; }
  get center(): number { return this.px / 2; }
  get radius(): number { return (this.px - this.stroke) / 2; }

  /** 弧：四分之一圈，其餘留空 */
  get arcDash(): string {
    const circumference = 2 * Math.PI * this.radius;
    return `${(circumference / 4).toFixed(3)} ${circumference.toFixed(3)}`;
  }

  /** 弧從 12 點鐘方向開始 */
  get arcTransform(): string {
    return `rotate(-90 ${this.center} ${this.center})`;
  }
}
