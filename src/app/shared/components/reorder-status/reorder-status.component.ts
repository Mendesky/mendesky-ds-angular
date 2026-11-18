import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  inject,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

/**
 * ReorderStatusComponent — 可排序清單的報讀區
 *
 * 一直在頁面上、視覺隱藏的 role="status"，平常是空的。移動之後使用端呼叫 announce(句子)，
 * 報讀軟體就念（句子用本體的 reorderMessage 產生）。
 *
 * - 放在清單外面、跟清單同一層：項目會被搬動，放在項目裡會跟著被搬走。
 * - 同一句連續念兩次時，句尾交替加一個不換行空白，文字有變報讀軟體才會再念。
 * - 使用者離開放它的容器（父元素）時清空：焦點移到容器外面（document 的 focusin），
 *   或滑鼠移出容器（pointerleave）。不用計時器。
 */
@Component({
  selector: 'app-reorder-status',
  standalone: true,
  template: '{{ text }}',
  host: { role: 'status', class: 'ds-reorder-status' },
  styles: [`
    :host {
      position: absolute;
      width: 1px;
      height: 1px;
      margin: -1px;
      padding: 0;
      overflow: hidden;
      clip: rect(0 0 0 0);
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReorderStatusComponent implements AfterViewInit, OnDestroy {
  /** 目前念的那一句；平常是空的 */
  text = '';

  private readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);
  private readonly doc = inject(DOCUMENT);
  private scope: HTMLElement | null = null;
  private readonly onFocusIn = (e: FocusEvent) => {
    const target = e.target as Node | null;
    if (this.text && this.scope && target && !this.scope.contains(target)) this.zone.run(() => this.clear());
  };
  private readonly onPointerLeave = () => {
    if (this.text) this.zone.run(() => this.clear());
  };

  ngAfterViewInit(): void {
    this.scope = this.host.parentElement;
    this.zone.runOutsideAngular(() => {
      this.doc.addEventListener('focusin', this.onFocusIn, true);
      this.scope?.addEventListener('pointerleave', this.onPointerLeave);
    });
  }

  ngOnDestroy(): void {
    this.doc.removeEventListener('focusin', this.onFocusIn, true);
    this.scope?.removeEventListener('pointerleave', this.onPointerLeave);
  }

  /** 念一句話。跟目前那句相同時，句尾交替加一個不換行空白，讓報讀軟體再念一次 */
  announce(message: string): void {
    const base = message.trim();
    this.text = this.text === base ? `${base} ` : base;
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }

  /** 清空 */
  clear(): void {
    if (!this.text) return;
    this.text = '';
    this.cdr.markForCheck();
    this.cdr.detectChanges();
  }
}
