import { TestBed, ComponentFixture } from '@angular/core/testing';
import { SpinnerComponent, SpinnerSize } from './spinner.component';

/**
 * app-spinner：淡軌道＋四分之一圈的弧，顏色跟著文字色。
 * 預設是狀態區（role="status"）並帶看不見的「載入中」；decorative 時整個藏起來不給報讀軟體。
 */
describe('SpinnerComponent', () => {
  let fixture: ComponentFixture<SpinnerComponent>;

  const host = () => fixture.nativeElement as HTMLElement;
  const svg = () => host().querySelector('svg') as SVGSVGElement;
  const track = () => host().querySelector('.ds-spinner__track') as SVGCircleElement;
  const arc = () => host().querySelector('.ds-spinner__arc') as SVGCircleElement;
  const label = () => host().querySelector('.ds-spinner__label') as HTMLElement | null;

  const render = (inputs: Partial<Pick<SpinnerComponent, 'size' | 'label' | 'decorative'>>) => {
    for (const [key, val] of Object.entries(inputs)) fixture.componentRef.setInput(key, val);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SpinnerComponent] }).compileComponents();
    fixture = TestBed.createComponent(SpinnerComponent);
    document.body.appendChild(host());
  });

  afterEach(() => host().remove());

  describe('造型', () => {
    const cases: Array<[SpinnerSize, number, number]> = [['12', 12, 1.5], ['16', 16, 2], ['24', 24, 2.5], ['36', 36, 3]];
    for (const [size, px, stroke] of cases) {
      it(`size=${size}：寬高 ${px}px，線寬 ${stroke}`, () => {
        render({ size });
        const box = svg().getBoundingClientRect();
        expect(box.width).toBe(px);
        expect(box.height).toBe(px);
        expect(Number(track().getAttribute('stroke-width'))).toBe(stroke);
        expect(Number(arc().getAttribute('stroke-width'))).toBe(stroke);
        // 圓要整個落在框內：半徑＋半個線寬＝框的一半
        expect(Number(track().getAttribute('r')) + stroke / 2).toBeCloseTo(px / 2, 5);
      });
    }

    it('預設 size 是 16', () => {
      render({});
      expect(svg().getBoundingClientRect().width).toBe(16);
    });

    it('軌道是一整圈、文字色的 20%；弧是四分之一圈、文字色、圓線頭', () => {
      host().style.color = 'rgb(10, 20, 30)';
      render({ size: '24' });
      expect(getComputedStyle(track()).stroke).toBe('rgb(10, 20, 30)');
      expect(getComputedStyle(track()).opacity).toBe('0.2');
      expect(track().getAttribute('stroke-dasharray')).toBeNull();
      expect(getComputedStyle(arc()).stroke).toBe('rgb(10, 20, 30)');
      expect(getComputedStyle(arc()).opacity).toBe('1');
      expect(arc().getAttribute('stroke-linecap')).toBe('round');
      const circumference = 2 * Math.PI * Number(arc().getAttribute('r'));
      const [dash, gap] = (arc().getAttribute('stroke-dasharray') ?? '').split(/[ ,]+/).map(Number);
      expect(dash).toBeCloseTo(circumference / 4, 1);
      expect(gap).toBeGreaterThanOrEqual(circumference * 0.75 - 0.01);
    });

    it('0.8 秒轉一圈，一直重複', () => {
      render({});
      const style = getComputedStyle(svg());
      expect(style.animationDuration).toBe('0.8s');
      expect(style.animationIterationCount).toBe('infinite');
      expect(style.animationTimingFunction).toBe('linear');
    });
  });

  describe('報讀', () => {
    it('預設：外層是 role="status"，念「載入中」；圖形本身藏起來', () => {
      render({});
      expect(host().getAttribute('role')).toBe('status');
      expect(host().hasAttribute('aria-hidden')).toBeFalse();
      expect(label()?.textContent?.trim()).toBe('載入中');
      expect(svg().getAttribute('aria-hidden')).toBe('true');
    });

    it('報讀文字看不見，不佔版面', () => {
      render({});
      const box = label()!.getBoundingClientRect();
      expect(box.width).toBeLessThanOrEqual(1);
      expect(box.height).toBeLessThanOrEqual(1);
      expect(host().getBoundingClientRect().width).toBe(16);
    });

    it('label 改成別的文字', () => {
      render({ label: '儲存中' });
      expect(label()?.textContent?.trim()).toBe('儲存中');
    });

    it('decorative：整個 aria-hidden，沒有 role，也沒有報讀文字', () => {
      render({ decorative: true });
      expect(host().getAttribute('aria-hidden')).toBe('true');
      expect(host().hasAttribute('role')).toBeFalse();
      expect(label()).toBeNull();
    });
  });

  // Karma 不能切換使用者的「減少動態」設定，所以直接讀元件樣式表裡 prefers-reduced-motion 區塊的規則。
  describe('減少動態', () => {
    it('改成 2.4 秒轉一圈，不停下來', () => {
      render({});
      let found: CSSStyleDeclaration | null = null;
      for (const sheet of Array.from(document.styleSheets)) {
        for (const rule of Array.from(sheet.cssRules)) {
          if (!(rule instanceof CSSMediaRule) || !rule.media.mediaText.includes('prefers-reduced-motion: reduce')) continue;
          for (const inner of Array.from(rule.cssRules)) {
            if (inner instanceof CSSStyleRule && /\.ds-spinner__svg(?![\w-])/.test(inner.selectorText)) found = inner.style;
          }
        }
      }
      expect(found).withContext('「減少動態」區塊裡找不到 .ds-spinner__svg 的規則').not.toBeNull();
      expect(found!.animationDuration).toBe('2.4s');
      expect(found!.animationName).not.toBe('none');
    });
  });
});
