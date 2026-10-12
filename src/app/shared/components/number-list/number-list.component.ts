import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { AvatarComponent } from '../avatar/avatar.component';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';

export type NumberListSize = 'S' | 'M';
export type NumberListBackground = 'white' | 'grey10' | 'grey20';
export type NumberListAction = 'view' | 'download' | 'edit' | 'delete' | 'subview';

@Component({
  selector: 'app-number-list',
  standalone: true,
  imports: [CommonModule, IconComponent, AvatarComponent, TooltipDirective],
  templateUrl: './number-list.component.html',
  styleUrls: ['./number-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NumberListComponent {
  /** S (小) 或 M (大)，影響字體、間距、按鈕大小 */
  @Input() size: NumberListSize = 'S';
  /** hover 時的底色 */
  @Input() background: NumberListBackground = 'white';
  /** Label chip 文字；空字串時不顯示。放不下時截成「…」，被截斷時滑過／聚焦看全文 */
  @Input() label = '';
  /** 主文字內容；放不下時截成「…」，被截斷時滑過／聚焦看全文 */
  @Input() text = '';
  /** 右側數字 1（Inter SemiBold，靠右對齊） */
  @Input() number1 = '';
  /** 右側數字 2（較深色，靠右對齊） */
  @Input() number2 = '';
  /** 操作按鈕清單：subview 出現在左側 content 區，其餘在右側按鈕區，固定依 檢視 / 下載 / 編輯 / 刪除 排列 */
  @Input() actions: NumberListAction[] = ['download'];
  /** 顯示 Avatar；傳入姓名文字作為 avatar 內容 */
  @Input() avatarText = '';

  @Output() actionClick = new EventEmitter<NumberListAction>();

  get hasSubview(): boolean { return this.actions.includes('subview'); }
  get hasView(): boolean     { return this.actions.includes('view'); }
  get hasDownload(): boolean { return this.actions.includes('download'); }
  get hasEdit(): boolean     { return this.actions.includes('edit'); }
  get hasDelete(): boolean   { return this.actions.includes('delete'); }
  get hasButtons(): boolean  { return this.hasView || this.hasDownload || this.hasEdit || this.hasDelete; }
  get showAvatar(): boolean  { return !!this.avatarText; }

  emit(action: NumberListAction): void {
    this.actionClick.emit(action);
  }
}
