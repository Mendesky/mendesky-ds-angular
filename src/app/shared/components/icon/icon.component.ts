import { Component, HostBinding, Input, OnChanges, isDevMode, ChangeDetectionStrategy } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ICON_REGISTRY } from './icon.registry';

/**
 * AppIconComponent — 通用 SVG 圖示元件
 *
 * 用法：
 *   <app-icon name="DownArrow" size="16"></app-icon>
 *
 * 大小：透過 size input 控制，對應 Figma IconsPlaceHolder 尺寸
 *   可用值：12 | 16 | 24 | 32 | 36 | 48（預設 24）
 *
 * 顏色：透過 CSS color 屬性控制（使用 currentColor）
 *   <app-icon name="DownArrow" size="24" style="color:#3A9CCD"></app-icon>
 */

const SIZE_MAP: Record<string, number> = {
  '12': 12,
  '16': 16,
  '24': 24,
  '32': 32,
  '36': 36,
  '48': 48,
};

@Component({
  selector: 'app-icon',
  standalone: true,
  templateUrl: './icon.component.html',
  styleUrls: ['./icon.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent implements OnChanges {
  /** Figma icon 名稱，對應 Icons/xxx（不含 Icons/ 前綴） */
  @Input() name = '';

  /** 正方形尺寸（px），對應 Figma IconsPlaceHolder：12 | 16 | 24 | 32 | 36 | 48 */
  @Input() size: '12' | '16' | '24' | '32' | '36' | '48' = '24';

  @HostBinding('style.width.px')
  get hostWidth(): number { return SIZE_MAP[this.size] ?? 24; }

  @HostBinding('style.height.px')
  get hostHeight(): number { return SIZE_MAP[this.size] ?? 24; }

  safePaths: SafeHtml = '';

  constructor(private sanitizer: DomSanitizer) {}

  ngOnChanges(): void {
    const paths = ICON_REGISTRY[this.name];
    if (this.name && paths === undefined && isDevMode()) {
      console.warn(
        `[app-icon] 未知 icon name: "${this.name}"，registry 無此 key，將不顯示。`
      );
    }
    this.safePaths = this.sanitizer.bypassSecurityTrustHtml(paths ?? '');
  }
}
