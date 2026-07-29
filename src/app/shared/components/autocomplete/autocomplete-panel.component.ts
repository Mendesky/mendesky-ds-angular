import {
  Component, Input, Output, EventEmitter,
  HostBinding, OnChanges, SimpleChanges,
  ViewChildren, QueryList, ElementRef, ChangeDetectionStrategy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AutocompleteOption } from './autocomplete.component';

@Component({
  selector: 'app-autocomplete-panel',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './autocomplete-panel.component.html',
  styleUrls: ['./autocomplete-panel.component.scss'],
})
export class AutocompletePanelComponent implements OnChanges {
  @Input() options: AutocompleteOption[] = [];
  @Input() activeIndex = -1;
  /** 面板寬度（px）＝ trigger 寬度；top/left/z-index 由 PortalPositioningService 負責 */
  @Input() width = 0;

  @Output() optionClick = new EventEmitter<AutocompleteOption>();

  @ViewChildren('optionEl') optionEls!: QueryList<ElementRef<HTMLButtonElement>>;

  @HostBinding('style.position') readonly position = 'fixed';
  @HostBinding('style.min-width.px') get hostWidth() { return this.width; }
  /**
   * max-width 一併鎖在 trigger 寬度：只設 min-width 時 host 的 width 仍是 auto，對
   * position:fixed 元素而言寬度＝shrink-to-fit＝min(max-content, 可用寬)，而 max-content 是
   * 「最長選項不換行的寬度」→ 選項一長（行業代號：代號＋最長 30 字行業名）面板就往外長到
   * 貼齊螢幕兩側，與同畫面其他下拉不一致（2026-07-25 真機回報；Karma 實測 trigger 366 / panel 506）。
   * 鎖上限後長名稱改為在面板內換行（.autocomplete-option 未設 nowrap），資訊不截斷。
   * width 為 0（trigger 還沒量到）時回傳 null 讓 Angular 移除該樣式，避免面板被壓成 0。
   */
  @HostBinding('style.max-width.px') get hostMaxWidth() { return this.width || null; }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['activeIndex'] && this.activeIndex >= 0) {
      setTimeout(() => {
        this.optionEls?.get(this.activeIndex)?.nativeElement
          .scrollIntoView({ block: 'nearest' });
      });
    }
  }

  select(option: AutocompleteOption): void {
    this.optionClick.emit(option);
  }
}
