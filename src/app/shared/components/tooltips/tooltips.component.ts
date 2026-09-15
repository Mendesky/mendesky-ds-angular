import { Component, Input, OnChanges, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TooltipDirection = 'Left' | 'Down' | 'Top' | 'Right';
export type TooltipStyle = 'Default' | 'Warning' | 'Grey';

@Component({
  selector: 'app-tooltips',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltips.component.html',
  styleUrls: ['./tooltips.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipsComponent implements OnChanges {
  @Input() propClass: TooltipDirection = 'Down';
  @Input() styles: TooltipStyle = 'Default';
  @Input() text = 'Description';

  // 預先算好的 ngClass 物件 — reference 穩定到下次 @Input 變動才換新。
  // 之前用 getter 每次 CD 返新 object literal → ngClass ngOnChanges 反覆觸發 → CD 死循環
  // 造成整個 tab freeze（弘宇創新等 case 同畫面多個 tooltip 累積放大）。
  wrapperClasses: Record<string, boolean> = {};
  boxClasses: Record<string, boolean> = {};
  textClasses: Record<string, boolean> = {};
  arrowBeforeClasses: Record<string, boolean> = {};
  arrowAfterClasses: Record<string, boolean> = {};

  ngOnChanges(): void {
    const styleKey = this.styles.toLowerCase() as 'default' | 'grey' | 'warning';
    this.wrapperClasses = {
      'tooltip--vertical': this.propClass === 'Down' || this.propClass === 'Top',
    };
    this.boxClasses = {
      'tooltip__box--default': this.styles === 'Default',
      'tooltip__box--grey':    this.styles === 'Grey',
      'tooltip__box--warning': this.styles === 'Warning',
    };
    this.textClasses = {
      'tooltip__text--default': this.styles === 'Default',
      'tooltip__text--grey':    this.styles === 'Grey',
      'tooltip__text--warning': this.styles === 'Warning',
    };
    const beforeDir = this.propClass === 'Left' ? 'left' : 'up';
    this.arrowBeforeClasses = {
      [`tooltip__arrow--${beforeDir}`]: true,
      [`arrow--${styleKey}`]: true,
    };
    const afterDir = this.propClass === 'Right' ? 'right' : 'down';
    this.arrowAfterClasses = {
      [`tooltip__arrow--${afterDir}`]: true,
      [`arrow--${styleKey}`]: true,
    };
  }
}
