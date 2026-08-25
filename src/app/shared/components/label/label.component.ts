import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

export type LabelColor =
  | 'White' | 'Transparent' | 'GreyOutline' | 'LightWhite'
  | 'SoftBlue' | 'Red' | 'Salmon' | 'Green'
  | 'Grey25' | 'Blue' | 'SeaGreen' | 'Grey70'
  | 'Grey16' | 'Error' | 'GreenAll' | 'Golden'
  | 'Purple' | 'GreenOutline'
  | 'KanbanDraft' | 'KanbanOpened' | 'KanbanDealClosed' | 'KanbanArchiving' | 'KanbanArchived';

export type LabelSize = 'M' | 'S' | 'L' | 'XS' | 'XXS';

@Component({
  selector: 'app-label',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './label.component.html',
  styleUrls: ['./label.component.scss'],
})
export class LabelComponent {
  @Input() color: LabelColor = 'LightWhite';
  @Input() size: LabelSize = 'L';
  @Input() text = 'Label';
  @Input() showLeftIcon = false;
  /** 指定左側 icon 名稱（registry key）；設定時以 app-icon 渲染此 icon，覆蓋內建打勾。 */
  @Input() leftIconName = '';
  @Input() showRightIcon = false;
  @Input() showNumberedList = false;
  @Input() truncate = false;
  /** 長文字折行：預設 chip 為 white-space:nowrap（短標籤正確行為）；自由文字內容設 true 讓 label 像外框一樣自動換行 */
  @Input() wrap = false;

  private readonly COLOR_CSS: Record<LabelColor, string> = {
    LightWhite:  'label--light-white',
    White:       'label--white',
    Transparent: 'label--transparent',
    GreyOutline: 'label--grey-outline',
    SoftBlue:    'label--soft-blue',
    Red:         'label--red',
    Salmon:      'label--salmon',
    Green:       'label--green',
    Grey25:      'label--grey25',
    Blue:        'label--blue',
    SeaGreen:    'label--sea-green',
    Grey70:      'label--grey70',
    Grey16:      'label--grey16',
    Error:       'label--error',
    GreenAll:    'label--green-all',
    Golden:      'label--golden',
    Purple:       'label--purple',
    GreenOutline: 'label--green-outline',
    KanbanDraft:      'label--kanban-draft',
    KanbanOpened:     'label--kanban-opened',
    KanbanDealClosed: 'label--kanban-dealclosed',
    KanbanArchiving:  'label--kanban-archiving',
    KanbanArchived:   'label--kanban-archived',
  };

  // text color token per color variant (from Figma node 2:27162)
  private readonly TEXT_CLASS: Record<LabelColor, string> = {
    LightWhite:  'text--light',   // #939393
    White:       'text--body',    // #686868
    Transparent: 'text--body',    // #686868
    GreyOutline: 'text--body',    // #686868
    Grey16:      'text--body',    // #686868（淺灰底，深字）
    Grey25:      'text--body',    // #686868（淺灰底，深字）
    Green:       'text--body',    // #686868（白底綠框，深字）
    Red:         'text--error',   // #cc5252（白底紅框，紅字）
    SoftBlue:    'text--white',   // white（藍底）
    Blue:        'text--white',   // white（藍底）
    SeaGreen:    'text--white',   // white（綠底）
    Salmon:      'text--white',   // white（橙底）
    Grey70:      'text--white',   // white（深灰底）
    Golden:      'text--white',   // white（金底）
    GreenAll:    'text--white',   // white（淺綠底）
    Error:       'text--white',   // white（紅底）
    Purple:       'text--white',   // white（紫底）
    GreenOutline: 'text--green',   // #5a8c2c 加粗（白底綠框，分類標記）
    KanbanDraft:      'text--body',    // #686868（淺灰 #d3d3d3 底，深字）
    KanbanOpened:     'text--body',    // #686868（CornflowerBlue/30 #bac6fd 底，深字）
    KanbanDealClosed: 'text--white',   // white（CornflowerBlue/50 #8293da 底，白字）
    KanbanArchiving:  'text--white',   // white（CornflowerBlue/70 #5866a0 底，白字）
    KanbanArchived:   'text--white',   // white（CornflowerBlue/90 #333d66 底，白字）
  };

  private readonly ICON_CLASS: Record<LabelColor, string> = {
    LightWhite:  'icon--light',
    White:       'icon--body',
    Transparent: 'icon--body',
    GreyOutline: 'icon--body',
    Grey16:      'icon--body',
    Grey25:      'icon--body',
    Green:       'icon--body',
    Red:         'icon--error',   // #cc5252
    SoftBlue:    'icon--white',
    Blue:        'icon--white',
    SeaGreen:    'icon--white',
    Salmon:      'icon--white',
    Grey70:      'icon--white',
    Golden:      'icon--white',
    GreenAll:    'icon--white',
    Error:       'icon--white',
    Purple:       'icon--white',
    GreenOutline: 'icon--green',
    KanbanDraft:      'icon--body',
    KanbanOpened:     'icon--body',
    KanbanDealClosed: 'icon--white',
    KanbanArchiving:  'icon--white',
    KanbanArchived:   'icon--white',
  };

  get hostClasses(): Record<string, boolean> {
    return {
      [`label--${this.size.toLowerCase()}`]: true,
      [this.COLOR_CSS[this.color]]: true,
      'label--truncate': this.truncate,
      'label--wrap': this.wrap,
    };
  }

  get textClass(): string {
    return this.TEXT_CLASS[this.color];
  }

  get iconColorClass(): string {
    return this.ICON_CLASS[this.color];
  }
}
