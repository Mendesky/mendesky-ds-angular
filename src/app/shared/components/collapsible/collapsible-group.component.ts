import {
  ChangeDetectionStrategy, Component, InjectionToken, Input, booleanAttribute,
} from '@angular/core';

/** 群組裡的一段：群組要收起它時呼叫 */
export interface CollapsibleGroupMember {
  /** 群組要求收合；停用的段落不理會（停用時維持原來的開合） */
  collapseFromGroup(): void;
}

/** 收合區塊找得到的群組 */
export interface CollapsibleGroupRef {
  register(member: CollapsibleGroupMember): void;
  unregister(member: CollapsibleGroupMember): void;
  /** 使用者打開了某一段 */
  memberOpened(member: CollapsibleGroupMember): void;
}

/**
 * 收合區塊用 DI 找最近的群組。每個 app-collapsible 自己也提供 null 給它的內容，
 * 所以段落內容裡巢狀的收合區塊找不到外層的群組，不會被當成同一組。
 */
export const COLLAPSIBLE_GROUP = new InjectionToken<CollapsibleGroupRef | null>('COLLAPSIBLE_GROUP');

/**
 * 收合區塊的群組：設了 single，使用者打開一段時，同一組裡原本開著的段落收起來。
 *
 * 段落用 DI 找到群組，所以包在卡片之類的元素裡也算同一組。DI 看的是寫在哪個範本，不是畫面上的位置：
 * 用包裝元件把內容投影進段落時，內容裡的收合區塊會被算進同一組。
 * 只在使用者打開時收其他段；頁面自己改 expanded 打開時不收，要一次只開一段就由頁面自己維持。
 * 群組本身不畫外框、不加間距，排法由頁面決定。
 */
@Component({
  selector: 'app-collapsible-group',
  standalone: true,
  template: '<ng-content></ng-content>',
  styles: [':host { display: block; }'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [{ provide: COLLAPSIBLE_GROUP, useExisting: CollapsibleGroupComponent }],
})
export class CollapsibleGroupComponent implements CollapsibleGroupRef {
  /** 一次只開一段 */
  @Input({ transform: booleanAttribute }) single = false;

  private readonly members = new Set<CollapsibleGroupMember>();

  register(member: CollapsibleGroupMember): void {
    this.members.add(member);
  }

  unregister(member: CollapsibleGroupMember): void {
    this.members.delete(member);
  }

  memberOpened(member: CollapsibleGroupMember): void {
    if (!this.single) return;
    this.members.forEach(m => {
      if (m !== member) m.collapseFromGroup();
    });
  }
}
