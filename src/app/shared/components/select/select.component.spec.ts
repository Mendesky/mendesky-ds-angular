import { ApplicationRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SelectComponent, SelectOption } from './select.component';

describe('SelectComponent — options equality（防 CD loop 回歸）', () => {
  let fixture: ComponentFixture<SelectComponent>;
  let component: SelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('TC-EQ1: 相同內容不同引用的 options 不應觸發 _options signal 更新（防止 infinite CD loop）', () => {
    const a: SelectOption[] = [{ value: 'tw', label: '台灣' }, { value: 'jp', label: '日本' }];
    const b: SelectOption[] = [{ value: 'tw', label: '台灣' }, { value: 'jp', label: '日本' }];

    fixture.componentRef.setInput('options', a);
    fixture.detectChanges();
    const refAfterA = (component as any)._options();

    fixture.componentRef.setInput('options', b);
    fixture.detectChanges();
    const refAfterB = (component as any)._options();

    expect(refAfterB).toBe(refAfterA); // signal 未更新，引用相同
  });

  it('TC-EQ2: 內容不同的 options 仍應觸發 _options signal 更新', () => {
    const a: SelectOption[] = [{ value: 'tw', label: '台灣' }];
    const b: SelectOption[] = [{ value: 'jp', label: '日本' }];

    fixture.componentRef.setInput('options', a);
    fixture.detectChanges();
    const refAfterA = (component as any)._options();

    fixture.componentRef.setInput('options', b);
    fixture.detectChanges();
    const refAfterB = (component as any)._options();

    expect(refAfterB).not.toBe(refAfterA);
    expect(refAfterB[0].value).toBe('jp');
  });
});

describe('SelectComponent — dynamic options reactivity', () => {
  let fixture: ComponentFixture<SelectComponent>;
  let component: SelectComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SelectComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('TC1: filteredOptions 應在 options input 動態更新後反映新值', () => {
    fixture.componentRef.setInput('options', [{ value: 'a', label: 'A' }]);
    fixture.detectChanges();

    fixture.componentRef.setInput('options', [{ value: 'b', label: 'B' }]);
    fixture.detectChanges();

    const filtered = component.filteredOptions();
    expect(filtered.length).toBe(1);
    expect(filtered[0].value).toBe('b');
  });

  it('TC2: displayLabel 應在 options 換為含相同 value 但不同 label 的新陣列後更新', () => {
    fixture.componentRef.setInput('options', [{ value: 'tn', label: '台南市' }]);
    component.writeValue('tn');
    fixture.detectChanges();
    expect(component.displayLabel()).toBe('台南市');

    fixture.componentRef.setInput('options', [
      { value: 'tn', label: '台南' },
      { value: 'tp', label: '台北' },
    ]);
    fixture.detectChanges();

    expect(component.displayLabel()).toBe('台南');
  });

  it('TC3: options 切換為空陣列後 filteredOptions 應為空', () => {
    fixture.componentRef.setInput('options', [{ value: 'a', label: 'A' }]);
    fixture.detectChanges();

    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();

    expect(component.filteredOptions().length).toBe(0);
  });
});

// ── 下拉面板寬度必須等於 trigger（與 app-autocomplete 面板一致）──────────────────
// panel host 只綁 min-width、width 為 auto → position:fixed 的寬度是 shrink-to-fit
// ＝min(max-content, 可用寬)，而 max-content ＝最長選項不換行的寬度 → 選項一長面板就往外長、
// 手機上貼齊螢幕兩側，與同畫面其他下拉不一致（autocomplete 實測 trigger 366 / panel 506）。
describe('SelectComponent — 下拉面板寬度對齊 trigger', () => {
  let fixture: ComponentFixture<SelectComponent>;

  const LONG: SelectOption[] = [
    { value: 'a', label: '豆類加工食品（豆腐、豆乾、豆皮、豆腐乳、豆豉、豆漿除外）製造' },
    { value: 'b', label: '稻作栽培' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SelectComponent] }).compileComponents();
    fixture = TestBed.createComponent(SelectComponent);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
    document.querySelectorAll('app-select-panel').forEach(el => el.remove());
  });

  it('長選項 → 面板不得超過 trigger 寬度', () => {
    const host = fixture.nativeElement as HTMLElement;
    host.style.display = 'block';
    host.style.width = '366px';
    document.body.appendChild(host);
    fixture.componentRef.setInput('options', LONG);
    fixture.detectChanges();

    (fixture.componentInstance as any).open();
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();   // 面板是動態元件，CD 走 ApplicationRef

    const panel = document.querySelector('app-select-panel') as HTMLElement | null;
    expect(panel).withContext('面板應已開啟').toBeTruthy();
    const trigger = host.querySelector('.select-box') as HTMLElement;
    const tw = trigger.getBoundingClientRect().width;
    const pw = panel!.getBoundingClientRect().width;
    console.log(`[select panel-w] trigger=${tw.toFixed(1)} panel=${pw.toFixed(1)}`);
    expect(pw).withContext(`面板 ${pw.toFixed(1)}px 比 trigger ${tw.toFixed(1)}px 寬`).toBeLessThanOrEqual(tw);
  });
});

/**
 * 狀態標記（2026-11-09）：
 * - 選項帶 status 時，選項文字後面接紅色驚嘆號（aria-hidden），狀態文字用看不見的字接在名稱後面念。
 * - 選中項目有 status 時，選取框文字後面也有驚嘆號；選取框用 aria-describedby 指向狀態文字。
 * - 可輸入模式：關著時輸入框依文字寬度縮起來，驚嘆號緊接在文字後面；打開（在打字）時不顯示。
 * - status 只改 label 也要更新畫面（options 相等判斷要比 status）。
 */
describe('SelectComponent — 狀態標記', () => {
  const OPTS: SelectOption[] = [
    { value: 'a', label: '第一組', status: { label: '需處理' } },
    { value: 'b', label: '第二組' },
  ];
  let fixture: ComponentFixture<SelectComponent>;
  let component: SelectComponent;
  let el: HTMLElement;

  const setup = (searchable: boolean, value: string | null) => {
    fixture = TestBed.createComponent(SelectComponent);
    component = fixture.componentInstance;
    el = fixture.nativeElement;
    el.style.display = 'block';
    el.style.width = '360px';
    document.body.appendChild(el);
    fixture.componentRef.setInput('options', OPTS);
    fixture.componentRef.setInput('searchable', searchable);
    component.writeValue(value);
    fixture.detectChanges();
  };

  afterEach(() => {
    fixture.destroy();
    el.remove();
    document.querySelectorAll('app-select-panel').forEach(p => p.remove());
  });

  it('status 只改 label 也會更新 options；內容相同的新引用不會', () => {
    setup(false, null);
    const before = (component as any)._options();
    fixture.componentRef.setInput('options', OPTS.map(o => ({ ...o, status: o.status ? { ...o.status } : o.status })));
    fixture.detectChanges();
    expect((component as any)._options()).toBe(before);
    fixture.componentRef.setInput('options', [{ ...OPTS[0], status: { label: '資料不完整' } }, OPTS[1]]);
    fixture.detectChanges();
    expect((component as any)._options()).not.toBe(before);
  });

  it('不可輸入模式：選中有標記的項目，文字後面有紅色驚嘆號，aria-describedby 指向狀態文字', () => {
    setup(false, 'a');
    const trigger = el.querySelector('[role="combobox"]') as HTMLElement;
    const icon = trigger.querySelector('.select-status') as HTMLElement;
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(icon).color).toBe('rgb(204, 82, 82)');
    const text = trigger.querySelector('.select-field__text') as HTMLElement;
    expect(text.textContent!.trim()).toBe('第一組');
    expect(icon.getBoundingClientRect().left).toBeGreaterThanOrEqual(text.getBoundingClientRect().right);
    const id = trigger.getAttribute('aria-describedby')!;
    expect(el.querySelector('#' + id)!.textContent!.trim()).toBe('需處理');
  });

  it('選中沒有標記的項目：沒有驚嘆號，也沒有 aria-describedby', () => {
    setup(false, 'b');
    const trigger = el.querySelector('[role="combobox"]') as HTMLElement;
    expect(trigger.querySelector('.select-status')).toBeNull();
    expect(trigger.hasAttribute('aria-describedby')).toBeFalse();
    expect(trigger.textContent!.trim()).toBe('第二組');
  });

  it('可輸入模式關著：驚嘆號緊接在文字後面，不是推到最右邊', () => {
    setup(true, 'a');
    const input = el.querySelector('input.select-field') as HTMLInputElement;
    expect(input.value).toBe('第一組');
    expect(input.getAttribute('aria-describedby')).toBeTruthy();
    const icon = el.querySelector('.select-status') as HTMLElement;
    const arrow = el.querySelector('.select-arrow') as HTMLElement;
    const inputRect = input.getBoundingClientRect();
    const iconRect = icon.getBoundingClientRect();
    expect(iconRect.left - inputRect.right).toBeLessThanOrEqual(8);
    // 三個字約 42px；外框 360px，輸入框若沒縮起來會佔 300px 以上
    expect(inputRect.width).toBeLessThan(120);
    expect(arrow.getBoundingClientRect().left - iconRect.right).toBeGreaterThan(100);
  });

  it('可輸入模式打開（在打字）時不顯示驚嘆號，輸入框恢復佔滿', () => {
    setup(true, 'a');
    (el.querySelector('.select-wrap') as HTMLElement).click();
    fixture.detectChanges();
    expect(component.isOpen()).toBeTrue();
    expect(el.querySelector('.select-status')).toBeNull();
    const input = el.querySelector('input.select-field') as HTMLInputElement;
    expect(input.hasAttribute('aria-describedby')).toBeFalse();
    expect(input.getBoundingClientRect().width).toBeGreaterThan(200);
  });

  it('下拉選項：有標記的選項文字後面有驚嘆號，狀態文字接在名稱後面；滑到的選項驚嘆號跟著文字變淺色', () => {
    setup(false, null);
    (el.querySelector('.select-wrap') as HTMLElement).click();
    fixture.detectChanges();
    TestBed.inject(ApplicationRef).tick();   // 面板是動態元件，CD 走 ApplicationRef
    const options = Array.from(document.querySelectorAll<HTMLButtonElement>('app-select-panel .panel-option'));
    expect(options.length).toBe(2);
    const marked = options[0];
    const icon = marked.querySelector('.panel-status') as HTMLElement;
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(getComputedStyle(icon).color).toBe('rgb(204, 82, 82)');
    expect(marked.querySelector('.panel-sr')!.textContent).toContain('需處理');
    expect(options[1].querySelector('.panel-status')).toBeNull();
    expect(options[1].textContent!.trim()).toBe('第二組');
    component.activeIndex.set(0);
    const panel = (component as any).panelRef;
    panel.setInput('activeIndex', 0);
    panel.changeDetectorRef.detectChanges();
    expect(marked.classList).toContain('panel-option--active');
    expect(getComputedStyle(icon).color).toBe(getComputedStyle(marked).color);
  });
});
