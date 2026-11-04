import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { InlineConfirmComponent } from './inline-confirm.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { IconComponent } from '../icon/icon.component';
import { ICON_REGISTRY } from '@mendesky/ds';

// 錯誤提示位置（2026-10-14 使用者定案）：欄位錯誤預設顯示在下方；版面放不下時可用 errorPosition 改上方。
describe('InlineConfirmComponent — 錯誤提示位置', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InlineConfirmComponent] }).compileComponents();
  });

  function tooltipPosition(position?: 'top' | 'bottom'): 'top' | 'bottom' {
    const fixture = TestBed.createComponent(InlineConfirmComponent);
    fixture.componentRef.setInput('label', '');
    fixture.componentRef.setInput('checkLabel', '我已確認內容皆正確無誤');
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

// 必填圖示（2026-11-04 使用者指正）：必填前提用圓框 ⓘ（Alert-Info），不是鈴鐺（Alert，通知用）。
describe('InlineConfirmComponent — 必填圖示', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InlineConfirmComponent] }).compileComponents();
  });

  function render(inputs: Record<string, unknown>) {
    const fixture = TestBed.createComponent(InlineConfirmComponent);
    fixture.componentRef.setInput('label', '發布前請確認內容已經過審核');
    fixture.componentRef.setInput('checkLabel', '我已確認內容經過審核');
    for (const [key, value] of Object.entries(inputs)) fixture.componentRef.setInput(key, value);
    fixture.detectChanges();
    return fixture.debugElement.query(By.css('.inline-confirm__icon-required'));
  }

  it('required 時，標題前畫出圓框 ⓘ 圖示，不是鈴鐺', () => {
    const icon = render({ requirement: 'required' });
    expect(icon).not.toBeNull();
    expect(icon.injector.get(IconComponent).name).toBe('Alert-Info');
    // 畫面上真的是圓框 ⓘ 的路徑，不是鈴鐺的
    const drawn = (icon.nativeElement as HTMLElement).querySelector('svg')!.innerHTML;
    const circle = ICON_REGISTRY['Alert-Info'].match(/d="([^"]+)"/)![1];
    const bell = ICON_REGISTRY['Alert'].match(/d="([^"]+)"/)![1];
    expect(drawn).toContain(circle);
    expect(drawn).not.toContain(bell);
  });

  it('optional 時不畫必填圖示', () => {
    expect(render({ requirement: 'optional' })).toBeNull();
  });

  it('hideRequiredIcon 時不畫必填圖示', () => {
    expect(render({ requirement: 'required', hideRequiredIcon: true })).toBeNull();
  });
});
