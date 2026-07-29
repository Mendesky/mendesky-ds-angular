import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AutoHeightDirective } from './auto-height.directive';

@Component({
  standalone: true,
  imports: [AutoHeightDirective],
  template: `<div class="box" [appAutoHeight]="enabled()" [autoHeightDelay]="0"><div [style.height.px]="inner()"></div></div>`,
})
class HostComponent {
  enabled = signal(true);
  inner = signal(50);
}

// class selector 匹配（不帶 [appAutoHeight]，靠 .cem-section-card 自動套用）
@Component({
  standalone: true,
  imports: [AutoHeightDirective],
  template: `<div class="cem-section-card" [autoHeightDelay]="0"></div>`,
})
class ClassSelectorHostComponent {}

describe('AutoHeightDirective — 偵測容器高度變化的過渡（ResizeObserver + WAAPI）', () => {
  let fixture: ComponentFixture<HostComponent>;
  let box: HTMLElement;
  let animateSpy: jasmine.Spy;
  let lastAnim: { onfinish: (() => void) | null; oncancel: (() => void) | null; cancel: jasmine.Spy };
  let observed: HTMLElement | null;
  let disconnectSpy: jasmine.Spy;
  let triggerResize: (() => void) | null;

  beforeEach(() => {
    observed = null;
    triggerResize = null;
    disconnectSpy = jasmine.createSpy('disconnect');
    // stub ResizeObserver → 手動觸發 callback
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(private cb: () => void) {}
      observe(el: HTMLElement) { observed = el; triggerResize = () => this.cb(); }
      disconnect() { disconnectSpy(); }
      unobserve() {}
    };
    lastAnim = { onfinish: null, oncancel: null, cancel: jasmine.createSpy('cancel') };
    animateSpy = spyOn(HTMLElement.prototype, 'animate').and.callFake(() => lastAnim as unknown as Animation);

    TestBed.configureTestingModule({ imports: [HostComponent] });
    fixture = TestBed.createComponent(HostComponent);
  });

  it('啟用（延遲後）→ observe 掛載元素', fakeAsync(() => {
    fixture.detectChanges(); // ngAfterViewInit 排延遲啟用
    box = fixture.nativeElement.querySelector('.box');
    tick(0);
    expect(observed).toBe(box);
  }));

  it('高度變化 → WAAPI FLIP animate（不碰 style.transition），動畫期間 disconnect observer', fakeAsync(() => {
    fixture.detectChanges();
    box = fixture.nativeElement.querySelector('.box');
    tick(0);
    spyOnProperty(box, 'offsetHeight').and.returnValue(120); // 模擬高度已變
    triggerResize!();
    expect(animateSpy).toHaveBeenCalled();
    expect(disconnectSpy).toHaveBeenCalled();     // 動畫期間停止觀察（避免 WAAPI 改 layout 迴圈）
    expect(box.style.transition).toBe('');         // 不碰 transition
  }));

  it('enabled=false → 不啟用（不 observe）', fakeAsync(() => {
    fixture.componentInstance.enabled.set(false);
    fixture.detectChanges();
    tick(0);
    expect(observed).toBeNull();
  }));

  it('prefers-reduced-motion → 不啟用', fakeAsync(() => {
    spyOn(window, 'matchMedia').and.returnValue({ matches: true } as MediaQueryList);
    fixture.detectChanges();
    tick(0);
    expect(observed).toBeNull();
  }));

  it('離散跳變 → 動畫期間設 overflow:hidden，onfinish 後清除（容器平時可能 overflow:visible）', fakeAsync(() => {
    fixture.detectChanges();
    box = fixture.nativeElement.querySelector('.box');
    tick(0);
    spyOnProperty(box, 'offsetHeight').and.returnValue(120);
    triggerResize!();
    expect(box.style.overflow).toBe('hidden');
    lastAnim.onfinish!();                 // 模擬動畫結束
    expect(box.style.overflow).toBe('');  // 清 inline，回 stylesheet
  }));

  it('連續/高頻變化（拖拉、auto-grow）→ 緊接的第二次變化 snap 不再 animate', fakeAsync(() => {
    fixture.detectChanges();
    box = fixture.nativeElement.querySelector('.box');
    tick(0);
    const h = spyOnProperty(box, 'offsetHeight');
    h.and.returnValue(120);
    triggerResize!();                             // 第一次：離散 → animate
    expect(animateSpy).toHaveBeenCalledTimes(1);
    h.and.returnValue(200);
    triggerResize!();                             // 緊接第二次（<400ms）→ snap
    expect(animateSpy).toHaveBeenCalledTimes(1);  // 沒有第二次補間
  }));
});

describe('AutoHeightDirective — class selector（.cem-section-card 自動套用）', () => {
  let classObserved: HTMLElement | null;

  beforeEach(() => {
    classObserved = null;
    (window as unknown as { ResizeObserver: unknown }).ResizeObserver = class {
      constructor(private cb: () => void) {}
      observe(el: HTMLElement) { classObserved = el; }
      disconnect() {}
      unobserve() {}
    };
    spyOn(HTMLElement.prototype, 'animate').and.callFake(() => ({ onfinish: null, oncancel: null, cancel: () => {} } as unknown as Animation));
  });

  it('元素僅帶 .cem-section-card（無 [appAutoHeight]）→ 延遲後仍 observe', fakeAsync(() => {
    const fx = TestBed.configureTestingModule({ imports: [ClassSelectorHostComponent] })
      .createComponent(ClassSelectorHostComponent);
    fx.detectChanges();
    const el = fx.nativeElement.querySelector('.cem-section-card');
    tick(0);
    expect(classObserved).toBe(el);
  }));
});
