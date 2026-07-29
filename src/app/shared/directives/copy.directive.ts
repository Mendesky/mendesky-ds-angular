import { AfterViewInit, Directive, ElementRef, HostListener, Renderer2, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { copyText as writeClipboard } from '../utils/clipboard.util';

/**
 * 點擊複製到剪貼簿。
 *
 * 套用方式有二：
 *   1. 顯式：在任意元素加 `appCopy` 屬性。
 *   2. 隱式：直接命中訪談表（client-view-modal）各「純資料欄位值」class（見 selector）。
 *      金額（mono price）與帶框項目名稱 tag 不在範圍內，故不列入 selector。
 *      客戶狀況及注意事項（`.vt4-status-body`，多段 richtext）非純資料欄位值，
 *      點擊複製整段 textContent 無意義且會蓋掉手動選字，故刻意不列入 selector。
 *
 * 行為：
 *   - 點擊讀取元素 textContent（即時讀取，永遠對應當下顯示值）複製，成功彈 success toast。
 *   - 套用 `.app-copy`（hover 變灰 + cursor pointer，樣式定義於全域 styles.scss）。
 *   - 空值或佔位「-」→ 加 `.app-copy--disabled`、點擊不作用。
 *
 * 註：disabled 判斷在 ngAfterViewInit 一次性計算（用 Renderer2 直接寫 class，
 *     不走 HostBinding，避免 OnPush 下 ExpressionChangedAfterChecked 與 CD-thrash）。
 */
@Directive({
  selector: `[appCopy],
    .vt1-info-field__value, .vt1-section__value, .vt1-business-scope, .vt1-deal-date,
    .vfb-block__value, .vfb-cost-tag__value,
    .vdi-row__value,
    .vt3-field__value, .vt3-contact-method-value,
    .vt4-source-section__value, .vt4-section__value, .vt4-field__value`,
  standalone: true,
})
export class CopyDirective implements AfterViewInit {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);
  private readonly toast = inject(ToastService);

  ngAfterViewInit(): void {
    const el = this.host.nativeElement;
    this.renderer.addClass(el, 'app-copy');
    if (!this.copyText()) {
      this.renderer.addClass(el, 'app-copy--disabled');
    }
  }

  @HostListener('click')
  onClick(): void {
    const text = this.copyText();
    if (!text) return;
    void writeClipboard(text).then(ok => {
      this.toast.show(ok
        ? { type: 'success', message: '已複製' }
        : { type: 'error', message: '複製失敗' });
    });
  }

  /** 可複製文字；空值或佔位「-」視為不可複製。 */
  private copyText(): string {
    const raw = (this.host.nativeElement.textContent ?? '').trim();
    return raw === '' || raw === '-' ? '' : raw;
  }
}
