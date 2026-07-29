import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [ToastService] });
    service = TestBed.inject(ToastService);
  });

  it('show() adds toast with id and hiding=false', () => {
    service.show({ type: 'success', message: 'Hello' });
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].message).toBe('Hello');
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].id).toBeDefined();
    expect(toasts[0].hiding).toBeFalse();
  });

  it('dismiss(id) marks hiding=true (exit animation; removal via removeById)', () => {
    service.show({ type: 'success', message: 'Test' });
    const id = service.toasts()[0].id;
    service.dismiss(id);
    expect(service.toasts()[0].hiding).toBeTrue();
    expect(service.toasts().length).toBe(1); // still in list until removeById
  });

  it('removeById removes item from queue', () => {
    service.show({ type: 'success', message: 'Test' });
    const id = service.toasts()[0].id;
    service.removeById(id);
    expect(service.toasts().length).toBe(0);
  });

  it('auto-dismiss marks hiding=true after 3000ms when no action', fakeAsync(() => {
    service.show({ type: 'success', message: 'Auto' });
    tick(2999);
    expect(service.toasts()[0].hiding).toBeFalse();
    tick(1);
    expect(service.toasts()[0].hiding).toBeTrue();
    expect(service.toasts().length).toBe(1); // still in list; component drives removal
  }));

  it('auto-dismiss marks hiding=true after 5000ms when action is provided', fakeAsync(() => {
    service.show({ type: 'success', message: 'Action', action: { label: '復原', onClick: () => {} } });
    tick(4999);
    expect(service.toasts()[0].hiding).toBeFalse();
    tick(1);
    expect(service.toasts()[0].hiding).toBeTrue();
  }));

  it('maintains FIFO order for consecutive shows', () => {
    service.show({ type: 'success', message: 'First' });
    service.show({ type: 'error', message: 'Second' });
    service.show({ type: 'success', message: 'Third' });
    const toasts = service.toasts();
    expect(toasts.length).toBe(3);
    expect(toasts[0].message).toBe('First');
    expect(toasts[1].message).toBe('Second');
    expect(toasts[2].message).toBe('Third');
  });

  // ── persist（loading toast 不自動消失）─────────────────
  it('show({ persist: true }) 不自動消失（超過預設 duration 仍未 hiding）', fakeAsync(() => {
    service.show({ type: 'loading', message: '訪談表生成中', persist: true });
    tick(10000);
    expect(service.toasts().length).toBe(1);
    expect(service.toasts()[0].hiding).toBeFalse();
  }));

  // ── update（同一顆 toast 原地轉場）─────────────────────
  it('update() 原地改 type/message、toast 數維持 1（同一顆轉場、同 id）', () => {
    const id = service.show({ type: 'loading', message: '訪談表生成中', persist: true });
    service.update(id, { type: 'success', message: '已開始下載', duration: 3000 });
    const toasts = service.toasts();
    expect(toasts.length).toBe(1);
    expect(toasts[0].id).toBe(id);
    expect(toasts[0].type).toBe('success');
    expect(toasts[0].message).toBe('已開始下載');
  });

  it('update() 帶新 duration → persist toast 轉為有限時、依新 duration 自動消失', fakeAsync(() => {
    const id = service.show({ type: 'loading', message: '訪談表生成中', persist: true });
    tick(10000);
    expect(service.toasts()[0].hiding).toBeFalse();      // persist：仍在
    service.update(id, { type: 'success', message: '已開始下載', duration: 3000 });
    tick(2999);
    expect(service.toasts()[0].hiding).toBeFalse();
    tick(1);
    expect(service.toasts()[0].hiding).toBeTrue();        // update 後 3s 自動消
  }));

  it('update() 轉 error（無 duration → 用預設 3000）', fakeAsync(() => {
    const id = service.show({ type: 'loading', message: '訪談表生成中', persist: true });
    service.update(id, { type: 'error', message: '訪談表生成失敗' });
    expect(service.toasts()[0].type).toBe('error');
    expect(service.toasts()[0].message).toBe('訪談表生成失敗');
    tick(3000);
    expect(service.toasts()[0].hiding).toBeTrue();
  }));

  it('update() 不存在的 id → no-op（不丟錯、不新增）', () => {
    service.update('nope', { type: 'success', message: 'x' });
    expect(service.toasts().length).toBe(0);
  });
});
