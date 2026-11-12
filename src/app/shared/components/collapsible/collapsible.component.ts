import {
  ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, booleanAttribute, inject, signal,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { COLLAPSIBLE_GROUP, CollapsibleGroupMember } from './collapsible-group.component';

/** 外觀：section＝頁面上的大段落（灰底）；card＝卡片或清單項目的標頭（沒有底色）；accent＝可以拖曳排序的段落（綠底白字） */
export type CollapsibleAppearance = 'section' | 'card' | 'accent';
/** 箭頭在標題按鈕的哪一端 */
export type CollapsibleChevronPosition = 'start' | 'end';
/** 標題層級（role="heading" 的 aria-level） */
export type CollapsibleHeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

let nextId = 0;

/**
 * 收合區塊：點標頭開合一段內容。
 *
 * 標頭分三區：前置區 | 標題按鈕 | 尾端區。只有標題按鈕（原生 button）會開合；
 * 前置區、尾端區放勾選框、拖曳把手、選單這些自己會動作的東西，在按鈕外面，點了不會開合。
 * 按鈕裡只放不能點的東西：前綴、標題、標題後資訊、摘要、數值。
 * 空間不夠時先縮摘要、再截標題，數值不縮：一行預覽放摘要，金額放數值。
 *
 * 內容區用全域的 .ds-collapse 做開合轉場；收合時內層加 inert，鍵盤進不去、報讀軟體不念，但內容還在 DOM 裡。
 * 開合可以 [(expanded)] 雙向綁定，也可以不綁、元件自己記。
 * 停用用 aria-disabled：按鈕還停得到，報讀軟體才念得出停用。
 * host 不留原生 title 屬性：title 是輸入，留著的話整個區塊滑過都會跳瀏覽器提示。
 */
@Component({
  selector: 'app-collapsible',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './collapsible.component.html',
  styleUrls: ['./collapsible.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // 段落內容裡巢狀的收合區塊找不到外層群組（見 COLLAPSIBLE_GROUP）
  providers: [{ provide: COLLAPSIBLE_GROUP, useValue: null }],
  host: {
    class: 'collapsible',
    '[class.collapsible--section]': "appearance === 'section'",
    '[class.collapsible--card]': "appearance === 'card'",
    '[class.collapsible--accent]': "appearance === 'accent'",
    '[class.collapsible--expanded]': 'isExpanded()',
    '[class.collapsible--disabled]': 'disabled',
    '[attr.title]': 'null',
  },
})
export class CollapsibleComponent implements CollapsibleGroupMember, OnDestroy {
  private readonly group = inject(COLLAPSIBLE_GROUP, { optional: true, skipSelf: true });
  private readonly uid = ++nextId;
  private readonly state = signal(false);

  /** 標題按鈕的 id */
  readonly triggerId = `app-collapsible-${this.uid}-trigger`;
  /** 內容區的 id，標題按鈕的 aria-controls 指向它 */
  readonly panelId = `app-collapsible-${this.uid}-panel`;
  /** 目前是否展開 */
  readonly isExpanded = this.state.asReadonly();

  /** 標題文字；必填 */
  @Input({ required: true }) title = '';
  /** 外觀 */
  @Input() appearance: CollapsibleAppearance = 'section';
  /** 箭頭位置：start 在標題左邊（預設）、end 在最右邊 */
  @Input() chevronPosition: CollapsibleChevronPosition = 'start';
  /** 停用：點了、按 Enter 或空白鍵都不開合，維持原來的開合 */
  @Input({ transform: booleanAttribute }) disabled = false;
  /** 標題層級；有值時標題按鈕外面包一層 role="heading" aria-level */
  @Input() headingLevel: CollapsibleHeadingLevel | null = null;

  /** 是否展開；可以 [(expanded)] 雙向綁定，不綁時元件自己記 */
  @Input({ transform: booleanAttribute })
  set expanded(value: boolean) {
    this.state.set(value);
  }
  get expanded(): boolean {
    return this.state();
  }

  /** 使用者開合時觸發（點標題按鈕、Enter、空白鍵），以及群組設了 single 而收起這一段時；頁面改 expanded 不觸發 */
  @Output() expandedChange = new EventEmitter<boolean>();

  constructor() {
    this.group?.register(this);
  }

  ngOnDestroy(): void {
    this.group?.unregister(this);
  }

  toggle(): void {
    if (this.disabled) return;
    const next = !this.state();
    this.state.set(next);
    // 先讓群組收起其他段，它們各自發 false；這段的 true 最後發，頁面用一個值記「開著哪一段」時才會記到這段
    if (next) this.group?.memberOpened(this);
    this.expandedChange.emit(next);
  }

  collapseFromGroup(): void {
    if (this.disabled || !this.state()) return;
    this.state.set(false);
    this.expandedChange.emit(false);
  }
}
