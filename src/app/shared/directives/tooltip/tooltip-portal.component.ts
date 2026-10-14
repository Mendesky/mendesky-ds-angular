import { Component, Input, HostBinding, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export type TooltipPortalDirection = 'top' | 'bottom' | 'left' | 'right';
export type TooltipPortalStyle = 'default' | 'warning' | 'grey';

@Component({
  selector: 'app-tooltip-portal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tooltip-portal.component.html',
  styleUrls: ['./tooltip-portal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TooltipPortalComponent {
  @Input() text = '';
  @Input() direction: TooltipPortalDirection = 'top';
  @Input() tooltipStyle: TooltipPortalStyle = 'default';
  /** 長文字換行：文字最寬 520px，超過就換行（無空白的長檔名也會斷）；預設關閉 */
  @Input() wrap = false;

  @HostBinding('class') get hostClass(): string {
    return `tooltip-portal tooltip-portal--${this.direction}`;
  }

  get isVertical(): boolean {
    return this.direction === 'top' || this.direction === 'bottom';
  }

  /** Arrow before box: bottom (↑ points toward trigger) or right (← points toward trigger) */
  get showArrowBefore(): boolean {
    return this.direction === 'bottom' || this.direction === 'right';
  }

  /** Arrow after box: top (↓ points toward trigger) or left (→ points toward trigger) */
  get showArrowAfter(): boolean {
    return this.direction === 'top' || this.direction === 'left';
  }

  get arrowClass(): string {
    const dirMap: Record<TooltipPortalDirection, string> = {
      top:    'tooltip__arrow--down',
      bottom: 'tooltip__arrow--up',
      left:   'tooltip__arrow--right',
      right:  'tooltip__arrow--left',
    };
    return `tooltip__arrow ${dirMap[this.direction]} arrow--${this.tooltipStyle}`;
  }

  get boxClass(): string {
    return `tooltip__box tooltip__box--${this.tooltipStyle}`;
  }

  get textClass(): string {
    return `tooltip__text tooltip__text--${this.tooltipStyle}${this.wrap ? ' tooltip__text--wrap' : ''}`;
  }
}
