import { Component, EventEmitter, Input, Output, input, model, output } from '@angular/core';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
  @Input('aliasA') a = '';
  @Input({ alias: 'aliasB' }) b = '';
  @Input() set c(value: string) { void value; }
  @Input({ required: true }) r!: string;
  d = input('');
  e = input.required<string>();
  f = model(0);
  g = output<void>();
  @Output() h = new EventEmitter<void>();
  i = input(0, { alias: 'aliasI' });
  private notAnInput = 1;
}
