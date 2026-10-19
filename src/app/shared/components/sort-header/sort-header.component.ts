import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy, HostBinding } from '@angular/core';
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
 * - 正在排序的欄：動作色、半粗，一直顯示上 / 下箭頭。
 * - 欄寬由呼叫端放在 host 上的 class（例：col-name）決定。
 * - 按鈕的左右內距往外拉回，文字會跟下方內容對齊；數字欄靠右時用 align="end"。
 *
 * host 帶 role="columnheader" 與 aria-sort，讀屏會唸出目前的排序方向。
 */
@Component({
  selector: 'app-sort-header',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './sort-header.component.html',
  styleUrls: ['./sort-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortHeaderComponent {
  /** 表頭文字 */
  @Input() label = '';

  /** 這欄的識別字，點擊時原樣發出 */
  @Input() key = '';

  /** 列表目前的排序狀態；null＝沒有排序 */
  @Input() sort: SortState | null = null;

  /** 文字靠左（預設）或靠右（數字欄） */
  @Input() align: 'start' | 'end' = 'start';

  /** 點擊時發出 key */
  @Output() sortChange = new EventEmitter<string>();

  @HostBinding('attr.role') readonly role = 'columnheader';

  @HostBinding('attr.aria-sort') get ariaSort(): 'ascending' | 'descending' | 'none' {
    if (!this.active) return 'none';
    return this.sort!.dir === 'asc' ? 'ascending' : 'descending';
  }

  @HostBinding('class.ds-sort-header--end') get alignEnd(): boolean {
    return this.align === 'end';
  }

  /** 這欄正在排序 */
  get active(): boolean {
    return !!this.sort && this.sort.key === this.key;
  }

  /** 沒在排序：通用排序符號；正在排序：方向箭頭 */
  get icon(): string {
    if (!this.active) return 'Sort';
    return this.sort!.dir === 'asc' ? 'UpArrow' : 'DownArrow';
  }

  onClick(): void {
    this.sortChange.emit(this.key);
  }
}
