import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToggleComponent } from './toggle.component';

/** app-toggle 報讀契約（2026-10-28）：ariaLabel 落在內層 button[role=switch]；沒設就不輸出。 */
@Component({
  standalone: true,
  imports: [ToggleComponent],
  template: `<app-toggle [checked]="checked" [ariaLabel]="ariaLabel" (checkedChange)="checked = $event"></app-toggle>`,
})
class HostComponent {
  checked = false;
  ariaLabel = '';
}

describe('ToggleComponent — 報讀名稱', () => {
  let fixture: ComponentFixture<HostComponent>;

  const switchBtn = () => fixture.nativeElement.querySelector('button[role="switch"]') as HTMLButtonElement;

  function render(patch: Partial<HostComponent> = {}): void {
    fixture = TestBed.createComponent(HostComponent);
    Object.assign(fixture.componentInstance, patch);
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
  });

  it('有設 ariaLabel 時落在 switch 的 aria-label', () => {
    render({ ariaLabel: '酬金補充說明' });
    expect(switchBtn().getAttribute('aria-label')).toBe('酬金補充說明');
  });

  it('切換開關後名稱不變，aria-checked 跟著變', () => {
    render({ ariaLabel: '客戶指定簽證會計師' });
    switchBtn().click();
    fixture.detectChanges();
    expect(switchBtn().getAttribute('aria-checked')).toBe('true');
    expect(switchBtn().getAttribute('aria-label')).toBe('客戶指定簽證會計師');
  });

  it('沒設時沒有 aria-label', () => {
    render();
    expect(switchBtn().hasAttribute('aria-label')).toBeFalse();
  });
});
