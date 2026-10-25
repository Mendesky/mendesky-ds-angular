import { Directive, Input } from '@angular/core';
@Directive({ selector: '[appDemoTip]', standalone: true })
export class DemoTipDirective {
  @Input() appDemoTip = '';
  @Input() tipPosition = 'top';
}
