import { Component, Input } from '@angular/core';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
  @Input() text = '';
  @Input() foo = 0;
}
