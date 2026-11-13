import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, inject,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { MENU_CONTEXT, MenuItemDetails } from '../action-menu/menu-context';

export type MenuItemTone = 'neutral' | 'danger';
/** 點了會在旁邊打開的面板是什麼，輸出成 aria-haspopup。目前只有 dialog：面板裡是按鈕、輸入框這類一般內容 */
export type MenuItemPanel = 'dialog';

let nextId = 0;

/**
 * 選單選項：選單裡的每一項。可以執行一個動作（selected 不設），也可以是一組單選裡的一個值（selected 設 true／false）。
 *
 * 放在 app-action-menu 裡時，會向動作選單登記，動作選單因此進入選單模式；這時外框是 role="none"，
 * 內層按鈕是 menuitem（單選項是 menuitemradio＋aria-checked）。
 * 放在選單外（例如篩選視窗的排序區）時就是一般按鈕，單選項用 aria-pressed。
 * 設了 opensPanel 的選項右邊有箭頭，點了在旁邊打開面板；放在選單裡時，動作選單點了它不關（見 action-menu）。
 * 設了 details 的選項，滑過或用鍵盤移過來時，動作選單在旁邊顯示補充說明面板（面板由 action-menu 管）。
 */
@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "inMenu ? 'none' : null",
    '[class.menu-item--in-menu]': 'inMenu',
  },
})
export class MenuItemComponent implements OnChanges, OnDestroy {
  // host: true：只找同一個範本裡包住它的 app-action-menu。包在使用端自己的元件裡時不再往外找，
  // 那個元件（例如一排選單外的排序選項）放進篩選面板，也不會把面板變成選單
  private readonly menu = inject(MENU_CONTEXT, { optional: true, host: true });
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  /** 放在 app-action-menu 裡（選單模式）時為 true */
  readonly inMenu = this.menu !== null;
  /** 說明文字的 id，給內層按鈕的 aria-describedby 用 */
  readonly descriptionId = `app-menu-item-desc-${++nextId}`;
  /** 藏起來的條列文字的 id，給 aria-describedby 用 */
  readonly detailsId = `app-menu-item-details-${nextId}`;

  /** 這一項要做什麼，或代表哪一個值 */
  @Input({ required: true }) label!: string;
  /**
   * 文字下方的說明（選填）；有值時文字變成粗體標題（一般項目深色，危險項目維持紅字）。
   * 一行最寬 16 個字，超過換行。停用時用它寫原因，這時標題不加粗、整項灰 50
   */
  @Input() description = '';
  /** 文字左邊的 DS 圖示名稱（選填） */
  @Input() icon = '';
  /** danger＝紅字的危險動作 */
  @Input() tone: MenuItemTone = 'neutral';
  /** 停用：用 aria-disabled，選單裡鍵盤還停得到，點了沒反應 */
  @Input() disabled = false;
  /** null＝一般動作；true／false＝單選項的選中／未選中 */
  @Input() selected: boolean | null = null;
  /** 點了會在旁邊打開面板（選填）：右邊加箭頭、輸出 aria-haspopup；放在選單裡點了不關選單 */
  @Input() opensPanel: MenuItemPanel | null = null;
  /** 旁邊的面板開著沒；設了 opensPanel 才有作用，輸出成 aria-expanded，開著時跟滑過一樣亮著 */
  @Input() panelOpen = false;

  /**
   * 補充說明（選填），每一個字串是一條，只能是純文字。滑過、或用鍵盤移到這一項時，選單旁邊出現面板，
   * 標題是 label。只在 app-action-menu 裡有作用；設了 opensPanel 時不生效
   */
  @Input() details: readonly string[] | null = null;

  /** 點擊或按 Enter／空白鍵執行時觸發；停用時不觸發 */
  @Output() itemClick = new EventEmitter<void>();

  constructor() {
    this.menu?.register(this);
  }

  ngOnChanges(): void {
    // 正在顯示的那一項改了說明或標題時，面板跟著換（不是那一項時動作選單不理）
    this.menu?.updateDetails?.(this, this.detailsPayload());
  }

  ngOnDestroy(): void {
    this.menu?.unregister(this);
  }

  /** details 有沒有作用：放在選單裡、沒設 opensPanel、至少一條 */
  get hasDetails(): boolean {
    return this.inMenu && !this.opensPanel && !!this.details && this.details.length > 0;
  }

  /** aria-describedby：說明在前、條列在後；都沒有就不輸出 */
  get describedBy(): string | null {
    const ids = [this.description ? this.descriptionId : '', this.hasDetails ? this.detailsId : ''].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  }

  /** 給報讀軟體念的條列：每一條後面補句號，念的時候才會斷開；已經有句末標點的不補 */
  get detailsSpoken(): string[] {
    return (this.details ?? []).map((d) => (/[。！？.!?]$/.test(d) ? d : `${d}。`));
  }

  /** 滑鼠移進來：換成這一項的說明，沒有說明就收起來 */
  onPointerEnter(): void {
    this.menu?.showDetails?.(this, this.detailsPayload());
  }

  /**
   * 拿到焦點：最後一次操作是鍵盤（方向鍵、用 Enter 打開選單、快捷鍵）才換成這一項的說明。
   * 滑鼠點開選單時，動作選單也會把焦點放到第一項，這時不顯示，要滑過才出現。
   * 不看 :focus-visible：Safari 在滑鼠點開後，程式移過去的焦點也會畫焦點框，靠它判斷會在滑鼠點開時跳出面板
   */
  onFocus(): void {
    if (lastInput !== 'keyboard') return;
    this.menu?.showDetails?.(this, this.detailsPayload());
  }

  private detailsPayload(): MenuItemDetails | null {
    if (!this.hasDetails) return null;
    return { label: this.label, items: this.details!, row: this.host.nativeElement };
  }

  get isRadio(): boolean {
    return this.selected !== null && this.selected !== undefined;
  }

  get itemRole(): 'menuitem' | 'menuitemradio' | null {
    if (!this.inMenu) return null;
    return this.isRadio ? 'menuitemradio' : 'menuitem';
  }

  onClick(event?: Event): void {
    // 停用沒用原生 disabled（選單裡方向鍵要停得到），點擊要自己攔下來
    if (this.disabled) return;
    // 會在旁邊打開面板的：先把焦點放到自己身上（Safari 用滑鼠點按鈕不會給焦點）。面板打開時記下的
    // 「打開前的焦點」才會是這一項，面板按 Esc 關掉後焦點回得來；要在 emit 前做，使用端一收到就可能打開面板
    if (this.opensPanel) (event?.currentTarget as HTMLElement | null)?.focus();
    this.itemClick.emit();
  }
}

/** 最後一次操作是鍵盤還是滑鼠（手指也算 pointer）；還沒有任何操作時是 null */
let lastInput: 'keyboard' | 'pointer' | null = null;

/*
 * 記住最後一次操作是鍵盤還是滑鼠，給補充說明面板判斷「焦點是不是用鍵盤移過來的」。
 * 這支檔案一載入就開始聽，不能等選項建立：打開選單的那一下（在觸發鈕上按 Enter、按快捷鍵）發生時，
 * 選單和選項都還不存在，等選項建立才聽就漏掉，頁面載入後第一次用鍵盤打開選單會看不到說明（2026-11-12 三瀏覽器實測）。
 * 在 document 的捕獲階段聽，比選單、頁面自己的處理早一步；整個頁面共用一份，一直留著。
 * 監聽加在 zone.js 的根 zone（Angular 的 zone 外面）：這支檔案若在延遲載入的區塊裡、於 Angular 的 zone 內載入，
 * 每按一次鍵盤、滑鼠都會多跑一次畫面更新
 */
if (typeof document !== 'undefined') {
  const listen = (): void => {
    document.addEventListener('keydown', () => { lastInput = 'keyboard'; }, true);
    document.addEventListener('pointerdown', () => { lastInput = 'pointer'; }, true);
  };
  const zone = (globalThis as { Zone?: { root: { run(fn: () => void): void } } }).Zone;
  if (zone) zone.root.run(listen);
  else listen();
}
