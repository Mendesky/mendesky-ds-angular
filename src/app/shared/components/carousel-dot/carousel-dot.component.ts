import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export type CarouselDotVariant = 'Dot' | 'Line';

@Component({
  selector: 'app-carousel-dot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carousel-dot.component.html',
  styleUrls: ['./carousel-dot.component.scss'],
})
export class CarouselDotComponent {
  /** 基礎形狀：圓點或橫條 */
  @Input() variant: CarouselDotVariant = 'Dot';

  /** 選中狀態 */
  @Input() active = false;

  /** 有值時啟用 hover 展開文字行為 */
  @Input() text = '';

  /** 點擊事件 */
  @Output() dotClick = new EventEmitter<void>();

  get hasText(): boolean {
    return this.text.length > 0;
  }
}
