import { AfterViewInit, Directive, ElementRef, HostListener, Renderer2, inject } from '@angular/core';
import { ToastService } from '../services/toast.service';
import { copyText as writeClipboard } from '@mendesky/ds';

/**
 * 點擊複製到剪貼簿。
 *
 * 套用方式：在任意元素加 `appCopy` 屬性。
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
  selector: '[appCopy]',
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
