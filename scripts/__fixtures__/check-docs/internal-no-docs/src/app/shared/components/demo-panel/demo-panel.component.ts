import { Component, Input } from '@angular/core';
@Component({ selector: 'app-demo-panel', standalone: true, template: '' })
export class DemoPanelComponent {
  @Input() items: string[] = [];
}
