import { Component, Input } from '@angular/core';
const DEFAULT_SIZE = 'M';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
  @Input() size = DEFAULT_SIZE;
}
