import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-page-skeleton',
  standalone: true,
  imports: [],
  templateUrl: './page-skeleton.component.html',
  styleUrls: ['./page-skeleton.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PageSkeletonComponent {
  readonly cols = [1, 2, 3, 4, 5];
  readonly cards = [1, 2];
}
