import {
  Component, Input, Output, EventEmitter,
  ElementRef, ViewChild, OnDestroy, OnChanges, SimpleChanges,
  inject, ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { TooltipsComponent } from '../tooltips/tooltips.component';
import { SelectComponent, SelectOption } from '../select/select.component';
import { TemplateVarDef, TemplateVarContext } from '../../models/template-var.model';

const GROUP_LABELS: Record<string, string> = {
  basic:      '基本資訊',
  financial:  '財務資訊',
  accounting: '記帳事務',
  payroll:    '薪資人力',
  cashier:    '出納事務',
  reform:     '整帳事務',
  settlement: '結算覆核',
};

type CloseReason = 'outside' | 'chipClick' | 'esc' | 'anchorGone' | 'destroy' | 'toggle';

@Component({
  selector: 'app-template-var-panel',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, TooltipsComponent, SelectComponent],
  templateUrl: './template-var-panel.component.html',
  styleUrls: ['./template-var-panel.component.scss'],
})
export class TemplateVarPanelComponent implements OnDestroy, OnChanges {
  @Input() varDefs: TemplateVarDef[] = [];
  @Input() variables: Record<string, string> = {};
  @Input() headerText = '藍色文字為可套用的範本變數，點擊插入至游標位置。';
  @Output() insert = new EventEmitter<string>();

  /** 公司/方案選擇 contexts（集團案件才傳；空 = 不顯示下拉、行為同現狀） */
  @Input() contexts: TemplateVarContext[] = [];
  /** 預設選取公司（由 host 依使用點語意算好；見 resolveDefaultContext） */
  @Input() defaultCaseId?: string;
  /** 預設選取方案 */
  @Input() defaultBundleId?: string;
  /** 使用者切換公司/方案時 emit；host 據此重算 qualified varDefs / variables */
  @Output() contextChange = new EventEmitter<{ caseId: string; bundleId: string }>();

  /** 目前選取的公司 caseId */
  selectedCaseId?: string;
  /** 目前選取的方案 bundleId */
  selectedBundleId?: string;

  get caseOptions(): SelectOption[] {
    return this.contexts.map((c) => ({ value: c.caseId, label: c.companyName }));
  }

  get bundleOptions(): SelectOption[] {
    const ctx = this.contexts.find((c) => c.caseId === this.selectedCaseId);
    return (ctx?.bundles ?? []).map((b) => ({ value: b.bundleId, label: b.bundleName }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['contexts'] || changes['defaultCaseId'] || changes['defaultBundleId']) {
      this._initSelection();
    }
  }

  /** 依 default 初始化下拉選取（不 emit：host 已為 default context 準備好 varDefs/variables） */
  private _initSelection(): void {
    if (!this.contexts.length) {
      this.selectedCaseId = undefined;
      this.selectedBundleId = undefined;
      return;
    }
    const caseId = this.contexts.find((c) => c.caseId === this.defaultCaseId)?.caseId
      ?? this.contexts[0].caseId;
    this.selectedCaseId = caseId;
    const bundles = this.contexts.find((c) => c.caseId === caseId)?.bundles ?? [];
    this.selectedBundleId = bundles.some((b) => b.bundleId === this.defaultBundleId)
      ? this.defaultBundleId
      : bundles[0]?.bundleId;
  }

  /** 切公司 → 方案自動落該公司第一個 → emit */
  onCaseChange(caseId: string): void {
    this.selectedCaseId = caseId;
    const bundles = this.contexts.find((c) => c.caseId === caseId)?.bundles ?? [];
    this.selectedBundleId = bundles[0]?.bundleId;
    this._emitContext();
  }

  /** 切方案 → emit */
  onBundleChange(bundleId: string): void {
    this.selectedBundleId = bundleId;
    this._emitContext();
  }

  private _emitContext(): void {
    if (this.selectedCaseId && this.selectedBundleId) {
      this.contextChange.emit({ caseId: this.selectedCaseId, bundleId: this.selectedBundleId });
    }
    this._scheduleUpdate(); // 清單高度可能變 → 重新定位 portal 面板
  }

  @ViewChild('trigger') triggerRef!: ElementRef<HTMLButtonElement>;
  @ViewChild('panel')   panelRef?: ElementRef<HTMLElement>;

  private elRef = inject(ElementRef);
  private cdr   = inject(ChangeDetectorRef);

  showPanel = false;
  searchQuery = '';
  hoveredVarKey: string | null = null;
  chipTooltipPos: { bottom: number; left: number } = { bottom: 0, left: 0 };

  /** inline autocomplete 模式（`%%` 觸發）：隱藏搜尋框/header、query 由 host 餵、支援 ↑↓Enter；ⓘ 模式為 false */
  inline = false;
  /** inline 模式查詢字（取代 searchQuery） */
  query = '';
  /** inline 模式目前高亮的 flat index（-1 = 無） */
  activeIndex = -1;

  private _panelEl: HTMLElement | null = null;
  private _anchorEl: HTMLElement | null = null;
  /** inline 模式錨定的游標 rect（取代按鈕 _anchorEl 定位） */
  private _anchorRect: DOMRect | null = null;
  private _rafId: number | null = null;

  // ── Bound handlers (stable references for addEventListener / removeEventListener) ──
  private readonly _onDocMousedown = (e: MouseEvent) => {
    if (!this.showPanel) return;
    const target = e.target as Node;
    if (this._panelEl?.contains(target))  return; // click inside panel
    if (this._anchorEl?.contains(target)) return; // click on trigger (toggle handles it)
    // 公司/方案下拉（app-select）的選項清單 portal 到 body、是本面板的兄弟節點，
    // 點選項不算「點面板外」——否則選方案就會誤關整個變數面板（閃退）。
    if (target instanceof Element && target.closest('app-select-panel')) return;
    this.closePanel('outside');
  };

  private readonly _onKeydown = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.showPanel) {
      e.stopPropagation();
      this.closePanel('esc');
    }
  };

  private readonly _onScroll = () => this._scheduleUpdate();
  private readonly _onResize = () => this._scheduleUpdate();

  // ── Computed ──
  /** 去除 HTML/markdown 標記取純文字，供搜尋比對 resolved value（避免誤命中 < > * 等標記字元）。 */
  private plainValue(key: string): string {
    return (this.variables[key] ?? '')
      .replace(/<[^>]*>/g, ' ')   // strip HTML tags
      .replace(/[*_`#>~]/g, '')   // strip 常見 markdown 標記
      .toLowerCase();
  }

  get varGroups(): { group: string; label: string; defs: TemplateVarDef[] }[] {
    const q = (this.inline ? this.query : this.searchQuery).trim().toLowerCase();
    const filtered = q
      ? this.varDefs.filter(v =>
          v.label.toLowerCase().includes(q) ||
          v.key.toLowerCase().includes(q) ||
          this.plainValue(v.key).includes(q))
      : this.varDefs;

    const map: Record<string, TemplateVarDef[]> = {};
    for (const def of filtered) {
      if (!map[def.group]) map[def.group] = [];
      map[def.group].push(def);
    }

    const order = ['basic', 'financial', 'accounting', 'payroll', 'cashier', 'reform', 'settlement'];
    return order
      .filter(g => map[g]?.length > 0)
      .map(g => ({ group: g, label: GROUP_LABELS[g] ?? g, defs: map[g] }));
  }

  varSyntax(key: string): string { return `%${key}%`; }

  // ── inline autocomplete（`%%` 觸發）：命令式 API，由編輯器(host)驅動 ──
  /** 所有可見項攤平（跨分群、依渲染順序），供 activeIndex 對應 */
  get flatDefs(): TemplateVarDef[] {
    return this.varGroups.flatMap(g => g.defs);
  }

  /** 目前高亮項的 key（無則 null） */
  get activeKey(): string | null {
    const f = this.flatDefs;
    return this.activeIndex >= 0 && this.activeIndex < f.length ? f[this.activeIndex].key : null;
  }

  get isOpen(): boolean { return this.showPanel; }

  /** 在游標 rect 開啟 inline 下拉（隱藏搜尋框/header；鍵盤由 host 路由，焦點留在編輯器） */
  openAt(rect: DOMRect, query = ''): void {
    this.inline = true;
    this.query = query;
    this._anchorRect = rect;
    this.activeIndex = -1;
    this.showPanel = true;
    this.cdr.markForCheck();

    requestAnimationFrame(() => {
      const panelEl = this.panelRef?.nativeElement;
      if (!panelEl || !this.showPanel) return;
      this._panelEl  = panelEl;
      this._anchorEl = null; // inline 用 _anchorRect 定位
      document.body.appendChild(panelEl);
      document.addEventListener('mousedown', this._onDocMousedown, { capture: true });
      document.addEventListener('scroll',    this._onScroll, { capture: true, passive: true });
      window.addEventListener('resize',      this._onResize, { passive: true });
      // inline 模式不掛 panel 自身 keydown（焦點在編輯器，由 host 路由 ↑↓Enter Esc）
      this.activeIndex = this.flatDefs.length > 0 ? 0 : -1;
      this.cdr.markForCheck();
      this._updatePosition();
    });
  }

  /** inline 模式：游標移動/打字時更新位置與查詢 */
  updateInline(rect: DOMRect, query: string): void {
    if (!this.showPanel || !this.inline) return;
    this._anchorRect = rect;
    this.setQuery(query);
  }

  /** 更新查詢 + 重置高亮到第一個 + 重新定位（list 高度可能變） */
  setQuery(query: string): void {
    this.query = query;
    this.activeIndex = this.flatDefs.length > 0 ? 0 : -1;
    this.cdr.markForCheck();
    this._scheduleUpdate();
  }

  /** ↑↓ 移動高亮（環繞） */
  moveActive(delta: number): void {
    const n = this.flatDefs.length;
    if (n === 0) { this.activeIndex = -1; return; }
    this.activeIndex = this.activeIndex < 0
      ? (delta > 0 ? 0 : n - 1)
      : (this.activeIndex + delta + n) % n;
    this.cdr.markForCheck();
    this._scrollActiveIntoView();
  }

  /** Enter：插入目前高亮項並關閉 */
  selectActive(): void {
    const key = this.activeKey;
    if (!key) return;
    this.insert.emit(key);
    this.closePanel('chipClick');
  }

  /** host 呼叫的關閉 */
  close(): void {
    this.closePanel('outside');
  }

  private _scrollActiveIntoView(): void {
    const el = this._panelEl?.querySelector('.tvp-chip--active') as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }

  // ── Public interaction ──
  togglePanel(event: MouseEvent): void {
    event.stopPropagation();
    if (this.showPanel) {
      this.closePanel('toggle');
    } else {
      this.openPanel();
    }
  }

  onSearchInput(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value;
  }

  onChipMousedown(event: MouseEvent): void {
    event.preventDefault();
  }

  onChipHover(event: MouseEvent, key: string): void {
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.hoveredVarKey = key;
    this.chipTooltipPos = {
      bottom: window.innerHeight - rect.top + 4,
      left:   rect.left + rect.width / 2,
    };
  }

  onChipLeave(): void {
    this.hoveredVarKey = null;
  }

  onChipClick(key: string, event: MouseEvent): void {
    event.stopPropagation();
    this.insert.emit(key);
    this.closePanel('chipClick');
  }

  ngOnDestroy(): void {
    this.closePanel('destroy');
  }

  // ── Open / close ──
  private openPanel(): void {
    this.searchQuery = '';
    this.showPanel = true;
    this.cdr.markForCheck();

    // Wait for Angular to render the panel (next animation frame after CD completes).
    requestAnimationFrame(() => {
      const panelEl = this.panelRef?.nativeElement;
      if (!panelEl || !this.showPanel) return;

      this._panelEl  = panelEl;
      this._anchorEl = this.triggerRef.nativeElement;

      // Portal panel to body so it is never clipped by ancestor overflow/transform.
      document.body.appendChild(panelEl);

      document.addEventListener('mousedown', this._onDocMousedown, { capture: true });
      document.addEventListener('keydown',   this._onKeydown,   { capture: true });
      document.addEventListener('scroll',    this._onScroll,    { capture: true, passive: true });
      window.addEventListener('resize',      this._onResize,    { passive: true });

      this._updatePosition();
    });
  }

  closePanel(reason: CloseReason): void {
    if (!this.showPanel) return;

    // Remove global listeners.
    document.removeEventListener('mousedown', this._onDocMousedown, { capture: true });
    document.removeEventListener('keydown',   this._onKeydown,   { capture: true });
    document.removeEventListener('scroll',    this._onScroll,    { capture: true });
    window.removeEventListener('resize',      this._onResize);

    if (this._rafId !== null) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }

    // Move panel back to :host so Angular can cleanly destroy it via @if.
    if (this._panelEl && this._panelEl.parentNode === document.body) {
      this.elRef.nativeElement.appendChild(this._panelEl);
    }

    this.hoveredVarKey = null;
    this._panelEl  = null;
    this._anchorEl = null;
    this._anchorRect = null;
    this.inline = false;
    this.query = '';
    this.activeIndex = -1;

    this.showPanel = false;
    this.cdr.markForCheck();
  }

  // ── Positioning ──
  private _updatePosition(): void {
    if (!this._panelEl) return;

    // inline 模式用游標 rect；ⓘ 模式用按鈕 _anchorEl
    const anchorRect = this._anchorRect ?? this._anchorEl?.getBoundingClientRect();
    if (!anchorRect) return;

    // 按鈕錨點消失（stepper 切走）→ 關閉。inline 的 caret rect 寬度為 0 屬正常，不誤判。
    if (!this.inline && anchorRect.width === 0 && anchorRect.height === 0) {
      this.closePanel('anchorGone');
      return;
    }

    const panelW = this._panelEl.offsetWidth  || 300;
    const panelH = this._panelEl.offsetHeight || 360;
    const GAP    = 6;
    const MARGIN = 12;
    const vw     = window.innerWidth;
    const vh     = window.innerHeight;

    // Vertical: prefer below trigger; flip above if no room.
    let top = anchorRect.bottom + GAP;
    if (top + panelH > vh - MARGIN) {
      top = anchorRect.top - GAP - panelH;
    }
    top = Math.max(MARGIN, Math.min(top, vh - panelH - MARGIN));

    // Horizontal: inline 左對齊游標；ⓘ 右對齊 trigger。皆 clamp 進視窗。
    let left = this.inline ? anchorRect.left : anchorRect.right - panelW;
    left = Math.max(MARGIN, Math.min(left, vw - panelW - MARGIN));

    this._panelEl.style.top    = top  + 'px';
    this._panelEl.style.left   = left + 'px';
    this._panelEl.style.bottom = 'auto';
    this._panelEl.style.right  = 'auto';
  }

  private _scheduleUpdate(): void {
    if (this._rafId !== null) return;
    this._rafId = requestAnimationFrame(() => {
      this._rafId = null;
      this._updatePosition();
    });
  }
}
