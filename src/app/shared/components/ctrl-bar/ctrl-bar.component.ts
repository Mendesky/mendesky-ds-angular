import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-ctrl-bar',
  standalone: true,
  templateUrl: './ctrl-bar.component.html',
  styleUrls: ['./ctrl-bar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CtrlBarComponent {}
