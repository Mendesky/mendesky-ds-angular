import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  HostBinding,
  Input,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { SortState } from './sort-header.model';

/**
 * SortHeaderComponent — 可點擊排序的表頭
 *
 * 放在列表表頭（.lt-header）裡當一格。點了發出這欄的 key，由呼叫端決定怎麼排、並把新的
 * 排序狀態傳回來（本元件不持有狀態，也不排序資料）。
 *
 * 用法：
 *   <app-sort-header class="col-name" label="姓名" key="name" [sort]="sort()" (sortChange)="onSort($event)" />
 *   onSort(key: string) { this.sort.set(nextSort(this.sort(), key)); }
 *
 * 外觀規則：
 * - 沒在排序的欄：跟一般表頭一樣是淺灰字，滑過或鍵盤聚焦時才出現排序圖示。
 * - 正在排序的欄：動作色、半粗，一直顯示方向圖示。
 * - 欄寬由呼叫端放在 host 上的 class（例：col-name）決定。
 * - 靠左、靠右時按鈕的內距往外拉回，文字（靠右時是排序圖示）跟下方內容的邊緣對齊。
 * - 置中時左邊補一塊跟排序圖示一樣寬的空位，欄名固定在這一格的正中間；這塊空位與圖示的位置
 *   不佔欄寬，按鈕左右各往外凸 16px。
 *
 * 報讀：
 * - 排序狀態寫在按鈕的名稱裡（畫面上看不到的一段字），例如「姓名，升冪排序」。列表多半沒有表格結構，
 *   單靠 columnheader＋aria-sort 念不出來。
 * - 外層是表格列（任何一層祖先帶 role="row" 屬性；原生 <tr> 不算）時，host 才帶 role="columnheader" 與 aria-sort，
 *   這時按鈕名稱不再重複寫排序狀態。只在元件建立時判斷一次。
 * - 點了這一欄、排序狀態在一秒內傳回來，role="status" 區域念「已依姓名升冪排序」。區域一直都在、平常是空的：
 *   焦點還在同一顆按鈕上，名稱變了報讀軟體多半不會重念。使用者離開這一欄（焦點移走或滑鼠移開）就清空。
 * - 表格列裡 host 另外帶 aria-label＝欄名，欄標頭的名稱才不會把上面那一句也算進去。
 */
@Component({
  selector: 'app-sort-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './sort-header.component.html',
  styleUrls: ['./sort-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortHeaderComponent implements OnInit, OnChanges {
  /** 表頭文字 */
  @Input() label = '';

  /** 這欄的識別字，點擊時原樣發出 */
  @Input() key = '';

  /** 列表目前的排序狀態；null＝沒有排序 */
  @Input() sort: SortState | null = null;

  /** 文字靠左（預設）、置中或靠右（數字欄） */
  @Input() align: 'start' | 'center' | 'end' = 'start';

  /** 欄名前面的圖示名稱；空字串＝不放 */
  @Input() leftIcon = '';

  /** 點擊時發出 key */
  @Output() sortChange = new EventEmitter<string>();

  /** 外層是不是表格列；ngOnInit 判斷一次 */
  inRow = false;

  /** role="status" 區域的文字；平常是空的 */
  statusText = '';

  /**
   * 這一欄最後一次被點的時間（Date.now()）；null＝沒有等著要念的點擊。
   * 用時間戳比對，不用計時器：使用端在 fakeAsync 裡點表頭的測試不會因此多出一顆沒清的計時器。
   */
  private clickedAt: number | null = null;

  /** 點了之後多久內排序狀態傳回來才念（毫秒）。超過就當成這一下沒有改到排序 */
  static readonly ANNOUNCE_WINDOW_MS = 1000;

  constructor(
    private readonly host: ElementRef<HTMLElement>,
    private readonly cdr: ChangeDetectorRef,
  ) {}

  @HostBinding('attr.role') get role(): 'columnheader' | null {
    return this.inRow ? 'columnheader' : null;
  }

  /**
   * 表格列裡 host 是 columnheader，名稱預設由內容算，會把 role="status" 區域的那一句也算進去
   * （「姓名已依姓名升冪排序」）。直接給名稱，欄標頭就只念欄名。
   */
  @HostBinding('attr.aria-label') get hostLabel(): string | null {
    return this.inRow ? this.label : null;
  }

  @HostBinding('attr.aria-sort') get ariaSort(): 'ascending' | 'descending' | 'none' | null {
    if (!this.inRow) return null;
    if (!this.active) return 'none';
    return this.sort!.dir === 'asc' ? 'ascending' : 'descending';
  }

  @HostBinding('class.ds-sort-header--end') get alignEnd(): boolean {
    return this.align === 'end';
  }

  @HostBinding('class.ds-sort-header--center') get alignCenter(): boolean {
    return this.align === 'center';
  }

  /** 這欄正在排序 */
  get active(): boolean {
    return !!this.sort && this.sort.key === this.key;
  }

  /** 沒在排序：通用排序符號；正在排序：方向圖示 */
  get icon(): string {
    if (!this.active) return 'Sort';
    return this.sort!.dir === 'asc' ? 'Sort-Asc' : 'Sort-Desc';
  }

  /** 正在排序時的方向用詞；沒在排序是空字串 */
  get dirText(): string {
    if (!this.active) return '';
    return this.sort!.dir === 'asc' ? '升冪排序' : '降冪排序';
  }

  /** 接在按鈕名稱後面、只給報讀軟體的排序狀態；表格列裡由 aria-sort 表達，不重複 */
  get stateText(): string {
    return this.inRow || !this.active ? '' : `，${this.dirText}`;
  }

  ngOnInit(): void {
    this.inRow = !!this.host.nativeElement.parentElement?.closest('[role="row"]');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!changes['sort'] && !changes['key'] && !changes['label']) return;
    if (!this.active) {
      // 換成別欄排序，或排序被清掉：這一欄不該留著上一句
      this.statusText = '';
      this.clickedAt = null;
      return;
    }
    if (!changes['sort']) {
      // 還在排序，但欄名或 key 被換掉了：上一句寫的是舊欄名，清掉
      this.statusText = '';
      return;
    }
    const clickedAt = this.clickedAt;
    this.clickedAt = null;
    if (clickedAt !== null && Date.now() - clickedAt <= SortHeaderComponent.ANNOUNCE_WINDOW_MS) {
      this.statusText = `已依${this.label}${this.dirText}`;
    } else {
      // 不是點這一欄造成的改變（從別的入口反轉方向），或點了很久之後才變：上一句已經不對了，清掉
      this.statusText = '';
    }
  }

  onClick(): void {
    this.clickedAt = Date.now();
    this.sortChange.emit(this.key);
    this.cdr.markForCheck();
  }

  /**
   * 使用者離開這一欄（焦點移走，或滑鼠移開）就把那一句清掉。
   * 那一句在填進去的當下已經念過；留著的話，之後用瀏覽模式逐項讀會再讀到一次過時的確認。
   * 滑鼠移開也算：有的瀏覽器用滑鼠點按鈕不會給焦點，只等 blur 會一直留著。
   */
  onLeave(): void {
    if (!this.statusText) return;
    this.statusText = '';
    this.cdr.markForCheck();
  }
}
