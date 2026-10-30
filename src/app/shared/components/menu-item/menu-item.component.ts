import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, Output, inject } from '@angular/core';
import { IconComponent } from '../icon/icon.component';
import { MENU_CONTEXT } from '../action-menu/menu-context';

export type MenuItemTone = 'neutral' | 'danger';

let nextId = 0;

/**
 * 選單選項：選單裡的每一項。可以執行一個動作（selected 不設），也可以是一組單選裡的一個值（selected 設 true／false）。
 *
 * 放在 app-action-menu 裡時，會向動作選單登記，動作選單因此進入選單模式；這時外框是 role="none"，
 * 內層按鈕是 menuitem（單選項是 menuitemradio＋aria-checked）。
 * 放在選單外（例如篩選視窗的排序區）時就是一般按鈕，單選項用 aria-pressed。
 */
@Component({
  selector: 'app-menu-item',
  standalone: true,
  imports: [IconComponent],
  templateUrl: './menu-item.component.html',
  styleUrls: ['./menu-item.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.role]': "inMenu ? 'none' : null",
    '[class.menu-item--in-menu]': 'inMenu',
  },
})
export class MenuItemComponent implements OnDestroy {
  // host: true：只找同一個範本裡包住它的 app-action-menu。包在使用端自己的元件裡時不再往外找，
  // 那個元件（例如一排選單外的排序選項）放進篩選面板，也不會把面板變成選單
  private readonly menu = inject(MENU_CONTEXT, { optional: true, host: true });

  /** 放在 app-action-menu 裡（選單模式）時為 true */
  readonly inMenu = this.menu !== null;
  /** 說明文字的 id，給內層按鈕的 aria-describedby 用 */
  readonly descriptionId = `app-menu-item-desc-${++nextId}`;

  /** 這一項要做什麼，或代表哪一個值 */
  @Input({ required: true }) label!: string;
  /** 文字下方的說明（選填）；有值時文字變成粗體標題（一般項目深色，危險項目維持紅字） */
  @Input() description = '';
  /** 文字左邊的 DS 圖示名稱（選填） */
  @Input() icon = '';
  /** danger＝紅字的危險動作 */
  @Input() tone: MenuItemTone = 'neutral';
  /** 停用：用 aria-disabled，選單裡鍵盤還停得到，點了沒反應 */
  @Input() disabled = false;
  /** null＝一般動作；true／false＝單選項的選中／未選中 */
  @Input() selected: boolean | null = null;

  /** 點擊或按 Enter／空白鍵執行時觸發；停用時不觸發 */
  @Output() itemClick = new EventEmitter<void>();

  constructor() {
    this.menu?.register(this);
  }

  ngOnDestroy(): void {
    this.menu?.unregister(this);
  }

  get isRadio(): boolean {
    return this.selected !== null && this.selected !== undefined;
  }

  get itemRole(): 'menuitem' | 'menuitemradio' | null {
    if (!this.inMenu) return null;
    return this.isRadio ? 'menuitemradio' : 'menuitem';
  }

  onClick(): void {
    // 停用沒用原生 disabled（選單裡方向鍵要停得到），點擊要自己攔下來
    if (this.disabled) return;
    this.itemClick.emit();
  }
}
