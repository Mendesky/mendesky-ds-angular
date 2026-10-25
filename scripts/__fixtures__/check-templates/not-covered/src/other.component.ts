import { Component } from '@angular/core';

@Component({
  selector: 'app-other',
  standalone: true,
  template: '<span>{{ label }}</span>',
})
export class OtherComponent {
  label = '名稱';
}
