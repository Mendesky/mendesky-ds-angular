import {
  Component, Input, Output, EventEmitter, OnInit, AfterViewInit, AfterViewChecked,
  signal, HostListener, ElementRef, HostBinding, inject,
 ChangeDetectionStrategy, } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DatePanelComponent implements OnInit, AfterViewInit, AfterViewChecked {
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
  /**
   * 焦點在面板的最後一個停點按 Tab（'forward'）、或第一個停點按 Shift+Tab（'backward'）。
   * 收到後由 date-picker 關面板、把焦點放回按鈕；'forward' 不擋預設動作，瀏覽器接著把焦點移到按鈕的下一個元素。
   */
  @Output() tabOut = new EventEmitter<'forward' | 'backward'>();

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
    // 打開時焦點移進格子：只用鍵盤的人打開就能選（滑鼠點開也一樣，焦點框只在用鍵盤時出現）
    setTimeout(() => this.focusCurrentGrid());
  }

  ngAfterViewChecked(): void {
    this.syncTabStop();
  }

  /** 月曆模式下點年份標題 → 展開年份清單快速跳年（year mode 的年清單本就是根視圖，不需此入口）。 */
  openYearGrid(): void {
    if (this.mode === 'year') return;
    this.viewState.set('year-grid');
    // 展開後把焦點/捲動落在目前顯示的年份，遠年一鍵到位（focus 會把 cell 捲進可視區）
    setTimeout(() => this.focusCurrentGrid());
  }

  /**
   * 面板的鍵盤操作：
   * - 方向鍵在格子間移動（年份 2 欄、月份 3 欄、日期 7 欄），跳過不能選的格子與空白格，碰到邊停住
   * - 按住 Enter 的連發不再按一次格子（選了月份換成日期格後，連發會直接選到日期）
   * - 最後一個停點按 Tab、第一個停點按 Shift+Tab：通知 date-picker 關面板
   * Enter／空白鍵選取、Esc 關閉不在這裡：前者是按鈕原生行為，後者由浮層定位服務處理。
   */
  onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      this.onTab(event);
      return;
    }
    if ((event.key === 'Enter' || event.key === ' ') && event.repeat) {
      event.preventDefault();
      return;
    }
    const grid = this.currentGrid();
    if (!grid) return;
    const cells = this.gridCells(grid);
    const current = cells.indexOf(document.activeElement as HTMLButtonElement);
    if (current === -1) return;

    const cols = this.gridColumns();
    const step = { ArrowRight: 1, ArrowLeft: -1, ArrowDown: cols, ArrowUp: -cols }[event.key];
    if (step === undefined) return;
    event.preventDefault();

    let next = current + step;
    while (next >= 0 && next < cells.length && !this.isFocusable(cells[next])) next += step;
    if (next < 0 || next >= cells.length) return;
    this.focusCell(grid, cells[next]!);
  }

  /**
   * Tab 在面板裡自己移：Safari 預設不讓 Tab 停在按鈕上，交給瀏覽器的話，面板上方的年份按鈕在 Safari 停不到，
   * 而且從格子按 Shift+Tab 會直接跳出面板、面板卻沒關。所以面板裡的停點一律由這裡依序移動。
   * 最後一個停點按 Tab 不擋預設動作：date-picker 把焦點放回按鈕後，瀏覽器接著移到按鈕的下一個元素。
   */
  private onTab(event: KeyboardEvent): void {
    const stops = Array.from(
      (this.el.nativeElement as HTMLElement).querySelectorAll('button:not([disabled])'),
    ).filter((b) => b.getAttribute('tabindex') !== '-1') as HTMLElement[];
    const at = stops.indexOf(document.activeElement as HTMLElement);
    if (at === -1) return;
    if (event.shiftKey) {
      event.preventDefault();
      if (at === 0) this.tabOut.emit('backward');
      else stops[at - 1].focus();
    } else if (at === stops.length - 1) {
      this.tabOut.emit('forward');
    } else {
      event.preventDefault();
      stops[at + 1].focus();
    }
  }

  /** 目前顯示的格子區 */
  private currentGrid(): HTMLElement | null {
    return (this.el.nativeElement as HTMLElement).querySelector('[role="listbox"]');
  }

  private gridColumns(): number {
    const view = this.viewState();
    if (view === 'year-grid') return 2;
    if (view === 'day-grid') return 7;
    return 3;
  }

  /** 格子區裡每一格的按鈕，順序跟畫面上的位置一樣；空白格是 null */
  private gridCells(grid: HTMLElement): (HTMLButtonElement | null)[] {
    return Array.from(grid.querySelectorAll('app-cell-btn')).map((c) => c.querySelector('button'));
  }

  private isFocusable(cell: HTMLButtonElement | null): cell is HTMLButtonElement {
    return !!cell && !cell.disabled;
  }

  /** 格子區只留一個 Tab 停點（tabindex=0），其餘 -1；方向鍵在格子間移動 */
  private focusCell(grid: HTMLElement, cell: HTMLButtonElement): void {
    for (const b of this.gridCells(grid)) b?.setAttribute('tabindex', '-1');
    cell.setAttribute('tabindex', '0');
    cell.focus();
  }

  /** 焦點移到目前格子區：選中的格子，沒有就第一個可選的格子 */
  private focusCurrentGrid(): void {
    const grid = this.currentGrid();
    if (!grid) return;
    const target = this.preferredCell(this.gridCells(grid).filter((c) => this.isFocusable(c)) as HTMLButtonElement[]);
    if (target) this.focusCell(grid, target);
  }

  private preferredCell(cells: HTMLButtonElement[]): HTMLButtonElement | undefined {
    return cells.find((c) => c.getAttribute('aria-selected') === 'true') ?? cells[0];
  }

  /**
   * 畫面更新後確保格子區剛好有一個可以停的 Tab 停點：
   * 換年後原本的停點可能變成不能選，或格子區整個換掉（月份格換成日期格）。
   */
  private syncTabStop(): void {
    const grid = this.currentGrid();
    if (!grid) return;
    const cells = this.gridCells(grid).filter((c) => this.isFocusable(c)) as HTMLButtonElement[];
    if (cells.length === 0) return;
    const stops = cells.filter((c) => c.getAttribute('tabindex') === '0');
    if (stops.length === 1) return;
    const keep = cells.find((c) => c === document.activeElement) ?? stops[0] ?? this.preferredCell(cells)!;
    for (const b of this.gridCells(grid)) b?.setAttribute('tabindex', b === keep ? '0' : '-1');
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
    setTimeout(() => this.focusCurrentGrid());
  }

  /** 年份清單中不可選超過 maxDate 的未來年（配合 date-picker 的 maxDate；yearRange 上限通常已含 maxYear 收斂）。 */
  isYearDisabled(year: number): boolean {
    return !!this.maxDate && year > this.maxDate.year;
  }

  selectMonth(month: number): void {
    if (this.mode === 'day') {
      this.selectedMonth.set(month);
      this.viewState.set('day-grid');
      setTimeout(() => this.focusCurrentGrid());
    } else {
      this.dateSelected.emit({ year: this.displayYear(), month, day: 0 });
    }
  }

  selectDay(day: number): void {
    this.dateSelected.emit({ year: this.displayYear(), month: this.selectedMonth()!, day });
  }

  backToMonths(): void {
    this.viewState.set('month-grid');
    setTimeout(() => this.focusCurrentGrid());
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
