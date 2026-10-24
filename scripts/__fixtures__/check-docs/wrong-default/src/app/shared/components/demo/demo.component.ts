import { Component, Input, input } from '@angular/core';
@Component({ selector: 'app-demo', standalone: true, template: '' })
export class DemoComponent {
  @Input() size = 'M';
  @Input() on = false;
  @Input() label = '';
  count = input(3);
  @Input() tone = 'info';
}
