import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;
  let component: InputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('@Output() blur', () => {
    it('失去焦點時 emit 當前空字串（初始值）', () => {
      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('');
    });

    it('使用者輸入後失去焦點時 emit 最新字串值', () => {
      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.value = '天母西路 1 號';
      inputEl.dispatchEvent(new Event('input'));
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('天母西路 1 號');
    });

    it('initialValue 設定後失去焦點時 emit 初始字串', () => {
      component.initialValue = '忠孝東路四段';
      component.ngOnChanges({ initialValue: new SimpleChange(null, '忠孝東路四段', false) });
      fixture.detectChanges();

      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('忠孝東路四段');
    });

    it('blur 不影響 valueChange — blur 時不觸發 valueChange', () => {
      const valueChangeEmitted: string[] = [];
      component.valueChange.subscribe(v => valueChangeEmitted.push(v));

      const inputEl: HTMLInputElement = fixture.nativeElement.querySelector('.input-field');
      inputEl.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(valueChangeEmitted.length).toBe(0);
    });
  });
});
