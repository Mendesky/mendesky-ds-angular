import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-list-tag',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './list-tag.component.html',
  styleUrls: ['./list-tag.component.scss'],
})
export class ListTagComponent {
  @Input() itemNumber = 'i';
  @Input() showBadge = true;
  @Input() showBadgeB = false;
  @Input() showBadgeC = false;
  @Input() text = 'Text';
}
