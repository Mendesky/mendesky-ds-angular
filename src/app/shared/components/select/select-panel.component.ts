import {
  Component, Input, Output, EventEmitter,
  HostBinding,
  OnChanges, SimpleChanges, ViewChildren, QueryList, ElementRef,
 ChangeDetectionStrategy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SelectOption } from './select.component';

@Component({
  selector: 'app-select-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './select-panel.component.html',
  styleUrls: ['./select-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectPanelComponent implements OnChanges {
  @Input() options: SelectOption[] = [];
  @Input() activeIndex = -1;
  /** min-width 對齊 trigger 寬度（px）；top/left/z-index 由 PortalPositioningService 負責 */
  @Input() width = 0;

  @Output() optionSelected = new EventEmitter<any>();

  @ViewChildren('optionEl') optionEls!: QueryList<ElementRef<HTMLButtonElement>>;

  /** click-outside 偵測已移至 PortalPositioningService（closeOnClickOutside: true） */
  @HostBinding('style.position') readonly position = 'fixed';
  @HostBinding('style.min-width.px') get hostWidth() { return this.width; }
  /**
   * max-width 一併鎖在 trigger 寬度（與 app-autocomplete 面板一致）。只綁 min-width 時 host 的
   * width 仍是 auto，對 position:fixed 元素而言寬度＝shrink-to-fit＝min(max-content, 可用寬)，
   * 而 max-content 是「最長選項不換行的寬度」→ 選項一長面板就往外長、在手機上貼齊螢幕兩側，
   * 與同畫面其他下拉不一致（2026-07-25 autocomplete 實測 trigger 366 / panel 506）。
   * 取捨：select 的選項是 `nowrap + text-overflow: ellipsis`（單行藥丸），鎖寬後過長選項會截斷；
   * autocomplete 則是可換行、不截斷。兩者都以「面板寬度＝輸入框寬度」為準。
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

  select(option: SelectOption): void {
    if (option.disabled) return;
    this.optionSelected.emit(option.value);
  }
}
