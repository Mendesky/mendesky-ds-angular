import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { InputComponent } from '../input/input.component';
import { SpinnerComponent } from '../spinner/spinner.component';

/** 編輯是怎麼收起的：key＝按 Enter 或 Esc；blur＝焦點離開輸入框（點到別處、按 Tab） */
export type InlineEditCloseReason = 'key' | 'blur';

/**
 * 原地編輯：畫面上的一段單行文字，點了就地變成輸入框。
 *
 * Enter 或離開輸入框就送出（去頭尾空白、跟原值不同才發 commit）；Esc 放棄。
 * Enter、Esc 不往外傳：放在視窗裡時，Esc 只收起輸入框，不會關掉視窗。
 * 按住 Enter／Esc 只算一下；用輸入法選字時的 Enter／Esc 交給輸入法。
 *
 * 展示櫃原則：值放在使用端。使用端給 value，收到 (commit) 自己存，存好再把新值給回來。
 * 要等伺服器成功才換值的使用端，等待時把 saving 設為 true：顯示剛送出的文字加轉圈，
 * saving 變回 false 後顯示 value（成功是新值，失敗是原值）。
 *
 * 規格（何時用、狀態、無障礙）在本體 @mendesky/ds 的 inline-edit。
 */
@Component({
  selector: 'app-inline-edit',
  standalone: true,
  imports: [InputComponent, SpinnerComponent],
  templateUrl: './inline-edit.component.html',
  styleUrls: ['./inline-edit.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineEditComponent implements OnChanges, OnInit, AfterViewInit {
  /** 目前的值，由使用端持有 */
  @Input() value = '';
  /** 這段文字是什麼（例：「名稱」）。顯示時的按鈕名稱與編輯時的輸入框名稱都靠它，一律要設 */
  @Input() ariaLabel = '';
  /** value 是空的時候顯示的提示文字，也是輸入框的提示文字 */
  @Input() placeholder = '';
  /** 輸入框尺寸；顯示文字的最小高度跟著它，切換時那一列不會跳 */
  @Input() size: 'S' | 'M' = 'S';
  /** 有值就擋住送出：Enter 與離開都不送，輸入框留著並顯示這段訊息 */
  @Input() errorMessage = '';
  /** 使用端正在存檔：顯示剛送出的文字加轉圈，這段時間進不了編輯；報讀軟體念「<ariaLabel>儲存中」 */
  @Input() saving = false;
  /** 停用：文字照常顯示，點了沒反應 */
  @Input() disabled = false;
  /** 是否在編輯中。入口不在文字上（例如從選單進入）時由使用端設為 true；可以雙向綁定 */
  @Input() editing = false;

  /** 送出：去頭尾空白後的字串。跟 value 相同（含只差頭尾空白）不發 */
  @Output() commit = new EventEmitter<string>();
  /** 按 Esc 放棄 */
  @Output() cancel = new EventEmitter<void>();
  /** 輸入框內容每次變動；使用端據此算 errorMessage */
  @Output() draftChange = new EventEmitter<string>();
  /**
   * 編輯收起時發出收起的原因。只在編輯時才放這個元件的使用端靠它決定要不要把焦點放回入口：
   * key 才放（輸入框被拿掉，焦點沒有地方去）；blur 不放（焦點已經在使用者點的地方）。
   */
  @Output() closed = new EventEmitter<InlineEditCloseReason>();
  @Output() editingChange = new EventEmitter<boolean>();

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly cdr = inject(ChangeDetectorRef);

  /** 畫面實際的編輯狀態；editing 輸入只是使用端的要求 */
  readonly isEditing = signal(false);
  /** 最後一次送出的文字，saving 時顯示它 */
  protected pendingText: string | null = null;
  /** 送出被錯誤訊息擋下時，給報讀軟體念的那段訊息；改字或收起就清掉 */
  protected blockedMessage = '';
  private draft = '';

  /** 報讀區的文字：存檔中念「<ariaLabel>儲存中」；送出被擋下時念錯誤訊息；其他時候是空的 */
  get statusText(): string {
    if (this.saving) return `${this.ariaLabel}儲存中`;
    return this.blockedMessage;
  }

  /** 目前該顯示的值：存檔中顯示剛送出的；這次存檔不是從這裡送出的（沒有剛送出的文字）就顯示 value */
  private get currentText(): string {
    return this.saving && this.pendingText !== null ? this.pendingText : this.value;
  }

  /** 顯示文字：有值顯示值，沒有就顯示提示文字 */
  get displayText(): string {
    return this.currentText || this.placeholder;
  }

  get isPlaceholderShown(): boolean {
    return !this.currentText;
  }

  /** 例：「編輯名稱，目前是第一季」 */
  get buttonLabel(): string {
    return `編輯${this.ariaLabel}，目前是${this.currentText || '空的'}`;
  }

  ngOnChanges(changes: SimpleChanges): void {
    // 存檔結束就忘掉剛送出的文字；不然下一次別的原因進入 saving 會顯示到舊的
    if (changes['saving'] && !this.saving) this.pendingText = null;
    // 不在存檔中而 value 換了（使用端先換值、或換成另一筆資料）：剛送出的文字已經沒有用，留著會在下次 saving 時顯示錯
    if (changes['value'] && !this.saving) this.pendingText = null;
    // 編輯中 value 被使用端換掉：輸入框會改顯示新值，草稿跟著換，送出的字才會跟畫面一樣
    if (changes['value'] && !changes['value'].firstChange && this.isEditing()) this.draft = this.value;
    const editing = changes['editing'];
    if (!editing || editing.firstChange) return;
    if (this.editing && !this.isEditing()) {
      if (!this.canEdit()) {
        // 存檔中或停用時不開；把使用端的雙向綁定改回來，不然下次設 true 不算變動
        queueMicrotask(() => this.editingChange.emit(false));
        return;
      }
      this.open();
      // 這時還在外層的變更偵測裡，輸入框要等這一輪畫完才存在
      queueMicrotask(() => this.focusInput());
    } else if (!this.editing && this.isEditing()) {
      // 使用端直接關掉：當作放棄，不送出
      this.isEditing.set(false);
      this.blockedMessage = '';
    }
  }

  ngOnInit(): void {
    // 元件一出現就是編輯狀態（使用端只在編輯時才放它）：第一次畫就直接畫輸入框
    if (!this.editing) return;
    if (this.canEdit()) this.open();
    // 存檔中或停用時不開；把使用端的雙向綁定改回來（跟之後才設 true 的情況一致）
    else queueMicrotask(() => this.editingChange.emit(false));
  }

  ngAfterViewInit(): void {
    if (this.isEditing()) queueMicrotask(() => this.focusInput());
  }

  onDisplayClick(): void {
    if (!this.canEdit()) return;
    this.open();
    this.editingChange.emit(true);
    this.focusInput();
  }

  /**
   * 收起後焦點回到顯示文字，按住不放的連發會落在這顆按鈕上：
   * Enter 連發會再打開輸入框，一開一關地閃；Esc 連發會傳到外層把視窗關掉。兩個都擋掉。
   */
  onDisplayKeydown(event: KeyboardEvent): void {
    if (event.repeat) {
      // 收起後的連發已經在 document 上吃掉（swallowRepeats）；這裡再擋一次，連發從別的路徑落到這顆按鈕也不會動作
      if (event.key === 'Enter' || event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
      }
      return;
    }
    // 用來進入編輯的那一下 Enter／空白鍵已經有用途，不往外傳（外層表單的 Enter、頁面的快捷鍵）。
    // 不擋預設動作：原生按鈕靠它觸發 click。進不了編輯時這個鍵沒被用掉，照常往外傳
    if ((event.key === 'Enter' || event.key === ' ') && this.canEdit()) event.stopPropagation();
  }

  onValueChange(value: string): void {
    this.draft = value;
    this.blockedMessage = '';
    this.draftChange.emit(value);
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Enter' && event.key !== 'Escape') return;
    // 這兩個鍵在輸入框裡已經有用途，不往外傳（外層視窗的 Esc 關閉、表單的 Enter 送出）
    event.stopPropagation();
    // 用輸入法選字時的 Enter（確定）、Esc（取消選字）是給輸入法的。Safari 確定選字的 Enter 沒有 isComposing，只看得出 keyCode 229
    if (event.isComposing || event.keyCode === 229) return;
    event.preventDefault();
    // 按住不放會連發，只認第一下
    if (event.repeat) return;
    if (event.key === 'Enter') {
      if (!this.submit('key')) return;
    } else {
      this.isEditing.set(false);
      this.blockedMessage = '';
      // 先發 cancel，再發 closed 與 editingChange：使用端在 editingChange 把元件拿掉時，前面的事件已經處理完
      this.cancel.emit();
      this.closed.emit('key');
      this.editingChange.emit(false);
    }
    this.swallowRepeats(event.key);
    this.focusDisplay();
  }

  /** 離開輸入框就送出；焦點已經被使用者移走，不拉回來 */
  onBlur(): void {
    // Enter／Esc 收起時輸入框被拆掉，瀏覽器可能再發一次 blur；已經收起就不重複送
    if (!this.isEditing()) return;
    // 整個視窗失去焦點（切到別的視窗或分頁）不算離開輸入框：留在編輯中、不送出。
    // 回來時瀏覽器會把焦點還給輸入框，打到一半的字還在
    if (!document.hasFocus()) return;
    this.submit('blur');
  }

  /** 送出並收起。有錯誤訊息時不送、留在編輯中，回傳 false */
  private submit(reason: InlineEditCloseReason): boolean {
    if (this.errorMessage) {
      // 畫面上輸入框變紅並顯示訊息；報讀軟體靠報讀區才聽得到「為什麼沒送出」
      this.blockedMessage = this.errorMessage;
      return false;
    }
    const next = this.draft.trim();
    this.isEditing.set(false);
    this.blockedMessage = '';
    if (next !== this.value.trim()) {
      this.pendingText = next;
      this.commit.emit(next);
      // 使用端沒有在 (commit) 裡進入 saving（先換值的用法）：剛送出的文字用不到，清掉。
      // 等一個 macrotask：saving 是輸入，要等外層重繪後才看得到新值
      setTimeout(() => {
        if (!this.saving) this.pendingText = null;
      });
    }
    this.closed.emit(reason);
    // 最後才發 editingChange（內容沒變時只會發 closed 與它）：使用端可以在這裡統一收尾
    this.editingChange.emit(false);
    return true;
  }

  /**
   * 按 Enter／Esc 收起之後，同一個鍵按住不放的連發一律吃掉，直到放開為止。
   * 連發落在哪裡不一定：顯示文字上（Enter 會把輸入框再打開、Esc 會傳到外層把視窗關掉），
   * 或使用端把元件拿掉後的 body 上。所以掛在 document 的捕捉階段，不靠元件自己還在不在。
   */
  private swallowRepeats(key: string): void {
    const onKeydown = (e: KeyboardEvent): void => {
      if (e.key !== key) return;
      // 不是連發＝重新按了一次，上一次按住已經結束（放開的事件可能發生在別的視窗而沒收到）：收掉，不擋這一下
      if (!e.repeat) return stop();
      e.preventDefault();
      e.stopPropagation();
    };
    const stop = (e?: Event): void => {
      if (e instanceof KeyboardEvent && e.key !== key) return;
      document.removeEventListener('keydown', onKeydown, true);
      document.removeEventListener('keyup', stop, true);
      window.removeEventListener('blur', stop);
    };
    document.addEventListener('keydown', onKeydown, true);
    document.addEventListener('keyup', stop, true);
    window.addEventListener('blur', stop);
  }

  private canEdit(): boolean {
    return !this.disabled && !this.saving;
  }

  private open(): void {
    this.draft = this.value;
    this.isEditing.set(true);
  }

  /**
   * 先同步畫出輸入框再聚焦並全選。從點擊進來時不能等 microtask：zone 要等 microtask 跑完才更新畫面，
   * 那時輸入框還沒出現，焦點會掉到 body。
   */
  private focusInput(): void {
    if (!this.isEditing()) return;
    this.cdr.detectChanges();
    const input = this.host.nativeElement.querySelector('input') as HTMLInputElement | null;
    input?.focus();
    input?.select();
  }

  /** Enter／Esc 收起後焦點還給顯示文字；不然輸入框被拆掉，焦點掉到 body */
  private focusDisplay(): void {
    this.cdr.detectChanges();
    (this.host.nativeElement.querySelector('.inline-edit__display') as HTMLElement | null)?.focus();
  }
}
