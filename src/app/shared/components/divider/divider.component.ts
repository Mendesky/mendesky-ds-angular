import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type DividerDisplay = 'Row' | 'Column';
export type DividerClass = 'White' | 'Grey20' | 'Grey30' | 'Grey40';

@Component({
  selector: 'app-divider',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './divider.component.html',
  styleUrls: ['./divider.component.scss'],
})
export class DividerComponent {
  /** 方向：Row 水平 | Column 垂直 */
  @Input() display: DividerDisplay = 'Row';

  /** 線條顏色深淺 */
  @Input() propClass: DividerClass = 'Grey20';

  /** 是否顯示中央標籤（僅 Row 有效） */
  @Input() showLabel = false;

  /** 標籤文字 */
  @Input() labelText = '上滑顯示更多';

  get colorClass(): string {
    const map: Record<DividerClass, string> = {
      White:  'divider--white',
      Grey20: 'divider--grey20',
      Grey30: 'divider--grey30',
      Grey40: 'divider--grey40',
    };
    return map[this.propClass];
  }

  get badgeBorderClass(): string {
    return '';
  }
}
