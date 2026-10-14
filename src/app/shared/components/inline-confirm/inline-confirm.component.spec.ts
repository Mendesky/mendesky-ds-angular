import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InlineConfirmComponent } from './inline-confirm.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

// 錯誤提示位置（2026-10-14 使用者定案）：欄位錯誤預設顯示在下方；版面放不下時可用 errorPosition 改上方。
describe('InlineConfirmComponent — 錯誤提示位置', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InlineConfirmComponent] }).compileComponents();
  });

  function tooltipPosition(position?: 'top' | 'bottom'): 'top' | 'bottom' {
    const fixture = TestBed.createComponent(InlineConfirmComponent);
    fixture.componentRef.setInput('label', '');
    fixture.componentRef.setInput('checkLabel', '我已確認報價內容皆正確無誤');
    fixture.componentRef.setInput('errorMessage', '請勾選確認後再送出');
    if (position) fixture.componentRef.setInput('errorPosition', position);
    fixture.detectChanges();
    const host = fixture.debugElement.query(By.directive(ErrorTooltipDirective));
    return host.injector.get(ErrorTooltipDirective).errorPosition;
  }

  it('沒有指定時，錯誤提示在下方', () => {
    expect(tooltipPosition()).toBe('bottom');
  });

  it('errorPosition="top" 時，錯誤提示在上方', () => {
    expect(tooltipPosition('top')).toBe('top');
  });
});
