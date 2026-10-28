import { Component, Input, ChangeDetectionStrategy, computed, signal } from '@angular/core';
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
  private static counter = 0;

  /** 標題元素的 id；裡面的 app-input 用 aria-labelledby 指向它 */
  readonly labelId = `app-field-label-${++FieldComponent.counter}`;

  /**
   * 標題與必填用 signal 存：裡面的 app-input 是 OnPush，只在自己的 Input 改變時重畫；
   * 讀 signal 才會在標題之後才載入或改字時跟著更新。
   */
  private readonly labelValue = signal('');
  private readonly requiredValue = signal(false);

  /** 欄位標題文字；不傳則不顯示 label row。非空白時也是直接寫在裡面的 app-input 的報讀名稱 */
  @Input()
  set label(value: string | null | undefined) {
    this.labelValue.set(value ?? '');
  }
  get label(): string {
    return this.labelValue();
  }

  /** 顯示「必填」badge；直接寫在裡面的 app-input 同時帶 aria-required="true" */
  @Input()
  set required(value: boolean) {
    this.requiredValue.set(!!value);
  }
  get required(): boolean {
    return this.requiredValue();
  }

  /** 標題後方的灰字補充說明（如「（每週寄送、每月寄送）」）；不傳則不顯示 */
  @Input() hint = '';

  /** 強調樣式：label 加粗 + 標題色 + 下方分隔線；用於唯讀展示區塊 */
  @Input() emphasis = false;

  /** 裡面的 app-input 讀的標題文字（去掉前後空白）；空字串＝沒有標題，不連 */
  readonly labelText = computed(() => this.labelValue().trim());

  /** 裡面的 app-input 讀的必填狀態 */
  readonly isRequired = this.requiredValue.asReadonly();
}
