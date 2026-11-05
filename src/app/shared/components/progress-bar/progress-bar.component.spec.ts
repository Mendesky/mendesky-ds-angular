import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProgressBarComponent } from './progress-bar.component';

/**
 * app-progress-bar 只畫比例、不內建文字；value 夾在 0～max，max ≤ 0 或非有限數字時為 0%。
 */
describe('ProgressBarComponent', () => {
  let fixture: ComponentFixture<ProgressBarComponent>;

  const barEl = () => fixture.nativeElement.querySelector('.ds-progress') as HTMLElement;
  const fillEl = () => fixture.nativeElement.querySelector('.ds-progress__fill') as HTMLElement;

  // OnPush：直接改 plain 屬性 fixture.detectChanges() 偵測不到，須用 setInput 走 Angular 的
  // input 綁定機制。
  const render = (inputs: Partial<Pick<ProgressBarComponent, 'value' | 'max' | 'ariaLabel'>>) => {
    for (const [key, val] of Object.entries(inputs)) fixture.componentRef.setInput(key, val);
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
  });

  describe('比例', () => {
    it('預設 value=0、max=100 時填色寬度為 0%', () => {
      render({});
      expect(fillEl().style.width).toBe('0%');
    });

    it('value=12、max=40 時填色寬度為 30%', () => {
      render({ value: 12, max: 40 });
      expect(fillEl().style.width).toBe('30%');
    });

    it('value 等於 max 時填滿 100%', () => {
      render({ value: 40, max: 40 });
      expect(fillEl().style.width).toBe('100%');
    });

    it('value 超過 max 時夾在 100%，不會溢出軌道', () => {
      render({ value: 55, max: 40 });
      expect(fillEl().style.width).toBe('100%');
    });

    it('value 為負數時夾在 0%', () => {
      render({ value: -3, max: 40 });
      expect(fillEl().style.width).toBe('0%');
    });
  });

  describe('防呆', () => {
    it('max=0（總數還沒算出來）時為 0%，不會除以零', () => {
      render({ value: 5, max: 0 });
      expect(fillEl().style.width).toBe('0%');
    });

    it('max 為負數時為 0%', () => {
      render({ value: 5, max: -10 });
      expect(fillEl().style.width).toBe('0%');
    });

    it('value 為 NaN 時為 0%', () => {
      render({ value: NaN, max: 40 });
      expect(fillEl().style.width).toBe('0%');
    });
  });

  describe('無障礙', () => {
    it('帶 role=progressbar 與 min / max / now', () => {
      render({ value: 12, max: 40 });
      expect(barEl().getAttribute('role')).toBe('progressbar');
      expect(barEl().getAttribute('aria-valuemin')).toBe('0');
      expect(barEl().getAttribute('aria-valuemax')).toBe('40');
      expect(barEl().getAttribute('aria-valuenow')).toBe('12');
    });

    it('aria-valuenow 跟著夾值，不會回報超過 max 的數字', () => {
      render({ value: 55, max: 40 });
      expect(barEl().getAttribute('aria-valuenow')).toBe('40');
    });

    it('有 ariaLabel 時輸出 aria-label', () => {
      render({ ariaLabel: '批次授權進度' });
      expect(barEl().getAttribute('aria-label')).toBe('批次授權進度');
    });

    it('ariaLabel 為空字串時不輸出 aria-label 屬性', () => {
      render({ ariaLabel: '' });
      expect(barEl().hasAttribute('aria-label')).toBeFalse();
    });
  });

  // 不定狀態與尺寸用 setInput 的字串 key 設值：value 給 null、size 是新設定，
  // 走 render() 的型別會擋掉。斷言一律查畫出來的 DOM 與計算後樣式。
  const set = (inputs: Record<string, unknown>) => {
    for (const [key, val] of Object.entries(inputs)) fixture.componentRef.setInput(key, val);
    fixture.detectChanges();
  };
  const widthRatio = () => fillEl().getBoundingClientRect().width / barEl().getBoundingClientRect().width;

  describe('不定狀態（value 為 null）', () => {
    it('保留 role=progressbar 與 min / max，但不輸出 aria-valuenow', () => {
      set({ value: null });
      expect(barEl().getAttribute('role')).toBe('progressbar');
      expect(barEl().getAttribute('aria-valuemin')).toBe('0');
      expect(barEl().getAttribute('aria-valuemax')).toBe('100');
      expect(barEl().hasAttribute('aria-valuenow'))
        .withContext('不定狀態沒有進度，輸出 aria-valuenow 會讓報讀軟體念出假的百分比')
        .toBeFalse();
    });

    it('有 ariaLabel 時照樣輸出 aria-label', () => {
      set({ value: null, ariaLabel: '上傳進度' });
      expect(barEl().getAttribute('aria-label')).toBe('上傳進度');
    });

    it('色段佔整條的 40%，而且在跑動畫', () => {
      set({ value: null });
      expect(fillEl().classList).toContain('ds-progress__fill--indeterminate');
      expect(widthRatio()).toBeCloseTo(0.4, 2);
      expect(getComputedStyle(fillEl()).animationName).not.toBe('none');
      expect(getComputedStyle(fillEl()).animationDuration).toBe('1.5s');
    });

    it('value 從 null 改回 30 → 回到有進度：寬度 30%、aria-valuenow=30、不再跑動畫', () => {
      set({ value: null });
      set({ value: 30 });
      expect(fillEl().classList).not.toContain('ds-progress__fill--indeterminate');
      expect(fillEl().style.width).toBe('30%');
      expect(barEl().getAttribute('aria-valuenow')).toBe('30');
      expect(getComputedStyle(fillEl()).animationName).toBe('none');
    });
  });

  describe('尺寸', () => {
    it('不給 size 時高 8px', () => {
      set({ value: 10 });
      expect(barEl().getBoundingClientRect().height).toBe(8);
    });

    it('size=S 時高 6px', () => {
      set({ value: 10, size: 'S' });
      expect(barEl().getBoundingClientRect().height).toBe(6);
    });
  });

  // Karma 不能切換使用者的「減少動態」設定，所以直接讀元件樣式表裡 prefers-reduced-motion 區塊的規則。
  // class 名稱要整段相符：.ds-progress__fill 不能比對到 .ds-progress__fill--indeterminate。
  describe('減少動態', () => {
    const reducedMotionRule = (className: string): CSSStyleDeclaration => {
      const selector = new RegExp(`\\.${className}(?![\\w-])`);
      for (const sheet of Array.from(document.styleSheets)) {
        for (const rule of Array.from(sheet.cssRules)) {
          if (!(rule instanceof CSSMediaRule) || !rule.media.mediaText.includes('prefers-reduced-motion: reduce')) continue;
          for (const inner of Array.from(rule.cssRules)) {
            if (inner instanceof CSSStyleRule && selector.test(inner.selectorText)) return inner.style;
          }
        }
      }
      throw new Error(`「減少動態」區塊裡找不到 .${className} 的規則`);
    };

    it('不定狀態的色段不動，停在正中間（30%～70%）', () => {
      set({ value: null });
      const style = reducedMotionRule('ds-progress__fill--indeterminate');
      expect(style.animationName).toBe('none');
      // 色段寬 40%，往右移自身寬度的 translateX%；中心點要落在整條的 50%
      const shift = /^translateX\(([\d.]+)%\)$/.exec(style.transform);
      expect(shift).withContext(`transform 是「${style.transform}」`).not.toBeNull();
      const left = widthRatio() * Number(shift![1]) / 100;
      expect(left).toBeCloseTo(0.3, 2);
      expect(left + widthRatio() / 2).toBeCloseTo(0.5, 2);
    });

    it('有進度時填色長度直接跳到新值，不跑 0.2 秒的過場', () => {
      set({ value: 10 });
      expect(reducedMotionRule('ds-progress__fill').transitionProperty).toBe('none');
    });
  });
});
