import { Component, Input, ViewChild, ElementRef, OnDestroy, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MinimapColumn {
  label: string;
  color: string;
  cardCount: number;
}

@Component({
  selector: 'app-kanban-minimap',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kanban-minimap.component.html',
  styleUrls: ['./kanban-minimap.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KanbanMinimapComponent implements OnDestroy {
  @ViewChild('minimapBody') minimapBodyRef!: ElementRef<HTMLElement>;

  @Input() columns: MinimapColumn[] = [];

  @Input() set boardContainer(el: HTMLElement | null | undefined) {
    this.unbindScroll();
    this._boardEl = el ?? null;
    if (el) {
      this.bindScroll();
      setTimeout(() => this.updateViewport(), 50);
    } else {
      this.visible.set(false);
    }
  }

  visible = signal(false);
  vpLeft = signal(0);
  vpWidth = signal(0);
  /** signal（非 plain boolean）：mouseup 監聽掛在 document 上、不是本元件 template 內的
   *  事件來源，OnPush 元件下 plain 欄位變更不會觸發重繪，改用 signal 確保正確刷新。 */
  isDragging = signal(false);

  private _boardEl: HTMLElement | null = null;
  private readonly _onScroll = () => this.updateViewport();
  private _resizeObserver?: ResizeObserver;

  private bindScroll(): void {
    const el = this._boardEl;
    if (!el) return;
    el.addEventListener('scroll', this._onScroll);
    this._resizeObserver = new ResizeObserver(() => this.updateViewport());
    this._resizeObserver.observe(el);
  }

  private unbindScroll(): void {
    this._boardEl?.removeEventListener('scroll', this._onScroll);
    this._resizeObserver?.disconnect();
    this._resizeObserver = undefined;
  }

  updateViewport(): void {
    const el = this._boardEl;
    const body = this.minimapBodyRef?.nativeElement;
    if (!el || !body) return;

    const overflows = el.scrollWidth > el.clientWidth + 1;
    this.visible.set(overflows);
    if (!overflows) return;

    const mapW = body.clientWidth;
    const scale = mapW / el.scrollWidth;
    const vpW = Math.max(16, el.clientWidth * scale);
    const vpL = Math.min(el.scrollLeft * scale, mapW - vpW);
    this.vpWidth.set(vpW);
    this.vpLeft.set(vpL);
  }

  onBodyClick(e: MouseEvent): void {
    if ((e.target as HTMLElement).classList.contains('minimap-viewport')) return;
    const el = this._boardEl;
    const body = this.minimapBodyRef?.nativeElement;
    if (!el || !body) return;
    const rect = body.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const scale = el.scrollWidth / body.clientWidth;
    el.scrollTo({ left: clickX * scale - el.clientWidth / 2, behavior: 'smooth' });
  }

  onViewportMousedown(e: MouseEvent): void {
    this.isDragging.set(true);
    const startX = e.clientX;
    const startScroll = this._boardEl?.scrollLeft ?? 0;
    e.preventDefault();
    e.stopPropagation();

    const onMove = (ev: MouseEvent) => {
      const el = this._boardEl;
      const body = this.minimapBodyRef?.nativeElement;
      if (!el || !body) return;
      el.scrollLeft = startScroll + (ev.clientX - startX) * (el.scrollWidth / body.clientWidth);
    };
    const onUp = () => {
      this.isDragging.set(false);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  // ngFor 用，必須 memoize：之前每次 CD 都 Array.from 返新陣列 → ngFor 偵測為 dirty
  // → ngForOf ngOnChanges → mark for check → 下一輪 CD → 再 Array.from → 死循環
  // 造成案件 modal 開啟時整個 tab freeze（弘宇創新 case 觸發）。
  // cardCount 取值小（0–6），Map cache 永久持有最多 7 個 entries。
  private readonly _cardRangeCache = new Map<number, number[]>();
  cardRange(count: number): number[] {
    const cached = this._cardRangeCache.get(count);
    if (cached) return cached;
    const arr = Array.from({ length: Math.min(count, 6) }, (_, i) => i);
    this._cardRangeCache.set(count, arr);
    return arr;
  }

  ngOnDestroy(): void {
    this.unbindScroll();
  }
}
