import { Component, EventEmitter, Input, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../../icon/icon.component';
import { ActionMenuComponent } from '../../action-menu/action-menu.component';

export interface GripMenuItem {
  id: string;
  label: string;
  /** 選單項左側 icon 名（app-icon registry key），對齊 Notion 直覺化選單。 */
  icon: string;
  /** 此項上方加分隔線（語意隔開，如刪除等危險操作）。 */
  dividerBefore?: boolean;
  danger?: boolean;
}

/**
 * app-rte-table-grip — Notion 式表格行/列把手（dumb / presentational）。
 *
 * hover 到某列左緣 / 某欄上緣時，由 rich-text-editor 命令式掛載並以 PortalPositioningService
 * 定位到該列/欄邊緣。點把手 → 內嵌 app-action-menu 彈出該行/列的增刪選單（只出「相對應」的
 * 操作，非一次全出）。本元件只 emit 選單項 id，實際 TipTap 指令由 rich-text-editor 執行。
 */
@Component({
  selector: 'app-rte-table-grip',
  standalone: true,
  imports: [CommonModule, IconComponent, ActionMenuComponent],
  templateUrl: './rte-table-grip.component.html',
  styleUrls: ['./rte-table-grip.component.scss'],
})
export class RteTableGripComponent {
  /** 'row' = 列把手（垂直，定位在列左緣）；'col' = 欄把手（水平，定位在欄上緣）。 */
  @Input() direction: 'row' | 'col' = 'row';
  /** 選單項（由 rich-text-editor 給定；列/欄各自的增刪 + 刪表）。 */
  @Input() items: GripMenuItem[] = [];
  /** 選單項被點擊時 emit 其 id。 */
  @Output() pick = new EventEmitter<string>();
  /** 選單開/關變化 → rich-text-editor 用以在選單開啟時鎖住把手（不被 hover-intent 收起）。 */
  @Output() menuStateChange = new EventEmitter<boolean>();

  readonly menuOpen = signal(false);

  toggle(): void {
    const next = !this.menuOpen();
    this.menuOpen.set(next);
    this.menuStateChange.emit(next);
  }
  onPick(id: string): void { this.pick.emit(id); this.closeMenu(); }
  closeMenu(): void {
    this.menuOpen.set(false);
    this.menuStateChange.emit(false);
  }
}
