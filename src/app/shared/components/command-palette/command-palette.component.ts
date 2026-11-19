import {
  AfterViewChecked, ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, Output,
  SimpleChanges, TemplateRef, ViewChild, inject, signal,
} from '@angular/core';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import {
  ResultListComponent, ResultListGroup, ResultListItem, ResultListItemContext, ResultListState,
} from '../result-list/result-list.component';
import { SearchFieldComponent } from '../search-field/search-field.component';

/** 使用者想關面板的方式：按 Esc（沒字的時候），或點背景 */
export type CommandPaletteCloseReason = 'escape' | 'backdrop';

let nextPaletteId = 0;

/**
 * 指令面板：對話框裡放搜尋框、結果清單、按鍵提示。打字找一筆、用上下鍵選、Enter 開啟。
 *
 * 元件不打後端、不決定搜什麼：字變了發 queryChange，使用端給 groups 與 state；開關也由使用端管（isOpen）。
 *
 * 按鍵（只處理焦點在輸入框時的）：
 * - ↓↑：移動選中，焦點留在輸入框；選中的列用輸入框的 aria-activedescendant 告訴報讀軟體。
 * - Enter：有選中發 itemSelect；沒選中發 querySubmit。輸入法選字中、按住連發都不發。
 * - Esc：有字先清空（搜尋框自己處理，不往外傳）；沒字才發 closeRequest。
 *
 * 焦點：打開的那一輪畫面更新完就放進輸入框，不等對話框的進場動畫（約 0.45 秒），打開就能打字。
 * 對話框之後抓到的「打開前的焦點」會是輸入框，所以關掉後由這個元件把焦點還給原本的元素；
 * 關掉時焦點已經在別的元素上就不還。
 *
 * 關掉時把字清空並發 queryChange('')，選中也清掉，重開不會看到上一次的東西。
 */
@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [ModalShellComponent, SearchFieldComponent, ResultListComponent],
  templateUrl: './command-palette.component.html',
  styleUrls: ['./command-palette.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent implements OnChanges, AfterViewChecked {
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild(SearchFieldComponent) private searchField?: SearchFieldComponent;
  @ViewChild(ResultListComponent) private list?: ResultListComponent;

  /** 開關，由使用端管 */
  @Input() isOpen = false;

  /** 必填。對話框的報讀名稱，例如「搜尋項目」；輸入框沒另外設 inputLabel 時也用它 */
  @Input({ required: true }) ariaLabel = '';

  /** 輸入框的報讀名稱；不設就用 ariaLabel */
  @Input() inputLabel = '';

  /** 輸入框的提示文字 */
  @Input() placeholder = '搜尋';

  /** 輸入框裡的字；跟 queryChange 一起可以寫成 [(query)] */
  @Input() query = '';

  /** 要列出來的結果（或還沒打字時的建議），直接交給 app-result-list */
  @Input() groups: readonly ResultListGroup[] = [];

  /** 清單的狀態：ready／loading／empty／error */
  @Input() state: ResultListState = 'ready';

  /** 每一列的內容範本；不給就顯示圖示、名稱、說明 */
  @Input() itemTemplate: TemplateRef<ResultListItemContext> | null = null;

  /** 有結果就先選中第一列 */
  @Input() autoActivateFirst = false;

  /** 上下鍵到頭尾時繞回另一端 */
  @Input() wrap = false;

  /** 清單的報讀名稱 */
  @Input() listLabel = '搜尋結果';

  /** 載入中顯示與念出來的字 */
  @Input() loadingText = '搜尋中';

  /** 沒有結果時顯示與念出來的字 */
  @Input() emptyText = '找不到結果';

  /** 載入失敗的標題 */
  @Input() errorTitle = '載入失敗';

  /** 載入失敗的說明 */
  @Input() errorDescription = '';

  /** 重試鈕的字 */
  @Input() retryText = '重試';

  /** ready 時報讀軟體念的字；不設念「找到 N 筆」，設空字串不念 */
  @Input() announcement: string | null = null;

  /** 底部要不要畫按鍵提示；觸控裝置一律不畫 */
  @Input() showHints = true;

  /** 按鍵提示裡 Enter 後面的字，寫選了之後會怎樣 */
  @Input() selectHint = '選取';

  /** 對話框寬度 */
  @Input() width = 'min(680px, calc(100vw - 32px))';

  /** 對話框最高多高；清單超過就在裡面捲 */
  @Input() maxHeight = '72vh';

  /** 輸入框的字變了（含清空；關掉面板時也會送一次空字串） */
  @Output() queryChange = new EventEmitter<string>();

  /** 選了一列：選中時按 Enter，或點那一列 */
  @Output() itemSelect = new EventEmitter<ResultListItem>();

  /** 沒選中任何一列就按 Enter；帶目前的字 */
  @Output() querySubmit = new EventEmitter<string>();

  /** 按了載入失敗的重試鈕。有人聽這個事件，重試鈕才會出現 */
  @Output() retry = new EventEmitter<void>();

  /** 使用者想關面板；使用端收到後把 isOpen 設成 false */
  @Output() closeRequest = new EventEmitter<CommandPaletteCloseReason>();

  /** 退場動畫跑完、對話框從畫面拿掉之後 */
  @Output() afterLeave = new EventEmitter<void>();

  protected readonly listId = `command-palette-${++nextPaletteId}-list`;
  protected current = '';
  protected readonly activeDescendant = signal<string | null>(null);

  /** 打開前焦點所在的元素；關掉後還給它 */
  private opener: HTMLElement | null = null;
  /** 這一輪畫面更新完要把焦點放進輸入框 */
  private focusPending = false;
  /** 對話框從畫面拿掉之後，要把焦點還給它 */
  private restoreTo: HTMLElement | null = null;

  protected get expanded(): boolean {
    return this.state === 'ready' && (this.groups ?? []).some(g => g.items.length > 0);
  }

  protected get hasRetry(): boolean {
    return this.retry.observed;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['query']) this.current = this.query ?? '';

    const open = changes['isOpen'];
    if (!open) return;
    if (open.currentValue) {
      const el = document.activeElement;
      // 退場動畫還沒跑完就重開：焦點還在自己的輸入框裡，這時沿用上一次記下的元素，不把自己記成「打開前的焦點」
      const ownInput = this.inputEl();
      if (!(ownInput && el === ownInput && this.opener)) {
        this.opener = el instanceof HTMLElement && el !== document.body && el !== ownInput ? el : null;
      }
      this.focusPending = true;
      this.restoreTo = null;
    } else if (!open.firstChange) {
      this.focusPending = false;
      this.list?.resetActive();
      if (this.current !== '') {
        this.current = '';
        // 在 ngOnChanges 裡：晚一個 microtask 再通知，不在使用端的範本檢查到一半時改它的值。
        // 使用端在同一輪又帶著字重開的話就不送，免得把它剛給的字清掉
        queueMicrotask(() => { if (!this.isOpen) this.queryChange.emit(''); });
      }
    }
  }

  ngAfterViewChecked(): void {
    if (this.restoreTo) {
      // 對話框的內容已經從畫面拿掉才還（它拿掉時會試著把焦點放回輸入框，要排在那之後）
      if (this.inputEl()?.isConnected) return;
      const opener = this.restoreTo;
      this.restoreTo = null;
      this.restoreFocus(opener);
      return;
    }
    if (!this.focusPending) return;
    const input = this.inputEl();
    // 對話框的內容要等它自己那一輪更新才接到畫面上；還沒接上就等下一輪
    if (!input || !input.isConnected) return;
    this.focusPending = false;
    input.focus({ preventScroll: true });
  }

  protected onQuery(value: string): void {
    // 退場動畫（約 0.45 秒）期間焦點還在輸入框，鍵盤還打得進來：關了就不再收
    if (!this.isOpen) return;
    this.current = value;
    this.list?.resetActive();
    this.queryChange.emit(value);
  }

  protected onKeydown(event: KeyboardEvent): void {
    // 只管輸入框上的按鍵：清除鈕、右邊投影進來的按鈕上的 Enter 是按那顆按鈕
    if (event.target !== this.inputEl()) return;
    if (!this.isOpen) return;
    if (this.list?.handleKeydown(event)) return;
    if (event.key !== 'Enter') return;
    if (event.isComposing || event.keyCode === 229) return;
    // 這一下元件用掉了：不往外傳給頁面的快速鍵；按住不放的連發也攔下，但不重複送
    event.preventDefault();
    event.stopPropagation();
    if (!event.repeat) this.querySubmit.emit(this.current);
  }

  /**
   * 按了重試：重試鈕接著會消失（狀態換成載入中），焦點會掉到 body，上下鍵與打字都失效。
   * 這個元件的焦點本來就該在輸入框，所以直接放回去
   */
  protected onRetry(): void {
    this.retry.emit();
    this.searchField?.focus();
  }

  protected onItemSelect(item: ResultListItem): void {
    if (!this.isOpen) return;
    this.itemSelect.emit(item);
  }

  protected onActiveOption(id: string | null): void {
    this.activeDescendant.set(id);
  }

  protected onAfterLeave(): void {
    this.afterLeave.emit();
    const opener = this.opener;
    this.opener = null;
    if (!opener || this.isOpen) {
      // 重開了：opener 留著，下一次關再還
      if (this.isOpen) this.opener = opener;
      return;
    }
    // 這時對話框還在畫面上；記下來，等它這一輪更新被拿掉之後（ngAfterViewChecked）再還
    this.restoreTo = opener;
    this.cdr.markForCheck();
  }

  private restoreFocus(opener: HTMLElement): void {
    if (this.isOpen || !opener.isConnected) return;
    const active = document.activeElement;
    // 焦點沒有地方去（body、null）才還；使用者已經移到別的元素就不搶
    if (active && active !== document.body && active !== document.documentElement) return;
    opener.focus();
  }

  private inputEl(): HTMLInputElement | null {
    return this.searchField?.inputElement ?? null;
  }
}
