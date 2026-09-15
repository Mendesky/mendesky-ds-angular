import { TestBed, ComponentFixture } from '@angular/core/testing';
import { CarouselDotComponent } from './carousel-dot.component';

/**
 * DS 契約測試（DS 側拷貝）。與 mendesky-web 的同名 spec 是同一份契約的兩份拷貝，
 * 行為閘門在 consumer 的 karma；這一份隨程式碼同步保存（見 README「Spec 政策」）。
 *
 * 兩個變體會並排在同一列表示「目前這一則 vs 其餘」，所以高度必須一致——
 * 2026-09-10 實測：Line 原本是 18×2 的髮絲線，混在 8px 圓點裡看起來像浮在中線上。
 */
describe('CarouselDotComponent', () => {
  let fixture: ComponentFixture<CarouselDotComponent>;
  let component: CarouselDotComponent;

  const shape = () => fixture.nativeElement.querySelector('.carousel-dot__shape') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CarouselDotComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(CarouselDotComponent);
    component = fixture.componentInstance;
  });

  describe('幾何', () => {
    it('Dot 是 8×8 圓點', () => {
      component.variant = 'Dot';
      fixture.detectChanges();
      const r = shape().getBoundingClientRect();
      expect(r.width).toBeCloseTo(8, 0);
      expect(r.height).toBeCloseTo(8, 0);
    });

    it('Line 的高度與 Dot 一致（8px），只有寬度不同', () => {
      component.variant = 'Line';
      fixture.detectChanges();
      const r = shape().getBoundingClientRect();
      expect(r.height).toBeCloseTo(8, 0);
      expect(r.width).toBeGreaterThan(8);
    });

    it('兩個變體的外框（hit area）等高，並排時不會上下錯位', () => {
      component.variant = 'Dot';
      fixture.detectChanges();
      const dotHost = (
        fixture.nativeElement.querySelector('.carousel-dot') as HTMLElement
      ).getBoundingClientRect().height;

      fixture.componentRef.setInput('variant', 'Line');
      fixture.detectChanges();
      const lineHost = (
        fixture.nativeElement.querySelector('.carousel-dot') as HTMLElement
      ).getBoundingClientRect().height;

      expect(lineHost).toBeCloseTo(dotHost, 0);
    });
  });

  describe('選中態', () => {
    // 顏色不在這裡驗：背景色有 0.15s 過渡，detectChanges 當下量到的還是起始值。
    // 這組只鎖「形狀不變」與「狀態有掛上去」，顏色屬於 DS 自己的視覺規格。
    it('active 不改變形狀', () => {
      component.variant = 'Dot';
      fixture.detectChanges();
      const before = shape().getBoundingClientRect();

      // OnPush：直接改 plain 屬性 fixture.detectChanges() 偵測不到，須用 setInput 走 Angular
      // 的 input 綁定機制。
      fixture.componentRef.setInput('active', true);
      fixture.detectChanges();
      const after = shape().getBoundingClientRect();

      expect(after.width).toBeCloseTo(before.width, 0);
      expect(after.height).toBeCloseTo(before.height, 0);
    });

    it('active 掛上 carousel-dot--active，未選中則沒有', () => {
      component.variant = 'Line';
      fixture.detectChanges();
      const host = () => fixture.nativeElement.querySelector('.carousel-dot') as HTMLElement;
      expect(host().classList).not.toContain('carousel-dot--active');

      fixture.componentRef.setInput('active', true);
      fixture.detectChanges();
      expect(host().classList).toContain('carousel-dot--active');
    });
  });

  describe('點擊', () => {
    it('點擊 emit dotClick', () => {
      const spy = jasmine.createSpy('dotClick');
      component.dotClick.subscribe(spy);
      fixture.detectChanges();
      (fixture.nativeElement.querySelector('.carousel-dot') as HTMLElement).click();
      expect(spy).toHaveBeenCalled();
    });
  });
});
