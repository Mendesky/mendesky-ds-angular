import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProcessModalComponent } from './process-modal.component';

/** DS-12：running 的轉圈改用 app-spinner 36px（裝飾用）；訊息放在 role="status" 裡，報讀軟體念得到 */
describe('ProcessModalComponent — running 轉圈（DS-12）', () => {
  let fixture: ComponentFixture<ProcessModalComponent>;

  const open = (message: string) => {
    fixture = TestBed.createComponent(ProcessModalComponent);
    fixture.componentRef.setInput('type', 'running');
    fixture.componentRef.setInput('message', message);
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();
  };

  afterEach(() => fixture.destroy());

  it('轉圈是 app-spinner、36px、裝飾用', () => {
    open('帳號驗證中');
    const spinner = fixture.nativeElement.querySelector('app-spinner') as HTMLElement;
    expect(spinner).not.toBeNull();
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.querySelector('svg')!.getAttribute('width')).toBe('36');
  });

  it('訊息在 role="status" 裡', () => {
    open('帳號驗證中');
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(status).not.toBeNull();
    expect(status.textContent?.trim()).toBe('帳號驗證中');
  });

  it('沒給訊息時念預設的「執行中請稍候」', () => {
    open('');
    const status = fixture.nativeElement.querySelector('[role="status"]') as HTMLElement;
    expect(status.textContent?.trim()).toBe('執行中請稍候');
  });
});
