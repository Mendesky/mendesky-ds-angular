import {
  Component, Input, OnDestroy, ElementRef, ApplicationRef,
  EnvironmentInjector, ComponentRef, forwardRef, signal, createComponent, inject,
 ChangeDetectionStrategy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { DatePanelComponent } from './date-panel.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './date-picker.component.html',
  styleUrls: ['./date-picker.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DatePickerComponent),
    multi: true,
  }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePickerComponent implements ControlValueAccessor, OnDestroy {
  @Input() size: 'S' | 'M' | 'L' = 'M';
  @Input() errorMessage = '';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';
  @Input() placeholder = '';
  /** 空值時顯示的「實心」語意文字（深色，非灰色 placeholder）。用於空值本身有明確業務語意的情境
   *  （如 startDate 空＝「審核通過後開始」）；點擊仍可開面板選日期。空字串時退回一般 placeholder 行為。 */
  @Input() emptyLabel = '';
  @Input() minYear = 110;
  @Input() maxYear = 125;
  /** 不允許選超過此月份（需搭配 maxYear）。null 表示無限制。 */
  @Input() maxMonth: number | null = null;
  /** 選取粒度：'year' 只選年、'month' 選年月（預設）、'day' 選年月日 */
  @Input() mode: 'year' | 'month' | 'day' = 'month';
  /** @deprecated 請改用 mode="year" */
  @Input() yearOnly = false;
  @Input() disabled = false;
  /** 不允許選此日期之後的日期（民國年）。null 表示無限制。 */
  @Input() maxDate: { year: number; month: number; day: number } | null = null;
  /** 顯示清除按鈕（有值且非 disabled 時）；點擊 emit ''（清空）。opt-in，預設關閉。 */
  @Input() clearable = false;

  value = signal('');
  isOpen = signal(false);

  private panelRef: ComponentRef<DatePanelComponent> | null = null;
  private _overlayRef: PortalOverlayRef | null = null;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly positioning = inject(PortalPositioningService);

  get resolvedMode(): 'year' | 'month' | 'day' {
    return this.yearOnly ? 'year' : this.mode;
  }

  get effectivePlaceholder(): string {
    if (this.placeholder) return this.placeholder;
    const map: Record<string, string> = { year: '選擇年度', month: '選擇月份', day: '選擇日期' };
    return map[this.resolvedMode] ?? '選擇日期';
  }

  get displayText(): string {
    const v = this.value();
    if (!v) return '';
    const parts = v.split('-');
    const year = parseInt(parts[0]);
    if (isNaN(year)) return '';
    if (this.resolvedMode === 'year') return `${year} 年`;
    const month = parseInt(parts[1]);
    if (isNaN(month)) return '';
    if (this.resolvedMode === 'month') return `${year} 年 ${month} 月`;
    const day = parseInt(parts[2]);
    if (isNaN(day)) return '';
    return `${year} 年 ${month} 月 ${day} 日`;
  }

  get currentYear(): number {
    const v = this.value();
    if (v) {
      const y = parseInt(v.split('-')[0]);
      if (!isNaN(y)) return y;
    }
    return new Date().getFullYear() - 1911;
  }

  get currentMonth(): number | null {
    if (this.resolvedMode === 'year') return null;
    const v = this.value();
    if (!v) return null;
    const m = parseInt(v.split('-')[1]);
    return isNaN(m) ? null : m;
  }

  get currentDay(): number | null {
    if (this.resolvedMode !== 'day') return null;
    const v = this.value();
    if (!v) return null;
    const d = parseInt(v.split('-')[2]);
    return isNaN(d) ? null : d;
  }

  onTriggerClick(): void {
    if (this.disabled) return;
    if (this.isOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
    this.onTouched();
  }

  /** 是否顯示清除按鈕：opt-in clearable + 有值 + 非 disabled。 */
  get showClear(): boolean {
    return this.clearable && !this.disabled && this.value() !== '';
  }

  /** 清除已選日期（emit 空字串＝清空）。stopPropagation 避免觸發 trigger 開面板。 */
  onClear(event: Event): void {
    event.stopPropagation();
    if (this.disabled) return;
    if (this.isOpen()) this.closePanel(false);
    this.value.set('');
    this.onChange('');
    this.onTouched();
  }

  /** ArrowUp / ArrowDown：開啟面板並讓 panel 自動聚焦 */
  onTriggerArrow(dir: 1 | -1): void {
    if (this.disabled) return;
    if (!this.isOpen()) this.openPanel();
    this.onTouched();
  }

  /** Tab / Shift+Tab：關閉面板（不 preventDefault，讓 Tab 繼續移動焦點），並 mark as touched */
  onTriggerTab(): void {
    if (this.isOpen()) this.closePanel(false);
    this.onTouched();
  }

  private openPanel(): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const ref = createComponent(DatePanelComponent, {
      environmentInjector: this.envInjector,
    });

    ref.instance.minYear = this.minYear;
    ref.instance.maxYear = this.maxYear;
    ref.instance.maxMonth = this.maxMonth;
    ref.instance.maxDate = this.maxDate;
    ref.instance.initYear = this.currentYear;
    ref.instance.initMonth = this.currentMonth;
    ref.instance.initDay = this.currentDay;
    ref.instance.mode = this.resolvedMode;
    ref.setInput('width', rect.width);

    ref.instance.dateSelected.subscribe(({ year, month, day }) => {
      // Restore focus to trigger BEFORE any downstream state updates (e.g. a parent's signal chain)
      // to prevent focus from being displaced by Angular re-renders or event handlers.
      (this.el.nativeElement.querySelector('.dp-trigger') as HTMLElement | null)?.focus();

      let val: string;
      if (this.resolvedMode === 'year') val = `${year}`;
      else if (this.resolvedMode === 'month') val = `${year}-${month}`;
      else val = `${year}-${month}-${day}`;
      this.value.set(val);
      this.onChange(val);
      this.closePanel(false);
    });

    this.appRef.attachView(ref.hostView);
    document.body.appendChild(ref.location.nativeElement);
    this.panelRef = ref;
    this.isOpen.set(true);

    this._overlayRef = this.positioning.attach(
      this.el,
      new ElementRef(ref.location.nativeElement as HTMLElement),
      {
        placement: 'bottom-start',
        gap: 4,
        trackScroll: false,
        closeOnClickOutside: true,
        closeOnEscape: true,
        onClose: (reason) => {
          if (reason === 'manual') return;
          this.closePanel(true);
        },
      }
    );
  }

  closePanel(returnFocus = true): void {
    if (returnFocus) {
      // Focus trigger BEFORE destroying the panel so focus never jumps to document.body
      const trigger = this.el.nativeElement.querySelector('.dp-trigger') as HTMLElement | null;
      trigger?.focus();
    }
    const ref = this._overlayRef;
    this._overlayRef = null;
    ref?.detach();
    if (this.panelRef) {
      this.appRef.detachView(this.panelRef.hostView);
      this.panelRef.destroy();
      this.panelRef = null;
    }
    this.isOpen.set(false);
  }

  ngOnDestroy(): void {
    this.closePanel(false);
  }

  writeValue(val: string): void {
    this.value.set(val ?? '');
  }

  registerOnChange(fn: (v: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
