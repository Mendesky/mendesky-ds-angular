import { Component } from '@angular/core';
import { ChildComponent } from './child.component';

@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [ChildComponent],
  template: '<app-child [name]="count"></app-child>',
})
export class ParentComponent {
  count = 123;
}
