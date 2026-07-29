import {
  Component, Input, Output, EventEmitter,
  ElementRef, OnChanges, SimpleChanges,
  inject, signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

export interface ButtonGroupOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export type ButtonGroupType = 'form' | 'round' | 'view';

@Component({
  selector: 'app-button-group',
  standalone: true,
  imports: [CommonModule, ErrorTooltipDirective],
  templateUrl: './button-group.component.html',
  styleUrls: ['./button-group.component.scss'],
})
export class ButtonGroupComponent implements OnChanges {
  private el = inject(ElementRef);

  @Input() type: ButtonGroupType = 'form';
  @Input() size: 'S' | 'M' | 'L' = 'L';
  @Input() options: ButtonGroupOption[] = [];
  @Input() value: string | null = null;
  @Input() disabled = false;
  @Input() errorMessage = '';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';

  @Output() valueChange = new EventEmitter<string>();

  /** 目前可 Tab 進入的項目索引（roving tabindex 模式） */
  focusIndex = signal(0);

  /** trackBy for *ngFor — options.value 在同一組內必須唯一 */
  trackByOptionValue = (_i: number, opt: ButtonGroupOption) => opt.value;

  get hasError(): boolean {
    return this.type === 'form' && !!this.errorMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['value'] || changes['disabled']) {
      this.focusIndex.set(this.resolveInitialFocus());
    }
  }

  select(val: string): void {
    if (!this.disabled && this.value !== val) {
      this.valueChange.emit(val);
    }
  }

  onKeydown(event: KeyboardEvent, currentIdx: number): void {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        const next = this.findNextEnabled(currentIdx, 1);
        this.moveFocus(next);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        const prev = this.findNextEnabled(currentIdx, -1);
        this.moveFocus(prev);
        break;
      }
      case 'Enter': {
        const opt = this.options[currentIdx];
        if (!opt || opt.disabled || this.disabled) {
          event.preventDefault();
          break;
        }
        if (this.value === opt.value) {
          break;
        }
        event.preventDefault();
        this.select(opt.value);
        break;
      }
      case ' ': {
        event.preventDefault();
        const opt = this.options[currentIdx];
        if (opt && !opt.disabled && !this.disabled) {
          this.select(opt.value);
        }
        break;
      }
    }
  }

  /**
   * 找初始 focus 位置：
   * 有選取值且該項未 disabled → 選取項
   * 否則 → 第一個 enabled 項
   * 全部 disabled → 0（防守性 fallback）
   */
  private resolveInitialFocus(): number {
    if (this.value !== null) {
      const selectedIdx = this.options.findIndex(o => o.value === this.value);
      if (selectedIdx >= 0 && !this.options[selectedIdx].disabled && !this.disabled) {
        return selectedIdx;
      }
    }
    const firstEnabled = this.options.findIndex(o => !o.disabled);
    return firstEnabled >= 0 ? firstEnabled : 0;
  }

  /** 設定 focusIndex 並把 DOM 焦點移到對應 button */
  private moveFocus(idx: number): void {
    this.focusIndex.set(idx);
    const buttons = (this.el.nativeElement as HTMLElement)
      .querySelectorAll<HTMLElement>('.btn-group__item');
    buttons[idx]?.focus();
  }

  /** 從 from 開始往 dir 方向找下一個 enabled 項（循環） */
  private findNextEnabled(from: number, dir: number): number {
    const len = this.options.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + dir + len) % len;
      if (!this.options[idx].disabled && !this.disabled) return idx;
    }
    return from; // 全部 disabled → 不移動
  }
}
