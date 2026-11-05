import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from './date-picker.component';
import { FieldComponent } from '../field/field.component';

// ── 報讀名稱（2026-11-05）──────────────────────────────────────
// 原本按鈕只念目前文字（值或提示文字），聽不出是哪個欄位；清除鈕寫死念「清除起始日」，用在結束日期也這樣念。
// 現在跟 app-input 一樣：ariaLabel 優先，其次是直接包住它的 app-field 標題。
// 按鈕念「名稱＋目前文字」，清除鈕念「清除＋名稱」，沒有名稱時念「清除日期」。

@Component({
  standalone: true,
  imports: [FieldComponent, DatePickerComponent, FormsModule],
  template: `
    <app-field [label]="label" [required]="required">
      <app-date-picker mode="day" [clearable]="true" [ariaLabel]="ariaLabel" [placeholder]="placeholder" [(ngModel)]="value"></app-date-picker>
    </app-field>
  `,
})
class FieldHostComponent {
  label = '完成日期';
  required = false;
  ariaLabel = '';
  placeholder = '';
  value = '';
}

/** 自己寫的元件，模板裡用了 app-date-picker；外層的 app-field 不是直接包住它 */
@Component({
  selector: 'test-wrapped-date-picker',
  standalone: true,
  imports: [DatePickerComponent],
  template: `<app-date-picker mode="day"></app-date-picker>`,
})
class WrappedDatePickerComponent {}

@Component({
  standalone: true,
  imports: [FieldComponent, WrappedDatePickerComponent],
  template: `<app-field label="完成日期" [required]="true"><test-wrapped-date-picker></test-wrapped-date-picker></app-field>`,
})
class WrappedHostComponent {}

/** 報讀軟體會念的名稱：有 aria-labelledby 就照順序接起指到的文字，否則用 aria-label */
function accessibleName(el: Element): string | null {
  const ids = el.getAttribute('aria-labelledby');
  if (ids !== null) {
    return ids
      .split(/\s+/)
      .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
      .join(' ');
  }
  return el.getAttribute('aria-label');
}

describe('DatePickerComponent — 報讀名稱', () => {
  let fixture: ComponentFixture<FieldHostComponent>;
  let host: FieldHostComponent;

  const root = () => fixture.nativeElement as HTMLElement;
  const trigger = () => root().querySelector('.dp-trigger')!;
  const clearBtn = () => root().querySelector('[data-testid="date-picker-clear"]');

  async function render(): Promise<void> {
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [FieldHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(FieldHostComponent);
    host = fixture.componentInstance;
    await render();
  });

  it('放在「完成日期」欄位裡、空值 → 念「完成日期 選擇日期」，只輸出一種名稱屬性', () => {
    expect(accessibleName(trigger())).toBe('完成日期 選擇日期');
    expect(trigger().hasAttribute('aria-label')).toBeFalse();
  });

  it('選了 114-3-15 → 念「完成日期 114 年 3 月 15 日」', async () => {
    host.value = '114-3-15';
    await render();
    expect(accessibleName(trigger())).toBe('完成日期 114 年 3 月 15 日');
  });

  it('欄位標題改字 → 名稱跟著變；改成空字串 → 只念目前文字', async () => {
    host.label = '出生日期';
    await render();
    expect(accessibleName(trigger())).toBe('出生日期 選擇日期');

    host.label = '';
    await render();
    expect(trigger().hasAttribute('aria-labelledby')).toBeFalse();
    expect(accessibleName(trigger())).toBe('選擇日期');
  });

  it('欄位標題只有空白 → 當成沒有標題', async () => {
    host.label = '   ';
    host.value = '114-3-15';
    await render();
    expect(trigger().hasAttribute('aria-labelledby')).toBeFalse();
    expect(accessibleName(trigger())).toBe('114 年 3 月 15 日');
    expect(clearBtn()!.getAttribute('aria-label')).toBe('清除日期');
  });

  it('清除鈕念「清除＋欄位標題」，不再寫死「清除起始日」', async () => {
    host.value = '114-3-15';
    await render();
    expect(clearBtn()!.getAttribute('aria-label')).toBe('清除完成日期');
  });

  it('提示文字就寫欄位標題（例如都是「完成日期」）→ 空值只念一次「完成日期」；選了值念「完成日期 114 年 3 月 15 日」', async () => {
    host.placeholder = '完成日期';
    await render();
    expect(accessibleName(trigger())).toBe('完成日期');

    host.value = '114-3-15';
    await render();
    expect(accessibleName(trigger())).toBe('完成日期 114 年 3 月 15 日');
  });

  it('設了 ariaLabel → 優先於欄位標題：按鈕念「名稱＋目前文字」，清除鈕念「清除＋名稱」', async () => {
    host.ariaLabel = '結束日期';
    host.value = '114-3-15';
    await render();
    expect(trigger().hasAttribute('aria-labelledby')).toBeFalse();
    expect(trigger().getAttribute('aria-label')).toBe('結束日期 114 年 3 月 15 日');
    expect(clearBtn()!.getAttribute('aria-label')).toBe('清除結束日期');
  });

  it('欄位必填 → 按鈕帶 aria-required="true"（跟 app-input 一樣）；改回非必填 → 沒有這個屬性', async () => {
    expect(trigger().hasAttribute('aria-required')).toBeFalse();

    host.required = true;
    await render();
    expect(trigger().getAttribute('aria-required')).toBe('true');

    host.required = false;
    await render();
    expect(trigger().hasAttribute('aria-required')).toBeFalse();
  });

  it('外層的 app-field 不是直接包住它（包在別的元件裡）→ 不念外層欄位標題，也不帶外層的必填', async () => {
    const wrapped = TestBed.createComponent(WrappedHostComponent);
    wrapped.detectChanges();
    const el = (wrapped.nativeElement as HTMLElement).querySelector('.dp-trigger')!;
    expect(el.hasAttribute('aria-labelledby')).toBeFalse();
    expect(el.hasAttribute('aria-required')).toBeFalse();
    expect(accessibleName(el)).toBe('選擇日期');
  });
});

describe('DatePickerComponent — 沒有欄位標題時的報讀名稱', () => {
  let fixture: ComponentFixture<DatePickerComponent>;

  const trigger = () => (fixture.nativeElement as HTMLElement).querySelector('.dp-trigger')!;
  const clearBtn = () => (fixture.nativeElement as HTMLElement).querySelector('[data-testid="date-picker-clear"]');

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [DatePickerComponent] }).compileComponents();
    fixture = TestBed.createComponent(DatePickerComponent);
    fixture.componentRef.setInput('mode', 'day');
    fixture.componentRef.setInput('clearable', true);
  });

  it('沒有欄位也沒有 ariaLabel → 跟原本一樣只念目前文字；清除鈕念「清除日期」', () => {
    fixture.detectChanges();
    expect(accessibleName(trigger())).toBe('選擇日期');
    expect(trigger().hasAttribute('aria-required')).toBeFalse();

    fixture.componentInstance.writeValue('114-3-15');
    fixture.detectChanges();
    expect(accessibleName(trigger())).toBe('114 年 3 月 15 日');
    expect(clearBtn()!.getAttribute('aria-label')).toBe('清除日期');
  });

  it('空值有語意文字 → 照舊念語意文字', () => {
    fixture.componentRef.setInput('emptyLabel', '審核通過後開始');
    fixture.detectChanges();
    expect(accessibleName(trigger())).toBe('審核通過後開始');
  });

  it('ariaLabel「開始日期」→ 按鈕念「開始日期 選擇日期」，清除鈕念「清除開始日期」', () => {
    fixture.componentRef.setInput('ariaLabel', '開始日期');
    fixture.componentInstance.writeValue('114-3-15');
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-label')).toBe('開始日期 114 年 3 月 15 日');
    expect(clearBtn()!.getAttribute('aria-label')).toBe('清除開始日期');

    fixture.componentInstance.writeValue('');
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-label')).toBe('開始日期 選擇日期');
  });

  it('ariaLabel 跟提示文字一樣（篩選列的「開始日期」）→ 空值只念一次「開始日期」；選了值念「開始日期 114 年 3 月 15 日」', () => {
    fixture.componentRef.setInput('ariaLabel', '開始日期');
    fixture.componentRef.setInput('placeholder', '開始日期');
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-label')).toBe('開始日期');

    fixture.componentInstance.writeValue('114-3-15');
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-label')).toBe('開始日期 114 年 3 月 15 日');
  });

  it('ariaLabel 只有空白 → 當成沒設', () => {
    fixture.componentRef.setInput('ariaLabel', '   ');
    fixture.componentInstance.writeValue('114-3-15');
    fixture.detectChanges();
    expect(trigger().getAttribute('aria-label')).toBe('114 年 3 月 15 日');
    expect(clearBtn()!.getAttribute('aria-label')).toBe('清除日期');
  });
});
