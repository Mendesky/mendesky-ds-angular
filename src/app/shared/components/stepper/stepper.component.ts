import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { DividerComponent } from '../divider/divider.component';

export interface NavSubItem {
  id: string;
  label: string;
}

export interface NavPage {
  id: string;
  num: string;
  label: string;
  subItems?: NavSubItem[];
}

export interface NavSection {
  /** 區段標題（companyName 或「集團報價共用資料」）。傳 undefined 則不顯示標題列 */
  label?: string;
  pages: NavPage[];
}

@Component({
  selector: 'app-stepper',
  standalone: true,
  imports: [CommonModule, IconComponent, DividerComponent],
  templateUrl: './stepper.component.html',
  styleUrls: ['./stepper.component.scss'],
})
export class StepperComponent {
  // ── Horizontal variant（原有 API，維持不變）──
  @Input() steps: string[] = [];
  @Input() currentStep = 0;
  @Output() stepClick = new EventEmitter<number>();

  // ── variant ──
  @Input() variant: 'horizontal' | 'nav' = 'horizontal';

  // ── Nav variant inputs ──
  @Input() navSections: NavSection[] = [];
  /** 目前 active 的 page id 或 sub-item id */
  @Input() activePage = '';
  /** 已展開的頂層 page ids */
  @Input() expandedPageIds: string[] = [];
  /** 尚未解鎖的頂層 page ids */
  @Input() lockedPageIds: string[] = [];
  /** sub-item 完成狀態 map：Record<subItemId, 'empty' | 'in-progress' | 'complete'>
   *  注意：'in-progress' 視覺上等同 'empty'（不顯示藍圈），僅用於頁面層級彙總 */
  @Input() sectionStatuses: Record<string, string> = {};
  /** 已觸發驗證的 section / page ids（顯示紅色警告狀態） */
  @Input() validationTriggeredIds: string[] = [];
  /** 隱藏 nav pill 內的數字文字（完成態的綠勾仍保留） */
  @Input() hideNum = false;

  // ── Nav variant outputs ──
  @Output() navPageClick = new EventEmitter<NavPage>();
  @Output() navSubItemClick = new EventEmitter<{ subId: string; parentId: string }>();

  // ── Horizontal methods ──
  onStepClick(index: number): void {
    if (index < this.currentStep) {
      this.stepClick.emit(index);
    }
  }

  // ── Nav helper methods ──
  getActiveParentId(): string {
    for (const section of this.navSections) {
      for (const page of section.pages) {
        if (page.id === this.activePage) return page.id;
        if (page.subItems?.some(s => s.id === this.activePage)) return page.id;
      }
    }
    return this.activePage;
  }

  isNavPageActive(pageId: string): boolean {
    return this.getActiveParentId() === pageId;
  }

  isNavPageExpanded(pageId: string): boolean {
    return this.expandedPageIds.includes(pageId);
  }

  isNavPageLocked(pageId: string): boolean {
    return this.lockedPageIds.includes(pageId);
  }

  isNavSubItemActive(subId: string): boolean {
    return this.activePage === subId;
  }

  getSubItemStatus(subId: string): string {
    return this.sectionStatuses[subId] ?? 'empty';
  }

  getPageStatus(pageId: string): string {
    return this.sectionStatuses[pageId] ?? 'empty';
  }

  /** sub-item 是否顯示警告（驗證已觸發且尚未完成） */
  isSubItemWarning(subId: string): boolean {
    return this.validationTriggeredIds.includes(subId) &&
      this.getSubItemStatus(subId) !== 'complete';
  }

  /** 頂層 page pill 是否顯示警告 */
  isPageWarning(page: NavPage): boolean {
    if (page.subItems?.length) {
      return page.subItems.some(s => this.isSubItemWarning(s.id));
    }
    return this.validationTriggeredIds.includes(page.id) &&
      this.getPageStatus(page.id) !== 'complete';
  }

  onNavPageClick(page: NavPage): void {
    this.navPageClick.emit(page);
  }

  onNavSubItemClick(subId: string, parentId: string): void {
    this.navSubItemClick.emit({ subId, parentId });
  }
}
