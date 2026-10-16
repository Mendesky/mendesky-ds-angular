import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { OptionCardComponent } from './option-card.component';

/** Host wrapper so we can drive @Input()s declaratively. */
@Component({
  standalone: true,
  imports: [OptionCardComponent],
  template: `
    <app-option-card
      [value]="value"
      [label]="label"
      [description]="description"
      [illustration]="illustration"
      [selected]="selected"
      [disabled]="disabled"
      (cardSelect)="onSelect()"
    ></app-option-card>
  `,
})
class HostComponent {
  value = 'board';
  label = '看板';
  description = '';
  illustration = '<svg data-illus="1"></svg>';
  selected = false;
  disabled = false;
  selectCount = 0;
  onSelect(): void {
    this.selectCount++;
  }
}

describe('OptionCardComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const cardEl = (): HTMLElement =>
    fixture.nativeElement.querySelector('.option-card') as HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders the label', () => {
    expect(fixture.nativeElement.querySelector('.option-card__label')?.textContent).toContain('看板');
  });

  it('exposes radio semantics with a stable testid', () => {
    const card = cardEl();
    expect(card.getAttribute('role')).toBe('radio');
    expect(card.getAttribute('data-testid')).toBe('option-card-board');
    expect(card.getAttribute('aria-checked')).toBe('false');
  });

  it('reflects selected state (class + aria-checked + check mark)', () => {
    host.selected = true;
    fixture.detectChanges();
    const card = cardEl();
    expect(card.classList).toContain('option-card--selected');
    expect(card.getAttribute('aria-checked')).toBe('true');
    expect(fixture.nativeElement.querySelector('.option-card__check')).toBeTruthy();
  });

  it('reflects disabled state (class + aria-disabled + tabindex -1)', () => {
    host.disabled = true;
    fixture.detectChanges();
    const card = cardEl();
    expect(card.classList).toContain('option-card--disabled');
    expect(card.getAttribute('aria-disabled')).toBe('true');
    expect(card.getAttribute('tabindex')).toBe('-1');
  });

  it('emits cardSelect on click when enabled', () => {
    cardEl().click();
    expect(host.selectCount).toBe(1);
  });

  it('does NOT emit cardSelect when disabled', () => {
    host.disabled = true;
    fixture.detectChanges();
    cardEl().click();
    expect(host.selectCount).toBe(0);
  });

  it('renders the description node only when description is provided', () => {
    expect(fixture.nativeElement.querySelector('.option-card__desc')).toBeNull();
    host.description = '依狀態分欄顯示，可拖曳卡片調整順序';
    fixture.detectChanges();
    const desc = fixture.nativeElement.querySelector('.option-card__desc');
    expect(desc).toBeTruthy();
    expect(desc.textContent).toContain('依狀態分欄顯示');
  });

  it('injects the illustration SVG markup', () => {
    expect(fixture.nativeElement.querySelector('.option-card__illus svg[data-illus="1"]')).toBeTruthy();
  });
});
