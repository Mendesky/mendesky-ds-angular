import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnDestroy, Output, SimpleChanges, TemplateRef, computed, inject, isDevMode, signal,
} from '@angular/core';
import { EmptyStateComponent } from '../empty-state/empty-state.component';
import { IconComponent } from '../icon/icon.component';
import { SpinnerComponent } from '../spinner/spinner.component';

/** 清單裡的一列。id 是使用端自己的識別碼；data 放使用端要在列範本或選取後用到的原始資料 */
export interface ResultListItem<T = unknown> {
  id: string;
  label: string;
  description?: string;
  icon?: string;
  data?: T;
}

/** 一組列。label 有值就畫成有標題的群組；沒有就直接列出來 */
export interface ResultListGroup<T = unknown> {
  id: string;
  label?: string;
  items: readonly ResultListItem<T>[];
}

/** ready：照 groups 畫；loading：轉圈；empty：沒有結果；error：載入失敗 */
export type ResultListState = 'ready' | 'loading' | 'empty' | 'error';

/** 列範本拿到的東西：$implicit 是那一列，active 是它現在是不是選中 */
export interface ResultListItemContext<T = unknown> {
  $implicit: ResultListItem<T>;
  active: boolean;
}

interface Row {
  item: ResultListItem;
  /** 這一列在畫面上的 id，給輸入框的 aria-activedescendant 用 */
  domId: string;
}

interface GroupView {
  id: string;
  label: string;
  labelId: string;
  rows: Row[];
}

let nextListId = 0;

/**
 * 結果清單：焦點留在輸入框，用上下鍵在清單裡選一列的那種清單（搜尋結果、最近開啟）。
 *
 * 元件不打後端、不管輸入框。使用端給資料（groups）與狀態（state），把輸入框的 keydown 轉進 handleKeydown，
 * 再把 activeOptionIdChange 送出來的 id 設到輸入框的 aria-activedescendant。
 *
 * - 選中用項目的 id 記，不用位置：內容換掉後，同一筆還在就維持選中，不在就清掉。
 * - 內容或狀態改變造成的選中變化，通知（activeIdChange、activeOptionIdChange）晚一個 microtask 送：
 *   這時使用端的範本可能已經檢查過，同步送會讓 Angular 報「檢查後又改值」。按鍵與滑鼠造成的變化同步送。
 * - 不用計時器：捲動、清掉選中都在事件當下做，使用端的 fakeAsync 測試不會多出待辦。
 */
@Component({
  selector: 'app-result-list',
  standalone: true,
  imports: [NgTemplateOutlet, IconComponent, SpinnerComponent, EmptyStateComponent],
  templateUrl: './result-list.component.html',
  styleUrls: ['./result-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultListComponent implements OnChanges, OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly zone = inject(NgZone);

  /** 清單的報讀名稱，例如「搜尋結果」 */
  @Input({ required: true }) ariaLabel = '';

  /** 清單元素的 id，給輸入框的 aria-controls 用；不設會自動產生 */
  @Input() listId = `result-list-${++nextListId}`;

  /** 要列出來的內容 */
  @Input() groups: readonly ResultListGroup[] = [];

  /** 目前的狀態；元件不知道使用端在不在載入，要使用端說 */
  @Input() state: ResultListState = 'ready';

  /** 選中那一列的 id（項目的 id）；跟 activeIdChange 一起可以寫成 [(activeId)] */
  @Input() activeId: string | null = null;

  /** 有結果就先選中第一列；這時第一列按 ↑ 不會變成沒選中 */
  @Input() autoActivateFirst = false;

  /** 最後一列按 ↓ 回第一列、第一列按 ↑ 到最後一列 */
  @Input() wrap = false;

  /** 每一列的內容範本；不給就顯示圖示、名稱、說明 */
  @Input() itemTemplate: TemplateRef<ResultListItemContext> | null = null;

  /** 載入中顯示與念出來的字 */
  @Input() loadingText = '搜尋中';

  /** 沒有結果時顯示與念出來的字 */
  @Input() emptyText = '找不到結果';

  /** 載入失敗的標題 */
  @Input() errorTitle = '載入失敗';

  /** 載入失敗的說明：寫下一步 */
  @Input() errorDescription = '';

  /** 重試鈕的字 */
  @Input() retryText = '重試';

  /**
   * 載入失敗時要不要畫重試鈕。不設（null）就看有沒有人聽 retry；
   * 包住清單、把 retry 轉出去的元件自己知道答案時，直接告訴清單
   */
  @Input() showRetry: boolean | null = null;

  /** ready 時報讀軟體念的字。不設（null）念「找到 N 筆」；設空字串就不念 */
  @Input() announcement: string | null = null;

  /** 選中的項目 id 改變 */
  @Output() activeIdChange = new EventEmitter<string | null>();

  /** 選中那一列在畫面上的 id 改變；設到輸入框的 aria-activedescendant */
  @Output() activeOptionIdChange = new EventEmitter<string | null>();

  /** 選了一列：選中時按 Enter，或點那一列 */
  @Output() itemSelect = new EventEmitter<ResultListItem>();

  /** 按了重試鈕。有人聽這個事件，重試鈕才會出現 */
  @Output() retry = new EventEmitter<void>();

  private readonly groupsSig = signal<readonly ResultListGroup[]>([]);
  private readonly stateSig = signal<ResultListState>('ready');
  protected readonly active = signal<string | null>(null);

  protected readonly view = computed<GroupView[]>(() => {
    let n = 0;
    return this.groupsSig().map((g, gi) => ({
      id: g.id,
      label: g.label ?? '',
      labelId: `${this.listId}-g${gi}`,
      rows: g.items.map(item => ({ item, domId: `${this.listId}-o${n++}` })),
    }));
  });

  private readonly rows = computed<Row[]>(() => this.view().flatMap(g => g.rows));

  /** 清單畫不畫：ready 而且有列 */
  protected readonly showList = computed(() => this.stateSig() === 'ready' && this.rows().length > 0);

  /** 畫出來的群組：清單藏起來時一列都不畫，載入中不會留著上一次的列 */
  protected readonly shownGroups = computed<GroupView[]>(() => (this.showList() ? this.view() : []));

  private readonly activeRow = computed<Row | null>(() => {
    const id = this.active();
    if (id === null) return null;
    return this.rows().find(r => r.item.id === id) ?? null;
  });

  /** 滑鼠上一次的位置（螢幕座標）；整頁都算，不只在列上的時候 */
  private lastPointer: { x: number; y: number } | null = null;
  /** 正在處理的這一個移動事件，滑鼠是不是真的換了位置 */
  private pointerMoved = false;

  /**
   * 記滑鼠在整頁的位置。只記「在列上」的位置不夠：滑鼠停在群組標題或清單外面時沒有紀錄，
   * 之後用鍵盤捲動、瀏覽器在原地補送的移動事件就會被當成「動了」，把鍵盤選好的列搶走。
   * 用 capture：比列自己的處理早跑；還沒看過滑鼠在哪裡時，第一個事件不算動了。
   * 放在 Angular 的區域外：整頁的滑鼠移動不該每一下都觸發畫面檢查。
   */
  private readonly trackPointer = (event: MouseEvent): void => {
    const last = this.lastPointer;
    this.pointerMoved = !!last && (last.x !== event.screenX || last.y !== event.screenY);
    this.lastPointer = { x: event.screenX, y: event.screenY };
  };

  /**
   * autoActivateFirst 時，選中是不是「跟著第一列」。一開始與還原之後是；使用者自己移動、或使用端指定之後不是。
   * 跟著的時候內容一換就選新的第一列，不會留在舊結果的那一筆。
   */
  private followFirst = true;

  constructor() {
    this.zone.runOutsideAngular(() => document.addEventListener('mousemove', this.trackPointer, true));
  }

  ngOnDestroy(): void {
    document.removeEventListener('mousemove', this.trackPointer, true);
  }

  /** 上一次送出去的值；一樣就不重送 */
  private lastEmittedId: string | null = null;
  private lastEmittedDomId: string | null = null;

  /** 選中那一列在畫面上的 id；沒選中是 null */
  get activeOptionId(): string | null {
    return this.activeRow()?.domId ?? null;
  }

  /** 現在有沒有列可以選；輸入框的 aria-expanded 用 */
  get hasOptions(): boolean {
    return this.showList();
  }

  protected get statusText(): string {
    switch (this.state) {
      case 'loading': return this.loadingText;
      case 'empty': return this.emptyText;
      case 'error': return [this.errorTitle, this.errorDescription].filter(Boolean).join('，');
      default: {
        if (this.announcement !== null) return this.announcement;
        const n = this.rows().length;
        return n > 0 ? `找到 ${n} 筆` : '';
      }
    }
  }

  protected get canRetry(): boolean {
    return this.showRetry ?? this.retry.observed;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['groups']) {
      this.groupsSig.set(this.groups ?? []);
      this.warnDuplicateIds();
    }
    if (changes['state']) this.stateSig.set(this.state);
    if (changes['activeId']) {
      this.active.set(this.activeId);
      this.followFirst = false;
      // 使用端自己設的值不用再通知回去
      this.lastEmittedId = this.activeId;
    }
    if (changes['groups'] || changes['state'] || changes['activeId'] || changes['autoActivateFirst']) {
      this.reconcile();
    }
  }

  /**
   * 把輸入框的 keydown 轉進來。回傳 true 表示這一下元件用掉了（已經取消預設動作、不往外傳）。
   * ↓↑ 移動選中；選中時 Enter 發 itemSelect。沒選中的 Enter、其他按鍵、輸入法選字中，都回傳 false。
   */
  handleKeydown(event: KeyboardEvent): boolean {
    if (event.isComposing || event.keyCode === 229) return false;
    if (event.altKey || event.ctrlKey || event.metaKey) return false;
    if (!this.showList()) return false;

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      this.consume(event);
      this.move(event.key === 'ArrowDown' ? 1 : -1);
      return true;
    }
    if (event.key === 'Enter') {
      const row = this.activeRow();
      if (!row) return false;
      this.consume(event);
      // 按住不放的連發：攔下來，不重複選取
      if (!event.repeat) this.itemSelect.emit(row.item);
      return true;
    }
    return false;
  }

  /**
   * 把選中還原成一開始的樣子：沒選中（autoActivateFirst 時是第一列）。
   * 使用端在「查詢的字變了」「面板關掉」時呼叫，免得上一次選中的列留到下一次。
   */
  resetActive(): void {
    this.followFirst = true;
    const rows = this.showList() ? this.rows() : [];
    this.active.set(this.autoActivateFirst && rows.length > 0 ? rows[0].item.id : null);
    this.notify();
  }

  /**
   * 滑鼠在列上移動 → 選中那一列。只認「滑鼠真的動了」：用鍵盤讓清單捲動時，滑鼠沒動、底下的列卻換了，
   * 有些瀏覽器會補送一次移動事件；位置跟上一次一樣就不處理，免得把鍵盤選好的列搶走。
   * 有沒有動由 trackPointer 判斷（它先跑）。
   */
  protected onPointerMove(row: Row): void {
    if (!this.pointerMoved) return;
    if (this.active() === row.item.id) return;
    this.setActive(row.item.id, false);
  }

  /** 按下滑鼠不搶焦點：焦點留在輸入框，使用者點完還能繼續打字 */
  protected onPointerDown(event: MouseEvent): void {
    event.preventDefault();
  }

  protected onClick(row: Row): void {
    this.itemSelect.emit(row.item);
  }

  protected onRetry(): void {
    this.retry.emit();
  }

  private consume(event: KeyboardEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  private move(delta: 1 | -1): void {
    const rows = this.rows();
    const last = rows.length - 1;
    const current = rows.findIndex(r => r.item.id === this.active());
    let next: number;
    if (delta === 1) {
      next = current < last ? current + 1 : this.wrap ? 0 : last;
    } else if (current > 0) {
      next = current - 1;
    } else if (this.wrap) {
      next = last;
    } else {
      // 第一列再往上：回到沒選中（autoActivateFirst 時留在第一列）；本來就沒選中則不動
      next = this.autoActivateFirst && current === 0 ? 0 : -1;
    }
    this.setActive(next >= 0 ? rows[next].item.id : null, true);
  }

  private setActive(id: string | null, scroll: boolean): void {
    this.followFirst = false;
    this.active.set(id);
    this.notify();
    if (scroll) this.scrollActiveIntoView();
  }

  /** 內容、狀態或使用端設的 activeId 變了之後，把選中整理成合理的值 */
  private reconcile(): void {
    const rows = this.showList() ? this.rows() : [];
    let id = this.active();
    if (this.autoActivateFirst && this.followFirst) id = null;
    if (id !== null && !rows.some(r => r.item.id === id)) id = null;
    if (id === null && this.autoActivateFirst && rows.length > 0) id = rows[0].item.id;
    if (id !== this.active()) this.active.set(id);
    // 沒有東西要通知就不排：使用端每次畫面更新都給新陣列（例如範本裡直接呼叫函式）時，
    // 每次都排一個 microtask 會再觸發一次畫面更新，變成停不下來的迴圈
    if (id === this.lastEmittedId && this.activeOptionId === this.lastEmittedDomId) return;
    // 這裡在 ngOnChanges 裡：通知晚一個 microtask，不在使用端的範本檢查到一半時改它的值
    queueMicrotask(() => this.notify());
  }

  private notify(): void {
    const id = this.active();
    const domId = this.activeOptionId;
    if (id !== this.lastEmittedId) {
      this.lastEmittedId = id;
      this.activeIdChange.emit(id);
    }
    if (domId !== this.lastEmittedDomId) {
      this.lastEmittedDomId = domId;
      this.activeOptionIdChange.emit(domId);
    }
  }

  /** 開發模式：項目 id 重複時提醒。重複時選中只認第一筆，後面同 id 的列用鍵盤選不到、也走不過去 */
  private warnDuplicateIds(): void {
    if (!isDevMode()) return;
    const seen = new Set<string>();
    for (const row of this.rows()) {
      if (seen.has(row.item.id)) {
        console.warn(`[app-result-list] 項目 id「${row.item.id}」重複了。選中是用 id 記的：重複時只認第一筆，後面的列用鍵盤選不到。請給不重複的 id。`);
        return;
      }
      seen.add(row.item.id);
    }
  }

  private scrollActiveIntoView(): void {
    const domId = this.activeOptionId;
    if (!domId) return;
    const el = this.host.nativeElement.querySelector<HTMLElement>(`[id="${domId}"]`);
    // 測試環境（jsdom 類）可能沒有 scrollIntoView
    el?.scrollIntoView?.({ block: 'nearest' });
  }
}
