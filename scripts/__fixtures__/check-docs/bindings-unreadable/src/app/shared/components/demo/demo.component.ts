import { Component, Input } from '@angular/core';
const SELECTOR = 'app-demo';
@Component({ selector: SELECTOR, standalone: true, template: '' })
export class DemoComponent {
  @Input() text = '';
}
