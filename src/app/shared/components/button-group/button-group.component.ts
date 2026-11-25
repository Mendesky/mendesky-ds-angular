import {
  Component, Input, Output, EventEmitter,
  ElementRef, OnChanges, SimpleChanges, QueryList, ViewChildren,
  inject, signal,
 ChangeDetectionStrategy, isDevMode, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';
import { IconComponent } from '../icon/icon.component';

export interface ButtonGroupOption {
  value: string;
  /** 選項名稱。有 icon 時不顯示在畫面上，改當報讀名稱（aria-label）與滑過提示 */
  label: string;
  disabled?: boolean;
  /** 圖示名稱（同 app-icon 的 name）。有值時按鈕只放圖示；建議只用在 view 型。只放圖示的選項不要停用（停用時提示出不來），要停用請改放文字 */
  icon?: string;
  /**
   * 這個選項帶一個選單（例：「走勢」再選畫金額或件數）。只有 view 型的文字選項能帶；有 icon 或不是 view 型時不畫箭頭（開發模式會提醒）。
   * 選中後再按一次（滑鼠、Enter、空白鍵）是開關選單（送出 menuToggle），沒選中時按下去照舊是選它。
   * 選單本身由使用端放：app-action-menu 的 anchorEl 給 menuAnchor()，按這顆才不會被當成點選單外面。
   */
  menu?: ButtonGroupOptionMenu;
}

export interface ButtonGroupOptionMenu {
  /** 選單目前選的值（例：「金額」）：報讀念「走勢，目前：金額」，滑過提示「走勢：金額」。 */
  hint?: string;
}

export type ButtonGroupType = 'form' | 'round' | 'view';

/**
 * 選中的顏色看用途，不看喜好：
 * - progress＝綠：跟填寫進度有關的作答。form 型不設 color 就是這個。
 * - primary＝深藍：選了以後畫面上顯示的東西會變（篩掉一部分資料、換一種排法）。
 * - neutral＝深灰：只是偏好的設定（單位、字級）。
 * view 型不拿來作答：不設或設 progress 都是深灰。round 型不吃 color。
 */
export type ButtonGroupColor = 'progress' | 'primary' | 'neutral';

@Component({
  selector: 'app-button-group',
  standalone: true,
  imports: [CommonModule, ErrorTooltipDirective, TooltipDirective, IconComponent],
  templateUrl: './button-group.component.html',
  styleUrls: ['./button-group.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ButtonGroupComponent implements OnChanges {
  private el = inject(ElementRef);

  @Input() type: ButtonGroupType = 'form';
  @Input() size: 'S' | 'M' | 'L' = 'L';
  @Input() color?: ButtonGroupColor;
  @Input() options: ButtonGroupOption[] = [];
  @Input() value: string | null = null;
  @Input() disabled = false;
  @Input() errorMessage = '';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';

  /** 帶選單的選項（選中那顆）的選單開著沒（使用端管）：箭頭轉向、aria-expanded 跟著它，開著時這顆的滑過提示收起。 */
  @Input() menuOpen = false;

  @Output() valueChange = new EventEmitter<string>();
  /** 按了選中、帶選單的那顆：要打開（true）或關上（false）選單。 */
  @Output() menuToggle = new EventEmitter<boolean>();

  @ViewChildren('btn') private btnRefs?: QueryList<ElementRef<HTMLButtonElement>>;

  /** 目前可 Tab 進入的項目索引（roving tabindex 模式） */
  focusIndex = signal(0);

  /** trackBy for *ngFor — options.value 在同一組內必須唯一 */
  trackByOptionValue = (_i: number, opt: ButtonGroupOption) => opt.value;

  /** 實際用的選中色：form 型不設是 progress；view 型只認 primary，其餘都是 neutral */
  get resolvedColor(): ButtonGroupColor {
    if (this.type === 'form') return this.color ?? 'progress';
    return this.color === 'primary' ? 'primary' : 'neutral';
  }

  get hasError(): boolean {
    return this.type === 'form' && !!this.errorMessage;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['options'] || changes['value'] || changes['disabled']) {
      this.focusIndex.set(this.resolveInitialFocus());
    }
    if (changes['options'] || changes['disabled']) {
      this.warnDisabledIconOption();
    }
    if (changes['options'] || changes['type']) {
      this.warnUnsupportedMenu();
    }
    this.closeMenuIfTriggerGone(changes);
  }

  /**
   * 選單開著時觸發鈕沒了資格（整組或那一項停用、value 被外面改成別的、拿掉 menu）：送 menuToggle(false) 讓使用端關選單，
   * 不然選單會留在一顆已經不是觸發鈕的按鈕下面。在變更偵測之後才送，使用端在這一輪改狀態會觸發 ExpressionChanged 錯誤。
   */
  private closeMenuIfTriggerGone(changes: SimpleChanges): void {
    const relevant = changes['options'] || changes['value'] || changes['disabled'] || changes['type'] || changes['menuOpen'];
    if (!relevant || !this.menuOpen || this.options.some(o => this.isMenuTrigger(o))) return;
    void Promise.resolve().then(() => {
      if (this.menuOpen && !this.options.some(o => this.isMenuTrigger(o))) this.menuToggle.emit(false);
    });
  }

  /** 這個選項畫不畫選單箭頭：只有 view 型的文字選項能帶選單。 */
  hasMenu(opt: ButtonGroupOption): boolean {
    return !!opt.menu && this.type === 'view' && !opt.icon;
  }

  /** 按這顆是開關選單（不是選取）：帶選單、而且已經選中、沒停用。 */
  isMenuTrigger(opt: ButtonGroupOption): boolean {
    return this.hasMenu(opt) && this.value === opt.value && !this.disabled && !opt.disabled;
  }

  /** 選單要對齊的按鈕（選中、帶選單的那顆）；給使用端放的 app-action-menu 當 anchorEl。沒有這顆時是 null。 */
  menuAnchor(): HTMLElement | null {
    const idx = this.options.findIndex(o => this.isMenuTrigger(o));
    return idx < 0 ? null : this.btnRefs?.get(idx)?.nativeElement ?? null;
  }

  /** 報讀名稱：只放圖示念選項名稱；帶選單、有目前值念「走勢，目前：金額」；其他念畫面上的字（不設）。 */
  ariaLabelOf(opt: ButtonGroupOption): string | null {
    if (opt.icon) return opt.label;
    if (this.hasMenu(opt) && opt.menu?.hint) return `${opt.label}，目前：${opt.menu.hint}`;
    return null;
  }

  /**
   * 滑過提示：只放圖示提示選項名稱；帶選單、有目前值提示「走勢：金額」（目前值不在畫面上）；其他不提示。
   * 選單開著時這顆不提示：提示和選單都往下出，會疊在一起（Safari 點按鈕不給焦點、不會 blur，提示要等滑鼠離開才收）。
   */
  tooltipOf(opt: ButtonGroupOption): string {
    if (opt.icon) return opt.label;
    if (this.isMenuTrigger(opt) && this.menuOpen) return '';
    if (this.hasMenu(opt) && opt.menu?.hint) return `${opt.label}：${opt.menu.hint}`;
    return '';
  }

  /**
   * 選中、帶選單那顆：開關選單（看 menuOpen）。這一下 click 不往外冒：開選單的同一下點擊再傳到外層，
   * 外層聽 click 的東西（例如整列點了會展開的卡片標題）會把它當成點了自己。其他選項照常往外冒。
   * 選單要用 menuAnchor() 對齊：按這顆時定位服務不把它算成點外面，選單到 click 時還開著，送的是「關」。
   */
  onItemClick(opt: ButtonGroupOption, event: Event): void {
    if (this.isMenuTrigger(opt)) {
      event.stopPropagation();
      this.menuToggle.emit(!this.menuOpen);
      return;
    }
    this.select(opt.value);
  }

  /** 開發模式：選項設了 menu 卻畫不出箭頭（不是 view 型、或只放圖示）時提醒一次。 */
  private warnedMenu = false;
  private warnUnsupportedMenu(): void {
    if (!isDevMode() || this.warnedMenu) return;
    const hit = this.options.find(o => o.menu && (this.type !== 'view' || o.icon));
    if (!hit) return;
    this.warnedMenu = true;
    console.warn(`[app-button-group] 選項「${hit.label}」設了 menu，但只有 view 型的文字選項能帶選單，這一格不會畫箭頭。`);
  }

  /**
   * 開發模式：只放圖示的選項不要停用（單一選項或整組都算）。
   * 停用的按鈕滑鼠碰不到、鍵盤停不上去，滑過提示出不來，看畫面的人就不知道它叫什麼。
   * 要停用的選項請改放文字（拿掉 icon）。每個元件只提醒一次。
   */
  private warnedDisabledIcon = false;
  private warnDisabledIconOption(): void {
    if (!isDevMode() || this.warnedDisabledIcon) return;
    const hit = this.options.find(o => o.icon && (o.disabled || this.disabled));
    if (!hit) return;
    this.warnedDisabledIcon = true;
    console.warn(`[app-button-group] 只放圖示的選項「${hit.label}」被停用了。停用時滑過提示不會出現，看畫面的人不知道它叫什麼。要停用的選項請改放文字（拿掉 icon）。`);
  }

  select(val: string): void {
    if (!this.disabled && this.value !== val) {
      this.valueChange.emit(val);
    }
  }

  onKeydown(event: KeyboardEvent, currentIdx: number): void {
    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        const next = this.findNextEnabled(currentIdx, 1);
        this.moveFocus(next);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        const prev = this.findNextEnabled(currentIdx, -1);
        this.moveFocus(prev);
        break;
      }
      case 'Enter': {
        const opt = this.options[currentIdx];
        if (!opt || opt.disabled || this.disabled) {
          event.preventDefault();
          break;
        }
        if (this.isMenuTrigger(opt)) {
          // 選中、帶選單那顆：Enter 開關選單，不再冒泡給外層（wizard 的 onFormEnter 不會同時跳下一步）；
          // 擋原生 click，免得開了又關。按住不放的連發不算
          event.preventDefault();
          event.stopPropagation();
          if (!event.repeat) this.onItemClick(opt, event);
          break;
        }
        if (this.value === opt.value) {
          break;
        }
        event.preventDefault();
        this.select(opt.value);
        break;
      }
      case ' ': {
        event.preventDefault();
        const opt = this.options[currentIdx];
        // 按住不放的連發不算：不然選單會一直開開關關
        if (opt && !opt.disabled && !this.disabled && !event.repeat) {
          // 選中、帶選單的那顆：空白鍵開關選單（同滑鼠按）
          this.onItemClick(opt, event);
        }
        break;
      }
    }
  }

  /**
   * 找初始 focus 位置：
   * 有選取值且該項未 disabled → 選取項
   * 否則 → 第一個 enabled 項
   * 全部 disabled → 0（防守性 fallback）
   */
  private resolveInitialFocus(): number {
    if (this.value !== null) {
      const selectedIdx = this.options.findIndex(o => o.value === this.value);
      if (selectedIdx >= 0 && !this.options[selectedIdx].disabled && !this.disabled) {
        return selectedIdx;
      }
    }
    const firstEnabled = this.options.findIndex(o => !o.disabled);
    return firstEnabled >= 0 ? firstEnabled : 0;
  }

  /** 設定 focusIndex 並把 DOM 焦點移到對應 button */
  private moveFocus(idx: number): void {
    this.focusIndex.set(idx);
    const buttons = (this.el.nativeElement as HTMLElement)
      .querySelectorAll<HTMLElement>('.btn-group__item');
    buttons[idx]?.focus();
  }

  /** 從 from 開始往 dir 方向找下一個 enabled 項（循環） */
  private findNextEnabled(from: number, dir: number): number {
    const len = this.options.length;
    let idx = from;
    for (let i = 0; i < len; i++) {
      idx = (idx + dir + len) % len;
      if (!this.options[idx].disabled && !this.disabled) return idx;
    }
    return from; // 全部 disabled → 不移動
  }
}
