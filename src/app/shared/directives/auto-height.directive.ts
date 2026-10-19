import { Directive, ElementRef, Input, AfterViewInit, OnChanges, OnDestroy, SimpleChanges, inject } from '@angular/core';

/**
 * 容器高度變化時平滑過渡（ResizeObserver + WAAPI FLIP）。
 *
 * 與 trigger-based 的過渡不同：本 directive **偵測元素自身高度的任何變化**——切步、step 內
 * button-group 切換、欄位顯示/隱藏、skeleton↔內容 都自動過渡，不需手動綁「切換訊號」。
 * 用於不走 modal-shell 的容器（如自訂的 wizard 卡片）；走 modal-shell 的 wizard
 * 改用 modal-shell 的 `animateContentHeight`（同機制、內建在 card 層）。
 *
 * 機制（與 modal-shell.animateContentHeight 一致）：
 * - 進場延遲：容器常有進場動畫（Panel tier 450ms），延遲後才啟用觀察，避免把進場也當高度變化。
 * - WAAPI FLIP：偵測到高度變化 → 從舊高 animate 到新高（DS Component tier 300ms + --ease-enter）。
 * - 動畫期間 disconnect observer：WAAPI animate height 逐幀改 layout，會讓 observer 迴圈觸發。
 * - 動畫期間動態設 overflow:hidden（結束清除回 stylesheet 值）：容器平時可能 overflow:visible
 *   （如卡片右上角浮出的儲存提示），不裁切會讓展開瞬間內容溢出破圖。
 * - 連續/高頻變化 snap：拖拉 textarea、auto-grow 等連續變化不補間（否則卡片會「一格格追」而卡頓），
 *   只對離散跳變（欄位顯示/隱藏、skeleton↔內容）補間。
 * - 尊重 prefers-reduced-motion。
 *
 * 用法：在元素上加 `appAutoHeight`（裸屬性即啟用），或綁 `[appAutoHeight]="條件"`。
 */
@Directive({
  selector: '[appAutoHeight]',
  standalone: true,
})
export class AutoHeightDirective implements AfterViewInit, OnChanges, OnDestroy {
  /** opt-in 開關（false → 不啟用；容器條件性需要過渡時可綁 signal）。 */
  @Input('appAutoHeight') enabled: boolean | '' = true;
  /** 啟用前延遲 ms（避開容器進場動畫；預設 450 = Panel tier）。 */
  @Input() autoHeightDelay = 450;

  private static readonly TWEEN_MS = 300; // DS Component tier
  /** 兩次高度變化間隔 < 此值視為連續操作（拖拉／auto-grow）→ 不補間，讓卡片即時跟隨。 */
  private static readonly SNAP_WINDOW_MS = 400;

  private readonly el = inject(ElementRef<HTMLElement>);
  private obs: ResizeObserver | null = null;
  private lastHeight: number | null = null;
  private lastChangeAt = 0;
  private anim: Animation | null = null;
  private enableTimer: ReturnType<typeof setTimeout> | null = null;
  private viewReady = false;

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.sync();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['enabled'] && this.viewReady) this.sync();
  }

  ngOnDestroy(): void {
    this.teardown();
  }

  private isEnabled(): boolean {
    return this.enabled === '' || this.enabled === true;
  }

  private sync(): void {
    if (this.isEnabled()) {
      if (!this.obs && this.enableTimer === null) this.scheduleEnable();
    } else {
      this.teardown();
    }
  }

  private scheduleEnable(): void {
    if (this.prefersReducedMotion() || typeof ResizeObserver === 'undefined') return;
    this.enableTimer = setTimeout(() => {
      this.enableTimer = null;
      const el = this.el.nativeElement;
      this.lastHeight = el.offsetHeight;
      this.obs = new ResizeObserver(() => this.onResize());
      this.obs.observe(el);
    }, this.autoHeightDelay);
  }

  private onResize(): void {
    const el = this.el.nativeElement;
    const next = el.offsetHeight;
    const prev = this.lastHeight;
    this.lastHeight = next;
    if (prev === null || prev === next) return;

    const now = performance.now();
    const consecutive = now - this.lastChangeAt < AutoHeightDirective.SNAP_WINDOW_MS;
    this.lastChangeAt = now;
    // 連續/高頻變化（拖拉 textarea、auto-grow）→ 不補間，height 保持 auto 即時跟隨，避免「一格格追」。
    if (consecutive) return;

    // 離散跳變 → WAAPI animate height 逐幀改 layout → observer 迴圈；動畫期間先停止觀察，結束再接回。
    this.obs?.disconnect();
    this.anim?.cancel();
    el.style.overflow = 'hidden'; // 動畫期間裁切，避免內容溢出（容器平時可能 overflow:visible）
    const anim = el.animate(
      [{ height: `${prev}px` }, { height: `${next}px` }],
      { duration: AutoHeightDirective.TWEEN_MS, easing: this.easeEnter() },
    );
    this.anim = anim;
    const done = (): void => {
      this.anim = null;
      el.style.overflow = ''; // 清除 inline，回到 stylesheet 值（visible / hidden）
      this.lastHeight = el.offsetHeight;
      this.obs?.observe(el);
    };
    anim.onfinish = done;
    anim.oncancel = () => { this.anim = null; el.style.overflow = ''; };
  }

  private teardown(): void {
    if (this.enableTimer !== null) { clearTimeout(this.enableTimer); this.enableTimer = null; }
    this.obs?.disconnect();
    this.obs = null;
    this.anim?.cancel();
    this.anim = null;
    this.el.nativeElement.style.overflow = '';
    this.lastHeight = null;
    this.lastChangeAt = 0;
  }

  /**
   * --ease-enter 是 :root 靜態 token（緩動曲線，runtime 不變），全實例共用；
   * cache 一次避免每次動畫的 getComputedStyle 造成 read-after-write forced reflow。
   */
  private static easeCache: string | null = null;
  private easeEnter(): string {
    return (AutoHeightDirective.easeCache ??=
      getComputedStyle(document.documentElement).getPropertyValue('--ease-enter').trim()
      || 'cubic-bezier(0.215, 0.61, 0.355, 1)');
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }
}
