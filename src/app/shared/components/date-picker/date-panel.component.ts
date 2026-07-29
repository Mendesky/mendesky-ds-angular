import {
  Component, Input, Output, EventEmitter, OnInit, AfterViewInit,
  signal, HostListener, ElementRef, HostBinding, inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconBtnComponent } from '../icon-btn/icon-btn.component';
import { CellBtnComponent } from '../cell-btn/cell-btn.component';

@Component({
  selector: 'app-date-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, IconBtnComponent, CellBtnComponent],
  templateUrl: './date-panel.component.html',
  styleUrls: ['./date-panel.component.scss'],
})
export class DatePanelComponent implements OnInit, AfterViewInit {
  @Input() minYear = 110;
  @Input() maxYear = 125;
  /** 不允許選超過此月份（需搭配 maxYear）。null 表示無限制。 */
  @Input() maxMonth: number | null = null;
  /** 不允許選此日期之後的日期（民國年）。null 表示無限制。 */
  @Input() maxDate: { year: number; month: number; day: number } | null = null;
  @Input() initYear = 115;
  @Input() initMonth: number | null = null;
  @Input() initDay: number | null = null;
  @Input() mode: 'year' | 'month' | 'day' = 'month';
  /** panel 寬度（px），由 DatePickerComponent 傳入 trigger 寬度 */
  @Input() width = 0;

  @Output() dateSelected = new EventEmitter<{ year: number; month: number; day: number }>();

  @HostBinding('style.position') readonly pos = 'fixed';
  @HostBinding('style.min-width.px') get hostMinWidth() { return this.width; }

  displayYear = signal(115);
  selectedMonth = signal<number | null>(null);
  viewState = signal<'year-grid' | 'month-grid' | 'day-grid'>('month-grid');

  readonly MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

  private readonly el = inject(ElementRef<HTMLElement>);

  get yearRange(): number[] {
    const years: number[] = [];
    for (let y = this.minYear; y <= this.maxYear; y++) years.push(y);
    return years;
  }

  daysInMonth(): number {
    const year = this.displayYear() + 1911;
    const month = this.selectedMonth()!;
    return new Date(year, month, 0).getDate();
  }

  firstDayOffset(): number {
    const year = this.displayYear() + 1911;
    const month = this.selectedMonth()! - 1;
    return new Date(year, month, 1).getDay();
  }

  dayGridCells(): (number | null)[] {
    const offset = this.firstDayOffset();
    const days = this.daysInMonth();
    const cells: (number | null)[] = Array(offset).fill(null);
    for (let d = 1; d <= days; d++) cells.push(d);
    return cells;
  }

  ngOnInit(): void {
    this.displayYear.set(this.initYear);
    if (this.initMonth) this.selectedMonth.set(this.initMonth);
    this.viewState.set(this.mode === 'year' ? 'year-grid' : 'month-grid');
  }

  ngAfterViewInit(): void {
    if (this.viewState() === 'year-grid') {
      setTimeout(() => this.focusYearCell(this.initYear));
    }
  }

  /** 月曆模式下點年份標題 → 展開年份清單快速跳年（year mode 的年清單本就是根視圖，不需此入口）。 */
  openYearGrid(): void {
    if (this.mode === 'year') return;
    this.viewState.set('year-grid');
    // 展開後把焦點/捲動落在目前顯示的年份，遠年一鍵到位（focus 會把 cell 捲進可視區）
    setTimeout(() => this.focusYearCell(this.displayYear()));
  }

  /** 年度網格方向鍵導航（2 欄佈局） */
  onYearGridKeydown(event: KeyboardEvent): void {
    const grid = this.el.nativeElement.querySelector('.dp-panel__year-grid');
    if (!grid) return;
    const buttons = Array.from(grid.querySelectorAll('button.cell-btn')) as HTMLElement[];
    const current = buttons.indexOf(document.activeElement as HTMLElement);
    if (current === -1) return;

    const cols = 2;
    let next = current;
    switch (event.key) {
      case 'ArrowRight': next = Math.min(current + 1, buttons.length - 1); break;
      case 'ArrowLeft':  next = Math.max(current - 1, 0); break;
      case 'ArrowDown':  next = Math.min(current + cols, buttons.length - 1); break;
      case 'ArrowUp':    next = Math.max(current - cols, 0); break;
      default: return;
    }
    event.preventDefault();
    buttons[current].setAttribute('tabindex', '-1');
    buttons[next].setAttribute('tabindex', '0');
    (buttons[next] as HTMLElement).focus();
  }

  private focusYearCell(year: number): void {
    const grid = this.el.nativeElement.querySelector('.dp-panel__year-grid');
    if (!grid) return;
    const buttons = grid.querySelectorAll('button.cell-btn');
    buttons.forEach((b: HTMLElement) => b.setAttribute('tabindex', '-1'));
    const idx = this.yearRange.indexOf(year);
    const index = idx >= 0 ? idx : 0;
    if (buttons[index]) {
      buttons[index].setAttribute('tabindex', '0');
      (buttons[index] as HTMLElement).focus();
    }
  }

  prevYear(): void {
    if (this.displayYear() > this.minYear) this.displayYear.update(y => y - 1);
  }

  nextYear(): void {
    if (this.displayYear() < this.maxYear) this.displayYear.update(y => y + 1);
  }

  selectYear(year: number): void {
    // year mode：選年即最終值 → emit。month/day mode：年份清單只是導航，選年後回月曆繼續選月/日。
    if (this.mode === 'year') {
      this.dateSelected.emit({ year, month: 0, day: 0 });
      return;
    }
    this.displayYear.set(year);
    this.viewState.set('month-grid');
  }

  /** 年份清單中不可選超過 maxDate 的未來年（配合 date-picker 的 maxDate；yearRange 上限通常已含 maxYear 收斂）。 */
  isYearDisabled(year: number): boolean {
    return !!this.maxDate && year > this.maxDate.year;
  }

  selectMonth(month: number): void {
    if (this.mode === 'day') {
      this.selectedMonth.set(month);
      this.viewState.set('day-grid');
    } else {
      this.dateSelected.emit({ year: this.displayYear(), month, day: 0 });
    }
  }

  selectDay(day: number): void {
    this.dateSelected.emit({ year: this.displayYear(), month: this.selectedMonth()!, day });
  }

  backToMonths(): void {
    this.viewState.set('month-grid');
  }

  prevMonth(): void {
    const m = this.selectedMonth()!;
    if (m > 1) {
      this.selectedMonth.set(m - 1);
    } else if (this.displayYear() > this.minYear) {
      this.displayYear.update(y => y - 1);
      this.selectedMonth.set(12);
    }
  }

  nextMonth(): void {
    const m = this.selectedMonth()!;
    if (m < 12) {
      this.selectedMonth.set(m + 1);
    } else if (this.displayYear() < this.maxYear) {
      this.displayYear.update(y => y + 1);
      this.selectedMonth.set(1);
    }
  }

  canGoPrevYear(): boolean { return this.displayYear() > this.minYear; }
  canGoNextYear(): boolean {
    if (this.maxDate) return this.displayYear() < this.maxDate.year;
    return this.displayYear() < this.maxYear;
  }

  isMonthDisabled(month: number): boolean {
    if (this.maxDate) {
      if (this.displayYear() > this.maxDate.year) return true;
      if (this.displayYear() === this.maxDate.year) return month > this.maxDate.month;
      return false;
    }
    if (this.maxMonth === null) return false;
    return this.displayYear() >= this.maxYear && month > this.maxMonth;
  }

  isDayDisabled(day: number): boolean {
    if (!this.maxDate) return false;
    const y = this.displayYear();
    const m = this.selectedMonth()!;
    if (y > this.maxDate.year) return true;
    if (y === this.maxDate.year && m > this.maxDate.month) return true;
    if (y === this.maxDate.year && m === this.maxDate.month && day > this.maxDate.day) return true;
    return false;
  }

  canGoPrevMonth(): boolean {
    return this.selectedMonth()! > 1 || this.displayYear() > this.minYear;
  }
  canGoNextMonth(): boolean {
    return this.selectedMonth()! < 12 || this.displayYear() < this.maxYear;
  }

  isMonthSelected(month: number): boolean {
    if (this.mode === 'day') return false;
    return this.initYear === this.displayYear() && this.initMonth === month;
  }

  isDaySelected(day: number): boolean {
    return (
      this.initYear === this.displayYear() &&
      this.initMonth === this.selectedMonth() &&
      this.initDay === day
    );
  }
}
