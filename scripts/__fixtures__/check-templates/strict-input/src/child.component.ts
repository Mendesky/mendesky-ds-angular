import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-child',
  standalone: true,
  template: '<span>{{ name }}</span>',
})
export class ChildComponent {
  @Input() name = '';
}
