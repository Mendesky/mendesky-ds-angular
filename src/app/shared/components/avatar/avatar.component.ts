import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type AvatarClass = 'Thumb' | 'Text' | 'Icon';
export type AvatarSize = 28 | 36 | 44 | 56 | 64 | 96 | 128 | 240;

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarComponent {
  /** 顯示類型：Thumb 照片 / Text 文字 / Icon 圖示 */
  @Input() propClass: AvatarClass = 'Text';

  /** 尺寸（px）：28 | 36 | 44 | 56 | 64 | 96 | 128 | 240 */
  @Input() size: AvatarSize = 44;

  /** Thumb 用：圖片 URL */
  @Input() src: string = '';

  /** Text 用：顯示文字（取第一字） */
  @Input() text: string = '';

  /** Icon 用：icon 名稱（對應 icon registry） */
  @Input() iconName: string = 'User';

  /** 是否可互動（啟用 hover / active 效果） */
  @Input() clickable: boolean = false;

  /** 自訂背景色（Text / Icon 模式，有值時覆蓋 SCSS 預設色） */
  @Input() bgColor: string = '';

  get rootClass(): string {
    const base = `avatar-root avatar--${this.size} avatar--${this.propClass.toLowerCase()}`;
    return this.clickable ? `${base} avatar--clickable` : base;
  }

  /** 依 size 對應 Icon 大小（px） */
  get iconSize(): number {
    const map: Record<number, number> = {
      28: 16, 36: 24, 44: 28, 56: 28, 64: 32, 96: 40, 128: 54, 240: 80,
    };
    return map[this.size] ?? Math.round(this.size * 0.55);
  }

  /** 依 iconSize 對應最接近的標準 size 字串 */
  get iconSizeStr(): '12' | '16' | '24' | '32' | '36' | '48' {
    const px = this.iconSize;
    if (px <= 14) return '12';
    if (px <= 20) return '16';
    if (px <= 28) return '24';
    if (px <= 34) return '32';
    if (px <= 42) return '36';
    return '48';
  }
}
