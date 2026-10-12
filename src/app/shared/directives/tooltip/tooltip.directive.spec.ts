import { Component } from '@angular/core';
import { TestBed, ComponentFixture, fakeAsync, tick } from '@angular/core/testing';
import { TooltipDirective } from './tooltip.directive';

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `
    <span class="host"
          style="display:inline-block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap"
          [style.width.px]="width"
          [appTooltip]="text"
          [appTooltipOnlyWhenTruncated]="onlyWhenTruncated">{{ text }}</span>
  `,
})
class HostComponent {
  text = '一段會被截斷的很長很長很長很長很長很長的文字';
  width = 60;
  onlyWhenTruncated = true;
}

describe('TooltipDirective — appTooltipOnlyWhenTruncated', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
    document.querySelectorAll('app-tooltip-portal').forEach((n) => n.remove());
  });

  function host(): HTMLElement {
    return fixture.nativeElement.querySelector('.host') as HTMLElement;
  }

  function portalShown(): boolean {
    return document.querySelector('app-tooltip-portal') !== null;
  }

  it('被截斷時 hover 顯示 tooltip', fakeAsync(() => {
    fixture.detectChanges();
    host().dispatchEvent(new Event('mouseenter'));
    tick(300);

    expect(portalShown()).toBeTrue();
    host().dispatchEvent(new Event('mouseleave'));
  }));

  it('沒被截斷時 hover 不顯示 tooltip（螢幕上已看得到全文，再講一次是噪音）', fakeAsync(() => {
    fixture.componentInstance.width = 2000;
    fixture.detectChanges();
    host().dispatchEvent(new Event('mouseenter'));
    tick(300);

    expect(portalShown()).toBeFalse();
  }));

  it('預設（未開啟此選項）不論是否截斷都顯示，既有用法行為不變', fakeAsync(() => {
    fixture.componentInstance.width = 2000;
    fixture.componentInstance.onlyWhenTruncated = false;
    fixture.detectChanges();
    host().dispatchEvent(new Event('mouseenter'));
    tick(300);

    expect(portalShown()).toBeTrue();
    host().dispatchEvent(new Event('mouseleave'));
  }));
});
