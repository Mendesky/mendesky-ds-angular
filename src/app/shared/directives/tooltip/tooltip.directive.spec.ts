import { Component } from '@angular/core';
import { ApplicationRef } from '@angular/core';
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

// ── 2026-10-13：appTooltipWrap（長文字換行）──────────────────────────────────

@Component({
  standalone: true,
  imports: [TooltipDirective],
  template: `<span class="host" [appTooltip]="text" [appTooltipWrap]="wrap">檔名</span>`,
})
class WrapHostComponent {
  /** 沒有空白的長檔名（約 90 字），最容易把 tooltip 撐寬 */
  text = 'Bank_Statement_2024Q1_TWD_USD_FixedDeposit_Reconciliation_final_v3_with_bank_seal_scan.pdf';
  wrap = true;
}

describe('TooltipDirective — appTooltipWrap', () => {
  let fixture: ComponentFixture<WrapHostComponent>;
  let restoreViewport: () => void;

  beforeEach(async () => {
    // tooltip 在寬度小於 1024px 一律隱藏（display:none，量到的寬度是 0），要在寬螢幕量才有意義
    const frame = window.frameElement as HTMLElement | null;
    if (!frame) throw new Error('需在 Karma 的 iframe 內執行，才能控制視窗寬度');
    const prev = frame.style.width;
    frame.style.width = '1280px';
    frame.getBoundingClientRect();
    restoreViewport = () => { frame.style.width = prev; };

    await TestBed.configureTestingModule({ imports: [WrapHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(WrapHostComponent);
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
    document.querySelectorAll('app-tooltip-portal').forEach((n) => n.remove());
    restoreViewport();
  });

  function openAndMeasure(): DOMRect {
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.host') as HTMLElement).dispatchEvent(new Event('mouseenter'));
    tick(300);
    TestBed.inject(ApplicationRef).tick();
    const textEl = document.querySelector('app-tooltip-portal .tooltip__text') as HTMLElement;
    expect(textEl).withContext('tooltip 沒有出現').not.toBeNull();
    return textEl.getBoundingClientRect();
  }

  it('開啟時文字最寬 520px，沒有空白的長檔名也會換行', fakeAsync(() => {
    const rect = openAndMeasure();
    expect(rect.width).withContext('寬度是 0＝tooltip 被隱藏，測試沒有量到東西').toBeGreaterThan(0);
    expect(rect.width).toBeLessThanOrEqual(520.5);
    expect(document.querySelector('.tooltip__text--wrap')).not.toBeNull();
  }));

  it('預設不開啟：不加換行樣式，既有用法的寬度不變', fakeAsync(() => {
    fixture.componentInstance.wrap = false;
    const rect = openAndMeasure();
    expect(document.querySelector('.tooltip__text--wrap')).toBeNull();
    expect(rect.width).toBeGreaterThan(520);
  }));
});
