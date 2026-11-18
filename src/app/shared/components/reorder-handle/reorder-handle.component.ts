import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  booleanAttribute,
  inject,
  signal,
} from '@angular/core';
import { CdkDragHandle } from '@angular/cdk/drag-drop';
import { REORDER_DIRECTIONS, reorderTarget, type ReorderDirection } from '@mendesky/ds';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { IconBtnComponent } from '../icon-btn/icon-btn.component';
import { IconComponent } from '../icon/icon.component';
import { MenuItemComponent } from '../menu-item/menu-item.component';

export type ReorderHandleAppearance = 'default' | 'inverse';

/** 從選單移動時送出；欄位名稱跟 CDK 拖曳放下的事件相同，兩邊可以用同一個處理函式 */
export interface ReorderMoveEvent {
  direction: ReorderDirection;
  /** 移動前的位置（從 0 起） */
  previousIndex: number;
  /** 移動後的位置（從 0 起） */
  currentIndex: number;
}

/**
 * ReorderHandleComponent — 可排序清單的握把
 *
 * 一顆按鈕做兩件事：
 * - 按住拖曳：元件本身就是 CDK 的拖曳握把（hostDirectives 帶了 CdkDragHandle），放在 cdkDrag 項目裡就能拖。
 * - 點一下（Enter、空白鍵）：打開「上移、下移、移到最上、移到最下」的選單，做不到的停用。
 *
 * 選了之後送出 move（從第幾個移到第幾個），不改資料；使用端搬陣列、存檔、失敗時退回。
 * 選單關閉時 app-action-menu 把焦點還給握把按鈕；項目被搬到別的位置後也一樣（測試鎖住上移、下移、移到最上、移到最下）。
 * 存檔失敗、使用端把項目搬回去時，焦點可能會掉，使用端呼叫 focusButton() 放回來。
 *
 * 清單只有一個項目（count < 2）或 disabled 時停用：按鈕停用、CDK 握把也停用（不能拖）。
 */
@Component({
  selector: 'app-reorder-handle',
  standalone: true,
  imports: [ActionMenuComponent, IconBtnComponent, IconComponent, MenuItemComponent],
  hostDirectives: [CdkDragHandle],
  host: {
    class: 'ds-reorder-handle',
    '[class.ds-reorder-handle--inverse]': "appearance === 'inverse'",
    '[class.ds-reorder-handle--disabled]': 'isDisabled',
  },
  templateUrl: './reorder-handle.component.html',
  styleUrls: ['./reorder-handle.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReorderHandleComponent implements OnChanges {
  /** 項目的完整名稱；報讀念「移動『名稱』」 */
  @Input({ required: true }) label = '';
  /** 這個項目目前在第幾個（從 0 起） */
  @Input({ required: true }) index = 0;
  /** 清單共幾個項目 */
  @Input({ required: true }) count = 0;
  /** 預設（白底、淺色底）或反白（深色標頭） */
  @Input() appearance: ReorderHandleAppearance = 'default';
  /** 停用：不能拖、不開選單 */
  @Input({ transform: booleanAttribute }) disabled = false;

  /** 從選單移動時送出 */
  @Output() move = new EventEmitter<ReorderMoveEvent>();

  readonly directions = REORDER_DIRECTIONS;
  readonly open = signal(false);
  readonly host: HTMLElement = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private readonly dragHandle = inject(CdkDragHandle, { self: true });

  /** 清單只有一個項目，或使用端設了停用 */
  get isDisabled(): boolean {
    return this.disabled || this.count < 2;
  }

  get menuLabel(): string {
    return `移動「${this.label}」`;
  }

  ngOnChanges(): void {
    this.dragHandle.disabled = this.isDisabled;
    if (this.isDisabled) this.open.set(false);
  }

  canMove(direction: ReorderDirection): boolean {
    return reorderTarget(this.index, this.count, direction) !== null;
  }

  toggle(): void {
    if (this.isDisabled) return;
    this.open.update(v => !v);
  }

  pick(direction: ReorderDirection): void {
    this.open.set(false);
    const currentIndex = reorderTarget(this.index, this.count, direction);
    if (currentIndex === null) return;
    this.move.emit({ direction, previousIndex: this.index, currentIndex });
  }

  /** 把焦點放到握把按鈕上（顯示焦點框） */
  focusButton(): void {
    this.host.querySelector<HTMLButtonElement>('button')?.focus({ focusVisible: true } as FocusOptions);
  }
}
