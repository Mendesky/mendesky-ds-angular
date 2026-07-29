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
} from '@angular/core';
import { A11yModule } from '@angular/cdk/a11y';
import { DrawerStateService } from '../../../core/services/drawer-state.service';
import { ModalStackService } from '../../../core/services/modal-stack.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal-shell',
  standalone: true,
  imports: [CommonModule, A11yModule],
  templateUrl: './modal-shell.component.html',
  styleUrls: ['./modal-shell.component.scss'],
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

  /** 對應 aria-labelledby 的元素 ID */
  @Input() ariaLabelledBy = '';

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

  private closeTimer: ReturnType<typeof setTimeout> | null = null;
  private trapTimer: ReturnType<typeof setTimeout> | null = null;
  // ── 內容高度過渡（animateContentHeight）──
  private resizeObs: ResizeObserver | null = null;
  private lastCardHeight: number | null = null;
  private heightAnim: Animation | null = null;
  private renderer = inject(Renderer2);
  private elRef = inject(ElementRef);
  private drawerState = inject(DrawerStateService);
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
      // Modal 開啟時關閉 Nav Drawer
      this.drawerState.close();
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
