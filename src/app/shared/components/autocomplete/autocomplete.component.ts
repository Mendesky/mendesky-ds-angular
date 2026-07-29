import {
  Component, Input, Output, EventEmitter, HostListener, ElementRef,
  ApplicationRef, EnvironmentInjector, createComponent, ComponentRef, OnDestroy,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { AutocompletePanelComponent } from './autocomplete-panel.component';
import { PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';

export type AutocompleteSize = 'S' | 'M' | 'L';

export interface AutocompleteOption {
  value: string;
  label: string;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule, IconComponent, ErrorTooltipDirective],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
})
export class AutocompleteComponent implements OnDestroy {
  @Input() size: AutocompleteSize = 'L';
  @Input() placeholder = 'Placeholder';
  @Input() options: AutocompleteOption[] = [];
  @Input() set value(v: AutocompleteOption[]) {
    this._selected = v ? [...v] : [];
  }
  @Input() errorMessage = '';
  @Input() errorPosition: 'top' | 'bottom' = 'bottom';
  @Input() disabled = false;
  @Input() singleSelect = false;

  @Output() selectionChange = new EventEmitter<AutocompleteOption[]>();

  protected _selected: AutocompleteOption[] = [];
  protected inputValue = '';
  protected focused = false;
  protected showDropdown = false;
  protected activeIndex = -1;

  private readonly el = inject(ElementRef<HTMLElement>);
  private readonly appRef = inject(ApplicationRef);
  private readonly envInjector = inject(EnvironmentInjector);
  private readonly positioning = inject(PortalPositioningService);

  private panelRef: ComponentRef<AutocompletePanelComponent> | null = null;
  private _overlayRef: PortalOverlayRef | null = null;

  ngOnDestroy(): void {
    this.closePanel();
  }

  get hasSelection(): boolean {
    return this._selected.length > 0;
  }

  get filteredOptions(): AutocompleteOption[] {
    const q = this.inputValue.trim().toLowerCase();
    return this.options.filter(o => {
      const notSelected = !this._selected.find(s => s.value === o.value);
      const matched = !q || o.label.toLowerCase().includes(q);
      return notSelected && matched;
    });
  }

  get wrapClasses(): Record<string, boolean> {
    return {
      [`autocomplete-wrap--${this.size.toLowerCase()}`]: true,
      'autocomplete-wrap--disabled': this.disabled,
      'autocomplete-wrap--error':    !this.disabled && !!this.errorMessage,
      'autocomplete-wrap--focus':    !this.disabled && !this.errorMessage && this.focused,
      'autocomplete-wrap--actived':  !this.disabled && !this.errorMessage && !this.focused && this.hasSelection,
    };
  }

  onFocus(): void {
    if (this.disabled) return;
    this.focused = true;
    if (!this.panelRef) {
      this.showDropdown = true;
      this.openPanel();
    }
  }

  onBlur(): void {
    setTimeout(() => {
      this.focused = false;
      if (this.showDropdown) {
        this.showDropdown = false;
        this.closePanel();
        this.activeIndex = -1;
      }
    }, 150);
  }

  onInput(event: Event): void {
    this.inputValue = (event.target as HTMLInputElement).value;
    this.activeIndex = -1;
    if (!this.panelRef) {
      this.showDropdown = true;
      this.openPanel();
    } else {
      this.syncPanel();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled) return;
    const opts = this.filteredOptions;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.showDropdown) {
          this.showDropdown = true;
          this.openPanel();
          this.activeIndex = 0;
          this.syncPanel();
        } else {
          this.activeIndex = opts.length === 0 ? -1
            : Math.min(this.activeIndex + 1, opts.length - 1);
          this.syncPanel();
        }
        break;

      case 'ArrowUp':
        event.preventDefault();
        if (this.showDropdown && opts.length > 0) {
          this.activeIndex = Math.max(this.activeIndex - 1, 0);
          this.syncPanel();
        }
        break;

      case 'Enter': {
        if (this.showDropdown && this.activeIndex >= 0 && this.activeIndex < opts.length) {
          event.preventDefault();
          event.stopPropagation();
          this.selectOption(opts[this.activeIndex]);
        }
        break;
      }

      case 'Tab':
        if (this.showDropdown && this.activeIndex >= 0 && this.activeIndex < opts.length) {
          this.selectOption(opts[this.activeIndex]);
        }
        break;

      case 'Escape':
        if (this.showDropdown) {
          event.stopPropagation();
          this.showDropdown = false;
          this.closePanel();
          this.activeIndex = -1;
        }
        break;

      case 'Backspace':
        if (this.inputValue === '' && this._selected.length > 0) {
          this._selected = this._selected.slice(0, -1);
          this.selectionChange.emit(this._selected);
          this.syncPanel();
        }
        break;
    }
  }

  selectOption(option: AutocompleteOption): void {
    this._selected = this.singleSelect ? [option] : [...this._selected, option];
    this.inputValue = '';
    this.activeIndex = -1;
    this.selectionChange.emit(this._selected);

    if (this.singleSelect) {
      this.showDropdown = false;
      this.focused = false;
      this.closePanel();
    } else {
      this.syncPanel();
    }
  }

  removeItem(item: AutocompleteOption, event: MouseEvent): void {
    event.stopPropagation();
    this._selected = this._selected.filter(s => s.value !== item.value);
    this.selectionChange.emit(this._selected);
    this.syncPanel();
  }

  clearAll(event: MouseEvent): void {
    event.preventDefault();
    this._selected = [];
    this.inputValue = '';
    this.activeIndex = -1;
    this.selectionChange.emit([]);
    this.syncPanel();
  }

  private openPanel(): void {
    if (this.panelRef || this.disabled) return;
    const boxEl = this.el.nativeElement.querySelector('.autocomplete-box') as HTMLElement | null;
    if (!boxEl) return;
    const rect = boxEl.getBoundingClientRect();

    this.panelRef = createComponent(AutocompletePanelComponent, {
      environmentInjector: this.envInjector,
    });
    this.panelRef.setInput('options',     this.filteredOptions);
    this.panelRef.setInput('activeIndex', this.activeIndex);
    this.panelRef.setInput('width',       rect.width);

    this.panelRef.instance.optionClick.subscribe((opt: AutocompleteOption) => {
      this.selectOption(opt);
    });

    this.appRef.attachView(this.panelRef.hostView);
    document.body.appendChild(this.panelRef.location.nativeElement);

    this._overlayRef = this.positioning.attach(
      new ElementRef(boxEl),
      new ElementRef(this.panelRef.location.nativeElement as HTMLElement),
      {
        placement: 'bottom-start',
        gap: 4,
        // 手機（≤767px，打字時鍵盤在下方）：強制向下開、不翻轉（disableFlip）——向下開時面板頂端
        // 固定貼齊輸入框下緣，結果筆數變動只往下長、近輸入框那側不位移（可選得到）。
        // 桌機維持會翻轉（stableFlipHeight 讓翻轉決策穩定）。boundMaxHeight 動態限高不蓋滿鍵盤縮小的視窗。
        disableFlip: window.matchMedia('(max-width: 767px)').matches,
        stableFlipHeight: 240,
        boundMaxHeight: 240,
        trackScroll: true,
        scrollContainerStrategy: 'document',
        closeOnClickOutside: true,
        closeOnEscape: false,
        onClose: (reason) => {
          if (reason === 'manual') return;
          this.showDropdown = false;
          this.closePanel();
          this.activeIndex = -1;
          this.focused = false;
        },
      },
    );
  }

  private closePanel(): void {
    const ref = this._overlayRef;
    this._overlayRef = null;
    ref?.detach();
    if (!this.panelRef) return;
    this.appRef.detachView(this.panelRef.hostView);
    this.panelRef.destroy();
    this.panelRef = null;
  }

  private syncPanel(): void {
    if (!this.panelRef) return;
    this.panelRef.setInput('options',     this.filteredOptions);
    this.panelRef.setInput('activeIndex', this.activeIndex);
  }
}
