import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { TextareaComponent } from './textarea.component';

describe('TextareaComponent', () => {
  let fixture: ComponentFixture<TextareaComponent>;
  let component: TextareaComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TextareaComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(TextareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('@Output() blur', () => {
    it('失去焦點時 emit 當前空字串（初始值）', () => {
      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('.textarea-field');
      el.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('');
    });

    it('使用者輸入後失去焦點時 emit 最新字串值', () => {
      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('.textarea-field');
      el.value = '前所費用：每月 3000 元';
      el.dispatchEvent(new Event('input'));
      el.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('前所費用：每月 3000 元');
    });

    it('initialValue 設定後失去焦點時 emit 初始字串', () => {
      component.initialValue = '前所收費說明';
      component.ngOnChanges({ initialValue: new SimpleChange(null, '前所收費說明', false) });
      fixture.detectChanges();

      const emitted: string[] = [];
      component.blur.subscribe(v => emitted.push(v));

      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('.textarea-field');
      el.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(emitted.length).toBe(1);
      expect(emitted[0]).toBe('前所收費說明');
    });

    it('blur 不影響 valueChange — blur 時不觸發 valueChange', () => {
      const valueChangeEmitted: string[] = [];
      component.valueChange.subscribe(v => valueChangeEmitted.push(v));

      const el: HTMLTextAreaElement = fixture.nativeElement.querySelector('.textarea-field');
      el.dispatchEvent(new Event('blur'));
      fixture.detectChanges();

      expect(valueChangeEmitted.length).toBe(0);
    });
  });
});
