import { Component } from '@angular/core';
import { ChildComponent } from './child.component';

@Component({
  selector: 'app-parent',
  standalone: true,
  imports: [ChildComponent],
  template: '<app-child [name]="label"></app-child>',
})
export class ParentComponent {
  label = '名稱';
}
