import { Component, EventEmitter, Input, Output } from '@angular/core';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
  @Input() text = '';
  @Output() clicked = new EventEmitter<void>();
}
