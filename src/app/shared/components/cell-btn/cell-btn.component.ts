import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cell-btn',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cell-btn.component.html',
  styleUrls: ['./cell-btn.component.scss'],
})
export class CellBtnComponent {
  /** 顯示文字（如 "113 年"、"3 月"、"15"） */
  @Input() text = '';

  /** 選中態 — 藍底白字 */
  @Input() selected = false;

  /** 停用態 — 低透明度，不可點擊 */
  @Input() disabled = false;

  /** 空白佔位（日曆前幾格），渲染 span 而非 button */
  @Input() empty = false;

  @Output() cellClick = new EventEmitter<void>();

  onClick(): void {
    if (this.disabled || this.empty) return;
    this.cellClick.emit();
  }
}
