import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnDestroy,
  Output,
  inject,
} from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { DividerComponent } from '../divider/divider.component';
import { CloseReason, PortalOverlayRef, PortalPositioningService } from '../../services/portal-positioning.service';

/** 面板裡的一個連結：側欄的子頁面、麵包屑切換選單的頁面 */
export interface NavPanelLink {
  id: string;
  label: string;
  icon?: string;
  href: string;
}

/** 面板為什麼要收起：點外面、按 Esc、頁面捲動、視窗改大小 */
export type NavPanelDismissReason = 'click-outside' | 'escape' | 'scroll' | 'resize';

/** 面板跟錨點的距離：側欄子選單離母項目 8px、麵包屑選單離切換鈕 6px */
const SIDE_GAP = 8;
const BELOW_GAP = 6;
/** 子選單下方放不下時往上移，跟畫面邊緣留的距離 */
const VIEWPORT_MARGIN = 8;

/**
 * NavLinkPanelComponent — 浮出的連結面板（內部元件，不給使用端直接用）
 *
 * 側欄窄欄的子選單（side="right"）與麵包屑最後一節的切換選單（side="below"）共用。
 * 外框跟 action-menu 一樣；每一列是連結（不是 menu-item 按鈕），可以按住 Ctrl／⌘ 開新分頁；
 * 目前頁綠 85 底白字（側欄「選中」的顏色：這兩個選單都是導覽）。
 *
 * 一出現就搬到 body，交給浮層定位服務：層級由服務給，不會被側欄或頁首的外框裁掉、蓋住。
 * - right：上緣對齊錨點上緣、左邊離錨點 8px；下方放不下時往上移到整個面板在畫面裡。
 *   位置在打開那一刻算好，之後不追錨點；捲動讓錨點移位、視窗改大小時送出 dismiss，由使用端收起。
 *   捲動但錨點沒動（例如焦點把錨點捲進畫面那一下，在面板打開之前就捲完了）不收。
 * - below：切換鈕下方 6px、左邊對齊；服務負責翻面與跟著捲動。
 *
 * 動畫原點設在錨點那一側，看起來是從錨點長出來的（側欄子選單：母項目右緣、圖示中線）。
 * 離場由使用端把 leaving 設成 true，播完 150ms 再移除元件（減少動態時直接移除）。
 *
 * 鍵盤：面板在 body 底下，Tab 順序接不上錨點，所以由使用端處理錨點的 Tab。
 * 面板裡的 Tab、Shift＋Tab 由面板自己在連結之間移動（Safari 預設按 Tab 不停在連結上，交給瀏覽器會跳出面板）；
 * 「第一個連結 Shift＋Tab」「最後一個連結 Tab」送出 tabOut，讓使用端決定焦點去哪。
 */
@Component({
  selector: 'app-nav-link-panel',
  standalone: true,
  imports: [IconComponent, DividerComponent],
  templateUrl: './nav-link-panel.component.html',
  styleUrls: ['./nav-link-panel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'nav-link-panel',
    role: 'group',
    '[id]': 'panelId',
    '[class.nav-link-panel--right]': 'side === "right"',
    '[class.nav-link-panel--below]': 'side === "below"',
    '[class.nav-link-panel--leaving]': 'leaving',
    '[attr.aria-labelledby]': 'heading ? panelId + "-heading" : null',
    '[attr.aria-label]': 'heading ? null : ariaLabel',
  },
})
export class NavLinkPanelComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) links: readonly NavPanelLink[] = [];
  @Input() currentId: string | null = null;
  /** 第一行的標題（側欄子選單放母項目名稱），下面接分隔線。不給就沒有標題 */
  @Input() heading: string | null = null;
  /** 沒有標題時的群組名稱 */
  @Input() ariaLabel = '';
  @Input({ required: true }) panelId = '';
  @Input({ required: true }) anchor!: HTMLElement;
  @Input() side: 'right' | 'below' = 'right';
  /** 正在離場：播收起動畫、不接受滑鼠 */
  @Input() leaving = false;

  /** 左鍵單擊連結（沒按修飾鍵）。是否擋掉瀏覽器換頁由使用端決定 */
  @Output() linkClick = new EventEmitter<{ link: NavPanelLink; event: MouseEvent }>();
  @Output() dismiss = new EventEmitter<NavPanelDismissReason>();
  /** 最後一個連結按 Tab（forward）、第一個連結按 Shift＋Tab（backward） */
  @Output() tabOut = new EventEmitter<{ direction: 'forward' | 'backward'; event: KeyboardEvent }>();

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly positioning = inject(PortalPositioningService);
  private readonly zone = inject(NgZone);
  private overlayRef: PortalOverlayRef | null = null;
  private destroyed = false;
  /** right：打開時錨點的位置。捲動後錨點離開這個位置，子選單就對不上了 */
  private anchorAt: { top: number; left: number } | null = null;

  private readonly onScroll = (event: Event) => {
    // 面板自己裡面捲動不算
    if (event.target instanceof Node && this.el.nativeElement.contains(event.target)) return;
    if (this.anchorAt) {
      const r = this.anchor.getBoundingClientRect();
      if (Math.abs(r.top - this.anchorAt.top) < 0.5 && Math.abs(r.left - this.anchorAt.left) < 0.5) return;
    }
    this.emitDismiss('scroll');
  };
  private readonly onResize = () => this.emitDismiss('resize');

  /** 連結列的 DOM，給使用端搬焦點 */
  linkElements(): HTMLAnchorElement[] {
    return Array.from(this.el.nativeElement.querySelectorAll<HTMLAnchorElement>('a.nav-link-panel__link'));
  }

  /** 焦點移到目前頁那一列，沒有就第一列 */
  focusCurrentOrFirst(): void {
    const links = this.linkElements();
    const i = this.links.findIndex(l => l.id === this.currentId);
    (links[i] ?? links[0])?.focus();
  }

  focusFirst(): void {
    this.linkElements()[0]?.focus();
  }

  contains(node: Node | null): boolean {
    return !!node && this.el.nativeElement.contains(node);
  }

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;
    document.body.appendChild(host);
    const onClose = (reason: CloseReason) => {
      if (reason === 'click-outside' || reason === 'escape') this.emitDismiss(reason);
    };

    if (this.side === 'right') {
      const r = this.anchor.getBoundingClientRect();
      this.anchorAt = { top: r.top, left: r.left };
      // 進場動畫一開始就把外框縮小，getBoundingClientRect 量到的是縮放後的高度；用排版高度（含小數）
      const h = parseFloat(getComputedStyle(host).height) || host.offsetHeight;
      const top = Math.max(VIEWPORT_MARGIN, Math.min(r.top, window.innerHeight - h - VIEWPORT_MARGIN));
      const left = r.right + SIDE_GAP;
      // 原點：母項目右緣（面板左邊再往左 8px）、母項目的垂直中線
      host.style.transformOrigin = `-${SIDE_GAP}px ${Math.round(r.top + r.height / 2 - top)}px`;
      this.overlayRef = this.positioning.attachAtPoint(left, top, this.el, {
        placement: 'bottom-start',
        gap: 0,
        disableFlip: true,
        trackScroll: false,
        closeOnClickOutside: true,
        closeOnEscape: true,
        ancestorAnchorEl: this.anchor,
        onClose,
      });
      this.zone.runOutsideAngular(() => {
        document.addEventListener('scroll', this.onScroll, { capture: true, passive: true });
        window.addEventListener('resize', this.onResize, { passive: true });
      });
    } else {
      const r = this.anchor.getBoundingClientRect();
      host.style.transformOrigin = `${Math.round(r.width / 2)}px -${BELOW_GAP}px`;
      this.overlayRef = this.positioning.attach(new ElementRef(this.anchor), this.el, {
        placement: 'bottom-start',
        gap: BELOW_GAP,
        trackScroll: true,
        scrollContainerStrategy: 'document',
        closeOnClickOutside: true,
        closeOnEscape: true,
        onClose,
        // 翻到上方時原點改在面板下緣外面（切換鈕那一側）
        onPlacementChange: (p) => {
          host.style.transformOrigin = p.startsWith('top')
            ? `${Math.round(r.width / 2)}px calc(100% + ${BELOW_GAP}px)`
            : `${Math.round(r.width / 2)}px -${BELOW_GAP}px`;
        },
      });
    }
    // 服務下一幀才定位；先同步算一次，第一幀就在對的位置，不會從頁面底部閃一下
    this.overlayRef.reposition();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    document.removeEventListener('scroll', this.onScroll, { capture: true } as EventListenerOptions);
    window.removeEventListener('resize', this.onResize);
    this.overlayRef?.detach();
    this.overlayRef = null;
    const host = this.el.nativeElement;
    if (host.parentNode === document.body) host.remove();
  }

  onLinkClick(event: MouseEvent, link: NavPanelLink): void {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    this.linkClick.emit({ link, event });
  }

  onLinkKeydown(event: KeyboardEvent, index: number): void {
    if (event.key !== 'Tab') return;
    const last = this.links.length - 1;
    if (!event.shiftKey && index === last) this.tabOut.emit({ direction: 'forward', event });
    else if (event.shiftKey && index === 0) this.tabOut.emit({ direction: 'backward', event });
    else {
      event.preventDefault();
      this.linkElements()[event.shiftKey ? index - 1 : index + 1]?.focus();
    }
  }

  private emitDismiss(reason: NavPanelDismissReason): void {
    if (this.destroyed || this.leaving) return;
    this.zone.run(() => this.dismiss.emit(reason));
  }
}
