import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DatePanelComponent } from './date-panel.component';

describe('DatePanelComponent — 年份清單導航（點年份標題快速跳年）', () => {
  let fixture: ComponentFixture<DatePanelComponent>;
  let component: DatePanelComponent;

  function setup(inputs: Partial<DatePanelComponent>): void {
    fixture = TestBed.createComponent(DatePanelComponent);
    component = fixture.componentInstance;
    Object.assign(component, inputs);
    fixture.detectChanges(); // 觸發 ngOnInit（設定 displayYear / viewState）
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePanelComponent] }).compileComponents();
  });

  it('day mode：openYearGrid → 由月曆切到年份清單', fakeAsync(() => {
    setup({ mode: 'day', minYear: 40, maxYear: 115, initYear: 110, initMonth: 5 });
    expect(component.viewState()).toBe('month-grid');
    component.openYearGrid();
    expect(component.viewState()).toBe('year-grid');
    tick(); // flush openYearGrid 內的 focus setTimeout
    fixture.detectChanges();
  }));

  it('day mode：點擊月曆標題的年份按鈕（template 接線）→ 展開年份清單', fakeAsync(() => {
    setup({ mode: 'day', minYear: 40, maxYear: 115, initYear: 110, initMonth: 5 });
    const toggle = fixture.nativeElement.querySelector('.dp-panel__year-toggle') as HTMLButtonElement;
    expect(toggle).withContext('月曆模式標題應渲染可點擊的年份按鈕').not.toBeNull();
    toggle.click();
    tick();
    fixture.detectChanges();
    expect(component.viewState()).toBe('year-grid');
    // 年份清單渲染出 minYear..maxYear 的年份 cell（含遠年下限 40）
    expect(fixture.nativeElement.querySelector('.dp-panel__year-grid')).not.toBeNull();
  }));

  it('day mode：在年份清單選年 → 更新 displayYear、回月曆、不 emit 最終值', () => {
    setup({ mode: 'day', minYear: 40, maxYear: 115, initYear: 110, initMonth: 5 });
    const spy = jasmine.createSpy('dateSelected');
    component.dateSelected.subscribe(spy);

    component.viewState.set('year-grid');
    component.selectYear(84); // 民國84年（遠年）

    expect(component.displayYear()).toBe(84);
    expect(component.viewState()).toBe('month-grid');
    expect(spy).not.toHaveBeenCalled();
  });

  it('year mode：選年即最終值 → emit、不切回月曆（既有行為不變）', () => {
    setup({ mode: 'year', minYear: 40, maxYear: 115, initYear: 110 });
    const spy = jasmine.createSpy('dateSelected');
    component.dateSelected.subscribe(spy);

    component.selectYear(100);

    expect(spy).toHaveBeenCalledWith({ year: 100, month: 0, day: 0 });
    expect(component.viewState()).toBe('year-grid');
  });

  it('year mode：openYearGrid 為 no-op（年份清單本就是根視圖）', () => {
    setup({ mode: 'year', minYear: 40, maxYear: 115, initYear: 110 });
    component.openYearGrid();
    expect(component.viewState()).toBe('year-grid');
  });

  it('isYearDisabled：maxDate 之後的年份不可選、當年與過往可選', () => {
    setup({ mode: 'day', minYear: 40, maxYear: 125, initYear: 115, initMonth: 7, maxDate: { year: 115, month: 7, day: 21 } });
    expect(component.isYearDisabled(116)).toBeTrue();
    expect(component.isYearDisabled(115)).toBeFalse();
    expect(component.isYearDisabled(114)).toBeFalse();
  });

  it('isYearDisabled：未設 maxDate 時年份全部可選', () => {
    setup({ mode: 'day', minYear: 40, maxYear: 125, initYear: 115 });
    expect(component.isYearDisabled(200)).toBeFalse();
  });

  it('yearRange：涵蓋 minYear..maxYear（含遠年下限，供遠年跳選）', () => {
    setup({ mode: 'day', minYear: 40, maxYear: 115, initYear: 115 });
    expect(component.yearRange[0]).toBe(40);
    expect(component.yearRange[component.yearRange.length - 1]).toBe(115);
    expect(component.yearRange).toContain(84);
  });
});
