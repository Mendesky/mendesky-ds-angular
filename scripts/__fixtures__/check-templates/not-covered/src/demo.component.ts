import { Component } from '@angular/core';

@Component({
  selector: 'app-demo',
  standalone: true,
  template: '<span>{{ label }}</span>',
})
export class DemoComponent {
  label = '名稱';
}
