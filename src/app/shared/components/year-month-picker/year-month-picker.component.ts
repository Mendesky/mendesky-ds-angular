import {
  Component, Input, OnDestroy, ElementRef, ApplicationRef,
  EnvironmentInjector, ComponentRef, Renderer2, forwardRef, signal, createComponent,
 ChangeDetectionStrategy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { YearMonthPanelComponent } from './year-month-panel.component';

@Component({
  selector: 'app-year-month-picker',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './year-month-picker.component.html',
  styleUrls: ['./year-month-picker.component.scss'],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => YearMonthPickerComponent),
    multi: true,
  }],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearMonthPickerComponent implements ControlValueAccessor, OnDestroy {
  @Input() size: 'S' | 'M' | 'L' = 'S';
  @Input() placeholder = '選擇年月';
  @Input() minYear = 110;
  @Input() maxYear = 125;
  /** true：只選年度，值格式為 '114'；false（預設）：選年月，值格式為 '114-3' */
  @Input() yearOnly = false;
  /** 'month'（預設）：選年月；'period'：1 期 = 2 個月，startMonth ∈ {1,3,5,7,9,11} */
  @Input() mode: 'month' | 'period' = 'month';
  /** true：唯讀（不可開啟面板、不可選），additive、預設 false、向後相容。 */
  @Input() disabled = false;

  value = signal('');
  isOpen = signal(false);

  private panelRef: ComponentRef<YearMonthPanelComponent> | null = null;
  private docClickListener: (() => void) | null = null;
  private onChange: (v: string) => void = () => {};
  private onTouched: () => void = () => {};

  constructor(
    private el: ElementRef,
    private appRef: ApplicationRef,
    private envInjector: EnvironmentInjector,
    private renderer: Renderer2,
  ) {}

  get displayText(): string {
    const v = this.value();
    if (!v) return '';
    if (this.yearOnly) {
      const y = parseInt(v);
      return isNaN(y) ? '' : `${y} 年`;
    }
    const [yearStr, monthStr] = v.split('-');
    if (!yearStr || !monthStr) return '';
    const m = parseInt(monthStr);
    if (isNaN(m)) return '';
    if (this.mode === 'period') {
      const startMonth = m % 2 === 0 ? m - 1 : m;
      return `${yearStr} 年 ${startMonth}~${startMonth + 1}月`;
    }
    return `${yearStr} 年 ${m} 月`;
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
    if (this.yearOnly) return null;
    const v = this.value();
    if (!v) return null;
    const m = parseInt(v.split('-')[1]);
    return isNaN(m) ? null : m;
  }

  onTriggerClick(): void {
    if (this.disabled) return; // 唯讀：不開啟面板
    if (this.isOpen()) {
      this.closePanel();
    } else {
      this.openPanel();
    }
    this.onTouched();
  }

  private openPanel(): void {
    const rect = this.el.nativeElement.getBoundingClientRect();
    const ref = createComponent(YearMonthPanelComponent, {
      environmentInjector: this.envInjector,
    });

    ref.instance.anchorRect = rect;
    ref.instance.minYear = this.minYear;
    ref.instance.maxYear = this.maxYear;
    ref.instance.initYear = this.currentYear;
    ref.instance.initMonth = this.currentMonth;
    ref.instance.yearOnly = this.yearOnly;
    ref.instance.mode = this.mode;

    ref.instance.monthSelected.subscribe(({ year, month }) => {
      const val = this.yearOnly ? `${year}` : `${year}-${month}`;
      this.value.set(val);
      this.onChange(val);
      this.closePanel();
    });
    ref.instance.panelClose.subscribe(() => this.closePanel());

    this.appRef.attachView(ref.hostView);
    document.body.appendChild(ref.location.nativeElement);
    this.panelRef = ref;
    this.isOpen.set(true);

    setTimeout(() => {
      this.docClickListener = this.renderer.listen('document', 'click', (e: MouseEvent) => {
        const panelEl = this.panelRef?.location.nativeElement as HTMLElement | null;
        const triggerEl = this.el.nativeElement as HTMLElement;
        if (
          panelEl && !panelEl.contains(e.target as Node) &&
          !triggerEl.contains(e.target as Node)
        ) {
          this.closePanel();
        }
      });
    });
  }

  closePanel(): void {
    if (this.panelRef) {
      this.appRef.detachView(this.panelRef.hostView);
      this.panelRef.destroy();
      this.panelRef = null;
    }
    this.docClickListener?.();
    this.docClickListener = null;
    this.isOpen.set(false);
  }

  ngOnDestroy(): void {
    this.closePanel();
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
}
