import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PoProcessComponent } from './po-process.component';

/** DS-12：Running 的轉圈改用 app-spinner 36px（裝飾用，旁邊有「執行中請稍候」） */
describe('PoProcessComponent — Running 轉圈（DS-12）', () => {
  let fixture: ComponentFixture<PoProcessComponent>;

  afterEach(() => fixture.destroy());

  it('轉圈是 app-spinner、36px、裝飾用', () => {
    fixture = TestBed.createComponent(PoProcessComponent);
    fixture.componentRef.setInput('status', 'Running');
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('app-spinner') as HTMLElement;
    expect(spinner).not.toBeNull();
    expect(spinner.getAttribute('aria-hidden')).toBe('true');
    expect(spinner.querySelector('svg')!.getAttribute('width')).toBe('36');
  });

  /** 第一輪審查：轉圈顏色固定是 --text/body #686868（跟「執行中請稍候」一樣），不跟著頁面的文字色走 */
  it('轉圈是 #686868，不跟著頁面的文字色', () => {
    fixture = TestBed.createComponent(PoProcessComponent);
    document.body.appendChild(fixture.nativeElement);
    (fixture.nativeElement as HTMLElement).style.color = 'rgb(28, 28, 46)';
    fixture.componentRef.setInput('status', 'Running');
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector('app-spinner') as HTMLElement;
    expect(getComputedStyle(spinner).color).toBe('rgb(104, 104, 104)');
    fixture.nativeElement.remove();
  });
});
