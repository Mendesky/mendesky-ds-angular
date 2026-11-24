import {
  Component, Input, Output, EventEmitter,
  ElementRef, OnChanges, SimpleChanges,
  inject, signal,
 ChangeDetectionStrategy, isDevMode, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';
import { IconComponent } from '../icon/icon.component';

export interface ButtonGroupOption {
  value: string;
  /** 選項名稱。有 icon 時不顯示在畫面上，改當報讀名稱（aria-label）與滑過提示 */
  label: string;
  disabled?: boolean;
  /** 圖示名稱（同 app-icon 的 name）。有值時按鈕只放圖示；建議只用在 view 型。只放圖示的選項不要停用（停用時提示出不來），要停用請改放文字 */
  icon?: string;
}

export type ButtonGroupType = 'form' | 'round' | 'view';

/**
 * 選中的顏色看用途，不看喜好：
 * - progress＝綠：跟填寫進度有關的作答。form 型不設 color 就是這個。
 * - primary＝深藍：選了以後畫面上顯示的東西會變（篩掉一部分資料、換一種排法）。
 * - neutral＝深灰：只是偏好的設定（單位、字級）。
 * view 型不拿來作答：不設或設 progress 都是深灰。round 型不吃 color。
 */
export type ButtonGroupColor = 'progress' | 'primary' | 'neutral';

@Component({
  selector: 'app-button-group',
  standalone: true,
  imports: [CommonModule, ErrorTooltipDirective, TooltipDirective, IconComponent],
  templateUrl: './button-group.component.html',
  styleUrls: ['./button-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonGroupComponent implements OnChanges {
  private el = inject(ElementRef);

  @Input() type: ButtonGroupType = 'form';
  @Input() size: 'S' | 'M' | 'L' = 'L';
  @Input() color?: ButtonGroupColor;
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

  /** 實際用的選中色：form 型不設是 progress；view 型只認 primary，其餘都是 neutral */
  get resolvedColor(): ButtonGroupColor {
    if (this.type === 'form') return this.color ?? 'progress';
    return this.color === 'primary' ? 'primary' : 'neutral';
  }

  get hasError(): boolean {
    return this.type === 'form' && !!this.errorMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['value'] || changes['disabled']) {
      this.focusIndex.set(this.resolveInitialFocus());
    }
    if (changes['options'] || changes['disabled']) {
      this.warnDisabledIconOption();
    }
  }

  /**
   * 開發模式：只放圖示的選項不要停用（單一選項或整組都算）。
   * 停用的按鈕滑鼠碰不到、鍵盤停不上去，滑過提示出不來，看畫面的人就不知道它叫什麼。
   * 要停用的選項請改放文字（拿掉 icon）。每個元件只提醒一次。
   */
  private warnedDisabledIcon = false;
  private warnDisabledIconOption(): void {
    if (!isDevMode() || this.warnedDisabledIcon) return;
    const hit = this.options.find(o => o.icon && (o.disabled || this.disabled));
    if (!hit) return;
    this.warnedDisabledIcon = true;
    console.warn(`[app-button-group] 只放圖示的選項「${hit.label}」被停用了。停用時滑過提示不會出現，看畫面的人不知道它叫什麼。要停用的選項請改放文字（拿掉 icon）。`);
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
