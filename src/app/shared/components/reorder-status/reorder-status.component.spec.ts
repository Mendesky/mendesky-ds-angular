import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { ReorderStatusComponent } from './reorder-status.component';

/**
 * app-reorder-status 契約（DS-16）：
 * - 一直在頁面上、role="status"、平常是空的、視覺隱藏但不是 display:none。
 * - announce 之後馬上有字；同一句再念一次，文字會變（句尾交替加不換行空白）。
 * - 焦點移到父元素外面、或滑鼠移出父元素時清空；焦點在父元素裡面移動不清。
 * - 不開計時器：fakeAsync 結束時不能有沒跑完的計時器。
 */
@Component({
  standalone: true,
  imports: [ReorderStatusComponent],
  template: `
    <div class="scope" data-testid="scope">
      <button type="button" data-testid="inside">清單裡的按鈕</button>
      <app-reorder-status></app-reorder-status>
    </div>
    <button type="button" data-testid="outside">外面的按鈕</button>
  `,
})
class HostComponent {
  @ViewChild(ReorderStatusComponent) status!: ReorderStatusComponent;
}

describe('ReorderStatusComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  const el = () => fixture.nativeElement.querySelector('app-reorder-status') as HTMLElement;
  const q = (id: string) => fixture.nativeElement.querySelector(`[data-testid="${id}"]`) as HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    fixture.nativeElement.remove();
  });

  it('一開始就在頁面上、role="status"、是空的、看不見但不是 display:none', () => {
    expect(el()).not.toBeNull();
    expect(el().getAttribute('role')).toBe('status');
    expect(el().textContent).toBe('');
    const s = getComputedStyle(el());
    expect(s.display).not.toBe('none');
    expect(s.position).toBe('absolute');
    expect(el().getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });

  it('announce 之後馬上有字；不開計時器', fakeAsync(() => {
    fixture.componentInstance.status.announce('「項目一」已從第 1 個移到第 2 個，共 3 個');
    expect(el().textContent).toBe('「項目一」已從第 1 個移到第 2 個，共 3 個');
  }));

  it('同一句連續念兩次，文字會變；第三次變回原句', () => {
    const s = fixture.componentInstance.status;
    s.announce('甲');
    const first = el().textContent;
    s.announce('甲');
    const second = el().textContent;
    s.announce('甲');
    expect(second).not.toBe(first);
    expect(second!.trim()).toBe('甲');
    expect(el().textContent).toBe(first);
  });

  it('焦點在父元素裡移動不清；移到外面就清空', () => {
    fixture.componentInstance.status.announce('甲');
    q('inside').focus();
    expect(el().textContent).toBe('甲');
    q('outside').focus();
    expect(el().textContent).toBe('');
  });

  it('滑鼠移出父元素時清空', () => {
    fixture.componentInstance.status.announce('甲');
    q('scope').dispatchEvent(new PointerEvent('pointerleave'));
    expect(el().textContent).toBe('');
  });

  it('clear 清空', () => {
    fixture.componentInstance.status.announce('甲');
    fixture.componentInstance.status.clear();
    expect(el().textContent).toBe('');
  });
});
