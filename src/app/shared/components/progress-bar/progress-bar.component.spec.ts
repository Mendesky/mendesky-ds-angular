import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ProgressBarComponent } from './progress-bar.component';

/**
 * DS 契約測試（套件側）。與 mendesky-web 的同名 spec 是同一份契約的兩份拷貝，
 * 改行為時兩邊一起改（見 ds-angular README「Spec 政策」）。
 *
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
});
