import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TooltipDirective } from '../../directives/tooltip/tooltip.directive';
import { TooltipPortalDirection } from '../../directives/tooltip/tooltip-portal.component';
import { SpinnerComponent, SpinnerSize } from '../spinner/spinner.component';

/** 圖示尺寸 — 對應 Figma IconBtn size 參數 */
export type IconBtnSize = '12' | '16-' | '16' | '24' | '32' | '36' | '48';

/**
 * 按鈕外觀類型
 * - Normal             : 標準圓形，白底，hover 轉藍，active 狀態轉綠
 * - Warning            : 白底紅色圖示，hover 轉紅底白圖示（刪除/危險操作）
 * - CardBtn            : 灰底（#e7e7e7），hover 加深，用於卡片操作按鈕
 * - CardBtnPdSmall     : 白底，padding 較小，與 Normal 相同 hover 行為
 * - Modal              : 透明底 + 白色邊框，灰色 hover（用於 Modal / 玻璃背景上的關閉）
 * - SectionBtn         : 透明底，灰色 hover（用於區段標題）
 * - Drag               : 拖曳把手，透明底，cursor: grab
 * - Block              : 矩形（非圓形），白底，padding 非對稱（6px h / 1px v）
 * - Block-Transparent  : 矩形（非圓形），透明底，同 Block 尺寸
 * - Icon+Text          : 圓形灰底 + 下方文字標籤，垂直排列（需搭配 label input）
 * - PrimaryFilled      : 實心主色、白色圖示、圓角方形；頁面主要的新增入口（例：頁首新增鈕），搭配 size="12"。
 *                        外觀同全域 .app-action-cta-btn：滑過 85% 不透明、停用 40% 不透明
 */
export type IconBtnClass =
  | 'Normal' | 'Warning' | 'CardBtn' | 'CardBtnPdSmall'
  | 'Modal' | 'SectionBtn' | 'Drag' | 'Block' | 'Block-Transparent'
  | 'Icon+Text' | 'PrimaryFilled';

/** aria-haspopup 的值：這顆按鈕會打開哪一種浮層。目前只開放 'menu'（打開放了 app-menu-item 的 app-action-menu） */
export type IconBtnAriaHaspopup = 'menu';

@Component({
  selector: 'app-icon-btn',
  standalone: true,
  imports: [CommonModule, TooltipDirective, SpinnerComponent],
  templateUrl: './icon-btn.component.html',
  styleUrls: ['./icon-btn.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconBtnComponent {
  /** 圖示尺寸（對應 Figma size 參數） */
  @Input() size: IconBtnSize = '24';

  /** 按鈕外觀類型 */
  @Input() propClass: IconBtnClass = 'Normal';

  /** 啟用（Actived）狀態，顯示綠色底 */
  @Input() active = false;

  /**
   * 是否為切換按鈕（toggle button）。
   * 設為 true 時輸出 `aria-pressed` 屬性給輔助科技（依 `active` 同步 true/false）；
   * 預設 false 時不輸出 `aria-pressed`，避免被讀屏軟體誤判為切換鈕。
   * 參考 WAI-ARIA Button Pattern（toggle button）。
   */
  @Input() toggle = false;

  /** 停用狀態 */
  @Input() disabled = false;

  /**
   * 載入中：app-spinner 取代圖示，點了不送出。
   * 不加原生 disabled（焦點所在的按鈕一停用，焦點就掉到頁面最上面），改用 aria-busy＋aria-disabled；
   * 也不淡化（停用的 50% 會讓轉圈對比掉到 3:1 以下）。同時設了 disabled 時以 disabled 為準。
   */
  @Input() loading = false;

  /** 轉圈大小；null＝跟 size 走（12→12、16-／16→16、24／32→24、36／48→36）。投影的圖示比 size 小時（例：size 24 放 16px 圖示）指定成圖示的大小 */
  @Input() loadingSize: SpinnerSize | null = null;

  /**
   * 載入中要念給報讀軟體聽的話（例：「產生 PDF 中…」）。設了就在按鈕外面放一個一直存在、視覺上隱藏的 role="status"，
   * 載入中填入這段文字，結束後清空。空字串＝不放。tooltip 換字報讀軟體不會念，要念就設這個。
   */
  @Input() loadingLabel = '';

  /** 無障礙標籤（建議每個 icon-btn 都設定） */
  @Input() ariaLabel = '';

  /** 這顆按鈕會打開選單（aria-haspopup，落在內層 button）；null＝不輸出。Safari 關閉選單後要同時有它和 ariaExpanded 才認得出觸發鈕 */
  @Input() ariaHaspopup: IconBtnAriaHaspopup | null = null;

  /** 選單現在開著沒（aria-expanded，落在內層 button）；null＝不輸出，true／false 照實輸出 */
  @Input() ariaExpanded: boolean | null = null;

  /** 文字標籤（僅 Icon+Text 模式顯示，呈現在圓形按鈕下方） */
  @Input() label = '';

  /** tooltip 文字，有值才顯示 */
  @Input() tooltip = '';

  /** tooltip 箭頭方向（同 app-tooltips propClass）：Down = 在上方、Top = 在下方 */
  @Input() tooltipPos: 'Down' | 'Top' | 'Left' | 'Right' = 'Down';

  /**
   * 鍵盤快速鍵提示文字（e.g. "⌘N" 或 "Ctrl+N"）
   * 有值時自動 append 到 tooltip，顯示為「tooltip（shortcutHint）」
   */
  @Input() shortcutHint = '';

  @Output() btnClick = new EventEmitter<void>();

  private readonly SIZE_CSS: Record<IconBtnSize, string> = {
    '12':  'icon-btn--2xs',
    '16-': 'icon-btn--xs',
    '16':  'icon-btn--sm',
    '24':  'icon-btn--md',
    '32':  'icon-btn--lg',
    '36':  'icon-btn--xl',
    '48':  'icon-btn--2xl',
  };

  private readonly CLASS_CSS: Record<IconBtnClass, string> = {
    'Normal':            'icon-btn--normal',
    'Warning':           'icon-btn--warning',
    'CardBtn':           'icon-btn--card-btn',
    'CardBtnPdSmall':    'icon-btn--card-btn-pd-small',
    'Modal':             'icon-btn--modal',
    'SectionBtn':        'icon-btn--section-btn',
    'Drag':              'icon-btn--drag',
    'Block':             'icon-btn--block',
    'Block-Transparent': 'icon-btn--block-transparent',
    'Icon+Text':         'icon-btn--icon-text',
    'PrimaryFilled':     'icon-btn--primary-filled',
  };

  private readonly SPINNER_SIZE: Record<IconBtnSize, SpinnerSize> = {
    '12': '12', '16-': '16', '16': '16', '24': '24', '32': '24', '36': '36', '48': '36',
  };

  /** 載入中且沒有停用（停用時以停用為準） */
  get busy(): boolean {
    return this.loading && !this.disabled;
  }

  get spinnerSize(): SpinnerSize {
    return this.loadingSize ?? this.SPINNER_SIZE[this.size] ?? '16';
  }

  get hostClasses(): Record<string, boolean> {
    return {
      [this.SIZE_CSS[this.size]]: true,
      [this.CLASS_CSS[this.propClass]]: true,
      'icon-btn--active': this.active,
      'icon-btn--loading': this.busy,
    };
  }

  /** 合併 tooltip 與 shortcutHint，供 template 顯示用 */
  get displayTooltip(): string {
    if (!this.shortcutHint) return this.tooltip;
    return this.tooltip ? `${this.tooltip}（${this.shortcutHint}）` : this.shortcutHint;
  }

  /** 將 legacy tooltipPos（箭頭方向）轉換為 TooltipDirective 的 direction（tooltip 位置） */
  get resolvedTooltipDir(): TooltipPortalDirection {
    const map: Record<string, TooltipPortalDirection> = {
      'Down':  'top',
      'Top':   'bottom',
      'Left':  'right',
      'Right': 'left',
    };
    return map[this.tooltipPos] ?? 'top';
  }

  onClick(): void {
    if (!this.disabled && !this.loading) this.btnClick.emit();
  }

  /**
   * 載入中擋下 click，不讓它傳到外層（使用端直接綁在 app-icon-btn 上的 (click)）。
   * 載入中按鈕 pointer-events: none，滑鼠實際點到的是這個外框；鍵盤 Enter／空白鍵的 click 從按鈕冒上來，也在這裡擋。
   */
  onWrapClick(event: Event): void {
    if (this.busy) event.stopPropagation();
  }
}
