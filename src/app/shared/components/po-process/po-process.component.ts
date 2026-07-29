import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type PoProcessStatus = 'Running' | 'Success' | 'Error' | 'Congratulation';

@Component({
  selector: 'app-po-process',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './po-process.component.html',
  styleUrls: ['./po-process.component.scss'],
})
export class PoProcessComponent {
  @Input() status: PoProcessStatus = 'Running';
  @Input() message = '';

  get cardClasses(): Record<string, boolean> {
    return {
      'po-process--running':        this.status === 'Running',
      'po-process--success':        this.status === 'Success',
      'po-process--error':          this.status === 'Error',
      'po-process--congratulation': this.status === 'Congratulation',
    };
  }
}
