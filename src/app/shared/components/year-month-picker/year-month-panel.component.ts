import {
  Component, Input, Output, EventEmitter, OnInit, signal, HostListener,
 ChangeDetectionStrategy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { IconBtnComponent } from '../icon-btn/icon-btn.component';
import { CellBtnComponent } from '../cell-btn/cell-btn.component';

@Component({
  selector: 'app-year-month-panel',
  standalone: true,
  imports: [CommonModule, IconComponent, IconBtnComponent, CellBtnComponent],
  templateUrl: './year-month-panel.component.html',
  styleUrls: ['./year-month-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class YearMonthPanelComponent implements OnInit {
  @Input() anchorRect!: DOMRect;
  @Input() minYear = 110;
  @Input() maxYear = 125;
  @Input() initYear = 115;
  @Input() initMonth: number | null = null;
  @Input() yearOnly = false;
  /** 'month'（預設）：選年月；'period'：1 期 = 2 個月，startMonth ∈ {1,3,5,7,9,11} */
  @Input() mode: 'month' | 'period' = 'month';

  @Output() monthSelected = new EventEmitter<{ year: number; month: number }>();
  @Output() panelClose = new EventEmitter<void>();

  displayYear = signal(115);
  panelStyle: Record<string, string> = {};

  readonly MONTHS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  readonly PERIOD_STARTS = [1, 3, 5, 7, 9, 11];

  get yearRange(): number[] {
    const years: number[] = [];
    for (let y = this.minYear; y <= this.maxYear; y++) years.push(y);
    return years;
  }

  selectYear(year: number): void {
    this.monthSelected.emit({ year, month: 0 });
  }

  ngOnInit(): void {
    this.displayYear.set(this.initYear);
    const rect = this.anchorRect;
    this.panelStyle = {
      position: 'fixed',
      top: `${rect.bottom + 4}px`,
      left: `${rect.left}px`,
      width: `${rect.width}px`,
      'z-index': '9999',
    };
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.panelClose.emit();
  }

  prevYear(): void {
    if (this.displayYear() > this.minYear) this.displayYear.update(y => y - 1);
  }

  nextYear(): void {
    if (this.displayYear() < this.maxYear) this.displayYear.update(y => y + 1);
  }

  selectMonth(month: number): void {
    this.monthSelected.emit({ year: this.displayYear(), month });
  }

  selectPeriod(startMonth: number): void {
    this.monthSelected.emit({ year: this.displayYear(), month: startMonth });
  }

  isSelected(month: number): boolean {
    return this.initYear === this.displayYear() && this.initMonth === month;
  }

  isPeriodSelected(startMonth: number): boolean {
    if (this.initMonth === null) return false;
    return this.initYear === this.displayYear() && this.getPeriodStartMonth(this.initMonth) === startMonth;
  }

  /** '1~2月', '3~4月', ... '11~12月' */
  getPeriodLabel(startMonth: number): string {
    return `${startMonth}~${startMonth + 1}月`;
  }

  /** 任意月份映射到所屬期的起始月：2→1, 4→3, 6→5, 8→7, 10→9, 12→11 */
  getPeriodStartMonth(month: number): number {
    return month % 2 === 0 ? month - 1 : month;
  }

  canGoPrev(): boolean { return this.displayYear() > this.minYear; }
  canGoNext(): boolean { return this.displayYear() < this.maxYear; }
}
