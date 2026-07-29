import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ModalCloseBtnComponent } from '../modal-close-btn/modal-close-btn.component';
import { InputComponent } from '../input/input.component';
import { EmptyStateComponent } from '../empty-state/empty-state.component';

/** 快速鍵群組內的單一項目 */
export interface ShortcutItem {
  description: string;
  /** 每個 key 獨立一個 <kbd>，e.g. ['⌘', 'N'] 或 ['Shift', '?'] */
  keys: string[];
}

/** 快速鍵分組（e.g. 報價案件、全域） */
export interface ShortcutGroup {
  label: string;
  items: ShortcutItem[];
}

/**
 * app-keyboard-help — 鍵盤快速鍵說明面板
 *
 * 按 ? 開啟，ESC 或 backdrop 關閉。
 * 快速鍵資料由父層透過 [shortcuts] 傳入，支援搜尋篩選。
 */
@Component({
  selector: 'app-keyboard-help',
  standalone: true,
  imports: [CommonModule, ModalShellComponent, ModalCloseBtnComponent, InputComponent, EmptyStateComponent],
  templateUrl: './keyboard-help.component.html',
  styleUrls: ['./keyboard-help.component.scss'],
})
export class KeyboardHelpComponent {
  @Input() isOpen = false;
  @Input() shortcuts: ShortcutGroup[] = [];
  @Output() close = new EventEmitter<void>();

  searchQuery = signal('');

  /** 依搜尋關鍵字篩選 groups，空群組不顯示 */
  get filteredShortcuts(): ShortcutGroup[] {
    const q = this.searchQuery().trim().toLowerCase();
    if (!q) return this.shortcuts;

    return this.shortcuts
      .map(group => ({
        ...group,
        items: group.items.filter(item =>
          item.description.toLowerCase().includes(q) ||
          group.label.toLowerCase().includes(q) ||
          item.keys.some(k => k.toLowerCase().includes(q))
        ),
      }))
      .filter(group => group.items.length > 0);
  }

  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  onClose(): void {
    this.searchQuery.set('');
    this.close.emit();
  }
}
