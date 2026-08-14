import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { DrawerShellComponent } from './drawer-shell.component';

describe('DrawerShellComponent', () => {
  let fixture: ComponentFixture<DrawerShellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [DrawerShellComponent],
    });
    fixture = TestBed.createComponent(DrawerShellComponent);
  });

  function panel(): HTMLElement | null {
    return fixture.nativeElement.querySelector('.drawer-panel');
  }

  function setIsOpen(value: boolean): void {
    fixture.componentRef.setInput('isOpen', value);
    fixture.detectChanges();
  }

  it('首次綁定 isOpen=false → 不排任何關閉計時器', fakeAsync(() => {
    setIsOpen(false);

    expect(panel()).withContext('預設關閉：不該渲染 panel').toBeNull();
    expect(flush())
      .withContext(
        '首次綁定就是關閉狀態時沒有動畫可播，不該留下計時器——' +
          '否則消費端任何用到本元件的 fakeAsync 測試，只要提前結束就會被這顆計時器弄掛',
      )
      .toBe(0);
  }));

  it('首次綁定 isOpen=true → 直接顯示，無計時器', fakeAsync(() => {
    setIsOpen(true);

    expect(panel()).withContext('開啟狀態應渲染 panel').not.toBeNull();
    expect(flush()).withContext('開啟路徑從不排計時器').toBe(0);
  }));

  it('開啟後關閉（true → false）→ 播 300ms 關閉動畫後才卸載', fakeAsync(() => {
    setIsOpen(true);
    setIsOpen(false);

    expect(panel())
      .withContext('關閉動畫期間 panel 仍在 DOM，否則動畫直接消失')
      .not.toBeNull();
    expect(panel()!.classList.contains('drawer-panel--closing'))
      .withContext('動畫由 --closing 樣式驅動')
      .toBeTrue();

    tick(299);
    fixture.detectChanges();
    expect(panel()).withContext('300ms 未到不得提前卸載').not.toBeNull();

    tick(1);
    fixture.detectChanges();
    expect(panel()).withContext('動畫播完即卸載').toBeNull();
  }));

  it('首次綁定 false、之後 true → false → 關閉動畫照播（firstChange 只擋第一次）', fakeAsync(() => {
    setIsOpen(false);
    setIsOpen(true);
    setIsOpen(false);

    expect(panel())
      .withContext('已開啟過的正常關閉路徑不受首次綁定守衛影響')
      .not.toBeNull();
    expect(panel()!.classList.contains('drawer-panel--closing')).toBeTrue();

    tick(300);
    fixture.detectChanges();
    expect(panel()).toBeNull();
  }));

  it('關閉動畫中重新開啟 → 取消關閉計時器，panel 不會被舊計時器卸載', fakeAsync(() => {
    setIsOpen(true);
    setIsOpen(false);
    setIsOpen(true);

    expect(panel()!.classList.contains('drawer-panel--closing'))
      .withContext('重開後應立刻脫離 closing 狀態')
      .toBeFalse();

    expect(flush())
      .withContext('舊的關閉計時器必須被 clearTimeout，否則 300ms 後會把重開的抽屜關掉')
      .toBe(0);
    fixture.detectChanges();
    expect(panel()).withContext('重開的抽屜應維持顯示').not.toBeNull();
  }));
});
