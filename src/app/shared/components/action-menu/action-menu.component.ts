import {
  Component, Input, Output, EventEmitter,
  HostListener, ElementRef, AfterViewInit, OnChanges, OnDestroy,
  NgZone, inject, forwardRef,
 ChangeDetectionStrategy, } from '@angular/core';
import { CloseReason, Placement, PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';
import {
  MENU_CONTEXT, MenuContext, expandedMenuTrigger, findMenuTrigger, initialMenuItem, isFormFieldTarget, isInteractiveTarget,
  menuItemsIn,
} from './menu-context';

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [],
  templateUrl: './action-menu.component.html',
  styleUrls: ['./action-menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // 放在裡面的 app-menu-item 透過 MENU_CONTEXT 登記；有登記就是選單模式
  providers: [{ provide: MENU_CONTEXT, useExisting: forwardRef(() => ActionMenuComponent) }],
})
export class ActionMenuComponent implements AfterViewInit, OnChanges, OnDestroy, MenuContext {
  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly positioning = inject(PortalPositioningService);
  private readonly zone = inject(NgZone);

  /** 點擊選單內部的子元素時是否自動 emit closeMenu。預設 true（適合 More 操作選單）；複雜篩選面板設 false。 */
  @Input() autoCloseOnAction = true;

  /** 對齊方向：'left' = 左對齊 trigger，'right' = 右對齊 trigger，'center' = 水平置中 trigger。 */
  @Input() align: 'left' | 'right' | 'center' = 'left';

  /**
   * 外部 anchor element：用於 trigger 不是 host.parentElement 的情境（如 contenteditable 內的 inline chip）。
   * 傳入後走 element-anchored 模式，由 PortalPositioningService 自動 track scroll/resize。
   */
  @Input() anchorEl: HTMLElement | null = null;

  /**
   * Legacy fixed 定位模式（向後相容）：
   * 有傳 fixedTop/fixedLeft 等值時，直接走 attachAtPoint；不傳則走 attach（element-anchored）。
   */
  @Input() fixedMode = false;
  @Input() fixedTop: number | null = null;
  @Input() fixedBottom: number | null = null;
  @Input() fixedRight: number | null = null;
  @Input() fixedLeft: number | null = null;
  @Input() fixedWidth: number | null = null;
  /**
   * 邏輯祖先錨點（僅 fixedMode/point-anchored 用）：巢狀 flyout 的觸發元素（位於父選單 panel 內）。
   * 帶入後，點此 flyout 內容時 click-outside 的 ancestor-protection 不會誤關父選單。
   */
  @Input() ancestorAnchorEl: HTMLElement | null = null;

  /**
   * 打開時是否把焦點移到第一個選項。預設 true（More 選單等：開了就用鍵盤選）。
   * 錨點是輸入框、使用者打開選單後還要繼續打字時設 false（如搜尋框下的「最近開啟」），
   * 否則游標會被搶進選單，接下來打的字進不了輸入框。設 false 時鍵盤進入選單由呼叫端負責。
   * 選單模式下，焦點先停在已選中的那一項，沒有選中項才停第一項。
   */
  @Input() autoFocusFirst = true;

  /**
   * 選單的名稱，選單模式（放了 app-menu-item）才輸出成外框的 aria-label。
   * 用畫面上看得到的字，例如「排序」「每頁顯示筆數」。
   */
  @Input() ariaLabel = '';

  /** 應關閉選單時發射（點擊外部 或 autoCloseOnAction=true 時點擊內部）。 */
  @Output() closeMenu = new EventEmitter<void>();

  private _overlayRef: PortalOverlayRef | null = null;
  /** 記住開啟 menu 前的 focused 元素，Escape 時還原 focus */
  private _triggerEl: HTMLElement | null = null;
  /** focus-when-ready：等非同步內容（skeleton→內容）出現才種初始焦點用。 */
  private _focusObserver: MutationObserver | null = null;
  private _focusTimer: ReturnType<typeof setTimeout> | null = null;

  /** 已登記的 app-menu-item；有任何一個就是選單模式 */
  private readonly _menuItems = new Set<object>();
  /** 這次打開期間進過選單模式。選單項目可能比外框先銷毀，關閉時不能只看當下有沒有項目 */
  private _wasMenu = false;
  /** 外框搬到 body 之前所在的外層元素：記不到觸發鈕時，到這裡找標了 aria-haspopup 的按鈕 */
  private _originParent: HTMLElement | null = null;
  /**
   * 選單開著時認出來的觸發鈕（外層裡 aria-expanded="true" 的那顆）。關閉的過程中觸發鈕的
   * aria-expanded 可能先變回 false，外層裡又有好幾顆時就認不出來，所以趁開著時先記下
   */
  private _openTrigger: HTMLElement | null = null;
  /** role／tabindex 是不是選單模式加上的；只移除自己加的 */
  private _menuAttrsApplied = false;
  /** aria-label 是不是由 ariaLabel 加上的；沒設 ariaLabel 時不動使用端直接寫在外框上的 aria-label */
  private _ariaLabelApplied = false;
  /** 選單模式下是不是因為點了選單外面而關閉（關閉後要再確認一次焦點） */
  private _closedByOutsideClick = false;
  /**
   * 選單開著時最近一次按下（滑鼠或手指）的元素。在 window 的 capture 階段記，
   * 比定位服務在 document 上判斷「點到外面」早一步，關閉時才知道使用者按的是什麼
   */
  private _lastPointerTarget: Element | null = null;
  /** 最近一次按下的那一刻，焦點在不在選單裡（跟 _lastPointerTarget 同時記，瀏覽器這時還沒移動焦點） */
  private _focusInMenuAtPress = false;
  /** 選單模式下最後拿到焦點的選單項目和它的位置：那一項在選單開著時被拿掉，才知道焦點要補到哪 */
  private _focusedItem: HTMLElement | null = null;
  private _focusedIndex = -1;
  private _destroyed = false;

  private readonly _onWindowPointerDown = (event: PointerEvent): void => {
    this._lastPointerTarget = event.target instanceof Element ? event.target : null;
    this._focusInMenuAtPress = (this.el.nativeElement as HTMLElement).contains(document.activeElement);
  };

  /** MenuContext：app-menu-item 建立時登記 */
  register(item: object): void {
    this._menuItems.add(item);
    this._wasMenu = true;
    this._syncMenuAttrs();
  }

  /** MenuContext：app-menu-item 銷毀時取消登記 */
  unregister(item: object): void {
    this._menuItems.delete(item);
    this._syncMenuAttrs();
    // 焦點所在的項目被拿掉時，焦點會掉回 body，方向鍵和 Esc 都收不到；等這一輪畫面更新完再補回選單裡
    if (this._focusedItem) queueMicrotask(() => this._refocusAfterItemRemoved());
  }

  ngOnChanges(): void {
    this._syncMenuAttrs();
  }

  ngAfterViewInit(): void {
    this._triggerEl = document.activeElement as HTMLElement | null;
    const host = this.el.nativeElement as HTMLElement;
    this._originParent = host.parentElement;
    this.zone.runOutsideAngular(() => window.addEventListener('pointerdown', this._onWindowPointerDown, true));
    // 原生觸發鈕的 aria-expanded 這時已經是 true；app-button 裡的按鈕比選單晚一步更新，下一幀再認一次
    this._rememberOpenTrigger();
    requestAnimationFrame(() => this._rememberOpenTrigger());

    if (this.fixedMode && this._hasLegacyCoords()) {
      // position:fixed 在 transform / backdrop-filter 祖先（如 modal-card--glass）內會被
      // containing block 困住、座標改相對容器解析 — 與 element-anchored 模式一致搬到 body，
      // 讓 fixedTop/fixedRight 真正以 viewport 為座標系（ngOnDestroy 已涵蓋自 body 移除）
      document.body.appendChild(host);
      this._attachFixed(host);
      return;
    }

    // Element-anchored：搬到 body → service 接管定位、scroll/resize、click-outside
    const anchorEl = this.anchorEl ?? (host.parentElement as HTMLElement);
    document.body.appendChild(host);
    this._overlayRef = this.positioning.attach(
      new ElementRef(anchorEl),
      this.el,
      {
        placement: this.align === 'right' ? 'bottom-end' : this.align === 'center' ? 'bottom' : 'bottom-start',
        gap: 6,
        trackScroll: true,
        scrollContainerStrategy: 'document',
        closeOnClickOutside: true,
        closeOnEscape: false,
        onClose: (reason) => this._onOverlayClose(reason),
      },
    );
    if (this.autoFocusFirst) requestAnimationFrame(() => this._focusFirstWhenReady());
  }

  ngOnDestroy(): void {
    this._destroyed = true;
    window.removeEventListener('pointerdown', this._onWindowPointerDown, true);
    this._teardownFocusWatch();
    this._overlayRef?.detach();
    const host = this.el.nativeElement as HTMLElement;
    const trigger = this._wasMenu ? this._menuTrigger() : null;
    // 點外面關掉時，下面三種情況不拉回這個選單的觸發鈕：
    // - 按到的是別的按鈕、連結、輸入框：使用者換去操作那個東西了，焦點交給瀏覽器處理
    //   （Chrome 會給它焦點，Safari 點按鈕不給、留在 body）
    // - 按下那一刻焦點不在選單裡：例如 autoFocusFirst 設 false、焦點一直在錨點的輸入框，使用者沒在用這個選單
    // - 觸發鈕是輸入框（例如搜尋框下的「最近開啟」）：使用者是點走了，游標不該跳回輸入框；
    //   這種輸入框常常一拿到焦點就打開下拉，還回去會讓選單關了又開
    const outsideLeavesFocus = this._closedByOutsideClick
      && (isInteractiveTarget(this._lastPointerTarget) || !this._focusInMenuAtPress || isFormFieldTarget(trigger));
    // 選單模式：選完、點外面或其他原因關掉時，焦點還在選單裡（或隨選單移除掉回 body）就還給觸發鈕；
    // 焦點已經被別的元素拿走（例如選項打開了對話框）就不搶
    const restoreFocus = this._wasMenu && !outsideLeavesFocus && this._focusLostWith(host);
    if (host.parentNode === document.body) {
      document.body.removeChild(host);
    }
    // 點外面關掉的不捲動頁面：觸發鈕可能已經捲出畫面，使用者是用滑鼠點別處，不該被捲回觸發鈕那裡。
    // 其他方式關掉的（Esc、Tab、選完一項）照預設捲到看得到觸發鈕，用鍵盤的人才看得到焦點在哪
    if (restoreFocus) trigger?.focus(this._closedByOutsideClick ? { preventScroll: true } : undefined);
    // 點外面空白處關掉的：瀏覽器接著處理同一次滑鼠按下，會把焦點移回 body，
    // 或停在按到的地方外面那層點得到焦點的外框（例如 tabindex="-1" 的對話框卡片）。
    // 等這次點擊處理完再看一次，焦點落在這兩種地方才還給觸發鈕
    if (this._wasMenu && this._closedByOutsideClick && !outsideLeavesFocus) {
      const pressed = this._lastPointerTarget;
      setTimeout(() => {
        if (trigger?.isConnected && this._focusParkedAfterPress(pressed)) trigger.focus({ preventScroll: true });
      });
    }
  }

  @HostListener('click', ['$event'])
  onHostClick(event?: MouseEvent): void {
    if (this._isMenu) {
      this._onMenuClick(event);
      return;
    }
    if (this.autoCloseOnAction) {
      this.closeMenu.emit();
    }
  }

  /** 選單模式：記下焦點停在第幾個選單項目（那一項之後被拿掉時用） */
  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent): void {
    if (!this._isMenu) return;
    const items = menuItemsIn(this.el.nativeElement as HTMLElement);
    const idx = items.indexOf(event.target as HTMLElement);
    this._focusedItem = idx >= 0 ? items[idx] : null;
    this._focusedIndex = idx;
  }

  /** 鍵盤導覽：Arrow Up/Down 移動焦點，Enter/Space 觸發 item，Escape 關閉 */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this._isMenu) {
      this._onMenuKeydown(event);
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        if (tag === 'input' || tag === 'select' || tag === 'textarea') return;
        event.preventDefault();
        const items = this._getFocusableItems();
        if (!items.length) return;
        const idx = items.indexOf(document.activeElement as HTMLElement);
        if (event.key === 'ArrowDown') {
          items[(idx + 1) % items.length].focus();
        } else {
          items[idx <= 0 ? items.length - 1 : idx - 1].focus();
        }
        break;
      }
      case 'Enter':
      case ' ': {
        // 跳過表單元素：input/textarea/select 有各自的原生 Enter/Space 行為
        const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
        if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') return;
        event.preventDefault();
        // 消費後不再冒泡：否則同一個 Enter 會續傳到 document 層快速鍵（如 kanban Enter 重開卡片選單），
        // 造成選單「關了又被重開、浮在剛開的 modal 上」（比照下方 Escape 分支）。
        event.stopPropagation();
        // WAI-ARIA Menu Pattern：Enter/Space 啟動 focused menuitem。
        // 主動 click 繞過「程式化 .focus() 後原生 Enter 不自動 trigger click」的瀏覽器差異。
        (document.activeElement as HTMLElement)?.click();
        break;
      }
      case 'Escape':
        event.stopPropagation();
        this._triggerEl?.focus();
        this.closeMenu.emit();
        break;
    }
  }

  /**
   * 定位服務關閉浮層時（點選單外面等）：照舊發 closeMenu；選單模式另外記下是不是點外面關的。
   * 看的是這次打開期間有沒有進過選單模式，不是當下：項目可能已經全被拿掉
   */
  private _onOverlayClose(reason: CloseReason): void {
    if (reason === 'manual') return;
    if (reason === 'click-outside' && this._wasMenu) this._closedByOutsideClick = true;
    this.closeMenu.emit();
  }

  private get _isMenu(): boolean {
    return this._menuItems.size > 0;
  }

  /** 選單模式才加 role="menu"、tabindex="-1"（點分隔線時接住焦點，但不進 Tab 順序）與 aria-label */
  private _syncMenuAttrs(): void {
    const host = this.el.nativeElement as HTMLElement;
    if (this._isMenu) {
      host.setAttribute('role', 'menu');
      host.setAttribute('tabindex', '-1');
      this._menuAttrsApplied = true;
    } else if (this._menuAttrsApplied) {
      host.removeAttribute('role');
      host.removeAttribute('tabindex');
      this._menuAttrsApplied = false;
    }
    if (this._isMenu && this.ariaLabel) {
      host.setAttribute('aria-label', this.ariaLabel);
      this._ariaLabelApplied = true;
    } else if (this._ariaLabelApplied) {
      host.removeAttribute('aria-label');
      this._ariaLabelApplied = false;
    }
  }

  /**
   * 選單模式的鍵盤（WAI-ARIA APG Menu）：上下方向鍵只在選單項目間循環（停用的也停得到）、
   * Home／End 跳頭尾、Enter／空白鍵執行目前這一項、Esc 與 Tab 關閉並把焦點交回觸發鈕。
   */
  private _onMenuKeydown(event: KeyboardEvent): void {
    // 用輸入法選字時的按鍵（Esc 取消選字、Enter 確定）是給輸入法的，選單不處理
    if (event.isComposing || event.keyCode === 229) return;
    // 焦點在輸入框、下拉、可編輯區時（規格不允許放進選單，萬一放了）：跟一般模式一樣只有 Esc 關選單，
    // 其他鍵交給欄位自己，不然空白打不進去、方向鍵移不了游標、Tab 會把選單關掉
    if (event.key !== 'Escape' && isFormFieldTarget(event.target)) return;
    const items = menuItemsIn(this.el.nativeElement as HTMLElement);
    const active = document.activeElement as HTMLElement | null;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        if (!items.length) return;
        const idx = active ? items.indexOf(active) : -1;
        if (event.key === 'ArrowDown') {
          items[(idx + 1) % items.length].focus();
        } else {
          items[idx <= 0 ? items.length - 1 : idx - 1].focus();
        }
        break;
      }
      case 'Home':
      case 'End':
        event.preventDefault();
        (event.key === 'Home' ? items[0] : items[items.length - 1])?.focus();
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        // 同一般模式：不冒泡到 document 層快速鍵；主動 click 讓程式化 focus 後的 Enter 也會執行
        event.stopPropagation();
        active?.click();
        break;
      case 'Escape':
        event.stopPropagation();
        this._menuTrigger()?.focus();
        this.closeMenu.emit();
        break;
      case 'Tab':
        // 不 preventDefault：焦點先交回觸發鈕，瀏覽器接著把它移到觸發鈕的下一個（Shift+Tab 是上一個）元素
        this._menuTrigger()?.focus();
        this.closeMenu.emit();
        break;
    }
  }

  /**
   * 選單模式的點擊：只有點到可用的選單項目才關（autoCloseOnAction 為 true 時）。
   * 點到分隔線、空白處不關，焦點留在選單外框；點到停用的項目也不關，焦點停在那一項。方向鍵照樣能用。
   */
  private _onMenuClick(event?: MouseEvent): void {
    const host = this.el.nativeElement as HTMLElement;
    const target = event?.target instanceof Node ? event.target : null;
    const item = target ? menuItemsIn(host).find((el) => el.contains(target)) : undefined;
    if (!item) {
      // 點到輸入框這類欄位時焦點留給它（見 _onMenuKeydown）
      if (!isFormFieldTarget(target)) host.focus();
      return;
    }
    if (item.getAttribute('aria-disabled') === 'true') {
      item.focus();
      return;
    }
    if (this.autoCloseOnAction) this.closeMenu.emit();
  }

  /** 焦點還在選單裡、或已經掉回 body（選單從畫面移除時，裡面的焦點會掉回 body） */
  private _focusLostWith(host: HTMLElement): boolean {
    const active = document.activeElement;
    return !active || active === document.body || active === document.documentElement || host.contains(active);
  }

  /**
   * 點外面空白處、瀏覽器處理完這次按下之後，焦點算不算「沒交給任何控制項」：
   * 掉在 body，或停在按到的地方外面那層、本身不是控制項的外框（例如 tabindex="-1" 的對話框卡片）
   */
  private _focusParkedAfterPress(pressed: Element | null): boolean {
    const active = document.activeElement;
    if (!active || active === document.body || active === document.documentElement) return true;
    return !!pressed && active.contains(pressed) && !isInteractiveTarget(active);
  }

  /** 選單開著時認一次觸發鈕；認得出來才記，認不出來保留之前記的 */
  private _rememberOpenTrigger(): void {
    if (this._destroyed) return;
    const found = expandedMenuTrigger(this.anchorEl ?? this._originParent);
    if (found) this._openTrigger = found;
  }

  /**
   * 選單模式要把焦點還給的觸發鈕。打開前有焦點的元素，要在選單原本的外層裡（或就是錨點本身）才算數：
   * Safari 上從別的選單直接點過來時，打開前的焦點可能還停在上一個選單的觸發鈕。
   * 不算數或記不到時（Safari 用滑鼠點按鈕不給焦點，打開前焦點在 body），改用開著時認出的觸發鈕，
   * 再不行就到外層元素裡找會打開選單的按鈕（見 findMenuTrigger）。
   */
  private _menuTrigger(): HTMLElement | null {
    const host = this.el.nativeElement as HTMLElement;
    const scope = this.anchorEl ?? this._originParent;
    const t = this._triggerEl;
    const usable = !!t && t !== document.body && t !== document.documentElement && t.isConnected && !host.contains(t);
    if (usable && (!scope || scope.contains(t))) return t;
    const opened = this._openTrigger?.isConnected ? this._openTrigger : null;
    return opened ?? findMenuTrigger(scope) ?? (usable ? t : null);
  }

  /**
   * 焦點所在的選單項目被拿掉、焦點掉回 body 時：補到同一個位置現在的那一項。
   * 項目全沒了，外框就不是選單了（tabindex 也拿掉了、接不住焦點），焦點改還給觸發鈕
   */
  private _refocusAfterItemRemoved(): void {
    const host = this.el.nativeElement as HTMLElement;
    const lost = this._focusedItem;
    if (this._destroyed || !lost || host.contains(lost)) return;
    const active = document.activeElement;
    if (active && active !== document.body && active !== document.documentElement) return;
    if (!this._isMenu) {
      this._focusedItem = null;
      this._menuTrigger()?.focus();
      return;
    }
    const items = menuItemsIn(host);
    (items[Math.min(this._focusedIndex, items.length - 1)] ?? host).focus();
  }

  private _getFocusableItems(): HTMLElement[] {
    const host = this.el.nativeElement as HTMLElement;
    return Array.from(
      host.querySelectorAll<HTMLElement>('button:not(:disabled), [role="menuitem"]:not([disabled])')
    );
  }

  /** 種初始焦點：一般模式到第一個可聚焦項；選單模式到已選中的那項，沒有就第一項。成功回 true、無可聚焦項回 false。 */
  private _focusFirst(): boolean {
    const first = this._isMenu
      ? initialMenuItem(menuItemsIn(this.el.nativeElement as HTMLElement))
      : this._getFocusableItems()[0];
    if (!first) return false;
    first.focus();
    return true;
  }

  /**
   * 種初始焦點，並容忍「非同步內容」：若當下沒有可聚焦項（如 flyout 正顯示 loading skeleton，
   * 內容尚未由 API 回填），掛 MutationObserver 等內容出現的那一刻立即補種焦點、隨即 disconnect。
   * 同步內容（一般 More 選單）在首次即成功、不會掛 observer。安全上限避免洩漏。
   * （對齊 DS pattern loading.api-hydration-skeleton：skeleton 無 tabindex、內容備妥才進焦點。）
   */
  private _focusFirstWhenReady(): void {
    if (this._focusFirst()) return;
    const host = this.el.nativeElement as HTMLElement;
    this._focusObserver = new MutationObserver(() => {
      if (this._focusFirst()) this._teardownFocusWatch();
    });
    this._focusObserver.observe(host, { childList: true, subtree: true });
    this._focusTimer = setTimeout(() => this._teardownFocusWatch(), 1000);
  }

  private _teardownFocusWatch(): void {
    this._focusObserver?.disconnect();
    this._focusObserver = null;
    if (this._focusTimer) { clearTimeout(this._focusTimer); this._focusTimer = null; }
  }

  private _hasLegacyCoords(): boolean {
    return this.fixedTop !== null || this.fixedBottom !== null ||
           this.fixedLeft !== null || this.fixedRight !== null;
  }

  /**
   * Point-anchored 模式：將 fixedTop/fixedLeft/fixedBottom/fixedRight 轉為
   * viewport 座標，交由 attachAtPoint 定位（含 viewport flip 與 click-outside 偵測）。
   *
   * fixedBottom/fixedRight 的對應：
   *   fixedLeft  + fixedTop    → placement: 'bottom-start'（top-left 錨點）
   *   fixedRight + fixedTop    → placement: 'bottom-end'  （top-right 錨點）
   *   fixedLeft  + fixedBottom → placement: 'top-start'   （bottom-left 錨點）
   *   fixedRight + fixedBottom → placement: 'top-end'     （bottom-right 錨點）
   */
  private _attachFixed(host: HTMLElement): void {
    if (this.fixedWidth !== null) host.style.width = this.fixedWidth + 'px';

    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const x = this.fixedLeft  !== null ? this.fixedLeft
             : (this.fixedRight  !== null ? vw - this.fixedRight  : 0);
    const y = this.fixedTop   !== null ? this.fixedTop
             : (this.fixedBottom !== null ? vh - this.fixedBottom : 0);

    let placement: Placement = 'bottom-start';
    if      (this.fixedBottom !== null && this.fixedRight !== null) placement = 'top-end';
    else if (this.fixedBottom !== null)                             placement = 'top-start';
    else if (this.fixedRight  !== null)                             placement = 'bottom-end';

    this._overlayRef = this.positioning.attachAtPoint(x, y, this.el, {
      placement,
      gap: 0,
      trackScroll: false,
      closeOnClickOutside: true,
      closeOnEscape: false,
      ancestorAnchorEl: this.ancestorAnchorEl ?? undefined,
      onClose: (reason) => this._onOverlayClose(reason),
    });
    if (this.autoFocusFirst) requestAnimationFrame(() => this._focusFirstWhenReady());
  }
}
