import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toggle',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './toggle.component.html',
  styleUrls: ['./toggle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ToggleComponent {
  /** 開關狀態 */
  @Input() checked = false;

  /** 禁用狀態 */
  @Input() disabled = false;

  /** 報讀軟體念的名稱，落在內層 switch 的 aria-label。畫面上的文字會隨開關改變時，給固定名稱 */
  @Input() ariaLabel = '';

  /** 狀態變更事件 */
  @Output() checkedChange = new EventEmitter<boolean>();

  toggle(): void {
    if (this.disabled) return;
    this.checkedChange.emit(!this.checked);
  }
}
