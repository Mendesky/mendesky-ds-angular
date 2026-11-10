import {
  AfterViewChecked, ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnChanges, Output, QueryList,
  ViewChild, ViewChildren,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';
import type { StatusMark } from '../../types/status-mark';

/** 一個頁籤 */
export interface TabItem {
  /** 這個頁籤代表的值；選中時元件的 value 等於它 */
  value: string | number;
  /** 頁籤上的文字 */
  label: string;
  /** 停用：點了、方向鍵都選不到 */
  disabled?: boolean;
  /** 名稱後面的狀態標記（選填） */
  status?: StatusMark | null;
}

let nextId = 0;

/**
 * 頁籤：同一個區塊裡切換幾組內容。只負責頁籤列，下方的內容由使用端自己顯示。
 *
 * 頁籤列是 role="tablist"，每個頁籤是 role="tab" 的原生 button。用 roving tabindex：
 * 只有選中的頁籤（沒有選中時是第一個沒停用的）在 Tab 順序裡，其他用左右方向鍵、Home、End 到，
 * 移過去就選中（自動啟用）。停用的頁籤會跳過。
 * 投影的內容放在 tablist 外面、最後一個頁籤右邊，例如「新增一組」按鈕。
 * 選中的頁籤改變時（含使用端改 value），頁籤列自動捲到看得見它；選中的沒變就不捲。
 */
@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [IconComponent, TooltipDirective],
  templateUrl: './tabs.component.html',
  styleUrls: ['./tabs.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TabsComponent implements OnChanges, AfterViewChecked {
  private readonly baseId = `app-tabs-${++nextId}`;
  /** 上次捲進畫面的選中頁籤（位置＋value）；沒變就不再捲，免得把使用者自己捲的位置拉回去 */
  private revealedKey: string | null = null;
  private needsReveal = false;

  /** 頁籤；value 不能重複 */
  @Input({ required: true }) items: TabItem[] = [];
  /** 選中的頁籤的 value；null＝都沒選中 */
  @Input() value: string | number | null = null;
  /** 頁籤列的名稱，報讀軟體會念；必填 */
  @Input({ required: true }) ariaLabel = '';
  /** 內容外框的 id（選填）；給了的話每個頁籤用 aria-controls 指向它 */
  @Input() panelId = '';

  /** 選中另一個頁籤時觸發（點擊、方向鍵、Home、End）；點已選中的頁籤不觸發 */
  @Output() valueChange = new EventEmitter<string | number>();

  @ViewChildren('tabBtn') private tabBtns!: QueryList<ElementRef<HTMLButtonElement>>;
  @ViewChild('list') private listRef?: ElementRef<HTMLElement>;

  ngOnChanges(): void {
    const i = this.items.findIndex(t => t.value === this.value);
    const key = i < 0 ? null : `${i}:${typeof this.value}:${this.value}`;
    if (key === this.revealedKey) return;
    this.revealedKey = key;
    this.needsReveal = key !== null;
  }

  /** 畫面更新完才量得到新頁籤的位置，所以在這裡捲 */
  ngAfterViewChecked(): void {
    if (!this.needsReveal) return;
    this.needsReveal = false;
    this.revealSelected();
  }

  /** 第 i 個頁籤的 id */
  tabId(index: number): string {
    return `${this.baseId}-tab-${index}`;
  }

  /** 選中頁籤的 id，給內容外框的 aria-labelledby 用；都沒選中時是 null */
  get selectedTabId(): string | null {
    const i = this.items.findIndex(t => t.value === this.value);
    return i < 0 ? null : this.tabId(i);
  }

  /** 在 Tab 順序裡的頁籤：選中且沒停用的；沒有就是第一個沒停用的 */
  get focusableIndex(): number {
    const sel = this.items.findIndex(t => t.value === this.value && !t.disabled);
    return sel >= 0 ? sel : this.items.findIndex(t => !t.disabled);
  }

  select(index: number): void {
    const tab = this.items[index];
    if (!tab || tab.disabled || tab.value === this.value) return;
    this.valueChange.emit(tab.value);
  }

  onKeydown(event: KeyboardEvent, index: number): void {
    let target = -1;
    switch (event.key) {
      case 'ArrowRight': target = this.step(index, 1); break;
      case 'ArrowLeft': target = this.step(index, -1); break;
      case 'Home': target = this.step(-1, 1); break;
      case 'End': target = this.step(this.items.length, -1); break;
      default: return;
    }
    event.preventDefault();
    if (target < 0 || target === index) return;
    this.tabBtns.get(target)?.nativeElement.focus();
    this.select(target);
  }

  /**
   * 把選中的頁籤捲進頁籤列看得到的範圍。捲軸藏起來，看不到的選中頁籤使用者找不到。
   * 只改頁籤列自己的 scrollLeft，不用 scrollIntoView，外面的頁面不會跟著捲。
   * 頁籤比頁籤列還寬時，以左邊對齊為準。
   */
  private revealSelected(): void {
    const list = this.listRef?.nativeElement;
    const i = this.items.findIndex(t => t.value === this.value);
    const tab = i < 0 ? undefined : this.tabBtns?.get(i)?.nativeElement;
    if (!list || !tab) return;
    const box = list.getBoundingClientRect();
    const r = tab.getBoundingClientRect();
    let delta = 0;
    if (r.right > box.right) delta = r.right - box.right;
    if (r.left - delta < box.left) delta = r.left - box.left;
    if (delta !== 0) list.scrollLeft += delta;
  }

  /** 從 from 往 dir 方向找下一個沒停用的頁籤，到頭就繞回另一端；都停用時回 -1 */
  private step(from: number, dir: 1 | -1): number {
    const n = this.items.length;
    for (let k = 1; k <= n; k++) {
      const i = (((from + dir * k) % n) + n) % n;
      if (!this.items[i].disabled) return i;
    }
    return -1;
  }
}
