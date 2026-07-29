import { Component } from '@angular/core';
import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CopyDirective } from './copy.directive';
import { ToastService } from '../services/toast.service';

/**
 * CopyDirective 核心行為測試。
 *
 * 剪貼簿工具（clipboard.util.ts）以具名 export 直接匯入（非 DI token），在此專案的
 * ES2022 module 編譯設定下該 export 是唯讀的，無法 `spyOn(clipboardUtil, 'copyText')`
 * （會拋 "is not declared writable or has no setter"）。因此改為在瀏覽器 API 邊界
 * 控制 `navigator.clipboard`／`document.execCommand`（沿用 clipboard.util.spec.ts
 * 既有作法），讓 CopyDirective → copyText() 走真實邏輯，只掛新增的 UI 行為
 * （呼叫剪貼簿、顯示 toast、disabled 狀態）。
 */
@Component({
  standalone: true,
  imports: [CopyDirective],
  template: `
    <span appCopy data-testid="value">12345678</span>
    <span appCopy data-testid="empty"></span>
    <span appCopy data-testid="placeholder">-</span>
  `,
})
class HostComponent {}

describe('CopyDirective', () => {
  let toast: jasmine.SpyObj<ToastService>;
  let fixture: ComponentFixture<HostComponent>;

  function render(): HTMLElement {
    toast = jasmine.createSpyObj('ToastService', ['show']);
    TestBed.configureTestingModule({
      imports: [HostComponent],
      providers: [{ provide: ToastService, useValue: toast }],
    });
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges(); // 觸發 ngAfterViewInit（CopyDirective 在此加 .app-copy）
    return fixture.nativeElement as HTMLElement;
  }

  it('有值元素掛載後套用 .app-copy，不加 disabled', () => {
    const host = render();
    const el = host.querySelector('[data-testid="value"]')!;
    expect(el.classList.contains('app-copy')).toBeTrue();
    expect(el.classList.contains('app-copy--disabled')).toBeFalse();
  });

  it('點擊有值元素 → 呼叫剪貼簿 API 寫入 textContent，成功時顯示成功 toast', async () => {
    const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    spyOnProperty(navigator, 'clipboard', 'get')
      .and.returnValue({ writeText: writeTextSpy } as unknown as Clipboard);
    const host = render();
    const el = host.querySelector('[data-testid="value"]') as HTMLElement;

    el.click();
    await fixture.whenStable();

    expect(writeTextSpy).toHaveBeenCalledWith('12345678');
    expect(toast.show).toHaveBeenCalledWith({ type: 'success', message: '已複製' });
  });

  it('剪貼簿寫入失敗 → 顯示失敗 toast', async () => {
    spyOnProperty(navigator, 'clipboard', 'get').and.returnValue(undefined as unknown as Clipboard);
    spyOn(document, 'execCommand').and.returnValue(false);
    const host = render();
    const el = host.querySelector('[data-testid="value"]') as HTMLElement;

    el.click();
    await fixture.whenStable();

    expect(toast.show).toHaveBeenCalledWith({ type: 'error', message: '複製失敗' });
  });

  it('空值元素 → 加 .app-copy--disabled，點擊不呼叫剪貼簿 API、不顯示 toast', async () => {
    const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    spyOnProperty(navigator, 'clipboard', 'get')
      .and.returnValue({ writeText: writeTextSpy } as unknown as Clipboard);
    const host = render();
    const el = host.querySelector('[data-testid="empty"]') as HTMLElement;

    expect(el.classList.contains('app-copy--disabled')).toBeTrue();

    el.click();
    await fixture.whenStable();

    expect(writeTextSpy).not.toHaveBeenCalled();
    expect(toast.show).not.toHaveBeenCalled();
  });

  it('佔位符「-」→ 視為空值，加 .app-copy--disabled', () => {
    const host = render();
    const el = host.querySelector('[data-testid="placeholder"]') as HTMLElement;
    expect(el.classList.contains('app-copy--disabled')).toBeTrue();
  });
});
