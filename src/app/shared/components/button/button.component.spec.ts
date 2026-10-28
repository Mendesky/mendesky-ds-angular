import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonAriaCurrent, ButtonComponent } from './button.component';

/**
 * app-button 報讀契約（2026-10-28）：
 * - ariaLabel／ariaPressed／ariaCurrent 落在內層原生 button；沒設就不輸出屬性。
 * - 內層 button 沒有任何文字、也沒有 ariaLabel 時，開發模式印一次 console.warn（載入中除外）。
 */
@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `
    <app-button class="ctl" [text]="text" [leftIcon]="leftIcon" [loading]="loading"
      [ariaLabel]="ariaLabel" [ariaPressed]="ariaPressed" [ariaCurrent]="ariaCurrent"></app-button>
  `,
})
class HostComponent {
  text = '';
  leftIcon = '';
  loading = false;
  ariaLabel = '';
  ariaPressed: boolean | null = null;
  ariaCurrent: ButtonAriaCurrent | null = null;
}

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button leftIcon="Add"><span>自訂內容</span></app-button>`,
})
class ProjectedHostComponent {}

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button text="確認" aria-label="外層名稱"></app-button>`,
})
class HostAttrComponent {}

describe('ButtonComponent — 報讀名稱與狀態', () => {
  let fixture: ComponentFixture<HostComponent>;
  let warn: jasmine.Spy;

  const button = () => fixture.nativeElement.querySelector('.ctl button') as HTMLButtonElement;
  const warnCalls = () => warn.calls.allArgs().filter((args) => String(args[0]).startsWith('[app-button]'));

  function render(patch: Partial<HostComponent> = {}): void {
    fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    warn = spyOn(console, 'warn');
    await TestBed.configureTestingModule({ imports: [HostComponent, ProjectedHostComponent, HostAttrComponent] }).compileComponents();
  });

  describe('ariaLabel', () => {
    it('有設時落在內層 button 的 aria-label', () => {
      render({ leftIcon: 'LeftArrow', ariaLabel: '上一頁' });
      expect(button().getAttribute('aria-label')).toBe('上一頁');
    });

    it('沒設時內層 button 沒有 aria-label', () => {
      render({ text: '確認' });
      expect(button().hasAttribute('aria-label')).toBeFalse();
    });
  });

  describe('ariaPressed', () => {
    it('true／false 都照實輸出', () => {
      render({ text: '粗體', ariaPressed: true });
      expect(button().getAttribute('aria-pressed')).toBe('true');
      fixture.componentInstance.ariaPressed = false;
      fixture.detectChanges();
      expect(button().getAttribute('aria-pressed')).toBe('false');
    });

    it('沒設（null）時沒有 aria-pressed', () => {
      render({ text: '粗體' });
      expect(button().hasAttribute('aria-pressed')).toBeFalse();
    });
  });

  describe('ariaCurrent', () => {
    it('有設時輸出 aria-current', () => {
      render({ text: '2026-10-24 版', ariaCurrent: 'true' });
      expect(button().getAttribute('aria-current')).toBe('true');
    });

    it('沒設（null）時沒有 aria-current', () => {
      render({ text: '2026-10-24 版' });
      expect(button().hasAttribute('aria-current')).toBeFalse();
    });
  });

  it('直接寫 aria-label 會留在外層 app-button，不會到內層 button（說明檔 usageNotes 的依據）', () => {
    const f = TestBed.createComponent(HostAttrComponent);
    f.detectChanges();
    const host = f.nativeElement.querySelector('app-button') as HTMLElement;
    expect(host.getAttribute('aria-label')).toBe('外層名稱');
    expect(host.querySelector('button')!.hasAttribute('aria-label')).toBeFalse();
  });

  describe('沒有名稱的警告（開發模式）', () => {
    it('只有圖示、沒有文字也沒有 ariaLabel → 警告一次', () => {
      render({ leftIcon: 'LeftArrow' });
      fixture.detectChanges();
      expect(warnCalls().length).toBe(1);
    });

    it('有文字 → 不警告', () => {
      render({ leftIcon: 'Add', text: '新增' });
      expect(warnCalls().length).toBe(0);
    });

    it('有 ariaLabel → 不警告', () => {
      render({ leftIcon: 'LeftArrow', ariaLabel: '上一頁' });
      expect(warnCalls().length).toBe(0);
    });

    it('載入中 → 不警告', () => {
      render({ loading: true });
      expect(warnCalls().length).toBe(0);
    });

    it('沒有 text 但有投影的文字內容 → 不警告', () => {
      const projected = TestBed.createComponent(ProjectedHostComponent);
      projected.detectChanges();
      expect(warnCalls().length).toBe(0);
    });
  });
});
