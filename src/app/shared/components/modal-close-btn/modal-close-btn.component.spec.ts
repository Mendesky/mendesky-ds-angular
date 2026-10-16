import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalCloseBtnComponent } from './modal-close-btn.component';

describe('ModalCloseBtnComponent', () => {
  let fixture: ComponentFixture<ModalCloseBtnComponent>;
  let component: ModalCloseBtnComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalCloseBtnComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalCloseBtnComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  it('點擊 → closeClick emit 一次', () => {
    let n = 0;
    component.closeClick.subscribe(() => n++);
    (fixture.nativeElement.querySelector('button.modal-close-btn') as HTMLButtonElement).click();
    expect(n).toBe(1);
  });

  it('使用統一 No-X-Cancel icon（非帶框 Close）', () => {
    const icon = fixture.nativeElement.querySelector('app-icon');
    expect(icon?.getAttribute('name')).toBe('No-X-Cancel');
  });

  it('預設 ariaLabel 為「關閉」', () => {
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBe('關閉');
  });

  it('ariaLabel 可覆寫', () => {
    // OnPush：直接改 plain 屬性 fixture.detectChanges() 偵測不到，須用 setInput 走 Angular
    // 的 input 綁定機制。
    fixture.componentRef.setInput('ariaLabel', '關閉費用設定');
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button');
    expect(btn?.getAttribute('aria-label')).toBe('關閉費用設定');
  });

  it('disabled 時 button 停用（saving 中不可關）', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBeTrue();
  });
});
