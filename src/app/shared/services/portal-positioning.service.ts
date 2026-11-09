import { ElementRef, ErrorHandler, Injectable, NgZone, inject } from '@angular/core';
import { ModalStackService } from '../../core/services/modal-stack.service';
import { ModalOpenNotifier } from '../../core/services/modal-open-notifier.service';

export type Placement =
  | 'top' | 'bottom' | 'left' | 'right'
  | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';

export type CloseReason =
  | 'escape' | 'click-outside' | 'modal-open' | 'trigger-removed' | 'manual';

export interface AttachOptions {
  /** 預設 'bottom'；point-anchored 模式預設 'bottom-start' */
  placement?: Placement;
  /** 預設 true；date-picker 用 false */
  trackScroll?: boolean;
  /** 預設 false；error-tooltip 用 true */
  closeOnModalOpen?: boolean;
  /** 預設 false；action-menu / autocomplete / select / date-picker 用 true */
  closeOnClickOutside?: boolean;
  /** 預設 true；error-tooltip 應傳 false（隨 errorMessage 狀態，非手動關閉） */
  closeOnEscape?: boolean;
  /**
   * 關閉時通知 caller 原因。
   * reason 為 'modal-open' 時，在 ModalStackService.register 當下同步呼叫，常落在變更偵測途中
   * （例如 app-dialog 的 ngOnChanges）。這時直接改模板綁定的一般欄位（非 signal），開發模式可能丟 NG0100。
   */
  onClose?: (reason: CloseReason) => void;
  /**
   * 預設 'nearest'；兩種策略都在 document capture phase 監聽 scroll（NgZone 外）。
   * - 'nearest'：只有錨點的祖先或整頁捲動才 reposition；錨點上下捲出任何一層 overflow scrollable 祖先
   *   （往上找到 position:fixed 的祖先就停）、或上下捲出視窗時隱藏 panel（tooltip / error-tooltip）
   * - 'document'：任何捲動都 reposition、不隱藏（action-menu / autocomplete / select）
   */
  scrollContainerStrategy?: 'nearest' | 'document';
  /** GAP 間距，預設 4px */
  gap?: number;
  /** effective placement 改變時通知 caller（viewport flip 後，caller 同步箭頭方向等 UI 元素） */
  onPlacementChange?: (placement: Placement) => void;
  /**
   * 邏輯祖先錨點：point-anchored（attachAtPoint，無 trigger 元素）的浮層用此告訴 click-outside
   * 的 ancestor-protection「我邏輯上屬於哪個元素之下」。典型：巢狀 flyout（如下載 submenu）的觸發鈕
   * 位於父選單 panel 內 → 帶入該觸發鈕，點 flyout 內容時父選單不會被誤判成 click-outside 而關閉。
   * 它也就是這個浮層的觸發鈕：按下它本身不算點外面，跟 element-anchored 的 trigger 一樣
   * （浮層不會在按下時先關；再按一次要不要關，由觸發鈕的點擊處理切換）。
   */
  ancestorAnchorEl?: HTMLElement;
  /**
   * 翻轉方向判斷用的「穩定高度」（opt-in）。有值時，上下翻轉決策改用此固定高度而非
   * 即時 panel 高度 → panel 內容筆數變化時不再反覆翻面跳動（autocomplete 手機打字時）。
   */
  stableFlipHeight?: number;
  /**
   * 動態限高上限（opt-in，Rule 15）。有值時，panel maxHeight 夾在
   * min(此上限, 選定方向可用空間) → 鍵盤縮小視窗時不會蓋滿畫面。
   */
  boundMaxHeight?: number;
  /**
   * 停用自動翻轉（opt-in，true 時 reposition 不 flip、永遠維持原 placement）。用於 autocomplete
   * 手機打字情境：鍵盤在下方時強制向下開，避免翻上去後面板高度隨結果筆數變動而近輸入框那側位移。
   */
  disableFlip?: boolean;
}

export interface PortalOverlayRef {
  /** 動態切換方向（caller 在偵測到外部條件變化時呼叫） */
  updatePlacement(placement: Placement): void;
  /** 強制重新計算位置（escape hatch；正常由內建 observer 自動處理） */
  reposition(): void;
  /** 關閉並清理 */
  detach(): void;
}

interface AnchorElement { kind: 'element'; el: HTMLElement; }
interface AnchorPoint { kind: 'point'; x: number; y: number; }
type Anchor = AnchorElement | AnchorPoint;

/** z-index 起始值：確保 portal 永遠位於 modal/wizard（z ~ 500）之上，對齊 pre-migration 行為 */
const Z_INDEX_FLOOR = 9999;

class InternalOverlayRef implements PortalOverlayRef {
  private rafId: number | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private intersectionObserver: IntersectionObserver | null = null;
  /** nearest 策略：錨點往上所有 overflow scrollable 祖先（判斷要不要隱藏用） */
  private scrollParents: HTMLElement[] = [];
  private onScroll = (e: Event) => {
    // nearest：只有錨點的祖先（或整頁）捲動會移動錨點。捲別的元素（例如 body 底下的選單清單）不用重算，
    // 不然表單上每個開著的錯誤提示都會被叫醒。
    if (this.options.scrollContainerStrategy === 'nearest' && this.anchor.kind === 'element') {
      const target = e.target;
      const movesAnchor = target === document || target === document.documentElement || target === document.body
        || (target instanceof Node && target.contains(this.anchor.el));
      if (!movesAnchor) return;
    }
    this.scheduleReposition();
  };
  private onResize = () => this.scheduleReposition();
  private detached = false;
  private lastEffectivePlacement: Placement | null = null;

  /** 開啟時的 ModalStack stackSize；closeOnModalOpen 用此判斷是否要關閉 */
  readonly openedAtStackSize: number;

  constructor(
    private readonly anchor: Anchor,
    private readonly panelEl: HTMLElement,
    private placement: Placement,
    private readonly options: Required<Pick<AttachOptions,
      'trackScroll' | 'closeOnModalOpen' | 'closeOnClickOutside' | 'closeOnEscape' | 'scrollContainerStrategy' | 'gap'>> & { onClose?: (reason: CloseReason) => void; onPlacementChange?: (placement: Placement) => void; ancestorAnchorEl?: HTMLElement; stableFlipHeight?: number; boundMaxHeight?: number; disableFlip?: boolean },
    private readonly modalStackSize: number,
    private readonly zIndex: number,
    private readonly removeFromService: (ref: InternalOverlayRef) => void,
  ) {
    this.openedAtStackSize = modalStackSize;
    this.setupPanelStyle();
    this.attachObservers();
    this.attachScrollListeners();
    requestAnimationFrame(() => this.reposition());
  }

  get triggerEl(): HTMLElement | null {
    return this.anchor.kind === 'element' ? this.anchor.el : null;
  }

  /** 邏輯祖先錨點（point-anchored 浮層用，供 ancestor-protection 判斷）；無則 null */
  get ancestorAnchorEl(): HTMLElement | null {
    return this.options.ancestorAnchorEl ?? null;
  }

  get isCloseOnClickOutside(): boolean { return this.options.closeOnClickOutside; }
  get isCloseOnEscape(): boolean { return this.options.closeOnEscape; }
  get isCloseOnModalOpen(): boolean { return this.options.closeOnModalOpen; }

  panelContains(target: EventTarget | null): boolean {
    if (!(target instanceof Node)) return false;
    return this.panelEl.contains(target);
  }

  triggerContains(target: EventTarget | null): boolean {
    if (this.anchor.kind !== 'element') return false;
    if (!(target instanceof Node)) return false;
    return this.anchor.el.contains(target);
  }

  /** 按到的是不是邏輯祖先錨點（point-anchored 浮層的「觸發鈕」，例如上層選單裡打開它的那一項） */
  ancestorAnchorContains(target: EventTarget | null): boolean {
    if (!(target instanceof Node)) return false;
    return !!this.options.ancestorAnchorEl?.contains(target);
  }

  updatePlacement(placement: Placement): void {
    this.placement = placement;
    this.scheduleReposition();
  }

  reposition(): void {
    if (this.detached) return;
    // 以下所有運算都在 **visual viewport 座標**（anchorRect 來自 getBoundingClientRect，
    // 與 vw/vh 同框；可視區間就是 [0, vh]）。寫入 style.top/left 前再換算成 fixed 座標，
    // 見本函式末端的座標換算註解。
    const vw = window.innerWidth;
    const vvp = window.visualViewport;
    const vh = (vvp?.height ?? window.innerHeight);

    let anchorRect: { top: number; left: number; right: number; bottom: number; width: number; height: number };

    if (this.anchor.kind === 'element') {
      const r = this.anchor.el.getBoundingClientRect();
      // anchor 已歸零（被 *ngIf 移除但 IntersectionObserver 還沒觸發）→ 主動 detach
      if (r.width === 0 && r.height === 0) {
        this.close('trigger-removed');
        return;
      }
      anchorRect = { top: r.top, left: r.left, right: r.right, bottom: r.bottom, width: r.width, height: r.height };

      // nearest 策略：錨點上下捲出任何一層可捲動祖先、或上下捲出視窗（visual 座標 [0, vh]）時隱藏（tooltip / error-tooltip）。
      // 只看最近一層不夠：最近的外框可能自己不會捲（例如只設了 overflow:auto 的區塊），真正在捲的是外層或整頁，
      // 錨點早已不在畫面上，面板卻被夾在視窗邊緣顯示（2026-11-06 Storybook 說明頁實測）。
      if (this.options.scrollContainerStrategy === 'nearest' && this.options.trackScroll) {
        const visible = r.bottom > 0 && r.top < vh && this.scrollParents.every((p) => {
          const c = p.getBoundingClientRect();
          return r.bottom > c.top && r.top < c.bottom;
        });
        this.panelEl.style.display = visible ? '' : 'none';
        if (!visible) return;
      }
    } else {
      anchorRect = {
        top: this.anchor.y, left: this.anchor.x,
        right: this.anchor.x, bottom: this.anchor.y,
        width: 0, height: 0,
      };
    }

    const panelW = this.panelEl.offsetWidth || 0;
    let panelH = this.panelEl.offsetHeight || 0;
    const gap = this.options.gap;
    // 翻轉決策改用「穩定高度」（opt-in）：panel 內容筆數變化時不重算翻面，消除跳動
    const flipH = this.options.stableFlipHeight ?? panelH;

    // viewport flip：根據 placement 計算 base，空間不足時翻轉。
    // disableFlip 時整段跳過、維持原 placement（autocomplete 手機打字：強制向下開，
    // 避免翻上去後面板高度隨結果筆數變動而近輸入框那側位移）。
    let placement = this.placement;
    if (!this.options.disableFlip) {
      if (placement === 'bottom' || placement === 'bottom-start' || placement === 'bottom-end') {
        if (anchorRect.bottom + gap + flipH > vh && anchorRect.top - gap - flipH >= 0) {
          placement = placement.replace('bottom', 'top') as Placement;
        }
      } else if (placement === 'top' || placement === 'top-start' || placement === 'top-end') {
        if (anchorRect.top - gap - flipH < 0 && anchorRect.bottom + gap + flipH <= vh) {
          placement = placement.replace('top', 'bottom') as Placement;
        }
      } else if (placement === 'left') {
        if (anchorRect.left - gap - panelW < 0 && anchorRect.right + gap + panelW <= vw) {
          placement = 'right';
        }
      } else if (placement === 'right') {
        if (anchorRect.right + gap + panelW > vw && anchorRect.left - gap - panelW >= 0) {
          placement = 'left';
        }
      }
    }

    // 通知 caller effective placement 是否改變（viewport flip 後同步箭頭等 UI 元素）
    if (placement !== this.lastEffectivePlacement) {
      this.lastEffectivePlacement = placement;
      this.options.onPlacementChange?.(placement);
    }

    // 動態限高（opt-in，Rule 15）：把 panel 夾在「選定方向可用空間」與設計上限之間，
    // 鍵盤縮小視窗（visualViewport）時不會蓋滿畫面；panelH 同步收斂供下方定位運算使用。
    if (this.options.boundMaxHeight != null) {
      const margin = 8;
      const isTop = placement.startsWith('top');
      const avail = isTop
        ? anchorRect.top - gap - margin
        : vh - (anchorRect.bottom + gap) - margin;
      const capped = Math.max(120, Math.min(this.options.boundMaxHeight, avail));
      this.panelEl.style.maxHeight = capped + 'px';
      panelH = Math.min(panelH, capped);
    }

    let top = 0, left = 0;
    switch (placement) {
      case 'bottom':
        top = anchorRect.bottom + gap;
        left = anchorRect.left + (anchorRect.width - panelW) / 2;
        break;
      case 'bottom-start':
        top = anchorRect.bottom + gap;
        left = anchorRect.left;
        break;
      case 'bottom-end':
        top = anchorRect.bottom + gap;
        left = anchorRect.right - panelW;
        break;
      case 'top':
        top = anchorRect.top - gap - panelH;
        left = anchorRect.left + (anchorRect.width - panelW) / 2;
        break;
      case 'top-start':
        top = anchorRect.top - gap - panelH;
        left = anchorRect.left;
        break;
      case 'top-end':
        top = anchorRect.top - gap - panelH;
        left = anchorRect.right - panelW;
        break;
      case 'left':
        top = anchorRect.top + (anchorRect.height - panelH) / 2;
        left = anchorRect.left - gap - panelW;
        break;
      case 'right':
        top = anchorRect.top + (anchorRect.height - panelH) / 2;
        left = anchorRect.right + gap;
        break;
    }

    // 夾在 viewport 邊界內（visual viewport 座標，可視區間 = [0, vh]）
    left = Math.max(4, Math.min(left, vw - panelW - 4));
    top = Math.max(4, Math.min(top, vh - panelH - 4));

    // ── visual → fixed 座標換算（iOS 鍵盤，錯一次代價高）────────────────────────
    // getBoundingClientRect() 回傳 **visual viewport** 座標；position:fixed 的 top/left
    // 吃的是 **layout viewport** 座標。iOS Safari 鍵盤開啟時 visual viewport 會在 layout
    // viewport 內下移，兩者相差 (offsetLeft, offsetTop) → 直接把上面算好的值寫進 style
    // 會讓浮層整體上移 offsetTop，落到可視範圍外（手機下拉選單被切在畫面頂端、選不到）。
    // 實測（2026-07-25 真 iPhone，推薦員工 autocomplete 鍵盤開啟）：offsetTop=208 時
    // style.top=212px 的面板量到 getBoundingClientRect().top=4 → 212 − 208 = 4，差值恰為 offsetTop。
    // 桌機／鍵盤收合時 offset 恆為 0 → 行為完全不變。同源坑：toast 的 --vv-offset-top。
    this.panelEl.style.position = 'fixed';
    this.panelEl.style.top = (top + (vvp?.offsetTop ?? 0)) + 'px';
    this.panelEl.style.left = (left + (vvp?.offsetLeft ?? 0)) + 'px';
    this.panelEl.style.right = 'auto';
    this.panelEl.style.bottom = 'auto';
  }

  detach(): void {
    this.close('manual');
  }

  closeWithReason(reason: CloseReason): void {
    this.close(reason);
  }

  private close(reason: CloseReason): void {
    if (this.detached) return;
    this.detached = true;
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
    this.resizeObserver?.disconnect();
    this.intersectionObserver?.disconnect();
    this.detachScrollListeners();
    this.removeFromService(this);
    this.options.onClose?.(reason);
  }

  private setupPanelStyle(): void {
    this.panelEl.style.position = 'fixed';
    this.panelEl.style.zIndex = String(this.zIndex);
  }

  private attachObservers(): void {
    if (this.anchor.kind !== 'element') return;
    const target = this.anchor.el;

    // ResizeObserver：trigger 尺寸變化（如 autocomplete chips 增減）→ 自動 reposition
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.scheduleReposition());
      this.resizeObserver.observe(target);
    }

    // IntersectionObserver：trigger 不可見（被 *ngIf 移除 / display:none）→ 自動 detach
    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting && entry.intersectionRatio === 0) {
            // intersectionRatio = 0 代表完全不可見；可能是被移除或滑出 viewport
            // 但若 trigger 還在 layout、只是滑出 viewport，我們不該 detach（scroll 仍可帶回視野）
            // 用 boundingClientRect 寬高判斷：歸零 = 真的被移除
            if (entry.boundingClientRect.width === 0 && entry.boundingClientRect.height === 0) {
              this.close('trigger-removed');
            }
          }
          // 錨點進出視窗不一定伴隨捲動（例如上方區塊收合，欄位被推進視窗）：排一次 reposition，
          // nearest 策略藏起來的面板才會再出現，移出視窗的才會藏起來。已 close 時 scheduleReposition 不做事。
          this.scheduleReposition();
        }
      });
      this.intersectionObserver.observe(target);
    }
  }

  private attachScrollListeners(): void {
    if (!this.options.trackScroll) return;

    // 全局 capture phase：任何 ancestor（含整頁）捲動都觸發 reposition。
    // nearest 以前只聽最近一層 scroll parent：外層或整頁捲動時收不到，面板停在原地。
    document.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
    if (this.options.scrollContainerStrategy === 'nearest' && this.anchor.kind === 'element') {
      this.scrollParents = this.findScrollParents(this.anchor.el);
    }
    window.addEventListener('resize', this.onResize, { passive: true });
  }

  private detachScrollListeners(): void {
    document.removeEventListener('scroll', this.onScroll, { capture: true });
    this.scrollParents = [];
    window.removeEventListener('resize', this.onResize);
  }

  private findScrollParents(el: HTMLElement): HTMLElement[] {
    const found: HTMLElement[] = [];
    let parent = el.parentElement;
    while (parent && parent !== document.body) {
      const style = getComputedStyle(parent);
      if (style.overflowY === 'auto' || style.overflowY === 'scroll') found.push(parent);
      // position:fixed 的祖先跳出外層容器的裁切（例如沒搬到 body 的 app-drawer-shell），再往外的容器不算
      if (style.position === 'fixed') break;
      parent = parent.parentElement;
    }
    return found;
  }

  private scheduleReposition(): void {
    if (this.detached || this.rafId !== null) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = null;
      this.reposition();
    });
  }
}

@Injectable({ providedIn: 'root' })
export class PortalPositioningService {
  private readonly modalStack = inject(ModalStackService);
  private readonly modalOpenNotifier = inject(ModalOpenNotifier);
  private readonly zone = inject(NgZone);
  private readonly errorHandler = inject(ErrorHandler);
  private readonly refs = new Set<InternalOverlayRef>();
  private documentListenersAttached = false;
  private visualViewportListenersAttached = false;
  /** 單調遞增 z-index；每次 attach 分配下一個值，確保後開的 panel 永遠在先開的上面 */
  private zIndexCounter = Z_INDEX_FLOOR;

  private readonly onPointerDown = (e: PointerEvent) => {
    const refsArr = Array.from(this.refs);
    const target = e.target;

    // Build a "safe" set: refs whose panel/trigger directly contains the click target.
    // point-anchored 浮層沒有 trigger，ancestorAnchorEl 就是它的觸發鈕：按它跟按 element-anchored 的 trigger 一樣不算點外面，
    // 由觸發鈕自己的點擊決定開關（例如再按一次上層選單裡那一項關掉面板）。不這樣的話，按下時先關、放開時又被那一項打開
    const safeRefs = new Set<InternalOverlayRef>(
      refsArr.filter(r => r.panelContains(target) || r.triggerContains(target) || r.ancestorAnchorContains(target)),
    );

    // Ancestor-protection pass:
    // When panels are teleported to body they become DOM siblings, so clicking
    // inside panel B does NOT satisfy A.panelContains(target) even when B's
    // trigger lives inside A's panel.  Walk upward: if any safe ref's trigger
    // (element-anchored) OR ancestorAnchorEl (point-anchored, e.g. nested flyout
    // whose 觸發鈕 lives in the parent menu panel) is physically inside ref_A's
    // panel, then ref_A is a logical ancestor of that safe ref and must also be
    // protected from closing.
    let grew = true;
    while (grew) {
      grew = false;
      for (const ref of refsArr) {
        if (safeRefs.has(ref)) continue;
        for (const safe of safeRefs) {
          const safeAnchor = safe.triggerEl ?? safe.ancestorAnchorEl;
          if (safeAnchor && ref.panelContains(safeAnchor)) {
            safeRefs.add(ref);
            grew = true;
            break;
          }
        }
      }
    }

    for (const ref of refsArr) {
      if (!ref.isCloseOnClickOutside) continue;
      if (!safeRefs.has(ref)) ref.closeWithReason('click-outside');
    }
  };

  private readonly onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    // 只關 topmost：找最後一個（latest attached）closeOnEscape ref
    const candidates = Array.from(this.refs).filter(r => r.isCloseOnEscape);
    const topmost = candidates[candidates.length - 1];
    if (!topmost) return;
    e.stopPropagation();
    topmost.closeWithReason('escape');
  };

  private readonly onVisualViewportChange = () => {
    for (const ref of this.refs) ref.reposition();
  };

  constructor() {
    // 有新的 modal 登記時，當場關掉 closeOnModalOpen 的 ref（比 ref 開啟時的層數多才關）。
    // 不用 effect 讀 stackSize：effect 比 modal 第一次畫出來還晚，app-dialog 一畫出來就記下
    // 「關掉後焦點還給誰」，那時日期面板還開著、焦點在面板的格子上，dialog 會記到即將被移除的格子，
    // 關掉後焦點落到 body。登記當下就關，面板先把焦點還給觸發元素，dialog 記到的才是它。
    // 關閉不在 effect 裡執行，onClose 裡寫 signal 不會丟 NG0600（原本由 effect 關閉時會）。
    // 訂閱掛在 ModalOpenNotifier（DS 內部服務）而不是 ModalStackService：使用端測試常用假物件代替
    // ModalStackService，假物件沒有訂閱方法，浮層服務一建立就會壞。
    // 每個 ref 各自接住錯誤：一個使用端的 onClose 出錯，不能擋住後面的 ref，也不能讓 register（modal 打開）跟著出錯。
    this.modalOpenNotifier.listen((size) => {
      for (const ref of Array.from(this.refs)) {
        if (ref.isCloseOnModalOpen && size > ref.openedAtStackSize) {
          try {
            ref.closeWithReason('modal-open');
          } catch (error) {
            this.errorHandler.handleError(error);
          }
        }
      }
    });
  }

  /** Element-anchored attach — 浮層貼齊 trigger 元素 */
  attach(trigger: ElementRef<HTMLElement>, panel: ElementRef<HTMLElement>, options?: AttachOptions): PortalOverlayRef {
    return this.create({ kind: 'element', el: trigger.nativeElement }, panel.nativeElement, options);
  }

  /**
   * Point-anchored attach — 浮層貼齊指定座標。
   * 座標為 viewport coordinates（與 event.clientX/Y、position: fixed 一致）。
   */
  attachAtPoint(x: number, y: number, panel: ElementRef<HTMLElement>, options?: AttachOptions): PortalOverlayRef {
    return this.create({ kind: 'point', x, y }, panel.nativeElement, { placement: 'bottom-start', ...options });
  }

  private create(anchor: Anchor, panelEl: HTMLElement, options?: AttachOptions): PortalOverlayRef {
    this.ensureDocumentListeners();
    const merged: Required<Pick<AttachOptions,
      'trackScroll' | 'closeOnModalOpen' | 'closeOnClickOutside' | 'closeOnEscape' | 'scrollContainerStrategy' | 'gap'>> & { onClose?: (reason: CloseReason) => void; onPlacementChange?: (placement: Placement) => void; ancestorAnchorEl?: HTMLElement; stableFlipHeight?: number; boundMaxHeight?: number; disableFlip?: boolean } = {
      trackScroll: options?.trackScroll ?? true,
      closeOnModalOpen: options?.closeOnModalOpen ?? false,
      closeOnClickOutside: options?.closeOnClickOutside ?? false,
      closeOnEscape: options?.closeOnEscape ?? true,
      scrollContainerStrategy: options?.scrollContainerStrategy ?? 'nearest',
      gap: options?.gap ?? 4,
      onClose: options?.onClose
        ? (reason: CloseReason) => this.zone.run(() => options.onClose!(reason))
        : undefined,
      onPlacementChange: options?.onPlacementChange
        ? (placement: Placement) => this.zone.run(() => options.onPlacementChange!(placement))
        : undefined,
      ancestorAnchorEl: options?.ancestorAnchorEl,
      stableFlipHeight: options?.stableFlipHeight,
      boundMaxHeight: options?.boundMaxHeight,
      disableFlip: options?.disableFlip,
    };
    const placement: Placement = options?.placement ?? 'bottom';

    // 在 NgZone 外建立：scroll／resize 監聽、requestAnimationFrame、Resize／IntersectionObserver 都不觸發變更偵測。
    // 要通知 Angular 的 onClose／onPlacementChange 已在上面各自 zone.run。
    const ref = this.zone.runOutsideAngular(() => new InternalOverlayRef(
      anchor,
      panelEl,
      placement,
      merged,
      this.modalStack.stackSize(),
      this.zIndexCounter++,
      (r) => this.refs.delete(r),
    ));
    this.refs.add(ref);
    return ref;
  }

  private ensureDocumentListeners(): void {
    if (!this.documentListenersAttached) {
      // 跑在 NgZone 外避免每次 pointerdown / keydown 都觸發 Change Detection
      this.zone.runOutsideAngular(() => {
        document.addEventListener('pointerdown', this.onPointerDown, { capture: true });
        document.addEventListener('keydown', this.onKeyDown);
      });
      this.documentListenersAttached = true;
    }
    if (!this.visualViewportListenersAttached && typeof window !== 'undefined' && window.visualViewport) {
      this.zone.runOutsideAngular(() => {
        window.visualViewport!.addEventListener('resize', this.onVisualViewportChange);
        window.visualViewport!.addEventListener('scroll', this.onVisualViewportChange);
      });
      this.visualViewportListenersAttached = true;
    }
  }
}
