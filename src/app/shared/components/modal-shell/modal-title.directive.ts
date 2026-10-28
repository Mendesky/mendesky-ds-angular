import { Directive, Input, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { ModalShellComponent } from './modal-shell.component';

/**
 * 對話框標題標記。
 *
 * 套用方式：在 app-modal-shell 裡的標題元素加 `appModalTitle` 屬性。
 *
 * 行為：
 *   - 卡片（role="dialog"）的 aria-labelledby 自動指向這個標題，報讀軟體開窗時會念出標題。
 *   - 標題沒有 id 就自動產生；寫了 id（id="…" 或 [id]="…"）就沿用，之後改值卡片跟著改指。
 *     用 [attr.id] 寫的 id 這裡收不到，會被自動 id 蓋掉。
 *   - 標題在投影進來的子元件裡、在 @if 裡都有效；標題消失時卡片清掉 aria-labelledby。
 *   - 接到的是「寫這個標題的 template 裡」最近的 app-modal-shell，不是畫面上包住它的那一個：
 *     標題寫在外殼外的 ng-template、或透過包裝元件的 ng-content 再投影進它自己的外殼，都接不上。
 *   - 找不到 app-modal-shell 時不做任何事。
 *
 * 註：一個對話框同一時間只能有一個標題。有兩個以上時用最早建立的那一個，開發模式會警告。
 */
@Directive({
  selector: '[appModalTitle]',
  standalone: true,
  host: { '[id]': 'titleId()' },
})
export class ModalTitleDirective implements OnInit, OnDestroy {
  private static counter = 0;
  private readonly autoId = `app-modal-title-${++ModalTitleDirective.counter}`;
  private readonly idValue = signal(this.autoId);
  private readonly shell = inject(ModalShellComponent, { optional: true });

  /** 標題元素的 id；不寫就自動產生 */
  @Input()
  set id(value: string | null | undefined) {
    this.idValue.set(value || this.autoId);
  }
  get id(): string {
    return this.idValue();
  }

  /** 卡片 aria-labelledby 讀取的 id */
  readonly titleId = this.idValue.asReadonly();

  ngOnInit(): void {
    this.shell?.registerTitle(this);
  }

  ngOnDestroy(): void {
    this.shell?.unregisterTitle(this);
  }
}
