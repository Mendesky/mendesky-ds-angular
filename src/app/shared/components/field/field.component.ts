import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LabelComponent } from '../label/label.component';

@Component({
  selector: 'app-field',
  standalone: true,
  imports: [CommonModule, LabelComponent],
  templateUrl: './field.component.html',
  styleUrls: ['./field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FieldComponent {
  /** 欄位標題文字；不傳則不顯示 label row */
  @Input() label = '';

  /** 顯示「必填」badge */
  @Input() required = false;

  /** 標題後方的灰字補充說明（如「（每週寄送、每月寄送）」）；不傳則不顯示 */
  @Input() hint = '';

  /** 強調樣式：label 加粗 + 標題色 + 下方分隔線；用於唯讀展示區塊 */
  @Input() emphasis = false;
}
