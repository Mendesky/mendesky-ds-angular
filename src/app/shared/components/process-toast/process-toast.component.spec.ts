import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessToastComponent, ToastSize } from './process-toast.component';

/** DS-12：loading 的轉圈改用 app-spinner，大小跟成功、失敗圖示一樣（S 24、M 36），裝飾用（訊息已經念了） */
describe('ProcessToastComponent — loading 轉圈（DS-12）', () => {
  let fixture: ComponentFixture<ProcessToastComponent>;

  const render = (size: ToastSize) => {
    fixture = TestBed.createComponent(ProcessToastComponent);
    fixture.componentRef.setInput('type', 'loading');
    fixture.componentRef.setInput('message', '處理中…');
    fixture.componentRef.setInput('size', size);
    fixture.componentRef.setInput('stackMode', true);
    fixture.componentRef.setInput('duration', 999999);
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  for (const [size, px] of [['S', '24'], ['M', '36']] as Array<[ToastSize, string]>) {
    it(`size=${size}：轉圈是 app-spinner、${px}px、裝飾用`, () => {
      render(size);
      const spinner = fixture.nativeElement.querySelector('[data-testid="process-toast-spinner"]') as HTMLElement;
      expect(spinner).not.toBeNull();
      expect(spinner.tagName).toBe('APP-SPINNER');
      expect(spinner.getAttribute('aria-hidden')).toBe('true');
      expect(spinner.querySelector('svg')!.getAttribute('width')).toBe(px);
    });
  }
});
