import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { OptionCardGroupComponent, OptionCardItem } from './option-card-group.component';

@Component({
  standalone: true,
  imports: [OptionCardGroupComponent],
  template: `
    <app-option-card-group
      [options]="options"
      [value]="value"
      ariaLabel="版面樣式"
      [disabledValues]="disabledValues"
      (valueChange)="onChange($event)"
    ></app-option-card-group>
  `,
})
class HostComponent {
  options: OptionCardItem[] = [
    { value: 'a', label: 'A', illustration: '<svg></svg>' },
    { value: 'b', label: 'B', illustration: '<svg></svg>' },
    { value: 'c', label: 'C', illustration: '<svg></svg>' },
  ];
  value: string | null = null;
  disabledValues: string[] = [];
  lastValue: string | null = null;
  onChange(v: string): void {
    this.lastValue = v;
  }
}

describe('OptionCardGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  const cards = (): HTMLElement[] =>
    Array.from(fixture.nativeElement.querySelectorAll('.option-card'));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders one card per option as a radiogroup', () => {
    expect(cards().length).toBe(3);
    expect(fixture.nativeElement.querySelector('[role="radiogroup"]')?.getAttribute('aria-label')).toBe('版面樣式');
  });

  it('marks the selected card from value', () => {
    host.value = 'b';
    fixture.detectChanges();
    const selected = cards().filter(c => c.classList.contains('option-card--selected'));
    expect(selected.length).toBe(1);
    expect(selected[0].getAttribute('data-testid')).toBe('option-card-b');
  });

  it('emits valueChange when an enabled card is clicked', () => {
    cards()[2].click();
    expect(host.lastValue).toBe('c');
  });

  it('does NOT emit valueChange for a disabled option', () => {
    host.disabledValues = ['b'];
    fixture.detectChanges();
    cards()[1].click();
    expect(host.lastValue).toBeNull();
  });

  it('ArrowRight moves focus to the next enabled card, skipping disabled', () => {
    host.disabledValues = ['b'];
    fixture.detectChanges();
    const list = cards();
    list[0].focus();
    const group = fixture.nativeElement.querySelector('[role="radiogroup"]') as HTMLElement;
    group.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    fixture.detectChanges();
    // 'b' is disabled → focus must land on 'c'
    expect(document.activeElement).toBe(list[2]);
  });

  it('tracks by value (duplicate labels, distinct values) without dup-key error', () => {
    host.options = [
      { value: 'x1', label: '同名', illustration: '' },
      { value: 'x2', label: '同名', illustration: '' },
    ];
    fixture.detectChanges();
    expect(cards().length).toBe(2);
  });
});
