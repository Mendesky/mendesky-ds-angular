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
