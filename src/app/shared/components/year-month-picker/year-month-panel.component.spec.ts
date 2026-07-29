import { YearMonthPanelComponent } from './year-month-panel.component';

describe('YearMonthPanelComponent — period mode helpers', () => {
  let component: YearMonthPanelComponent;

  beforeEach(() => {
    component = new YearMonthPanelComponent();
  });

  describe('getPeriodLabel', () => {
    it('1 → "1~2月"', () => {
      expect(component.getPeriodLabel(1)).toBe('1~2月');
    });
    it('3 → "3~4月"', () => {
      expect(component.getPeriodLabel(3)).toBe('3~4月');
    });
    it('5 → "5~6月"', () => {
      expect(component.getPeriodLabel(5)).toBe('5~6月');
    });
    it('7 → "7~8月"', () => {
      expect(component.getPeriodLabel(7)).toBe('7~8月');
    });
    it('9 → "9~10月"', () => {
      expect(component.getPeriodLabel(9)).toBe('9~10月');
    });
    it('11 → "11~12月"', () => {
      expect(component.getPeriodLabel(11)).toBe('11~12月');
    });
  });

  describe('getPeriodStartMonth', () => {
    it('1 → 1', () => expect(component.getPeriodStartMonth(1)).toBe(1));
    it('2 → 1', () => expect(component.getPeriodStartMonth(2)).toBe(1));
    it('3 → 3', () => expect(component.getPeriodStartMonth(3)).toBe(3));
    it('4 → 3', () => expect(component.getPeriodStartMonth(4)).toBe(3));
    it('5 → 5', () => expect(component.getPeriodStartMonth(5)).toBe(5));
    it('6 → 5', () => expect(component.getPeriodStartMonth(6)).toBe(5));
    it('11 → 11', () => expect(component.getPeriodStartMonth(11)).toBe(11));
    it('12 → 11', () => expect(component.getPeriodStartMonth(12)).toBe(11));
  });
});
