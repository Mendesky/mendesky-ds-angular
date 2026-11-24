import { Component } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { NumberInputComponent } from './number-input.component';

describe('NumberInputComponent — valueCommit debounce', () => {
  let component: NumberInputComponent;
  let fixture: ComponentFixture<NumberInputComponent>;
  let emittedCommits: (number | null)[];
  let blurEvents: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NumberInputComponent);
    component = fixture.componentInstance;
    emittedCommits = [];
    blurEvents = 0;
    component.valueCommit.subscribe((val) => emittedCommits.push(val));
    component.inputBlur.subscribe(() => blurEvents++);
    fixture.detectChanges();
  });

  it('連續 scheduleCommit 5 次，600ms 後 valueCommit 只 emit 1 次，payload = 最後一次的值', fakeAsync(() => {
    (component as any).scheduleCommit(1);
    tick(50);
    (component as any).scheduleCommit(2);
    tick(50);
    (component as any).scheduleCommit(3);
    tick(50);
    (component as any).scheduleCommit(4);
    tick(50);
    (component as any).scheduleCommit(5);

    expect(emittedCommits.length).toBe(0);
    tick(600);
    expect(emittedCommits.length).toBe(1);
    expect(emittedCommits[0]).toBe(5);
  }));

  it('scheduleCommit 後立即 flushCommit，valueCommit 立即 emit 1 次（不再等 600ms）', fakeAsync(() => {
    (component as any).scheduleCommit(10);
    const didFlush = (component as any).flushCommit();

    expect(didFlush).toBeTrue();
    expect(emittedCommits.length).toBe(1);
    expect(emittedCommits[0]).toBe(10);

    tick(600);
    expect(emittedCommits.length).toBe(1); // flush 後不重複 emit
  }));

  it('scheduleCommit 後呼叫 ngOnDestroy，valueCommit 在 destroy 前 emit 1 次', fakeAsync(() => {
    (component as any).scheduleCommit(20);
    component.ngOnDestroy();

    expect(emittedCommits.length).toBe(1);
    expect(emittedCommits[0]).toBe(20);

    tick(600);
    expect(emittedCommits.length).toBe(1);
  }));

  it('onBlur 在有 pending timer 時只 emit 1 次 valueCommit，payload = 最終 numericValue', fakeAsync(() => {
    component.max = 10;
    component.numericValue = 8;
    (component as any).scheduleCommit(8);
    component.numericValue = 12;
    component.onBlur();

    expect(emittedCommits.length).toBe(1);
    expect(emittedCommits[0]).toBe(10);
    expect(blurEvents).toBe(1);

    tick(600);
    expect(emittedCommits.length).toBe(1);
  }));

  it('clearValue 取消 pending step，不先 emit 舊值，只 emit null 一次', fakeAsync(() => {
    component.numericValue = 5;
    (component as any).scheduleCommit(5);
    component.clearValue(new MouseEvent('click'));

    // 只有 1 次 emit，且是 null（不是先 5 後 null）
    expect(emittedCommits.length).toBe(1);
    expect(emittedCommits[0]).toBeNull();

    tick(600);
    expect(emittedCommits.length).toBe(1); // 沒有殘留 timer 再 emit
  }));

  it('stepUp/stepDown 不 emit inputBlur，改由 adjust 排程單次 valueCommit', fakeAsync(() => {
    component.step = 2;
    component.numericValue = 5;

    component.stepUp();
    component.stepDown();

    expect(blurEvents).toBe(0);
    expect(emittedCommits.length).toBe(0);

    tick(600);

    expect(emittedCommits).toEqual([5]);
  }));

  it('純打字（onInput）不觸發 valueCommit；valueChange 即時 emit', fakeAsync(() => {
    const valueChanges: (number | null)[] = [];
    component.valueChange.subscribe((v) => valueChanges.push(v));

    const el = document.createElement('input');
    el.value = '42';
    const mockEvent = { target: el } as unknown as Event;
    component.onInput(mockEvent);

    tick(600);

    expect(emittedCommits.length).toBe(0);
    expect(valueChanges.length).toBeGreaterThanOrEqual(1);
    expect(valueChanges[0]).toBe(42);
  }));
});

describe('NumberInputComponent — dirty flag commit', () => {
  let component: NumberInputComponent;
  let fixture: ComponentFixture<NumberInputComponent>;
  let emittedCommits: (number | null)[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NumberInputComponent);
    component = fixture.componentInstance;
    emittedCommits = [];
    component.valueCommit.subscribe((val) => emittedCommits.push(val));
    fixture.detectChanges();
  });

  it('AC1: 純 focus → blur 不 emit（initialValue 有值，使用者沒動過）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.onBlur();
    expect(emittedCommits.length).toBe(0);
  }));

  it('AC2: 打字後 blur emit 1 次 valueCommit', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 3);
    fixture.detectChanges();
    const el = document.createElement('input');
    el.value = '7';
    component.onInput({ target: el } as unknown as Event);
    tick(0); // 清掉 onInput 內的 cursor 還原 setTimeout(0)
    component.onBlur();
    expect(emittedCommits).toEqual([7]);
  }));

  it('AC3: clearValue 後立即 blur，valueCommit 只 emit null 1 次（不重發）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.clearValue(new MouseEvent('click'));
    component.onBlur();
    expect(emittedCommits).toEqual([null]);
  }));

  it('AC4: stepUp 後 debounce 600ms emit，再 blur 不重發', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.stepUp();
    tick(600);
    component.onBlur();
    expect(emittedCommits).toEqual([6]);
  }));

  it('AC5: stepUp 後立即 blur，flushCommit 觸發 1 次 emit（debounce 未到）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.stepUp();
    component.onBlur();
    tick(600);
    expect(emittedCommits).toEqual([6]);
  }));

  it('AC6: initialValue 外部回填（parent echo）後再次 blur 不 emit', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 3);
    fixture.detectChanges();
    const el = document.createElement('input');
    el.value = '7';
    component.onInput({ target: el } as unknown as Event);
    tick(0); // 清掉 onInput 內的 cursor 還原 setTimeout(0)
    component.onBlur();
    fixture.componentRef.setInput('initialValue', 7);
    fixture.detectChanges();
    component.onBlur();
    expect(emittedCommits).toEqual([7]);
  }));

  it('AC7: focused 中 parent echo initialValue（父層 signal 回寫場景），blur 仍 emit', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 3);
    fixture.detectChanges();

    component.onFocus(); // 模擬使用者 focus

    const el = document.createElement('input');
    el.value = '7';
    component.onInput({ target: el } as unknown as Event); // isDirty = true
    tick(0);

    // 模擬父層 onNumberChange：signal 更新 → [initialValue] echo 回來
    fixture.componentRef.setInput('initialValue', 7);
    fixture.detectChanges(); // ngOnChanges，focused=true 時不應重置 dirty

    component.onBlur(); // 應 emit 7（isDirty 仍 true）
    expect(emittedCommits).toEqual([7]);
  }));
});

describe('NumberInputComponent — keyboard vs mouse + value-unchanged guard', () => {
  let component: NumberInputComponent;
  let fixture: ComponentFixture<NumberInputComponent>;
  let emittedCommits: (number | null)[];

  function makeArrowEvent(key: 'ArrowUp' | 'ArrowDown'): KeyboardEvent {
    return { key, shiftKey: false, preventDefault: () => {} } as unknown as KeyboardEvent;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NumberInputComponent);
    component = fixture.componentInstance;
    emittedCommits = [];
    component.valueCommit.subscribe((val) => emittedCommits.push(val));
    fixture.detectChanges();
  });

  it('AC12: 鍵盤 ArrowUp 後 tick(600ms) 不自動 emit（鍵盤不走 debounce）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.onFocus();

    component.onKeydown(makeArrowEvent('ArrowUp'));
    tick(600);

    expect(emittedCommits.length).toBe(0);
  }));

  it('AC13: 鍵盤 ArrowUp 後 blur 才 emit', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.onFocus();

    component.onKeydown(makeArrowEvent('ArrowUp'));
    component.onBlur();

    expect(emittedCommits).toEqual([6]);

    tick(600);
    expect(emittedCommits.length).toBe(1); // 不重發
  }));

  it('AC14: onInput 改值後改回原值，blur 不 emit（值未實質變）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.onFocus();

    const el = document.createElement('input');
    el.value = '8';
    component.onInput({ target: el } as unknown as Event);
    tick(0);

    el.value = '5';
    component.onInput({ target: el } as unknown as Event);
    tick(0);

    component.onBlur();

    expect(emittedCommits.length).toBe(0);
  }));

  it('AC15: 鍵盤 ArrowUp + ArrowDown 回原值，blur 不 emit', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.onFocus();

    component.onKeydown(makeArrowEvent('ArrowUp'));  // 6
    component.onKeydown(makeArrowEvent('ArrowDown')); // 5（回原值）
    component.onBlur();

    expect(emittedCommits.length).toBe(0);

    tick(600);
    expect(emittedCommits.length).toBe(0);
  }));

  it('AC16: stepUp debounce emit 6 + stepDown debounce emit 5 → blur 不重發', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.onFocus();

    component.stepUp();
    tick(600); // debounce fire → emit 6

    component.stepDown();
    tick(600); // debounce fire → emit 5

    component.onBlur();

    expect(emittedCommits).toEqual([6, 5]); // debounce 期間 emit 兩次；blur 不重發
  }));

  it('AC17: stepUp 後立即 stepDown（pending 期回原值），blur 不 emit', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    component.onFocus();

    component.stepUp();   // numericValue=6, pending timer 開始
    component.stepDown(); // numericValue=5, pending timer 重設

    component.onBlur(); // 值回到 focus 快照(5)，不應 emit

    expect(emittedCommits.length).toBe(0);

    tick(600);
    expect(emittedCommits.length).toBe(0);
  }));
});

describe('NumberInputComponent — 游標還原（千分位）', () => {
  let component: NumberInputComponent;
  let fixture: ComponentFixture<NumberInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NumberInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('在開頭打字游標停在剛輸入字元之後（不因千分位逗號漂移）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 30000); // displayValue = "30,000"
    fixture.detectChanges();
    component.onFocus();

    const el = document.createElement('input');
    document.body.appendChild(el);
    el.value = '130,000';        // 模擬瀏覽器已在開頭插入 "1"
    el.setSelectionRange(1, 1);  // 游標在 "1|30,000"
    component.onInput({ target: el } as unknown as Event);
    tick(0);                     // 觸發 onInput 內 setSelectionRange 的 setTimeout

    expect(el.selectionStart).toBe(1); // 修正前 = 2（bug），修正後 = 1
    expect(component.numericValue).toBe(130000);
    document.body.removeChild(el);
  }));

  it('在末尾連續打字游標保持在末尾', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 3000);
    fixture.detectChanges();
    component.onFocus();

    const el = document.createElement('input');
    document.body.appendChild(el);
    el.value = '30,000';         // "3,000" 末尾再打一個 0
    el.setSelectionRange(6, 6);
    component.onInput({ target: el } as unknown as Event);
    tick(0);

    expect(el.selectionStart).toBe(6);
    expect(component.numericValue).toBe(30000);
    document.body.removeChild(el);
  }));

  it('中間插入一個數字後游標停在插入點之後', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 1000);
    fixture.detectChanges();
    component.onFocus();

    const el = document.createElement('input');
    document.body.appendChild(el);
    el.value = '1,0500';         // "1,000" 在 "1,0|00" 插入 "5"
    el.setSelectionRange(4, 4);  // "1,05|00"
    component.onInput({ target: el } as unknown as Event);
    tick(0);

    // 格式化後 "10,500"，游標應在第 3 個數字之後 → "10,5|00"
    expect(el.selectionStart).toBe(4);
    expect(component.numericValue).toBe(10500);
    document.body.removeChild(el);
  }));
});

describe('NumberInputComponent — allowEmpty（必填欄位不可清空）', () => {
  let component: NumberInputComponent;
  let fixture: ComponentFixture<NumberInputComponent>;
  let emittedCommits: (number | null)[];
  let valueChanges: (number | null)[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NumberInputComponent);
    component = fixture.componentInstance;
    emittedCommits = [];
    valueChanges = [];
    component.valueCommit.subscribe((v) => emittedCommits.push(v));
    component.valueChange.subscribe((v) => valueChanges.push(v));
    fixture.detectChanges();
  });

  it('AC1: allowEmpty=false 時 focus+有值不渲染清除鈕', () => {
    fixture.componentRef.setInput('initialValue', 5000);
    fixture.componentRef.setInput('allowEmpty', false);
    component.onFocus();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.number-input-clear'))).toBeNull();
  });

  it('AC1 control: allowEmpty 預設 true 時 focus+有值會渲染清除鈕', () => {
    fixture.componentRef.setInput('initialValue', 5000);
    component.onFocus();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.css('.number-input-clear'))).not.toBeNull();
  });

  it('AC2: allowEmpty=false 鍵盤刪空後 blur 還原為原值、不 emit valueCommit(null)', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5000);
    fixture.componentRef.setInput('allowEmpty', false);
    fixture.detectChanges();
    component.onFocus();

    const el = document.createElement('input');
    el.value = '';
    component.onInput({ target: el } as unknown as Event); // 刪空 → numericValue=null
    tick(0);

    component.onBlur();

    expect(component.numericValue).toBe(5000);                 // 還原
    expect(component.displayValue).toBe('5,000');              // 顯示同步還原
    expect(emittedCommits.length).toBe(0);                     // 不送 null
    expect(valueChanges[valueChanges.length - 1]).toBe(5000);  // valueChange 最後為還原值
  }));

  it('AC4: allowEmpty 預設 true 刪空 blur 仍 emit valueCommit(null)（既有行為不變）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5000);
    fixture.detectChanges();
    component.onFocus();

    const el = document.createElement('input');
    el.value = '';
    component.onInput({ target: el } as unknown as Event);
    tick(0);

    component.onBlur();

    expect(component.numericValue).toBeNull();
    expect(emittedCommits).toEqual([null]);
  }));

  it('AC2 邊界: 從未定價(baseline=null) + allowEmpty=false，刪空 blur 維持空白（不誤還原）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', null);
    fixture.componentRef.setInput('allowEmpty', false);
    fixture.detectChanges();
    component.onFocus(); // baseline = null

    const el = document.createElement('input');
    el.value = '';
    component.onInput({ target: el } as unknown as Event);
    tick(0);
    component.onBlur();

    expect(component.numericValue).toBeNull();   // 維持空白
    expect(emittedCommits.length).toBe(0);       // 不送 commit
  }));

  it('AC5: allowEmpty=false 不影響上下鍵行為（鍵盤 ArrowUp 後 blur emit 一次）', fakeAsync(() => {
    fixture.componentRef.setInput('initialValue', 5);
    fixture.componentRef.setInput('allowEmpty', false);
    fixture.detectChanges();
    component.onFocus();

    component.onKeydown({ key: 'ArrowUp', shiftKey: false, preventDefault: () => {} } as unknown as KeyboardEvent);
    tick(600);
    expect(emittedCommits.length).toBe(0); // 鍵盤不走 debounce
    component.onBlur();
    expect(emittedCommits).toEqual([6]);   // blur 才 emit 一次
  }));
});

describe('NumberInputComponent — 按上下按鈕後 600ms 內點進輸入框', () => {
  // 按鈕改的值排在 600ms 後送出。這段期間點進輸入框，排好的這次不能被當成「沒改」取消：
  // 有焦點期間先不送（使用者可能要接著打字），離開時把最後的值送出。
  let component: NumberInputComponent;
  let fixture: ComponentFixture<NumberInputComponent>;
  let emittedCommits: (number | null)[];
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberInputComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(NumberInputComponent);
    component = fixture.componentInstance;
    emittedCommits = [];
    component.valueCommit.subscribe((val) => emittedCommits.push(val));
    fixture.componentRef.setInput('initialValue', 5);
    fixture.detectChanges();
    input = fixture.debugElement.query(By.css('.number-input-field')).nativeElement;
  });

  function clickUp(): void {
    fixture.debugElement.query(By.css('.stepper-btn--up')).nativeElement.click();
    fixture.detectChanges();
  }

  function focusInput(): void {
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  }

  function blurInput(): void {
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function type(value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    tick(0); // onInput 內還原游標的 setTimeout(0)
    fixture.detectChanges();
  }

  it('沒改值就離開：仍送出按鈕改的值，只送一次', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    blurInput();
    expect(emittedCommits).toEqual([6]);

    tick(600);
    expect(emittedCommits).toEqual([6]);
  }));

  it('有焦點期間不送；接著打字，離開時只送打的值', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    tick(600);
    expect(emittedCommits).toEqual([]);

    type('9');
    blurInput();
    expect(emittedCommits).toEqual([9]);
  }));

  it('改回按按鈕前的值再離開：不送（後端本來就是這個值）', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    type('5');
    blurInput();
    tick(600);
    expect(emittedCommits).toEqual([]);
  }));

  it('有焦點時元件被銷毀：仍送出按鈕改的值', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    fixture.destroy();
    expect(emittedCommits).toEqual([6]);
  }));

  it('600ms 到了已送出，之後點進去沒改值離開：不重送', fakeAsync(() => {
    clickUp();
    tick(600);
    expect(emittedCommits).toEqual([6]);

    focusInput();
    blurInput();
    expect(emittedCommits).toEqual([6]);
  }));
});

// 使用端常見寫法：(valueChange) 接回 [initialValue]。按 ↑↓ 後的回寫會觸發 ngOnChanges，
// 這時不能把起點換成按鈕改過的值、也不能清 isDirty，否則排好的 commit 會被當成「沒改」。
@Component({
  standalone: true,
  imports: [NumberInputComponent],
  template: `<app-number-input [initialValue]="v" (valueChange)="v = $event"
                               (valueCommit)="commits.push($event)"></app-number-input>`,
})
class EchoHostComponent {
  v: number | null = 5;
  commits: (number | null)[] = [];
}

describe('NumberInputComponent — 使用端把 valueChange 接回 initialValue 時，按上下按鈕後點進輸入框', () => {
  let fixture: ComponentFixture<EchoHostComponent>;
  let host: EchoHostComponent;
  let input: HTMLInputElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EchoHostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(EchoHostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    input = fixture.debugElement.query(By.css('.number-input-field')).nativeElement;
  });

  function clickUp(): void {
    fixture.debugElement.query(By.css('.stepper-btn--up')).nativeElement.click();
    fixture.detectChanges(); // 回寫的 initialValue 在這裡進 ngOnChanges
  }

  function focusInput(): void {
    input.dispatchEvent(new Event('focus'));
    fixture.detectChanges();
  }

  function blurInput(): void {
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function type(value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    tick(0); // onInput 內還原游標的 setTimeout(0)
    fixture.detectChanges();
  }

  it('沒點進去：600ms 後送出；之後點進去沒改值離開不重送', fakeAsync(() => {
    clickUp();
    expect(host.v).toBe(6);
    tick(600);
    expect(host.commits).toEqual([6]);

    focusInput();
    blurInput();
    expect(host.commits).toEqual([6]);
  }));

  it('100ms 點進去、沒改值就離開：送出按鈕改的值', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    blurInput();
    tick(600);
    expect(host.commits).toEqual([6]);
  }));

  it('100ms 點進去、停 700ms：有焦點期間不送，離開時送出', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    tick(700);
    expect(host.commits).toEqual([]);

    blurInput();
    expect(host.commits).toEqual([6]);
  }));

  it('100ms 點進去、打字後離開：只送打的值', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    type('9');
    blurInput();
    tick(600);
    expect(host.commits).toEqual([9]);
  }));

  it('100ms 點進去、改回按按鈕前的值再離開：不送', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    type('5');
    blurInput();
    tick(600);
    expect(host.commits).toEqual([]);
  }));

  it('100ms 點進去、元件被銷毀：仍送出按鈕改的值', fakeAsync(() => {
    clickUp();
    tick(100);
    focusInput();
    fixture.destroy();
    expect(host.commits).toEqual([6]);
  }));
});
