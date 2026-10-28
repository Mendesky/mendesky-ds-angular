import {
  Component,
  Input,
  Output,
  EventEmitter,
  signal,
  OnChanges,
  SimpleChanges,
  ElementRef,
  OnDestroy,
  Renderer2,
  HostListener,
  inject,
  computed,
  isDevMode,
  Signal,
 ChangeDetectionStrategy, } from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { ModalStackService } from '../../../core/services/modal-stack.service';
import { CommonModule } from '@angular/common';

/** appModalTitle 向外殼登記時交出的標題 */
export interface ModalTitleRef {
  readonly titleId: Signal<string>;
}

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './modal-shell.component.html',
  styleUrls: ['./modal-shell.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModalShellComponent implements OnChanges, OnDestroy {
  /** 控制顯示 / 隱藏 */
  @Input() isOpen = false;

  /** 卡片寬度（預設 580px） */
  @Input() width = '580px';

  /** 卡片最大高度（預設 88vh） */
  @Input() maxHeight = '88vh';

  /** 卡片樣式變體：default（垂直置中）| search（上方對齊 14vh）| floating-right（右下角浮層，dock 上方）*/
  @Input() variant: 'default' | 'search' | 'floating-right' = 'default';

  /**
   * 對應 aria-labelledby 的元素 ID。
   * 一般不用設：在標題加 appModalTitle 就會自動指向它。標題在外殼外面、要指多個元素時才用。
   */
  @Input() ariaLabelledBy = '';

  /**
   * 對話框的報讀名稱（aria-label）。沒有可見標題時才用，例如搜尋視窗。
   * 有設時卡片只輸出 aria-label，不輸出 aria-labelledby。
   */
  @Input() ariaLabel = '';

  /** 讓卡片 overflow: visible，用於 stepper 浮在卡片上方的 wizard 模式 */
  @Input() overflowVisible = false;

  /** 啟用卡片毛玻璃效果（預設不透明，opt-in 啟用） */
  @Input() frostedGlass = false;

  /** 加深 backdrop（用於需要高度聚焦的彈窗，如版本更新公告）；預設用標準淺色 backdrop */
  @Input() darkBackdrop = false;

  /**
   * 內容高度變化時平滑過渡 card 高度（opt-in）。用於多步驟 wizard 切步、skeleton↔內容切換等——
   * card 是 fit-content（受 max-height 限制），內容一變高度就瞬跳。啟用後以 ResizeObserver 偵測
   * card 高度變化 → WAAPI FLIP 平滑補間（DS Component tier 300ms + 進場曲線）。
   * 進場動畫（450ms）結束後才啟用（避開開場）；尊重 prefers-reduced-motion。
   * 內容超過 max-height 時 card 固定 max-height、內容變化不改 card 高度 → 不觸發（body 捲動，符合預期）。
   */
  @Input() animateContentHeight = false;

  /**
   * 點 backdrop 是否可關閉（對齊 ds-patterns modal.dismissal）。
   * parent 傳 `[canDismiss]="!isDirty()"`：dirty 時 false → backdrop 完全 inert（不 emit、不關）；
   * clean 時 true → 照常 emit backdropClick。預設 true，既有使用點不傳即維持原行為。
   * 注意：此 gate 只作用於 backdrop；ESC 不受 gate（dirty 時仍 emit escapePress，由 parent 決定直接關或彈二次確認）。
   */
  @Input() canDismiss = true;

  /** 點擊 backdrop 時觸發（父層決定是否關閉） */
  @Output() backdropClick = new EventEmitter<void>();

  /** 按 Escape 鍵時觸發（父層決定是否關閉） */
  @Output() escapePress = new EventEmitter<void>();

  /** leave 動畫結束後觸發（450ms 後）；用於「確認後清 target」等需要等動畫結束的場景 */
  @Output() afterLeave = new EventEmitter<void>();

  /** 內部 render 狀態：確保 leave 動畫結束後才移除 DOM */
  protected visible = signal(false);
  protected isClosing = signal(false);

  /**
   * Focus trap auto-capture：動畫完成（450ms）後才啟用。
   * 避免動畫進行中 focus 跳動，也避免巢狀 modal 搶奪 focus。
   */
  protected trapAutoCapture = signal(false);

  private static counter = 0;
  private readonly modalId = `modal-shell-${++ModalShellComponent.counter}`;

  /**
   * appModalTitle 登記的標題。用 signal 存：標題可能在外殼檢查完之後才登記
   * （投影進來的子元件、@if），一般陣列會觸發 ExpressionChangedAfterChecked。
   */
  private readonly titles = signal<readonly ModalTitleRef[]>([]);
  /** 卡片 aria-labelledby 自動指向的標題 id；沒有標題時是空字串 */
  protected readonly labelledBy = computed(() => this.titles()[0]?.titleId() ?? '');

  /** ariaLabel 去掉前後空白；只有空白、或沒開嚴格檢查的 template 傳進 undefined，都當成沒設 */
  protected get labelText(): string {
    return (this.ariaLabel ?? '').trim();
  }

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private trapTimer: ReturnType<typeof setTimeout> | null = null;
  // ── 內容高度過渡（animateContentHeight）──
  private resizeObs: ResizeObserver | null = null;
  private lastCardHeight: number | null = null;
  private heightAnim: Animation | null = null;
  private renderer = inject(Renderer2);
  private elRef = inject(ElementRef);
  private modalStack = inject(ModalStackService);

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape') return;
    if (!this.isOpen) return;
    // 只有 stack 最上層的 modal 才回應 Escape
    if (!this.modalStack.isTopmost(this.modalId)) return;
    event.preventDefault();
    this.escapePress.emit();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['isOpen']) return;

    const opened = changes['isOpen'].currentValue as boolean;

    if (opened) {
      // 清掉正在進行的 timer
      if (this.closeTimer) { clearTimeout(this.closeTimer); this.closeTimer = null; }
      if (this.trapTimer) { clearTimeout(this.trapTimer); this.trapTimer = null; }
      this.isClosing.set(false);
      this.trapAutoCapture.set(false);
      this.visible.set(true);
      // 把 host element 移到 document.body 根層，
      // 使 backdrop-filter 不受祖先 overflow:hidden 限制
      this.renderer.appendChild(document.body, this.elRef.nativeElement);
      // 註冊到 ModalStackService
      this.modalStack.register(this.modalId);
      // 動畫完成（Panel tier = 450ms）後才啟用 auto-capture
      this.trapTimer = setTimeout(() => {
        this.trapAutoCapture.set(true);
        this.trapTimer = null;
        // 進場動畫結束後才啟用高度過渡觀察（避開開場的 scale/opacity 動畫）
        if (this.animateContentHeight) this.enableHeightObserver();
        // 內容此時已渲染完，檢查一次報讀名稱；只在開發模式
        if (isDevMode()) this.warnIfUnnamed();
      }, 450);
    } else {
      // 立即從 stack 移除，讓下層 modal 可以立刻接管 Escape
      this.modalStack.unregister(this.modalId);
      if (this.trapTimer) { clearTimeout(this.trapTimer); this.trapTimer = null; }
      this.trapAutoCapture.set(false);
      this.teardownHeightObserver();
      // 觸發 leave 動畫，450ms 後移除 DOM
      this.isClosing.set(true);
      this.closeTimer = setTimeout(() => {
        this.visible.set(false);
        this.isClosing.set(false);
        this.closeTimer = null;
        this.afterLeave.emit();
      }, 450);
    }
  }

  ngOnDestroy(): void {
    if (this.closeTimer) clearTimeout(this.closeTimer);
    if (this.trapTimer) clearTimeout(this.trapTimer);
    this.teardownHeightObserver();
    this.modalStack.unregister(this.modalId);
    const host = this.elRef.nativeElement as HTMLElement;
    if (host.parentNode === document.body) {
      document.body.removeChild(host);
    }
  }

  registerTitle(title: ModalTitleRef): void {
    this.titles.update(list => [...list, title]);
  }

  unregisterTitle(title: ModalTitleRef): void {
    this.titles.update(list => list.filter(t => t !== title));
  }

  // ── 報讀名稱檢查（開發模式）──────────────────────────────────────────
  private warnIfUnnamed(): void {
    if (!this.labelText && !this.ariaLabelledBy && this.titles().length > 1) {
      console.warn('[app-modal-shell] 這個對話框同時有不只一個 appModalTitle，只會用最早建立的那一個當名稱。請只留一個，或改設 ariaLabel。');
      return;
    }
    if (this.accessibleName()) return;
    console.warn('[app-modal-shell] 這個對話框開啟 0.45 秒後還沒有報讀名稱。請在標題加上 appModalTitle；沒有標題時設定 ariaLabel。標題要等資料載入才出現的話，載入中也先顯示標題文字。');
  }

  /** 依卡片目前的 aria-label／aria-labelledby 算出報讀軟體會念的名稱 */
  private accessibleName(): string {
    if (this.labelText) return this.labelText;
    return (this.ariaLabelledBy || this.labelledBy())
      .split(/\s+/)
      .filter(Boolean)
      .map(id => document.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
  }

  // ── 內容高度過渡（animateContentHeight）──────────────────────────────
  private enableHeightObserver(): void {
    if (this.prefersReducedMotion() || typeof ResizeObserver === 'undefined') return;
    const card = this.cardEl();
    if (!card) return;
    this.lastCardHeight = card.offsetHeight;
    this.resizeObs = new ResizeObserver(() => this.onCardResize(card));
    this.resizeObs.observe(card);
  }

  private onCardResize(card: HTMLElement): void {
    const next = card.offsetHeight;
    const prev = this.lastCardHeight;
    this.lastCardHeight = next;
    if (prev === null || prev === next) return;
    // WAAPI animate height 會逐幀改 layout → ResizeObserver 迴圈；動畫期間先停止觀察，結束再接回。
    this.resizeObs?.disconnect();
    this.heightAnim?.cancel();
    const anim = card.animate(
      [{ height: `${prev}px` }, { height: `${next}px` }],
      { duration: 300, easing: this.easeEnter() }, // DS Component tier
    );
    this.heightAnim = anim;
    const done = (): void => {
      this.heightAnim = null;
      // 重記當前實際高度（動畫期間內容若又變，以最終佈局為準）後恢復觀察
      this.lastCardHeight = card.offsetHeight;
      this.resizeObs?.observe(card);
    };
    anim.onfinish = done;
    anim.oncancel = () => { this.heightAnim = null; };
  }

  private teardownHeightObserver(): void {
    this.resizeObs?.disconnect();
    this.resizeObs = null;
    this.heightAnim?.cancel();
    this.heightAnim = null;
    this.lastCardHeight = null;
  }

  private cardEl(): HTMLElement | null {
    return (this.elRef.nativeElement as HTMLElement).querySelector('.modal-card');
  }

  private easeEnter(): string {
    const v = getComputedStyle(document.documentElement).getPropertyValue('--ease-enter').trim();
    return v || 'cubic-bezier(0.215, 0.61, 0.355, 1)';
  }

  private prefersReducedMotion(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    );
  }

  protected onBackdropClick(): void {
    // dirty 時 canDismiss=false → backdrop 完全 inert，不 emit（不關閉，避免誤觸丟失輸入）
    if (this.canDismiss) this.backdropClick.emit();
  }

  isTopmost(): boolean {
    return this.modalStack.isTopmost(this.modalId);
  }
}
