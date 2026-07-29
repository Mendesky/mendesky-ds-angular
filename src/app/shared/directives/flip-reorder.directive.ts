import { AfterViewInit, Directive, ElementRef, NgZone, OnDestroy, inject } from '@angular/core';

/** 動效規範（animation.md）：Component tier 300ms、進場曲線 token var(--ease-enter)（easeOutCubic）。
 *  以 el.style.transition 字串套用，CSS 變數會從 :root 解析（非 WAAPI，故可用 var()）。 */
const FLIP_DURATION_MS = 300;
const FLIP_EASE = 'var(--ease-enter)';
/** 小於此位移（px）視為沒動，跳過動畫，避免微抖。 */
const FLIP_THRESHOLD_PX = 1;

/**
 * 資料驅動清單重排的平滑滑動（reactive FLIP）。
 *
 * 用途：當清單背後的資料（如報價卡 allCases）重新排序，`*ngFor`（搭配 trackBy: c.id）
 * 會「搬動」既有 DOM 節點到新位置。本 directive 讓被搬動的卡片以動畫從舊位置滑到新位置，
 * 而非瞬間跳位。
 *
 * 與 dashboard 拖曳 FLIP（flexbox order、節點不離 DOM、imperative onDrop）機制不同：
 * 那邊由使用者拖曳觸發、節點不動只改視覺 order；這裡由「資料重排」觸發、節點真的被 Angular 搬移，
 * 故採 MutationObserver（監聽容器 childList）偵測重排，無法用同一份 imperative 抽出。
 *
 * 套用方式：把 `appFlipReorder` 加在「直接持有重複卡片」的容器上，卡片本身帶 `[data-flip-id]="唯一鍵"`
 * （與 trackBy 同一個 c.id，確保是「同一節點滑動」而非新節點淡入）。
 *
 * 量測座標：用 `offsetTop/offsetLeft`（layout 座標、scroll-immune），避免容器/祖先捲動造成假位移。
 * a11y：`prefers-reduced-motion: reduce` 時完全不加過渡（瞬間定位）。
 * 效能：所有監聽與 DOM 操作都在 `runOutsideAngular` 內，純 DOM 副作用、不觸發 change detection。
 */
@Directive({
  selector: '[appFlipReorder]',
  standalone: true,
})
export class FlipReorderDirective implements AfterViewInit, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  private observer?: MutationObserver;
  private resizeObserver?: ResizeObserver;
  /** flip-id → 上次落定的 layout 位置（offset 座標）。 */
  private positions = new Map<string, { top: number; left: number }>();

  ngAfterViewInit(): void {
    this.zone.runOutsideAngular(() => {
      this.measure(); // 種下初始基準
      this.observer = new MutationObserver(() => this.animateReorder());
      this.observer.observe(this.host.nativeElement, { childList: true });
      if (typeof ResizeObserver !== 'undefined') {
        // resize 會改變 layout 位置但非重排 → 只更新基準、不動畫，避免下次重排算到 stale 位移
        this.resizeObserver = new ResizeObserver(() => this.measure());
        this.resizeObserver.observe(this.host.nativeElement);
      }
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
    this.resizeObserver?.disconnect();
  }

  /** 目前所有直接子 `[data-flip-id]` 的 layout 位置（offset 座標、scroll-immune）。 */
  private snapshot(): Map<string, { el: HTMLElement; top: number; left: number }> {
    const map = new Map<string, { el: HTMLElement; top: number; left: number }>();
    const children = Array.from(this.host.nativeElement.children) as HTMLElement[];
    for (const el of children) {
      const id = el.dataset['flipId'];
      if (id != null) map.set(id, { el, top: el.offsetTop, left: el.offsetLeft });
    }
    return map;
  }

  /** 重新量測並存為基準（不動畫）——seed / resize 後保持基準新鮮。 */
  private measure(): void {
    const snap = this.snapshot();
    this.positions = new Map();
    snap.forEach((v, id) => this.positions.set(id, { top: v.top, left: v.left }));
  }

  private prefersReducedMotion(): boolean {
    return typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * 依 `this.positions`（舊）對比目前 DOM（新）做 FLIP，最後更新基準。
   * 對外可測：測試直接 measure() → 改 DOM 順序 → animateReorder()。
   */
  animateReorder(): void {
    const current = this.snapshot();
    const reduced = this.prefersReducedMotion();
    if (!reduced) {
      current.forEach((cur, id) => {
        const old = this.positions.get(id);
        if (!old) return; // 新增卡：無舊基準 → 不滑、直接就位
        const dx = old.left - cur.left;
        const dy = old.top - cur.top;
        if (Math.abs(dx) < FLIP_THRESHOLD_PX && Math.abs(dy) < FLIP_THRESHOLD_PX) return;
        this.play(cur.el, dx, dy);
      });
    }
    // 更新基準（transform 不影響 offsetTop，量到的是最新 layout 位置）
    this.positions = new Map();
    current.forEach((v, id) => this.positions.set(id, { top: v.top, left: v.left }));
  }

  /** FLIP play：先 invert 回舊位置（無過渡），強制 reflow，再過渡回新位置。 */
  private play(el: HTMLElement, dx: number, dy: number): void {
    // INVERT：暫時關過渡，把卡片用 transform 視覺擺回舊位置
    el.style.transition = 'none';
    el.style.transform = `translate(${dx}px, ${dy}px)`;
    // 強制 reflow，讓 invert 即時生效（否則下一步清 transform 不會產生過渡）
    void el.offsetWidth;
    // PLAY：開過渡、清 transform → 從舊位置平滑滑回新位置
    el.style.transition = `transform ${FLIP_DURATION_MS}ms ${FLIP_EASE}`;
    el.style.transform = '';
    const cleanup = (): void => {
      el.style.transition = '';
      el.style.transform = '';
      el.removeEventListener('transitionend', cleanup);
    };
    el.addEventListener('transitionend', cleanup, { once: true });
  }
}
