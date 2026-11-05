import { ApplicationRef, Component } from '@angular/core';
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

// ── 面板的鍵盤操作（2026-11-05）──────────────────────────────────
// 原本按 Enter 打得開面板，但焦點留在外面的按鈕上，方向鍵沒反應，再按 Tab 面板就關了：只用鍵盤選不了月份或日期。
// 現在：打開時焦點落在選中的格子（選年月日的月份格落在正在看的月份，沒有就第一個可選的格子），方向鍵在格子間移動、不停在不能選的格子或空白格上、碰到邊停住；
// Enter／空白鍵選取（按鈕原生行為）；Esc 關閉並回到按鈕；Tab 依序經過面板裡的按鈕，最後一個再按 Tab 關面板、
// 讓瀏覽器把焦點移到按鈕的下一個元素；第一個按 Shift+Tab 關面板、回到按鈕。
// 合成的鍵盤事件不會觸發瀏覽器的預設動作（Enter 按下按鈕、Tab 移焦點），所以這裡用 click() 代替 Enter，
// Tab 只驗「有沒有擋掉預設動作」；真的按鍵另外用 Playwright 在 Chromium、WebKit 驗。

@Component({
  standalone: true,
  imports: [FieldComponent, DatePickerComponent, FormsModule],
  template: `
    <app-field label="完成日期">
      <app-date-picker [mode]="mode" [maxYear]="maxYear" [maxDate]="maxDate" [(ngModel)]="value"></app-date-picker>
    </app-field>
    <button type="button" class="after">下一個欄位</button>
  `,
})
class KeyboardHostComponent {
  mode: 'year' | 'month' | 'day' = 'month';
  maxYear = 125;
  maxDate: { year: number; month: number; day: number } | null = null;
  value = '';
}

describe('DatePickerComponent — 面板的鍵盤操作', () => {
  let fixture: ComponentFixture<KeyboardHostComponent>;
  let host: KeyboardHostComponent;
  let appRef: ApplicationRef;

  const root = () => fixture.nativeElement as HTMLElement;
  const trigger = () => root().querySelector('.dp-trigger') as HTMLElement;
  const panel = () => document.querySelector('app-date-panel') as HTMLElement | null;
  const active = () => document.activeElement as HTMLElement | null;
  const activeText = () => active()?.textContent?.trim() ?? '';
  const gridButtons = () =>
    Array.from(panel()!.querySelectorAll('[role="listbox"] button.cell-btn')) as HTMLButtonElement[];
  const cell = (text: string) => gridButtons().find((b) => b.textContent?.trim() === text)!;
  const headerBtn = (label: string) => panel()!.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    appRef.tick();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    appRef.tick();
    await fixture.whenStable();
  }

  function key(target: Element, k: string, init: KeyboardEventInit = {}): KeyboardEvent {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
    target.dispatchEvent(e);
    return e;
  }

  async function open(value = ''): Promise<void> {
    host.value = value;
    await settle();
    trigger().focus();
    key(trigger(), 'Enter');
    await settle();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [KeyboardHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(KeyboardHostComponent);
    host = fixture.componentInstance;
    appRef = TestBed.inject(ApplicationRef);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('空值按 Enter 打開 → 焦點在「1 月」；有值 114-3 → 焦點在「3 月」', async () => {
    await open();
    expect(panel()).not.toBeNull();
    expect(activeText()).toBe('1 月');

    key(active()!, 'Escape');
    await settle();
    await open('114-3');
    expect(activeText()).toBe('3 月');
  });

  it('格子區只有一個 Tab 停點，就是有焦點的格子', async () => {
    await open('114-3');
    const stops = gridButtons().filter((b) => b.getAttribute('tabindex') !== '-1');
    expect(stops.length).toBe(1);
    expect(stops[0] as HTMLElement).toBe(active()!);
  });

  it('方向鍵：→ 從 3 月到 4 月，↓ 到 7 月，↑ 回 4 月，← 到 3 月；停點跟著移', async () => {
    await open('114-3');
    expect(key(active()!, 'ArrowRight').defaultPrevented).toBeTrue();
    expect(activeText()).toBe('4 月');
    key(active()!, 'ArrowDown');
    expect(activeText()).toBe('7 月');
    key(active()!, 'ArrowUp');
    expect(activeText()).toBe('4 月');
    key(active()!, 'ArrowLeft');
    expect(activeText()).toBe('3 月');
    expect(active()!.getAttribute('tabindex')).toBe('0');
  });

  it('碰到邊停住；不能選的格子停不上去，後面都不能選時停在原地', async () => {
    await open('114-1');
    key(active()!, 'ArrowLeft');
    expect(activeText()).toBe('1 月');
    key(active()!, 'ArrowUp');
    expect(activeText()).toBe('1 月');

    key(active()!, 'Escape');
    await settle();
    host.maxYear = 114;
    host.maxDate = { year: 114, month: 6, day: 30 };
    await open('114-6');
    key(active()!, 'ArrowRight');
    expect(activeText()).toBe('6 月');
    key(active()!, 'ArrowDown');
    expect(activeText()).toBe('6 月');
  });

  it('在格子上選取（Enter 的效果）→ 值改變、面板關閉、焦點回到按鈕', async () => {
    await open('114-3');
    key(active()!, 'ArrowRight');
    active()!.click();
    await settle();
    expect(host.value).toBe('114-4');
    expect(panel()).toBeNull();
    expect(active()).toBe(trigger());
  });

  it('Esc → 面板關閉、焦點回到按鈕、值不變', async () => {
    await open('114-3');
    key(active()!, 'ArrowRight');
    key(active()!, 'Escape');
    await settle();
    expect(panel()).toBeNull();
    expect(active()).toBe(trigger());
    expect(host.value).toBe('114-3');
  });

  it('最後一個停點按 Tab → 面板關閉、焦點先回到按鈕，不擋預設動作（瀏覽器接著移到下一個欄位）', async () => {
    await open('114-3');
    const e = key(active()!, 'Tab');
    // 瀏覽器在 keydown 處理完就執行 Tab 的預設動作，焦點必須在這之前就回到按鈕
    expect(active()).toBe(trigger());
    await settle();
    expect(e.defaultPrevented).toBeFalse();
    expect(panel()).toBeNull();
    expect(active()).toBe(trigger());
  });

  it('面板裡的 Tab 由面板自己移（Safari 預設 Tab 停不到按鈕）：上一年 → 選年份 → 下一年 → 格子，Shift+Tab 反過來', async () => {
    await open('114-3');
    const prevYear = panel()!.querySelector('button[aria-label="上一年"]') as HTMLButtonElement;
    prevYear.focus();
    const steps: string[] = [];
    for (let i = 0; i < 3; i++) {
      expect(key(active()!, 'Tab').defaultPrevented).toBeTrue();
      steps.push(active()!.getAttribute('aria-label') ?? activeText());
    }
    expect(steps).toEqual(['選擇年份', '下一年', '3 月']);
    expect(key(active()!, 'Tab', { shiftKey: true }).defaultPrevented).toBeTrue();
    expect(active()!.getAttribute('aria-label')).toBe('下一年');
    expect(panel()).not.toBeNull();
  });

  it('第一個停點按 Shift+Tab → 擋掉預設動作、面板關閉、焦點回到按鈕', async () => {
    await open('114-3');
    const first = panel()!.querySelector('button[aria-label="上一年"]') as HTMLButtonElement;
    first.focus();
    const e = key(first, 'Tab', { shiftKey: true });
    expect(active()).toBe(trigger());
    await settle();
    expect(e.defaultPrevented).toBeTrue();
    expect(panel()).toBeNull();
    expect(active()).toBe(trigger());
  });

  it('選年月日：選了月份 → 換成日期格，焦點在 1 日；有值時在選中的那天', async () => {
    host.mode = 'day';
    await open();
    cell('3 月').click();
    await settle();
    expect(activeText()).toBe('1');

    key(active()!, 'Escape');
    await settle();
    await open('114-3-15');
    cell('3 月').click();
    await settle();
    expect(activeText()).toBe('15');
    key(active()!, 'ArrowDown');
    expect(activeText()).toBe('22');
  });

  it('選年月日：1 日前面的空白格停不上去，← ↑ 都停在原地、不報錯，格子區仍只有一個停點', async () => {
    const errors = spyOn(console, 'error');
    host.mode = 'day';
    await open('114-3-2');
    cell('3 月').click();
    await settle();
    // 114 年 3 月 1 日是星期六，前面有 6 個空白格；2 日在第二列第一格
    expect(activeText()).toBe('2');
    key(active()!, 'ArrowUp');
    expect(activeText()).toBe('2');
    key(active()!, 'ArrowLeft');
    expect(activeText()).toBe('1');
    key(active()!, 'ArrowLeft');
    expect(activeText()).toBe('1');
    expect(gridButtons().filter((b) => b.getAttribute('tabindex') === '0')).toEqual([active() as HTMLButtonElement]);
    expect(errors).not.toHaveBeenCalled();
  });

  it('快速跳年：選了年份 → 回到月份格，焦點在月份格上', async () => {
    await open('114-3');
    (panel()!.querySelector('.dp-panel__year-toggle') as HTMLButtonElement).click();
    await settle();
    expect(activeText()).toBe('114 年');
    key(active()!, 'ArrowDown');
    expect(activeText()).toBe('116 年');
    active()!.click();
    await settle();
    expect(activeText()).toBe('1 月');
  });

  it('用滑鼠點開 → 焦點一樣在格子上', async () => {
    host.value = '114-3';
    await settle();
    trigger().click();
    await settle();
    expect(activeText()).toBe('3 月');
  });

  it('按住 Enter 不放：按鈕上的連發不會再打開面板，格子上的連發不會再選一次', async () => {
    await open('114-3');
    expect(key(active()!, 'Enter', { repeat: true }).defaultPrevented).toBeTrue();

    key(active()!, 'Escape');
    await settle();
    trigger().focus();
    key(trigger(), 'Enter', { repeat: true });
    await settle();
    expect(panel()).toBeNull();
  });
  it('選年月日有值時打開 → 焦點在值的月份（月份格不標示選中）；從日期格按「返回月份」→ 焦點回到剛才的月份', async () => {
    host.mode = 'day';
    await open('114-3-15');
    expect(activeText()).toBe('3 月');
    expect(cell('3 月').getAttribute('aria-selected')).not.toBe('true');
    cell('5 月').click();
    await settle();
    headerBtn('返回月份').click();
    await settle();
    expect(activeText()).toBe('5 月');
  });

  it('選年份沒有值時打開 → 焦點在今年（今年本來就標示為選中）', async () => {
    host.mode = 'year';
    await open();
    expect(activeText()).toBe(`${new Date().getFullYear() - 1911} 年`);
  });

  it('用鍵盤按「下一年」到上限、按鈕變停用 → 焦點移到「選擇年份」，Tab 還能進格子；「上一年」到下限也一樣', async () => {
    host.maxDate = { year: 114, month: 6, day: 30 };
    await open('113-5');
    const next = headerBtn('下一年');
    next.focus();
    next.click();
    await settle();
    expect(next.disabled).toBeTrue();
    expect(active()!.getAttribute('aria-label')).toBe('選擇年份');
    expect(key(active()!, 'Tab').defaultPrevented).toBeTrue();
    expect(activeText()).toBe('5 月');

    key(active()!, 'Escape');
    await settle();
    host.maxDate = null;
    await open('111-5');
    const prev = headerBtn('上一年');
    prev.focus();
    prev.click();
    await settle();
    expect(prev.disabled).toBeTrue();
    expect(active()!.getAttribute('aria-label')).toBe('選擇年份');
  });

  it('換年後原本的停點變成不能選 → 停點移到能選的格子，從「選擇年份」按 Tab 進得去格子', async () => {
    host.maxDate = { year: 114, month: 6, day: 30 };
    await open('113-12');
    expect(activeText()).toBe('12 月');
    const next = headerBtn('下一年');
    next.focus();
    next.click();
    await settle();
    expect(cell('12 月').disabled).toBeTrue();
    const stops = gridButtons().filter((b) => !b.disabled && b.getAttribute('tabindex') === '0');
    expect(stops.map((b) => b.textContent?.trim())).toEqual(['1 月']);
    expect(key(active()!, 'Tab').defaultPrevented).toBeTrue();
    expect(activeText()).toBe('1 月');
    expect(panel()).not.toBeNull();
  });

  it('格子上的第一下 Enter／空白鍵不擋（按鈕照常被按下），也不往外傳給頁面的快捷鍵', async () => {
    await open('114-3');
    const pageKeys: string[] = [];
    const listener = (e: KeyboardEvent) => pageKeys.push(e.key);
    document.addEventListener('keydown', listener);
    try {
      expect(key(active()!, 'Enter').defaultPrevented).toBeFalse();
      expect(key(active()!, ' ').defaultPrevented).toBeFalse();
      expect(pageKeys).toEqual([]);
    } finally {
      document.removeEventListener('keydown', listener);
    }
  });

  it('在「上一年／下一年」上按住 Enter → 連發不擋，可以連續換年；格子上的空白鍵連發一樣擋掉', async () => {
    await open('114-3');
    expect(key(active()!, ' ', { repeat: true }).defaultPrevented).toBeTrue();
    const next = headerBtn('下一年');
    next.focus();
    expect(key(next, 'Enter', { repeat: true }).defaultPrevented).toBeFalse();
  });

  it('用鍵盤移動焦點時明確要求顯示焦點框（Safari 用滑鼠點開後，程式移動的焦點預設不畫框）', async () => {
    await open('114-3');
    const focusSpy = spyOn(HTMLElement.prototype, 'focus').and.callThrough();
    key(active()!, 'ArrowRight');
    expect(focusSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ focusVisible: true }));
    headerBtn('上一年').focus();
    focusSpy.calls.reset();
    key(active()!, 'Tab');
    expect(focusSpy.calls.mostRecent().args[0]).toEqual(jasmine.objectContaining({ focusVisible: true }));
  });
});
