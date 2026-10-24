import { Component, EventEmitter, Input, Output, input, model } from '@angular/core';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
  @Input() text = '';
  variant = input<'primary' | 'secondary'>('primary');
  value = model('');
  @Output() clicked = new EventEmitter<void>();
}
