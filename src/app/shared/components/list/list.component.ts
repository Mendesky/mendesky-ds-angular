import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list.component.html',
  styleUrls: ['./list.component.scss'],
})
export class ListComponent {
  @Input() level: '1' | '2' | '3' | '4' = '1';
  @Input() title = 'Title';
  @Input() value = 'Value';
  @Input() itemNumber = '1';
  @Input() showItemNumber = true;
  @Input() showTitle = true;
  @Input() showValue = true;
  @Input() hasChildren = false;
  @Input() status: 'Default' | 'Hover' = 'Default';

  get hostClasses(): Record<string, boolean> {
    return {
      [`list-item--level-${this.level}`]: true,
      'list-item--has-children': this.hasChildren && this.status === 'Default',
      'list-item--hover': this.status === 'Hover',
    };
  }
}
