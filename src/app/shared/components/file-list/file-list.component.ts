import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NumberListComponent, NumberListAction } from '../number-list/number-list.component';

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type?: string;
  url?: string;
  mimeType?: string;
}

@Component({
  selector: 'app-file-list',
  standalone: true,
  imports: [CommonModule, NumberListComponent],
  templateUrl: './file-list.component.html',
  styleUrls: ['./file-list.component.scss'],
})
export class FileListComponent {
  @Input() docs: FileItem[] = [];
  @Input() disabled = false;
  @Input() emptyText = '尚未上傳任何檔案';

  @Output() removeFile = new EventEmitter<string>();
  @Output() viewFile   = new EventEmitter<string>();

  get actions(): NumberListAction[] {
    return this.disabled ? ['view'] : ['view', 'delete'];
  }

  formatSize(bytes: number): string {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return Math.ceil(bytes / 1024) + ' KB';
  }

  onAction(id: string, action: NumberListAction): void {
    if (action === 'view')   this.viewFile.emit(id);
    if (action === 'delete') this.removeFile.emit(id);
  }
}
