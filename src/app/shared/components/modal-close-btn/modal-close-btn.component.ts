import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { IconComponent } from '../icon/icon.component';

/**
 * 共用 Modal 關閉鈕。視覺對齊 new-case-wizard 的 .wiz-close-btn：
 * transparent 底、無邊框、4px 小圓角、grey hover、No-X-Cancel icon（16）。
 * 放進各 modal 自己的 header，關閉決策交 parent：`(closeClick)="requestClose()"`。
 */
@Component({
  selector: 'app-modal-close-btn',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './modal-close-btn.component.html',
  styleUrls: ['./modal-close-btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalCloseBtnComponent {
  /** 無障礙標籤；情境特定可覆寫（如「關閉酬金拆分」），預設「關閉」 */
  @Input() ariaLabel = '關閉';
  /** 停用（如 saving 中不可關） */
  @Input() disabled = false;
  /** 點擊關閉鈕時觸發；parent 決定 dirty 時直接關還是彈二次確認 */
  @Output() closeClick = new EventEmitter<void>();
}
