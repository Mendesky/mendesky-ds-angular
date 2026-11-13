import {
  Component, Input, Output, EventEmitter,
  HostListener, ElementRef, AfterViewInit, OnChanges, OnDestroy,
  NgZone, inject, forwardRef, signal, ViewChild,
 ChangeDetectionStrategy, } from '@angular/core';
import { PortalTeleportDirective } from '../../directives/portal-teleport.directive';
import { CloseReason, Placement, PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';
import {
  MENU_CONTEXT, MenuContext, MenuItemDetails, WIDGET_ROLES, expandedMenuTrigger, initialMenuItem, isFormFieldTarget, isInteractiveTarget,
  menuItemsIn,
} from './menu-context';

@Component({
  selector: 'app-action-menu',
  standalone: true,
  imports: [PortalTeleportDirective],
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
   * 帶入後，點此 flyout 內容時 click-outside 的 ancestor-protection 不會誤關父選單；
   * 按下這個元素本身也不算點外面（flyout 不會在按下時先關，再按一次關不關由使用端的切換決定）。
   * 選單裡的那一項在 flyout 開著時按右方向鍵，也靠它找到這個 flyout、把焦點移進來。
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

  /** 已登記的 app-menu-item；有任何一個就是選單模式 */
  private readonly _menuItems = new Set<object>();
  /** 這次打開期間進過選單模式。選單項目可能比外框先銷毀，關閉時不能只看當下有沒有項目 */
  private _wasMenu = false;
  /** 外框搬到 body 之前所在的外層元素：記不到觸發鈕時，到這裡找標了 aria-expanded="true" 的選單按鈕 */
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
  /** 最近一次按下的是不是選單裡面。要在按下時記：按到的選項可能接著被重建、離開畫面，關閉時已經查不出來 */
  private _pressedInMenu = false;
  /**
   * 點擊剛傳進外框、還沒到選項自己的點擊監聽之前，按到的是哪個選單項目、它當時停用沒、會不會在旁邊打開面板。
   * 選項的 itemClick 跑完後畫面會先更新一次，外框收到這次點擊時，那一項可能已經停用、被重建或換掉了圖示
   */
  private _clickSnapshot: { event: Event; item: HTMLElement | null; disabled: boolean; opensPanel: boolean } | null = null;
  /** 選單模式下最後拿到焦點的選單項目和它的位置：那一項在選單開著時被拿掉，才知道焦點要補到哪 */
  private _focusedItem: HTMLElement | null = null;
  private _focusedIndex = -1;
  private _destroyed = false;

  /** 補充說明面板目前顯示的內容與座標；null＝沒有面板 */
  readonly detailsPanel = signal<DetailsPanelState | null>(null);
  @ViewChild('detailsEl') private _detailsEl?: ElementRef<HTMLElement>;
  /** 面板目前是哪一項的說明，以及那一項給的內容（位置要重算時用） */
  private _detailsOwner: object | null = null;
  private _details: MenuItemDetails | null = null;
  /** 等下一幀量面板高度、重算位置的 requestAnimationFrame */
  private _detailsFrame: number | null = null;
  private _detailsListening = false;
  /**
   * 選單被定位服務移動時（改外框的 style），面板跟著重算。只聽捲動不夠：捲動事件先到面板、後到定位服務，
   * 面板在同一幀先量會量到選單移動前的位置
   */
  private _detailsMoveObserver: MutationObserver | null = null;
  /** 頁面或選單捲動、視窗大小改變：選單或那一列可能移動了，下一幀重算面板位置 */
  private readonly _onDetailsViewportChange = (): void => this._scheduleDetailsLayout();

  private readonly _onWindowPointerDown = (event: PointerEvent): void => {
    const host = this.el.nativeElement as HTMLElement;
    this._lastPointerTarget = event.target instanceof Element ? event.target : null;
    this._focusInMenuAtPress = host.contains(document.activeElement);
    // 補充說明面板畫在 body 底下，但按它算按在選單裡（見 _detailsCompanions）
    this._pressedInMenu = host.contains(this._lastPointerTarget)
      || !!this._detailsEl?.nativeElement.contains(this._lastPointerTarget);
  };

  /** 跟選單算在一起的元素：補充說明面板。按它不算點外面，選單不關（定位服務的 companionEls） */
  private readonly _detailsCompanions = (): ReadonlyArray<Element | null | undefined> => [this._detailsEl?.nativeElement];

  private readonly _onHostClickCapture = (event: MouseEvent): void => {
    const item = this._menuItemAt(event.target);
    this._clickSnapshot = {
      event,
      item,
      disabled: item?.getAttribute('aria-disabled') === 'true',
      opensPanel: !!item?.hasAttribute('aria-haspopup'),
    };
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
    if (item === this._detailsOwner) this._hideDetails();
    this._syncMenuAttrs();
    // 焦點所在的項目被拿掉時，焦點會掉回 body，方向鍵和 Esc 都收不到；等這一輪畫面更新完再補回選單裡
    if (this._focusedItem) queueMicrotask(() => this._refocusAfterItemRemoved());
  }

  ngOnChanges(): void {
    this._syncMenuAttrs();
  }

  /** MenuContext：滑過、或用鍵盤移到某一項時，顯示它的補充說明；那一項沒有說明（null）就收起來 */
  showDetails(item: object, details: MenuItemDetails | null): void {
    if (this._destroyed) return;
    if (!details) {
      this._hideDetails();
      return;
    }
    this._detailsOwner = item;
    this._details = details;
    if (!this._detailsListening) {
      this._detailsListening = true;
      this.zone.runOutsideAngular(() => {
        window.addEventListener('scroll', this._onDetailsViewportChange, { capture: true, passive: true });
        window.addEventListener('resize', this._onDetailsViewportChange, { passive: true });
        this._detailsMoveObserver = new MutationObserver(() => this._scheduleDetailsLayout());
        this._detailsMoveObserver.observe(this.el.nativeElement as HTMLElement, { attributes: true, attributeFilter: ['style'] });
      });
    }
    // 先用面板現在的高度放一次（換選項時是上一項的高度，第一次出現時不管高度），下一幀量到新內容的高度再修正
    this._layoutDetails();
    this._scheduleDetailsLayout();
  }

  /**
   * 選單打開時有 150ms 的縮放動畫（actionMenuIn），動畫期間量到的列位置是縮放中的。
   * 鍵盤打開時第一項的說明在動畫中就出現，滑得快的也會在動畫中滑過；動畫結束再對齊一次，面板才貼齊那一列
   */
  @HostListener('animationend', ['$event'])
  onHostAnimationEnd(event: AnimationEvent): void {
    if (event.target !== this.el.nativeElement || !this._details) return;
    this._scheduleDetailsLayout();
  }

  /** MenuContext：某一項的說明改了。正在顯示的就是那一項時才跟著換 */
  updateDetails(item: object, details: MenuItemDetails | null): void {
    if (item !== this._detailsOwner) return;
    this.showDetails(item, details);
  }

  ngAfterViewInit(): void {
    this._triggerEl = document.activeElement as HTMLElement | null;
    const host = this.el.nativeElement as HTMLElement;
    this._originParent = host.parentElement;
    this.zone.runOutsideAngular(() => {
      window.addEventListener('pointerdown', this._onWindowPointerDown, true);
      host.addEventListener('click', this._onHostClickCapture, true);
    });
    // 原生觸發鈕的 aria-expanded 這時已經是 true；app-button 裡的按鈕比選單晚一步更新，下一幀再認一次、以那次為準
    this._rememberOpenTrigger(false);
    requestAnimationFrame(() => this._rememberOpenTrigger(true));

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
        companionEls: this._detailsCompanions,
        onClose: (reason) => this._onOverlayClose(reason),
      },
    );
    if (this.autoFocusFirst) requestAnimationFrame(() => this._focusFirstWhenReady());
  }

  ngOnDestroy(): void {
    this._destroyed = true;
    this._hideDetails();
    sidePanels.delete(this);
    const host = this.el.nativeElement as HTMLElement;
    window.removeEventListener('pointerdown', this._onWindowPointerDown, true);
    host.removeEventListener('click', this._onHostClickCapture, true);
    this._teardownFocusWatch();
    this._overlayRef?.detach();
    const trigger = this._wasMenu ? this._menuTrigger() : null;
    const pressed = this._lastPointerTarget;
    // 下面這些情況不把焦點拉回這個選單的觸發鈕。
    // 點外面關掉的：
    // - 按到的是別的按鈕、連結、輸入框：使用者換去操作那個東西了，焦點交給瀏覽器處理
    //   （Chrome 會給它焦點，Safari 點按鈕不給、留在 body）
    // - 按下那一刻焦點不在選單裡：例如 autoFocusFirst 設 false、焦點一直在錨點的輸入框，使用者沒在用這個選單
    // - 觸發鈕是輸入框（例如搜尋框下的「最近開啟」）：使用者是點走了，游標不該跳回輸入框；
    //   這種輸入框常常一拿到焦點就打開下拉，還回去會讓選單關了又開
    // 不是點外面關掉的：
    // - 按到的是選單外面、觸發鈕以外的控制項，例如同一個外層裡另一個選單的觸發鈕（在外層裡，不算點外面），
    //   使用端切換狀態把這個選單關了：使用者換去操作它了。Chrome 按下時就把焦點給它，
    //   Safari 按按鈕不給、焦點在 body，也不該拉回這個選單的觸發鈕
    const leaveFocus = this._closedByOutsideClick
      ? isInteractiveTarget(pressed) || !this._focusInMenuAtPress || isFormFieldTarget(trigger)
      : !!pressed && !this._pressedInMenu && !trigger?.contains(pressed) && isInteractiveTarget(pressed);
    // 選單模式：選完、點外面或其他原因關掉時，焦點還在選單裡（或隨選單移除掉回 body）就還給觸發鈕；
    // 焦點已經被別的元素拿走（例如選項打開了對話框）就不搶。
    // 再按一次這個選單自己的觸發鈕關掉的：Safari 按下時焦點停到外面那層點得到焦點的外框
    // （例如 tabindex="-1" 的對話框卡片），也還給觸發鈕，跟 Chrome 按下就給它焦點的結果一樣
    const pressedOwnTrigger = !this._closedByOutsideClick && !!pressed && !!trigger?.contains(pressed);
    const restoreFocus = this._wasMenu && !leaveFocus
      && (this._focusLostWith(host) || (pressedOwnTrigger && this._focusParkedAfterPress(pressed)));
    if (host.parentNode === document.body) {
      document.body.removeChild(host);
    }
    // 點外面關掉的不捲動頁面：觸發鈕可能已經捲出畫面，使用者是用滑鼠點別處，不該被捲回觸發鈕那裡。
    // 其他方式關掉的（Esc、Tab、選完一項）照預設捲到看得到觸發鈕，用鍵盤的人才看得到焦點在哪
    if (restoreFocus) trigger?.focus(this._closedByOutsideClick ? { preventScroll: true } : undefined);
    // 點外面空白處關掉的：瀏覽器接著處理同一次滑鼠按下，會把焦點移回 body，
    // 或停在按到的地方外面那層點得到焦點的外框（例如 tabindex="-1" 的對話框卡片）。
    // 等這次點擊處理完再看一次，焦點落在這兩種地方才還給觸發鈕
    if (this._wasMenu && this._closedByOutsideClick && !leaveFocus) {
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
    // 改用鍵盤操作了：之前按下的元素不是接下來關閉的原因（見 ngOnDestroy 的 leaveFocus）
    this._lastPointerTarget = null;
    this._pressedInMenu = false;
    if (this._isMenu) {
      this._onMenuKeydown(event);
      return;
    }
    // 同選單模式：用輸入法選字時的按鍵是給輸入法的（例如在面板的輸入框按 Esc 是取消選字），浮層不處理
    if (yieldToIme(event)) return;
    // 裡面的欄位自己處理過這個鍵（例如 #select、#date-picker 按方向鍵、Enter 打開清單，並取消預設動作）：交給它，
    // 不然方向鍵會把焦點搶走、Enter 會再點一次把剛打開的清單關掉。Esc 照舊由浮層處理，欄位要留住 Esc 會自己擋下不往外傳
    if (event.defaultPrevented && event.key !== 'Escape') return;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        // 焦點在輸入框、下拉、多行輸入框、可編輯區裡：方向鍵是移動游標，不搶焦點
        if (isFormFieldTarget(document.activeElement)) return;
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
        // 跳過表單欄位：輸入框、多行輸入框、下拉、可編輯區有各自的原生 Enter/Space 行為（例如打字、換行）
        if (isFormFieldTarget(document.activeElement)) return;
        event.preventDefault();
        // 消費後不再冒泡：否則同一個 Enter 會續傳到 document 層快速鍵（如 kanban Enter 重開卡片選單），
        // 造成選單「關了又被重開、浮在剛開的 modal 上」（比照下方 Escape 分支）。
        event.stopPropagation();
        // 同選單模式：按住不放的連發不執行（例如按住 Enter 用快捷鍵打開浮層，連發落進了浮層）；
        // 執行之後、放開之前的連發都吃掉，不然會按到選項打開的對話框裡的按鈕
        if (event.repeat) break;
        this.zone.runOutsideAngular(() => swallowRepeatsUntilKeyup(event.key));
        // WAI-ARIA Menu Pattern：Enter/Space 啟動 focused menuitem。
        // 主動 click 繞過「程式化 .focus() 後原生 Enter 不自動 trigger click」的瀏覽器差異。
        (document.activeElement as HTMLElement)?.click();
        break;
      }
      case 'Escape':
        event.stopPropagation();
        // 按住不放的連發吃掉：選單旁邊的面板按 Esc，第一下關面板、焦點回到選單裡打開它的那一項，
        // 接下來的連發會落進選單、把選單也關掉
        if (event.repeat) break;
        this.zone.runOutsideAngular(() => swallowRepeatsUntilKeyup(event.key));
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
   * 會在旁邊打開面板的項目（app-menu-item 設了 opensPanel），右方向鍵跟 Enter 一樣打開面板。
   */
  private _onMenuKeydown(event: KeyboardEvent): void {
    // 用輸入法選字時的按鍵（Esc 取消選字、Enter 確定）是給輸入法的，選單不處理
    if (yieldToIme(event)) return;
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
        // 按住不放的連發不執行，例如按住 Enter 打開選單，連發落進了選單
        if (event.repeat) break;
        // 執行之後、放開這個鍵之前的連發都吃掉：不然選單關掉、焦點回到觸發鈕後，連發會讓觸發鈕再打開選單、
        // 再執行一次，一直循環；選項打開了對話框時，連發也會按到對話框裡的按鈕
        this.zone.runOutsideAngular(() => swallowRepeatsUntilKeyup(event.key));
        active?.click();
        break;
      case 'ArrowRight':
        // 只處理會在旁邊打開面板的項目（APG 子選單的做法）。停用的不動；其他項目和左方向鍵都不處理，事件照常往外傳
        if (!active || !items.includes(active) || !active.hasAttribute('aria-haspopup')) break;
        if (active.getAttribute('aria-disabled') === 'true') break;
        if (active.getAttribute('aria-expanded') === 'true') {
          // 面板已經開著、焦點卻還在這一項（例如內容載入中、面板設了 autoFocusFirst=false）：把焦點移進面板。
          // 不再按一次，那會把面板關掉。找不到面板（沒用 ancestorAnchorEl 指回這一項），或面板裡還沒有可以操作的東西就不動
          if (!sidePanelOpenedBy(active)?._focusFirst()) break;
          event.preventDefault();
          event.stopPropagation();
          break;
        }
        event.preventDefault();
        event.stopPropagation();
        // 同 Enter：按住不放的連發不執行，執行之後、放開之前的連發都吃掉，不然面板會一開一關
        if (event.repeat) break;
        this.zone.runOutsideAngular(() => swallowRepeatsUntilKeyup(event.key));
        active.click();
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
   * 點到會在旁邊打開面板的項目也不關：選單留著，面板打開在它旁邊（焦點由 app-menu-item 自己留在那一項）。
   * 點到哪一項、停用沒，看點擊剛傳進外框時記下的（見 _clickSnapshot）
   */
  private _onMenuClick(event?: MouseEvent): void {
    const host = this.el.nativeElement as HTMLElement;
    const target = event?.target ?? null;
    const snap = event && this._clickSnapshot?.event === event ? this._clickSnapshot : null;
    this._clickSnapshot = null;
    const item = snap ? snap.item : this._menuItemAt(target);
    if (!item) {
      // 點到輸入框這類欄位時焦點留給它（見 _onMenuKeydown）
      if (!isFormFieldTarget(target)) host.focus();
      return;
    }
    if (snap ? snap.disabled : item.getAttribute('aria-disabled') === 'true') {
      item.focus();
      return;
    }
    if (snap ? snap.opensPanel : item.hasAttribute('aria-haspopup')) return;
    if (this.autoCloseOnAction) this.closeMenu.emit();
  }

  /** 事件目標所在的選單項目（app-menu-item 內層的按鈕） */
  private _menuItemAt(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Node)) return null;
    return menuItemsIn(this.el.nativeElement as HTMLElement).find((el) => el.contains(target)) ?? null;
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

  /**
   * 選單開著時認觸發鈕（見 expandedMenuTrigger），好幾顆開著時取打開前有焦點的那顆。
   * 打開那一刻（final 為 false）認得出來才記：app-button 裡的按鈕比選單晚一步更新，這時可能還認到剛關掉的
   * 上一個選單的觸發鈕。下一幀（final 為 true）以那次為準，認不出來就清掉
   */
  private _rememberOpenTrigger(final: boolean): void {
    if (this._destroyed) return;
    const found = expandedMenuTrigger(this.anchorEl ?? this._originParent, this._triggerEl);
    if (found || final) this._openTrigger = found;
  }

  /**
   * 選單模式要把焦點還給的觸發鈕，依序：
   * 1. 選單開著時認出來的觸發鈕（見 _rememberOpenTrigger）。放最前面：Safari 點按鈕時焦點會落到點得到焦點的外層，
   *    打開前有焦點的可能是外層，不是觸發鈕。打開前的焦點在外層裡別的地方時（例如用 Chrome 滑鼠點、用鍵盤打開
   *    一顆沒標 aria-expanded 的觸發鈕），外層裡標著的是別的選單的觸發鈕，不認，改用第 3 項。Safari 點原生按鈕時
   *    打開前的焦點在 body 或外框上，分不出來，還是會認那顆；所以觸發鈕要照規格標 aria-expanded
   * 2. 第 1 顆在選單開著時被重建、已經不在畫面上（例如清單重新載入、版面變窄換了一顆按鈕）：到外層再認一次換上來的那顆
   * 3. 打開前有焦點的元素
   * 都沒有就不還（Safari 用滑鼠點按鈕不給焦點，打開前焦點在 body）。開著時沒認出來的，關閉的時候不再認：這時觸發鈕的
   * aria-expanded 可能已經先變回 false，外層裡還標著的可能是另一個開著的選單的觸發鈕。外層裡只有一顆選單按鈕、
   * 但沒標 aria-expanded="true" 時，也不拿它來猜：用鍵盤快捷鍵、右鍵打開的選單，那顆可能跟這個選單無關
   */
  private _menuTrigger(): HTMLElement | null {
    const opened = this._openTrigger?.isConnected ? this._openTrigger : null;
    if (opened) return opened;
    const rebuilt = this._openTrigger ? expandedMenuTrigger(this.anchorEl ?? this._originParent, this._triggerEl) : null;
    if (rebuilt) return rebuilt;
    const host = this.el.nativeElement as HTMLElement;
    const t = this._triggerEl;
    const usable = !!t && t !== document.body && t !== document.documentElement && t.isConnected && !host.contains(t);
    return usable ? t : null;
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

  /** 一般模式上下方向鍵走得到的按鈕：Tab 停不到的輔助鈕（tabindex="-1"，例如 #number-input 的增減鈕）、看不到的不算（見 isShown） */
  private _getFocusableItems(): HTMLElement[] {
    const host = this.el.nativeElement as HTMLElement;
    return Array.from(
      host.querySelectorAll<HTMLElement>('button:not(:disabled):not([tabindex="-1"]), [role="menuitem"]:not([disabled])')
    ).filter(isShown);
  }

  /**
   * 種初始焦點：一般模式到第一顆按鈕，沒有按鈕才到第一個欄位或連結（見 FIELD_SELECTOR）；
   * Tab 停不到的不算（見 focusIfTabbable），真的拿到焦點才算成功。
   * 選單模式到已選中的那項，沒有就第一項。成功回 true、沒有可以聚焦的回 false。
   * 選單裡的選項按右方向鍵、面板已經開著時也呼叫它（見 _onMenuKeydown），所以不是 private
   */
  _focusFirst(): boolean {
    const host = this.el.nativeElement as HTMLElement;
    if (this._isMenu) {
      const first = initialMenuItem(menuItemsIn(host));
      if (!first) return false;
      first.focus();
      return true;
    }
    const buttons = Array.from(host.querySelectorAll<HTMLElement>('button'));
    const fields = Array.from(host.querySelectorAll<HTMLElement>(FIELD_SELECTOR));
    return [...buttons, ...fields].some(focusIfTabbable);
  }

  /**
   * 種初始焦點，並容忍「非同步內容」：若當下沒有可聚焦項（如 flyout 正顯示 loading skeleton，
   * 內容尚未由 API 回填），掛 MutationObserver 等內容出現的那一刻立即補種焦點、隨即 disconnect。
   * 同步內容（一般 More 選單）在首次即成功、不會掛 observer。
   * 不設時間上限：內容晚多久出來都等（後端慢的時候，用鍵盤的人才進得了面板）。浮層關掉（ngOnDestroy）就停；
   * 內容出來之前使用者已經把焦點移到別處（例如回選單換了一項）也停，不搶回來。
   * （對齊 DS pattern loading.api-hydration-skeleton：skeleton 無 tabindex、內容備妥才進焦點。）
   */
  private _focusFirstWhenReady(): void {
    if (this._focusFirst()) return;
    const host = this.el.nativeElement as HTMLElement;
    const waitingOn = document.activeElement;
    this._focusObserver = new MutationObserver(() => {
      const active = document.activeElement;
      const stillWaiting = !active || active === waitingOn || active === document.body || active === document.documentElement;
      if (!stillWaiting || this._focusFirst()) this._teardownFocusWatch();
    });
    // 內容不一定是新增的元素，也可能是原本藏著（hidden、class、style）、停用或 tabindex="-1" 的元素變成可以用，這些也要再試
    this._focusObserver.observe(host, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['hidden', 'class', 'style', 'disabled', 'tabindex', 'inert'],
    });
  }

  private _teardownFocusWatch(): void {
    this._focusObserver?.disconnect();
    this._focusObserver = null;
  }

  /**
   * 算面板位置：選單右邊隔 8px，頂端對齊那一列（列頂減去選單上內距，面板頂端才跟選單的外框齊）。
   * 右邊放不下 320px 改放左邊；兩邊都放不下就放空間大的那邊、縮窄到放得下，不到 200px 不顯示（面板不蓋住選單）。
   * 下面放不下往上移，上面至少留 8px。疊放層級跟選單一樣：選單在其他浮層上時，面板也在
   */
  private _layoutDetails(): void {
    const d = this._details;
    if (!d) return;
    const host = this.el.nativeElement as HTMLElement;
    const menu = host.getBoundingClientRect();
    const row = d.row.getBoundingClientRect();
    const hostStyle = getComputedStyle(host);
    const padTop = parseFloat(hostStyle.paddingTop) || 0;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    const roomRight = vw - DETAILS_MARGIN - (menu.right + DETAILS_GAP);
    const roomLeft = menu.left - DETAILS_GAP - DETAILS_MARGIN;
    let side: 'right' | 'left';
    let width = DETAILS_WIDTH;
    if (roomRight >= DETAILS_WIDTH) side = 'right';
    else if (roomLeft >= DETAILS_WIDTH) side = 'left';
    else {
      side = roomRight >= roomLeft ? 'right' : 'left';
      width = Math.floor(Math.max(roomRight, roomLeft));
    }
    if (width < DETAILS_MIN_WIDTH) {
      // 太窄讀不下去：不顯示，但記著這一項，視窗變寬時（resize 重算）再出現
      if (this.detailsPanel() !== null) this.zone.run(() => this.detailsPanel.set(null));
      return;
    }
    const left = side === 'right' ? menu.right + DETAILS_GAP : menu.left - DETAILS_GAP - width;

    let top = row.top - padTop;
    const height = this._detailsEl?.nativeElement.offsetHeight ?? 0;
    if (height > 0) top = Math.min(top, vh - DETAILS_MARGIN - height);
    top = Math.max(DETAILS_MARGIN, top);

    const zParsed = parseInt(hostStyle.zIndex, 10);
    const z = Number.isNaN(zParsed) ? null : zParsed;

    const prev = this.detailsPanel();
    if (prev && prev.top === top && prev.left === left && prev.width === width && prev.z === z
      && prev.label === d.label && prev.items === d.items) return;
    // 捲動、視窗大小的監聽在 Angular 外面跑，改面板要回到 Angular 裡面，畫面才會更新
    this.zone.run(() => this.detailsPanel.set({ label: d.label, items: d.items, top, left, width, z }));
  }

  /** 下一幀再算一次位置：那時面板已經畫出新內容，量得到高度 */
  private _scheduleDetailsLayout(): void {
    if (this._detailsFrame !== null) return;
    this.zone.runOutsideAngular(() => {
      this._detailsFrame = requestAnimationFrame(() => {
        this._detailsFrame = null;
        this._layoutDetails();
      });
    });
  }

  private _hideDetails(): void {
    this._detailsOwner = null;
    this._details = null;
    if (this._detailsFrame !== null) {
      cancelAnimationFrame(this._detailsFrame);
      this._detailsFrame = null;
    }
    if (this._detailsListening) {
      this._detailsListening = false;
      window.removeEventListener('scroll', this._onDetailsViewportChange, { capture: true });
      window.removeEventListener('resize', this._onDetailsViewportChange);
      this._detailsMoveObserver?.disconnect();
      this._detailsMoveObserver = null;
    }
    if (this.detailsPanel() !== null) this.detailsPanel.set(null);
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

    if (this.ancestorAnchorEl) sidePanels.add(this);
    this._overlayRef = this.positioning.attachAtPoint(x, y, this.el, {
      placement,
      gap: 0,
      trackScroll: false,
      closeOnClickOutside: true,
      closeOnEscape: false,
      ancestorAnchorEl: this.ancestorAnchorEl ?? undefined,
      companionEls: this._detailsCompanions,
      onClose: (reason) => this._onOverlayClose(reason),
    });
    if (this.autoFocusFirst) requestAnimationFrame(() => this._focusFirstWhenReady());
  }
}

/** 補充說明面板：寬度、跟選單的距離、離視窗邊緣至少留多少 */
const DETAILS_WIDTH = 320;
const DETAILS_GAP = 8;
const DETAILS_MARGIN = 8;
/** 兩邊都放不下 320px 時面板會縮窄；比這個窄就不顯示，一行只剩幾個字讀不下去 */
const DETAILS_MIN_WIDTH = 200;

interface DetailsPanelState {
  label: string;
  items: readonly string[];
  top: number;
  left: number;
  /** 面板寬：平常 320px，兩邊都放不下時縮窄 */
  width: number;
  /** 跟選單一樣的疊放層級（定位服務寫在選單上的 z-index）；選單沒有時用樣式裡的預設值 */
  z: number | null;
}

/**
 * 一般模式沒有按鈕時，初始焦點改落在的欄位：原生的輸入框、下拉、多行輸入框、連結、可編輯區，
 * 以及用 tabindex 加控制項角色做成的欄位（DS 的 #select、#date-picker 是 role="combobox" 的 div，
 * #upload-dropzone 是 role="button" 的 div）。只有 tabindex、沒有控制項角色的（例如文字被截斷時才加 tabindex 的提示文字）不算
 */
const FIELD_SELECTOR = [
  'input:not([type="hidden"])', 'select', 'textarea', 'a[href]',
  '[contenteditable]:not([contenteditable="false"])',
  ...WIDGET_ROLES.map((r) => `[role="${r}"][tabindex]`),
].join(', ');

/** 看得到、也沒被 inert 擋住：方向鍵清單和初始焦點用同一套標準 */
function isShown(el: HTMLElement): boolean {
  return !el.closest('[inert]') && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
}

/**
 * Tab 停得到才把焦點放上去，回傳是不是真的拿到焦點。
 * tabindex="-1" 的輔助鈕（例如 #number-input 的增減鈕）、原生 disabled 的、
 * 看不到的（例如 #upload-dropzone 裡 hidden 的檔案輸入框）都不算。
 * aria-disabled="true" 的算：#button 的「停用但可點」就是要讓人停得到、看得到原因，Tab 也停得到它
 */
function focusIfTabbable(el: HTMLElement): boolean {
  if (el.getAttribute('tabindex') === '-1' || el.matches(':disabled')) return false;
  if (!isShown(el)) return false;
  el.focus();
  return el.contains(document.activeElement);
}

/**
 * 用輸入法選字時的按鍵（Esc 取消選字、Enter 確定）是給輸入法的，浮層不處理，回傳 true。
 * Esc 照樣不往外傳：外層的對話框多半在 document 上聽 Esc 關閉，傳出去會把對話框關掉。
 * 有的瀏覽器選字時 key 是 "Process"，所以也看 code
 */
function yieldToIme(event: KeyboardEvent): boolean {
  if (!event.isComposing && event.keyCode !== 229) return false;
  if (event.key === 'Escape' || event.code === 'Escape') event.stopPropagation();
  return true;
}

/** 開著、用 ancestorAnchorEl 指回選單裡某一項的面板（fixedMode 的 app-action-menu） */
const sidePanels = new Set<ActionMenuComponent>();

/** 找打開這一項旁邊面板的那個浮層：面板的 ancestorAnchorEl 是這一項，或包著這一項（例如 app-menu-item 的元素） */
function sidePanelOpenedBy(item: HTMLElement): ActionMenuComponent | null {
  for (const panel of sidePanels) {
    const anchor = panel.ancestorAnchorEl;
    if (anchor && anchor.contains(item)) return panel;
  }
  return null;
}

/**
 * 從現在到放開 key 之前，吃掉這個鍵的連發（keydown 的 repeat 為 true）：不執行預設動作、也不再傳下去。
 * 放開那一下也取消預設動作（空白鍵在按鈕上是放開時才按下去）。焦點離開視窗、或沒收到放開就又按了一次時停止
 */
function swallowRepeatsUntilKeyup(key: string): void {
  const stop = (): void => {
    window.removeEventListener('keydown', onKeydown, true);
    window.removeEventListener('keyup', onKeyup, true);
    window.removeEventListener('blur', stop);
  };
  const onKeydown = (e: KeyboardEvent): void => {
    if (e.key !== key) return;
    if (!e.repeat) {
      stop();
      return;
    }
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const onKeyup = (e: KeyboardEvent): void => {
    if (e.key !== key) return;
    e.preventDefault();
    stop();
  };
  window.addEventListener('keydown', onKeydown, true);
  window.addEventListener('keyup', onKeyup, true);
  window.addEventListener('blur', stop);
}
