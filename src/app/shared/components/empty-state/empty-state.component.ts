import {
  Component, Input, Output, EventEmitter, ChangeDetectionStrategy,
  AfterViewChecked, ElementRef, OnChanges, SimpleChanges, ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

/** empty：讀到了但沒有資料（預設）；error：內容讀取失敗 */
export type EmptyStateVariant = 'empty' | 'error';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, ButtonComponent, IconComponent],
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.es-host--error]': "variant === 'error'",
    // title 是元件屬性；寫成靜態屬性 title="…" 時 Angular 也會把它留在 host 上，
    // 滑過整塊會跳出瀏覽器原生提示。這裡把 host 的 title 屬性拿掉。
    '[attr.title]': 'null',
  },
})
export class EmptyStateComponent implements OnChanges, AfterViewChecked {
  /** empty（預設）顯示插圖與 message；error 改顯示紅色圖示、標題、說明與重試鈕 */
  @Input() variant: EmptyStateVariant = 'empty';
  /** 插圖下方的說明文字；空字串時不顯示。只有 empty 版本顯示 */
  @Input() message = '目前無資料';
  /** error 版本的標題：寫哪一塊沒載入 */
  @Input() title = '載入失敗';
  /** error 版本的說明：寫下一步；空字串時不顯示 */
  @Input() description = '';
  /** error 版本重試鈕的文字 */
  @Input() retryText = '重試';
  /** error 版本：true 時重試鈕顯示載入圈與「重試中」，再按不會送出 retry */
  @Input() retrying = false;
  /** error 版本按下重試鈕。只有使用端接了這個事件，重試鈕才會出現 */
  @Output() retry = new EventEmitter<void>();

  @ViewChild('wrapper', { static: true }) private wrapperRef!: ElementRef<HTMLElement>;
  @ViewChild('retryArea') private retryAreaRef?: ElementRef<HTMLElement>;

  /** 重試剛結束（retrying 改回 false），畫面更新後要檢查焦點是否該還給重試鈕 */
  private returnFocusToRetry = false;

  get isError(): boolean {
    return this.variant === 'error';
  }

  /** 使用端有接 (retry) 才顯示重試鈕：不能重試的地方不出現按了沒用的按鈕 */
  get showRetry(): boolean {
    return this.isError && this.retry.observed;
  }

  ngOnChanges(changes: SimpleChanges): void {
    const r = changes['retrying'];
    // 重試中按鈕會變成原生 disabled，接不住焦點、焦點會掉到 body。
    // 趁按鈕還沒停用（這一輪的模板還沒更新），把焦點移到錯誤區塊本身，鍵盤使用者不必從頭找回來。
    if (r?.currentValue && !r.previousValue && this.isError) {
      const area = this.retryAreaRef?.nativeElement;
      if (area && area.contains(document.activeElement)) {
        this.wrapperRef.nativeElement.focus();
      }
    }
    // 重試仍失敗：按鈕要等這一輪模板更新才解除停用，所以在 ngAfterViewChecked 再把焦點還回去
    if (!r?.currentValue && r?.previousValue && this.isError) {
      this.returnFocusToRetry = true;
    }
  }

  ngAfterViewChecked(): void {
    if (!this.returnFocusToRetry) return;
    this.returnFocusToRetry = false;
    // 焦點還停在錯誤區塊本身（重試中移過來的）才還；使用者已經移到別處就不搶
    if (document.activeElement !== this.wrapperRef.nativeElement) return;
    const btn = this.retryAreaRef?.nativeElement.querySelector('button');
    if (btn && !btn.disabled) btn.focus();
  }

  onRetryClick(): void {
    // 按鈕 loading 時原生已停用；這裡再擋一次，避免任何路徑在重試中重送
    if (this.retrying) return;
    this.retry.emit();
  }
}
