import { ApplicationRef, Component, HostListener } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { DatePickerComponent } from './date-picker.component';
import { FieldComponent } from '../field/field.component';
import { DialogComponent } from '../dialog/dialog.component';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';

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

// ── 期別模式（2026-11-05）──────────────────────────────────────
// 取代 Year Month Picker 的期別模式：一期兩個月，值是那一期的起始月（'114-3' 代表 3~4 月）。
// 規格：本體 v0.7.1 date-picker 規格的「值格式」「顯示文字」「行為規格」三段。

@Component({
  standalone: true,
  imports: [FieldComponent, DatePickerComponent, FormsModule],
  template: `
    <app-field label="開始期別">
      <app-date-picker
        mode="period"
        size="L"
        [maxYear]="maxYear"
        [maxMonth]="maxMonth"
        [maxDate]="maxDate"
        [disabled]="disabled"
        [ngModel]="value"
        (ngModelChange)="onChange($event)"></app-date-picker>
    </app-field>
  `,
})
class PeriodHostComponent {
  maxYear = 125;
  maxMonth: number | null = null;
  maxDate: { year: number; month: number; day: number } | null = null;
  disabled = false;
  value = '';
  changes: string[] = [];
  onChange(v: string): void {
    this.changes.push(v);
    this.value = v;
  }
}

describe('DatePickerComponent — 期別模式', () => {
  let fixture: ComponentFixture<PeriodHostComponent>;
  let host: PeriodHostComponent;
  let appRef: ApplicationRef;

  const root = () => fixture.nativeElement as HTMLElement;
  const trigger = () => root().querySelector('.dp-trigger') as HTMLElement;
  const triggerText = () => root().querySelector('.dp-trigger__text')?.textContent?.trim() ?? '';
  const panel = () => document.querySelector('app-date-panel') as HTMLElement | null;
  const active = () => document.activeElement as HTMLElement | null;
  const activeText = () => active()?.textContent?.trim() ?? '';
  const gridButtons = () =>
    Array.from(panel()!.querySelectorAll('[role="listbox"] button.cell-btn')) as HTMLButtonElement[];
  const cellTexts = () => gridButtons().map((b) => b.textContent?.trim());
  const cell = (text: string) => gridButtons().find((b) => b.textContent?.trim() === text)!;
  const headerBtn = (label: string) => panel()!.querySelector(`button[aria-label="${label}"]`) as HTMLButtonElement;
  const picker = () => fixture.debugElement.query((d) => d.componentInstance instanceof DatePickerComponent)
    .componentInstance as DatePickerComponent;

  async function settle(): Promise<void> {
    fixture.detectChanges();
    appRef.tick();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    appRef.tick();
    await fixture.whenStable();
  }

  function key(target: Element, k: string): KeyboardEvent {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
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
    await TestBed.configureTestingModule({ imports: [PeriodHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(PeriodHostComponent);
    host = fixture.componentInstance;
    appRef = TestBed.inject(ApplicationRef);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  it('面板有 6 格，從「1~2 月」到「11~12 月」；在 114 年選「3~4 月」→ 送出 114-3，按鈕顯示「114 年 3~4 月」', async () => {
    await open('114-1');
    expect(cellTexts()).toEqual(['1~2 月', '3~4 月', '5~6 月', '7~8 月', '9~10 月', '11~12 月']);
    cell('3~4 月').click();
    await settle();
    expect(host.changes).toEqual(['114-3']);
    expect(panel()).toBeNull();
    expect(triggerText()).toBe('114 年 3~4 月');
  });

  it('收到雙數月 114-4：顯示「114 年 3~4 月」、「3~4 月」標成選中、焦點落在它上面；值不改寫，也不送出', async () => {
    await open('114-4');
    expect(triggerText()).toBe('114 年 3~4 月');
    expect(cell('3~4 月').getAttribute('aria-selected')).toBe('true');
    expect(activeText()).toBe('3~4 月');
    expect(picker().value()).toBe('114-4');
    expect(host.changes).toEqual([]);
  });

  it('沒有值、也沒設提示文字：按鈕顯示「選擇期別」', () => {
    expect(triggerText()).toBe('選擇期別');
  });

  it('跟說明檔範例同樣的組合（「開始期別」欄位、size L、沒設提示文字）：空值念「開始期別 選擇期別」；選「3~4 月」後念「開始期別 114 年 3~4 月」', async () => {
    expect(accessibleName(trigger())).toBe('開始期別 選擇期別');
    await open('114-1');
    cell('3~4 月').click();
    await settle();
    expect(accessibleName(trigger())).toBe('開始期別 114 年 3~4 月');
  });

  it('沒有值時打開：焦點落在第一格「1~2 月」', async () => {
    await open();
    expect(activeText()).toBe('1~2 月');
  });

  it('上限 maxDate 114-5-10：114 年「7~8 月」以後不能選，「5~6 月」可以選', async () => {
    host.maxDate = { year: 114, month: 5, day: 10 };
    await open('114-1');
    expect(gridButtons().map((b) => b.disabled)).toEqual([false, false, false, true, true, true]);
  });

  it('上限 maxYear 114＋maxMonth 5：114 年「7~8 月」以後不能選；113 年每一期都能選', async () => {
    host.maxYear = 114;
    host.maxMonth = 5;
    await open('114-1');
    expect(gridButtons().map((b) => b.disabled)).toEqual([false, false, false, true, true, true]);
    headerBtn('上一年').click();
    await settle();
    expect(gridButtons().map((b) => b.disabled)).toEqual([false, false, false, false, false, false]);
  });

  it('maxDate 和 maxYear＋maxMonth 都設時以 maxDate 為準', async () => {
    host.maxYear = 114;
    host.maxMonth = 5;
    host.maxDate = { year: 114, month: 9, day: 1 };
    await open('114-1');
    expect(gridButtons().map((b) => b.disabled)).toEqual([false, false, false, false, false, true]);
  });

  it('方向鍵：3 欄，在「1~2 月」按 ↓ 到「7~8 月」，→ 到「9~10 月」', async () => {
    await open('114-1');
    expect(activeText()).toBe('1~2 月');
    key(active()!, 'ArrowDown');
    expect(activeText()).toBe('7~8 月');
    key(active()!, 'ArrowRight');
    expect(activeText()).toBe('9~10 月');
  });

  it('快速跳年：點「選擇年份」選 112 年 → 回到期別格，焦點在期別格上，選「5~6 月」送出 112-5', async () => {
    await open('114-1');
    headerBtn('選擇年份').click();
    await settle();
    cell('112 年').click();
    await settle();
    expect(cellTexts()).toEqual(['1~2 月', '3~4 月', '5~6 月', '7~8 月', '9~10 月', '11~12 月']);
    expect(activeText()).toBe('1~2 月');
    cell('5~6 月').click();
    await settle();
    expect(host.changes).toEqual(['112-5']);
  });

  // ── 以下 2026-11-05 #48 審查第 1 輪補：上限只用單數月測，換成「比第幾期」的寫法也會全綠 ──
  const disabledFlags = () => gridButtons().map((b) => b.disabled);

  it('上限 maxYear 114＋maxMonth 3：「3~4 月」可以選，「5~6 月」以後不能選', async () => {
    host.maxYear = 114;
    host.maxMonth = 3;
    await open('114-1');
    expect(disabledFlags()).toEqual([false, false, true, true, true, true]);
  });

  it('上限 maxYear 114＋maxMonth 4（雙數月）：「3~4 月」可以選，「5~6 月」以後不能選', async () => {
    host.maxYear = 114;
    host.maxMonth = 4;
    await open('114-1');
    expect(disabledFlags()).toEqual([false, false, true, true, true, true]);
  });

  it('上限 maxDate 114-4-30（雙數月）：「3~4 月」可以選，「5~6 月」以後不能選', async () => {
    host.maxDate = { year: 114, month: 4, day: 30 };
    await open('114-1');
    expect(disabledFlags()).toEqual([false, false, true, true, true, true]);
  });

  it('maxDate 在下一年 115-2-1：114 年每一期都能選；按「下一年」到 115 年，只有「1~2 月」能選', async () => {
    host.maxDate = { year: 115, month: 2, day: 1 };
    await open('114-1');
    expect(disabledFlags()).toEqual([false, false, false, false, false, false]);
    headerBtn('下一年').click();
    await settle();
    expect(disabledFlags()).toEqual([false, true, true, true, true, true]);
  });

  it('maxDate 在上一年 113-12-31、值是 114-1：114 年每一期都不能選', async () => {
    host.maxDate = { year: 113, month: 12, day: 31 };
    await open('114-1');
    expect(disabledFlags()).toEqual([true, true, true, true, true, true]);
  });

  it('maxDate 比 maxYear＋maxMonth 嚴（maxMonth 9、maxDate 114-4-1）：以 maxDate 為準，「5~6 月」以後不能選', async () => {
    host.maxYear = 114;
    host.maxMonth = 9;
    host.maxDate = { year: 114, month: 4, day: 1 };
    await open('114-1');
    expect(disabledFlags()).toEqual([false, false, true, true, true, true]);
  });

  for (const [value, text, label] of [
    ['114-2', '114 年 1~2 月', '1~2 月'],
    ['114-6', '114 年 5~6 月', '5~6 月'],
    ['114-12', '114 年 11~12 月', '11~12 月'],
  ]) {
    it(`收到雙數月 ${value}：顯示「${text}」、「${label}」標成選中；值不改寫，也不送出`, async () => {
      await open(value);
      expect(triggerText()).toBe(text);
      expect(cell(label).getAttribute('aria-selected')).toBe('true');
      expect(picker().value()).toBe(value);
      expect(host.changes).toEqual([]);
    });
  }

  it('停用時：點按鈕、按 Enter、按 ↓ 都不會打開面板', async () => {
    host.disabled = true;
    await settle();
    trigger().click();
    await settle();
    expect(panel()).withContext('點按鈕').toBeNull();
    key(trigger(), 'Enter');
    await settle();
    expect(panel()).withContext('按 Enter').toBeNull();
    key(trigger(), 'ArrowDown');
    await settle();
    expect(panel()).withContext('按 ↓').toBeNull();
  });

  it('期別格排成 3 欄 2 列', async () => {
    await open('114-1');
    const rects = gridButtons().map((b) => b.getBoundingClientRect());
    expect(new Set(rects.map((r) => Math.round(r.left))).size).toBe(3);
    expect(new Set(rects.map((r) => Math.round(r.top))).size).toBe(2);
  });
});

// ── Esc 不傳給外層（2026-11-05）──────────────────────────────────
// 面板開著時按 Esc，原本只有面板關閉、事件照樣傳到 document，外層視窗在 document 上聽 Esc 的話也會收到，
// 跟著跳出關閉確認或直接關閉。現在面板開著時由 date-picker 先接住 Esc：關面板、焦點回按鈕、不往外傳。
// 外層用 @HostListener('document:keydown.escape') 模擬，跟使用端視窗的寫法一樣。

@Component({
  standalone: true,
  imports: [FieldComponent, DatePickerComponent, DialogComponent, ModalShellComponent, FormsModule, ErrorTooltipDirective],
  template: `
    @if (show) {
      <app-field label="完成日期">
        <app-date-picker [mode]="mode" [(ngModel)]="value"></app-date-picker>
      </app-field>
    }
    <span class="err-anchor" [appErrorTooltip]="errorMsg">另一個欄位</span>
    <app-dialog [isOpen]="dialogOpen" header="提示" content="內容" (cancel)="onDialogCancel()"></app-dialog>
    <app-modal-shell [isOpen]="shellOpen" ariaLabel="視窗" (escapePress)="shellOpen = false">
      <button type="button" class="in-shell">確定</button>
    </app-modal-shell>
  `,
})
class OuterEscHostComponent {
  mode: 'year' | 'month' | 'period' | 'day' = 'month';
  show = true;
  value = '';
  outerEsc = 0;
  dialogOpen = false;
  dialogCancels = 0;
  shellOpen = false;
  errorMsg = '';
  onDialogCancel(): void {
    this.dialogCancels++;
    this.dialogOpen = false;
  }
  @HostListener('document:keydown.escape')
  onOuterEsc(): void {
    this.outerEsc++;
  }
}

describe('DatePickerComponent — Esc 不傳給外層', () => {
  let fixture: ComponentFixture<OuterEscHostComponent>;
  let host: OuterEscHostComponent;
  let appRef: ApplicationRef;

  const root = () => fixture.nativeElement as HTMLElement;
  const trigger = () => root().querySelector('.dp-trigger') as HTMLElement;
  const panel = () => document.querySelector('app-date-panel') as HTMLElement | null;
  const active = () => document.activeElement as HTMLElement | null;
  const gridButtons = () =>
    Array.from(panel()!.querySelectorAll('[role="listbox"] button.cell-btn')) as HTMLButtonElement[];

  async function settle(): Promise<void> {
    fixture.detectChanges();
    appRef.tick();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    appRef.tick();
    await fixture.whenStable();
  }

  function key(target: Element, k: string): KeyboardEvent {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true });
    target.dispatchEvent(e);
    return e;
  }

  async function open(): Promise<void> {
    trigger().focus();
    key(trigger(), 'Enter');
    await settle();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [OuterEscHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(OuterEscHostComponent);
    host = fixture.componentInstance;
    appRef = TestBed.inject(ApplicationRef);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  for (const mode of ['year', 'month', 'period', 'day'] as const) {
    it(`${mode} 模式：面板開著，在格子上按 Esc → 面板關閉、焦點回到按鈕，外層收不到`, async () => {
      host.mode = mode;
      await settle();
      await open();
      expect(panel()).withContext('面板有打開').not.toBeNull();
      key(active()!, 'Escape');
      await settle();
      expect(panel()).toBeNull();
      expect(active()).toBe(trigger());
      expect(host.outerEsc).toBe(0);
    });
  }

  it('焦點不在面板上（例如點了面板空白處，焦點落到 body）時按 Esc → 一樣只關面板，外層收不到', async () => {
    await open();
    (active() as HTMLElement).blur();
    expect(active()).toBe(document.body);
    key(document.body, 'Escape');
    await settle();
    expect(panel()).toBeNull();
    expect(active()).toBe(trigger());
    expect(host.outerEsc).toBe(0);
  });

  it('面板關著時按 Esc → 照常傳給外層', async () => {
    trigger().focus();
    key(trigger(), 'Escape');
    expect(host.outerEsc).toBe(1);
  });

  it('用 Esc 關掉面板後，再按一次 Esc → 這次傳給外層', async () => {
    await open();
    key(active()!, 'Escape');
    await settle();
    key(active()!, 'Escape');
    expect(host.outerEsc).toBe(1);
  });

  it('選了值、面板關閉後按 Esc → 傳給外層', async () => {
    await open();
    gridButtons()[0].click();
    await settle();
    expect(panel()).toBeNull();
    key(active()!, 'Escape');
    expect(host.outerEsc).toBe(1);
  });

  // ── 以下 2026-11-05 #49 審查第 1 輪補 ──
  function keyRepeat(target: Element, k: string): KeyboardEvent {
    const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, repeat: true });
    target.dispatchEvent(e);
    return e;
  }

  function keyup(target: Element, k: string): void {
    target.dispatchEvent(new KeyboardEvent('keyup', { key: k, bubbles: true, cancelable: true }));
  }

  it('按住 Esc 不放：第一下關面板，之後的連發外層都收不到；放開後再按一次 → 外層收到', async () => {
    await open();
    key(active()!, 'Escape');
    await settle();
    expect(panel()).toBeNull();
    for (let i = 0; i < 4; i++) keyRepeat(active()!, 'Escape');
    expect(host.outerEsc).withContext('連發').toBe(0);
    keyup(active()!, 'Escape');
    key(active()!, 'Escape');
    expect(host.outerEsc).withContext('放開後新的一下').toBe(1);
  });

  it('按住 Esc 時沒收到放開、直接按了新的一下 Esc → 這一下傳給外層', async () => {
    await open();
    key(active()!, 'Escape');
    await settle();
    keyRepeat(active()!, 'Escape');
    key(active()!, 'Escape');
    expect(host.outerEsc).toBe(1);
  });

  it('按住 Esc 時視窗失去焦點 → 停止擋連發', async () => {
    await open();
    key(active()!, 'Escape');
    await settle();
    window.dispatchEvent(new Event('blur'));
    keyRepeat(active()!, 'Escape');
    expect(host.outerEsc).toBe(1);
  });

  it('按住 Esc 時元件被移除 → 之後的連發照常傳給外層', async () => {
    await open();
    key(active()!, 'Escape');
    await settle();
    host.show = false;
    await settle();
    keyRepeat(document.body, 'Escape');
    expect(host.outerEsc).toBe(1);
  });

  it('面板開著時蓋上 app-dialog → 面板關閉、焦點進對話框；按一次 Esc 關的是對話框', async () => {
    await open();
    host.dialogOpen = true;
    await settle();
    expect(panel()).withContext('對話框打開時面板關閉').toBeNull();
    expect(document.querySelector('app-dialog')!.contains(active())).withContext('焦點在對話框裡').toBeTrue();
    key(active() ?? document.body, 'Escape');
    await settle();
    expect(host.dialogCancels).toBe(1);
  });

  it('面板開著時蓋上 app-modal-shell → 面板關閉；視窗接手焦點，關掉後焦點回到日期按鈕', async () => {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    await open();
    host.shellOpen = true;
    await settle();
    expect(panel()).withContext('視窗打開時面板關閉').toBeNull();
    await wait(500); // modal-shell 進場 450ms 後才接手焦點
    await settle();
    expect(active()?.classList.contains('in-shell')).withContext('焦點在視窗裡').toBeTrue();
    key(active()!, 'Escape');
    await settle();
    expect(host.shellOpen).withContext('Esc 關的是視窗').toBeFalse();
    await wait(500);
    await settle();
    expect(active()).withContext('視窗關掉後焦點回到日期按鈕').toBe(trigger());
  });

  // ── 以下 2026-11-09 mendesky-web #356 審查補 ──
  // 浮層服務在 effect 裡通知「有視窗打開了」，日期元件在那裡關面板。關面板最後一步把 isOpen 設回 false，
  // 原本在 effect 裡寫 signal 會丟 NG0600、沒寫進去：按鈕還標成展開，之後按一次只是把狀態歸零、面板沒打開，要按第二次。
  for (const kind of ['app-dialog', 'app-modal-shell'] as const) {
    it(`面板開著時蓋上 ${kind} → 按鈕不再標成展開；視窗關掉後按一次按鈕就打開面板`, async () => {
      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const setOpen = (v: boolean) => {
        if (kind === 'app-dialog') host.dialogOpen = v;
        else host.shellOpen = v;
      };
      await open();
      setOpen(true);
      await settle();
      expect(panel()).withContext('視窗打開時面板關閉').toBeNull();
      expect(trigger().getAttribute('aria-expanded')).withContext('面板關了，按鈕不再標成展開').toBe('false');
      setOpen(false);
      await settle();
      await wait(500); // 等視窗退場動畫跑完
      await settle();
      trigger().click();
      await settle();
      expect(panel()).withContext('按一次就打開面板').not.toBeNull();
    });
  }

  // 浮層服務收到「有視窗打開了」時，依序關掉設了 closeOnModalOpen 的浮層。原本日期元件關面板時丟 NG0600，
  // 迴圈在那裡中斷，排在面板後面打開的錯誤提示不會被關，留在對話框上面。
  it('面板開著時又出現錯誤提示，再蓋上 app-dialog → 面板和錯誤提示都關閉', async () => {
    const tooltips = () => document.querySelectorAll('app-form-error-portal').length;
    await open();
    host.errorMsg = '請填寫';
    await settle();
    expect(tooltips()).withContext('前提：錯誤提示在面板之後打開').toBe(1);
    host.dialogOpen = true;
    await settle();
    expect(panel()).withContext('面板關閉').toBeNull();
    expect(tooltips()).withContext('排在面板後面的錯誤提示也關閉').toBe(0);
    host.errorMsg = '';
    await settle();
  });

  it('開關面板幾次後，日期元件在 document、window 捕獲階段掛的按鍵監聽都有拿掉', async () => {
    type Entry = { target: EventTarget; type: string; fn: unknown };
    const live: Entry[] = [];
    const isCapture = (opt: unknown) => (typeof opt === 'boolean' ? opt : !!(opt as AddEventListenerOptions | undefined)?.capture);
    for (const target of [document, window] as EventTarget[]) {
      const add = target.addEventListener.bind(target);
      const remove = target.removeEventListener.bind(target);
      spyOn(target, 'addEventListener').and.callFake((type: string, fn: EventListenerOrEventListenerObject, opt?: boolean | AddEventListenerOptions) => {
        if ((type === 'keydown' || type === 'keyup') && isCapture(opt)) live.push({ target, type, fn });
        add(type, fn, opt);
      });
      spyOn(target, 'removeEventListener').and.callFake((type: string, fn: EventListenerOrEventListenerObject, opt?: boolean | EventListenerOptions) => {
        const i = live.findIndex((e) => e.target === target && e.type === type && e.fn === fn);
        if (i >= 0 && isCapture(opt)) live.splice(i, 1);
        remove(type, fn, opt);
      });
    }
    const liveTypes = () => live.map((e) => `${e.target === window ? 'window' : 'document'}:${e.type}`);
    await open();
    key(active()!, 'Escape');
    await settle();
    keyup(active()!, 'Escape');
    expect(liveTypes()).withContext('用 Esc 關掉、放開 Esc 之後').toEqual([]);
    await open();
    gridButtons()[0].click();
    await settle();
    expect(liveTypes()).withContext('選了值關閉之後').toEqual([]);
    await open();
    host.show = false;
    await settle();
    expect(liveTypes()).withContext('面板開著時元件被移除之後').toEqual([]);
  });

  it('面板開著時元件被移除 → 之後按 Esc 照常傳給外層', async () => {
    await open();
    host.show = false;
    await settle();
    expect(panel()).toBeNull();
    key(document.body, 'Escape');
    expect(host.outerEsc).toBe(1);
  });
});

// ── 點外面關面板不捲動頁面（2026-11-09，mendesky-web #356 審查第 2 條）──────────
// v0.9.0 起面板一打開，焦點就移進面板。點外面關面板時焦點還給按鈕；按鈕若已捲出畫面，
// 照預設呼叫 focus() 會把頁面捲回按鈕，滑鼠放開時底下換成別的東西，這一下點擊就沒作用。
// 跟 Action Menu 一樣：點外面關掉的不捲動；Esc 關掉的照預設捲到看得到按鈕，用鍵盤的人才看得到焦點在哪。

@Component({
  standalone: true,
  imports: [DatePickerComponent],
  template: `
    <div style="height: 200px"></div>
    <app-date-picker mode="month"></app-date-picker>
    <div style="height: 4000px"></div>
    <button type="button" class="far-away">很下面的按鈕</button>
    <div style="height: 400px"></div>
  `,
})
class TallPageHostComponent {}

describe('DatePickerComponent — 點外面關面板不捲動頁面', () => {
  let fixture: ComponentFixture<TallPageHostComponent>;
  let appRef: ApplicationRef;

  const root = () => fixture.nativeElement as HTMLElement;
  const trigger = () => root().querySelector('.dp-trigger') as HTMLElement;
  const farButton = () => root().querySelector('.far-away') as HTMLElement;
  const panel = () => document.querySelector('app-date-panel');

  async function settle(): Promise<void> {
    fixture.detectChanges();
    appRef.tick();
    await new Promise((r) => setTimeout(r, 0));
    fixture.detectChanges();
    appRef.tick();
    await fixture.whenStable();
  }

  /** 從按鈕打開面板，再把頁面捲到很下面的按鈕；回傳捲完的位置 */
  async function openThenScrollAway(): Promise<number> {
    window.scrollTo(0, 0);
    trigger().focus();
    trigger().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
    await settle();
    expect(panel()).withContext('面板有打開').not.toBeNull();
    farButton().scrollIntoView({ block: 'center' });
    await settle();
    expect(trigger().getBoundingClientRect().bottom).withContext('前提：日期按鈕已捲出畫面').toBeLessThan(0);
    return window.scrollY;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [TallPageHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(TallPageHostComponent);
    appRef = TestBed.inject(ApplicationRef);
    document.body.appendChild(fixture.nativeElement);
    await settle();
  });

  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
    window.scrollTo(0, 0);
  });

  it('按下面板外的按鈕 → 面板關閉、焦點回到日期按鈕，頁面不捲動', async () => {
    const scrolled = await openThenScrollAway();
    farButton().dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(window.scrollY).toBe(scrolled);
  });

  it('按 Esc 關面板 → 焦點回到日期按鈕，頁面照預設捲到看得到它', async () => {
    const scrolled = await openThenScrollAway();
    document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).toBe(trigger());
    expect(window.scrollY).toBeLessThan(scrolled);
  });
});
