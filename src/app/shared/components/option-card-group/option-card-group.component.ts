import { Component, Input, Output, EventEmitter, ElementRef, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OptionCardComponent } from '../option-card/option-card.component';

/** app-option-card-group 的選項資料模型（展示型，外部傳入）。 */
export interface OptionCardItem {
  value: string;
  label: string;
  description?: string;
  /** 插圖 SVG 字串 */
  illustration?: string;
  disabled?: boolean;
}

/**
 * 一組互斥的插圖卡片（WAI-ARIA radiogroup）。負責 radiogroup 語意與方向鍵 roving focus；
 * 各卡視覺與選取互動委派給 app-option-card。
 *
 * 取代各處手刻的卡片 grid 與方向鍵 handler，讓同一套互動只維護一份。
 */
@Component({
  selector: 'app-option-card-group',
  standalone: true,
  imports: [CommonModule, OptionCardComponent],
  templateUrl: './option-card-group.component.html',
  styleUrls: ['./option-card-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OptionCardGroupComponent {
  @Input() options: OptionCardItem[] = [];
  /** 目前選中的 value */
  @Input() value: string | null = null;
  @Input() ariaLabel = '';
  /** 額外停用的 value（疊加在 option.disabled 之上，供名額已滿等情境） */
  @Input() disabledValues: string[] = [];

  @Output() valueChange = new EventEmitter<string>();

  private readonly elRef = inject(ElementRef);

  isDisabled(option: OptionCardItem): boolean {
    return !!option.disabled || this.disabledValues.includes(option.value);
  }

  onSelect(option: OptionCardItem): void {
    if (this.isDisabled(option)) return;
    this.valueChange.emit(option.value);
  }

  /** 方向鍵在啟用卡片間 roving focus（←/↑ 上一張、→/↓ 下一張，wrap）。 */
  onKeydown(event: KeyboardEvent): void {
    const forward = event.key === 'ArrowRight' || event.key === 'ArrowDown';
    const backward = event.key === 'ArrowLeft' || event.key === 'ArrowUp';
    if (!forward && !backward) return;

    const cards = Array.from(
      (this.elRef.nativeElement as HTMLElement)
        .querySelectorAll<HTMLElement>('.option-card:not([aria-disabled="true"])'),
    );
    if (cards.length === 0) return;

    event.preventDefault();
    const current = cards.indexOf(document.activeElement as HTMLElement);
    if (current === -1) {
      cards[0].focus();
      return;
    }
    const next = forward
      ? (current + 1) % cards.length
      : (current - 1 + cards.length) % cards.length;
    cards[next].focus();
  }
}
