import {
  Component, Input, Output, EventEmitter, signal, computed,
  ViewChild, ElementRef, OnDestroy, forwardRef,
  ApplicationRef, EnvironmentInjector, createComponent,
  ComponentRef, HostListener, effect,
 ChangeDetectionStrategy, } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { SelectPanelComponent } from './select-panel.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';

export interface SelectOption {
  value: any;
  label: string;
  disabled?: boolean;
}

function optionsEqual(a: SelectOption[], b: SelectOption[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (
      a[i].value !== b[i].value ||
      a[i].label !== b[i].label ||
      a[i].disabled !== b[i].disabled
    ) {
      return false;
    }
  }
  return true;
}

@Component({
  selector: 'app-select',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  providers: [{
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => SelectComponent),
    multi: true,
  }],
  templateUrl: './select.component.html',
  styleUrls: ['./select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SelectComponent implements ControlValueAccessor, OnDestroy {
  @ViewChild('triggerWrap')  triggerWrapRef!:  ElementRef<HTMLDivElement>;
  @ViewChild('triggerInput') triggerInputRef!: ElementRef<HTMLInputElement>;
  @ViewChild('triggerDiv')   triggerDivRef!:   ElementRef<HTMLDivElement>;

  private readonly _options = signal<SelectOption[]>([], { equal: optionsEqual });
  @Input() set options(val: SelectOption[]) { this._options.set(val ?? []); }
  @Input() placeholder = '請選擇';
  @Input() errorMessage = '';
  @Input() size: 'S' | 'M' | 'L' = 'M';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';
  @Input() searchable = false;
  @Input() clearable = false;
  @Input() set disabled(val: boolean) { this.isDisabled.set(val); }

  /* ── 內部狀態 ── */
  value       = signal<any>(null);
  isDisabled  = signal(false);
  isOpen      = signal(false);
  inputText   = signal('');
  activeIndex = signal(-1);
  isFocused   = signal(false);

  /** 已選項目的顯示文字 */
  displayLabel = computed(() =>
    this._options().find(o => o.value === this.value())?.label ?? ''
  );

  /** 是否有選中值（用於 --actived 狀態） */
  hasValue = computed(() => this.value() !== null && this.value() !== undefined);

  /** 取得目前 trigger 元素（div 或 input，由 searchable 決定） */
  private get triggerEl(): HTMLElement | undefined {
    return this.searchable
      ? this.triggerInputRef?.nativeElement
      : this.triggerDivRef?.nativeElement;
  }

  inputDisplayValue = computed(() =>
    this.isOpen() ? this.inputText() : this.displayLabel()
  );

  inputPlaceholder = computed(() =>
    this.isOpen() ? (this.displayLabel() || this.placeholder) : this.placeholder
  );

  filteredOptions = computed(() => {
    const q = this.inputText().trim().toLowerCase();
    const opts = this._options();
    return q
      ? opts.filter(o => o.label.toLowerCase().includes(q))
      : opts;
  });

  get hasError(): boolean { return !!this.errorMessage; }

  /* ── Portal 相關 ── */
  private panelRef: ComponentRef<SelectPanelComponent> | null = null;
  private _overlayRef: PortalOverlayRef | null = null;

  constructor(
    private appRef:      ApplicationRef,
    private envInjector: EnvironmentInjector,
    private positioning: PortalPositioningService,
  ) {
    /* filteredOptions 變動時即時同步到 panel */
    effect(() => {
      const opts = this.filteredOptions();
      this.panelRef?.setInput('options', opts);
    });
  }

  /* ── CVA ── */
  private onChange  = (_: any) => {};
  private onTouched = () => {};

  writeValue(val: any): void        { this.value.set(val ?? null); }
  registerOnChange(fn: any): void   { this.onChange = fn; }
  registerOnTouched(fn: any): void  { this.onTouched = fn; }
  setDisabledState(d: boolean): void { this.isDisabled.set(d); }

  clearValue(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.value.set(null);
    this.onChange(null);
    this.onTouched();
  }

  /* ── 事件處理 ── */

  /**
   * 滑鼠點擊旗標：pointerdown 時設為 true，click 結束後重置。
   * 防止 focus 事件（由滑鼠點擊觸發）與 click 事件競爭，
   * 造成 panel 開了又馬上被 close() 關掉。
   */
  private _pointerIsDown = false;
  /** iOS Safari 安全網：選取選項後補 focus 期間，暫時阻擋 onTriggerFocus 重新開啟面板 */
  private _restoring = false;

  onWrapPointerdown(e: PointerEvent): void {
    e.stopPropagation();
    this._pointerIsDown = true;
  }

  onWrapClick(): void {
    this._pointerIsDown = false;
    if (this.isDisabled()) return;
    this.isOpen() ? this.close() : this.open();
  }

  /** focus 事件（Tab 進入或滑鼠點擊）— 不自動開 panel，僅標記 isFocused */
  onTriggerFocus(): void { this.isFocused.set(true); }

  onTriggerBlur(): void { this.isFocused.set(false); }

  onInput(e: Event): void {
    const val = (e.target as HTMLInputElement).value;
    this.inputText.set(val);
    if (!this.isOpen()) this.open();
    this.setActiveIndex(-1);
  }

  onKeydown(e: KeyboardEvent): void {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        if (!this.isOpen()) {
          this.open();
          if (this.activeIndex() === -1) this.setActiveIndex(0);
        } else {
          this.moveActive(1);
        }
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (!this.isOpen()) {
          this.open();
          if (this.activeIndex() === -1) {
            this.setActiveIndex(this.filteredOptions().length - 1);
          }
        } else {
          this.moveActive(-1);
        }
        break;
      case 'Enter':
      case ' ':
        if (this.isOpen()) {
          e.preventDefault();
          e.stopPropagation();
          this.confirmActive();
        } else if (!this.isDisabled()) {
          e.preventDefault();
          e.stopPropagation();
          this.open();
          if (this.activeIndex() === -1) this.setActiveIndex(0);
        }
        break;
      case 'Tab':
        if (this.isOpen()) this.confirmActive();
        break;
      case 'Escape':
        if (this.isOpen()) {
          e.stopPropagation();
        }
        this.close();
        this.triggerEl?.blur();
        break;
    }
  }

  private setActiveIndex(idx: number): void {
    this.activeIndex.set(idx);
    this.panelRef?.setInput('activeIndex', idx);
  }

  private moveActive(dir: 1 | -1): void {
    const opts = this.filteredOptions();
    if (opts.length === 0) return;
    const current = this.activeIndex();
    let next = current === -1
      ? (dir === 1 ? 0 : opts.length - 1)
      : (current + dir + opts.length) % opts.length;
    let attempts = 0;
    while (opts[next]?.disabled && attempts < opts.length) {
      next = (next + dir + opts.length) % opts.length;
      attempts++;
    }
    this.setActiveIndex(next);
  }

  private confirmActive(): void {
    const idx  = this.activeIndex();
    const opts = this.filteredOptions();
    if (idx >= 0 && idx < opts.length && !opts[idx].disabled) {
      this.value.set(opts[idx].value);
      this.onChange(opts[idx].value);
    }
    this.close();
  }

  /* ── Panel 開關 ── */

  open(): void {
    if (this.panelRef || this.isDisabled()) return;

    const rect = this.triggerWrapRef.nativeElement.getBoundingClientRect();

    this.panelRef = createComponent(SelectPanelComponent, {
      environmentInjector: this.envInjector,
    });

    const initIdx = this.filteredOptions().findIndex(o => o.value === this.value());
    this.activeIndex.set(initIdx);

    this.panelRef.setInput('options',      this.filteredOptions());
    this.panelRef.setInput('activeIndex',  initIdx);
    this.panelRef.setInput('width',        rect.width);

    this.panelRef.instance.optionSelected.subscribe((val: any) => {
      this.value.set(val);
      this.onChange(val);
      this.close();
      // iOS Safari 安全網：touchend 可能比 mousedown 更早 blur 觸發 input，
      // 此處補 focus 讓後續 focusout（使用者真正離開 section 時）能正常觸發。
      this._restoring = true;
      this.triggerEl?.focus();
      setTimeout(() => this._restoring = false);
    });

    this.appRef.attachView(this.panelRef.hostView);
    document.body.appendChild(this.panelRef.location.nativeElement);
    this.isOpen.set(true);
    this.triggerEl?.focus();

    this._overlayRef = this.positioning.attach(
      this.triggerWrapRef,
      new ElementRef(this.panelRef.location.nativeElement as HTMLElement),
      {
        placement: 'bottom-start',
        gap: 4,
        trackScroll: true,
        scrollContainerStrategy: 'document',
        closeOnClickOutside: true,
        closeOnEscape: false,
        onClose: (reason) => {
          if (reason === 'manual') return;
          this.close();
        },
      },
    );
  }

  close(): void {
    if (!this.panelRef) return;
    const ref = this._overlayRef;
    this._overlayRef = null;
    ref?.detach();
    this.appRef.detachView(this.panelRef.hostView);
    this.panelRef.destroy();
    this.panelRef = null;
    this.inputText.set('');
    this.activeIndex.set(-1);
    this.isOpen.set(false);
    this.onTouched();
  }

  ngOnDestroy(): void { this.close(); }
}
