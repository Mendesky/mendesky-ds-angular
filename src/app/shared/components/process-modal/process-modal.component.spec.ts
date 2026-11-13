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

/**
 * 第一輪審查：轉圈顏色固定是 --text/body #686868（跟訊息文字一樣），不跟著頁面的文字色走；
 * 報讀用的 role="status" 一直存在（視窗打開前就在），打開時才填訊息——區域跟視窗一起出現時，有些報讀軟體不會念。
 */
describe('ProcessModalComponent — 轉圈顏色與一直存在的 status', () => {
  let fixture: ComponentFixture<ProcessModalComponent>;
  const status = () => fixture.nativeElement.querySelector('[role="status"]') as HTMLElement | null;
  const setOpen = (isOpen: boolean) => { fixture.componentRef.setInput('isOpen', isOpen); fixture.detectChanges(); };

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessModalComponent);
    document.body.appendChild(fixture.nativeElement);
    // 頁面文字色故意跟 #686868 不同，才驗得出轉圈有沒有自己設顏色
    (fixture.nativeElement as HTMLElement).style.color = 'rgb(28, 28, 46)';
    fixture.componentRef.setInput('type', 'running');
    fixture.componentRef.setInput('message', '帳號驗證中');
    fixture.detectChanges();
  });

  afterEach(() => { fixture.nativeElement.remove(); fixture.destroy(); });

  it('轉圈是 #686868，不跟著頁面的文字色', () => {
    setOpen(true);
    const spinner = fixture.nativeElement.querySelector('app-spinner') as HTMLElement;
    expect(getComputedStyle(spinner).color).toBe('rgb(104, 104, 104)');
  });

  it('還沒打開：已經有一個空的 role="status"', () => {
    expect(status()).not.toBeNull();
    expect(status()!.textContent?.trim()).toBe('');
  });

  it('打開後：同一個 status 填入訊息；status 不在遮罩裡', () => {
    const before = status();
    setOpen(true);
    expect(status()).toBe(before);
    expect(status()!.textContent?.trim()).toBe('帳號驗證中');
    const overlay = fixture.nativeElement.querySelector('.process-modal-overlay') as HTMLElement;
    expect(overlay.contains(status())).toBeFalse();
  });

  it('畫面上的訊息不重複念（報讀只念 status 那一份）', () => {
    setOpen(true);
    const visible = fixture.nativeElement.querySelector('.process-modal__text') as HTMLElement;
    expect(visible.textContent?.trim()).toBe('帳號驗證中');
    expect(visible.getAttribute('aria-hidden')).toBe('true');
  });

  it('關掉後：status 清空', () => {
    setOpen(true);
    setOpen(false);
    expect(status()!.textContent?.trim()).toBe('');
  });

  it('congratulation：status 不填（只有處理中才念）', () => {
    fixture.componentRef.setInput('type', 'congratulation');
    setOpen(true);
    expect(status()!.textContent?.trim()).toBe('');
  });
});
