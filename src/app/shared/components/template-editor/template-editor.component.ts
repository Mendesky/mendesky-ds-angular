import {
  Component, Input, Output, EventEmitter, NgZone, inject,
  ElementRef, ViewChild, AfterViewInit, OnChanges, OnDestroy, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { TemplateVarPanelComponent } from '../template-var-panel/template-var-panel.component';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { ButtonComponent } from '../button/button.component';
import { TemplateVarDef, TemplateVarContext } from '../../models/template-var.model';
import { detectInlineTrigger } from '../../utils/inline-trigger';
import { splitTemplateVarRe, fullTemplateVarRe, endTemplateVarRe, globalTemplateVarRe } from '../../utils/template-var-key';

/** 自訂拖曳型別：只用來讓瀏覽器承認這是合法拖曳，不設 text/plain（避免把 `%Key%` 字面
 *  字串灑進外部 drop target，例如 p4-6-notes 那類讀 text/plain 決定重排的宿主）。 */
const DRAG_MIME = 'application/x-mendesky-template-var';

/** 拖曳縮圖的寬度上限（px）。夠放約 10 個中文字，超出以省略號截斷。 */
const GHOST_MAX_WIDTH = 160;

const CARET_SVG = '<svg class="tpl__caret" viewBox="0 0 24 24" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.83586 7.88323C5.22639 7.4927 5.85955 7.4927 6.25008 7.88323L11.543 13.1761L16.8359 7.88323C17.2264 7.4927 17.8596 7.4927 18.2501 7.88323C18.6406 8.27375 18.6406 8.90691 18.2501 9.29744L12.2501 15.2974C11.8596 15.688 11.2264 15.688 10.8359 15.2974L4.83586 9.29744C4.44534 8.90691 4.44534 8.27375 4.83586 7.88323Z" fill="currentColor"/></svg>';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, ErrorTooltipDirective, TemplateVarPanelComponent, ActionMenuComponent, ButtonComponent],
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss'],
})
export class TemplateEditorComponent implements AfterViewInit, OnChanges, OnDestroy {
  /** 範本字串，含 %key% 標記，例：「茲將附上 %CompanyName% 有關 %ServiceItemNames% 之…」 */
  @Input() template = '';
  /** 變數 map，key 對應 %key% 標記 */
  @Input() variables: Record<string, string> = {};
  /** 最小顯示行數（決定 min-height），1 ≈ input 高度，4 ≈ textarea 高度 */
  @Input() minRows = 2;
  @Input() placeholder = '';
  @Input() errorMessage = '';
  @Input() disabled = false;
  /** 可用變數定義清單（傳入後顯示 ⓘ 浮動按鈕與變數面板） */
  @Input() variableDefs: TemplateVarDef[] = [];

  /** 公司/方案選擇 contexts（passthrough 給 panel；空 = 不顯示下拉） */
  @Input() varContexts: TemplateVarContext[] = [];
  /** 預設選取公司（passthrough） */
  @Input() defaultCaseId?: string;
  /** 預設選取方案（passthrough） */
  @Input() defaultBundleId?: string;
  /** panel 切換公司/方案時往上 emit，供 host 重算 varDefs/variables */
  @Output() contextChange = new EventEmitter<{ caseId: string; bundleId: string }>();

  @Output() templateChange = new EventEmitter<string>();
  @Output() textChange = new EventEmitter<string>();
  /** blur 時 emit 當前 template 字串，供父元件做「失焦後送 API」 */
  @Output() blurChange = new EventEmitter<string>();
  /** select chip 切換選項時 emit，key = 變數 key，value = 選項 value */
  @Output() optionSelect = new EventEmitter<{ key: string; value: string }>();

  @ViewChild('editor') editorRef!: ElementRef<HTMLDivElement>;
  /** 拖曳落點指示線（template 內的固定元素，位置由本元件直接改 inline style） */
  @ViewChild('dropCaret') private dropCaretRef?: ElementRef<HTMLElement>;
  /** 共用變數面板（ⓘ 與 `%%` autocomplete 共用此實例） */
  @ViewChild(TemplateVarPanelComponent) private varPanel?: TemplateVarPanelComponent;

  focused = false;
  hasContent = false;

  /** IME 組字中（注音/拼音）：composition 期間不偵測 `%%`，避免面板狂閃 */
  private _composing = false;
  /** `%%` autocomplete 觸發所在的 text node 與起始 offset（供選取時刪除 `%%query`） */
  private _triggerNode: Text | null = null;
  private _triggerStart = 0;

  /** 目前展開的 select chip key（null = 無展開 menu） */
  activeSelectKey: string | null = null;
  /** 目前展開 select chip 的可選項 */
  _activeSelectOptions: { label: string; value: string }[] = [];
  /** 目前展開的 select chip element（供 action-menu element-anchored 定位） */
  _activeSelectChip: HTMLElement | null = null;

  private isRendered = false;
  private isEditing = false;
  private _lastEmittedTemplate = '';

  private readonly zone = inject(NgZone);

  /**
   * 游標快照：編輯器最後一次「游標確實落在自己裡面」時的 Range。
   *
   * 為什麼需要：`insertVariable` 原本只讀插入當下的 live document selection。點 ⓘ 面板的
   * **搜尋框**（原生 <input>、面板又 portal 到 body）會把 selection 帶離編輯器 → 判定式
   * `editorEl.contains(...)` 為 false → 走末尾 fallback ＝ 使用者回報的「搜尋後變數插到最後面」
   * （2026-09-14）。對照組「直接點 chip」不壞，靠的是 `.tvp-chip` 的 mousedown preventDefault；
   * `%%` inline 不壞，靠的是 `_deleteTriggerText()` 主動把 selection 設回編輯器。
   *
   * 只存 collapsed 位置：`.tpl` 帶 `user-select: all`（scss:60），點一下 chip 就會產生一個
   * 完整涵蓋該 chip 的**非 collapsed** Range；若原樣存下來、插入時再 `deleteContents()`，
   * 使用者只是想把游標移過去卻會被吃掉一顆既有變數。非 collapsed 一律收斂到結尾。
   */
  private _savedRange: Range | null = null;
  /** 快照當下 startContainer 的 nodeType，用來偵測「節點被換掉、Range 被重新錨定」 */
  private _savedRangeNodeType: number | null = null;

  private readonly _onCaretMove = (): void => this._snapshotCaret();

  get wrapClasses(): Record<string, boolean> {
    return {
      'te-wrap--error':    !this.disabled && !!this.errorMessage,
      'te-wrap--focus':    !this.disabled && this.focused && !this.errorMessage,
      'te-wrap--actived':  !this.disabled && !this.focused && this.hasContent && !this.errorMessage,
      'te-wrap--disabled': this.disabled,
    };
  }

  /** 只顯示已有值的變數（panel 只列可套用的項目） */
  get filteredVarDefs(): TemplateVarDef[] {
    return this.variableDefs.filter(v => !!this.variables[v.key]);
  }

  /**
   * 依 chip key 查變數定義；variant key（`Key|N`）找不到 exact def 時 fallback 到
   * parent key（`Key`）的 def——glance 變體 chip 繼承 bare def 的 options / select 樣式，
   * 不需為每個 variant 另建 def（也避免插入面板被 variant 噪音灌爆）。
   */
  private findDef(key: string): TemplateVarDef | undefined {
    const exact = this.variableDefs.find(v => v.key === key);
    if (exact) return exact;
    // 既有 chip 存 plain/variant key（`%X%` 或 `%X|exact%`），但 varDefs 可能已完全限定（`%X|Case:..|Bundle:..%`）。
    // 以 concept（第一段 `|` 前）互相比對，讓 plain chip 找得到其對應 def（含帶 options 的 glance def）→
    // 內嵌變體下拉不因 varDefs 被限定而消失。
    const concept = key.split('|')[0];
    return this.variableDefs.find(v => v.key.split('|')[0] === concept);
  }

  ngAfterViewInit(): void {
    this.renderTemplate();
    this.isRendered = true;
    this.syncHasContent();
    this._lastEmittedTemplate = this.extractTemplate();
    this._updateVarDefsSig();

    // 方向鍵 / Home / End / 滑鼠點選會移動游標但**不觸發 input**，只靠 onInput + onBlur 會漏。
    // 綁在編輯器元素自己身上（非 document）：一頁有 9 個以上實例，document 級監聽會互相乘上去。
    // 註冊在 zone 外：本元件沒有 OnPush，游標每動一次就 tick 全 app 會拖垮 p4-5 的那堆 getter；
    // 回呼只寫私有欄位、不碰任何 template 綁定，所以不需要 CD。
    const el = this.editorRef?.nativeElement;
    if (el) {
      this.zone.runOutsideAngular(() => {
        el.addEventListener('keyup', this._onCaretMove);
        el.addEventListener('mouseup', this._onCaretMove);
      });
    }
  }

  ngOnDestroy(): void {
    const el = this.editorRef?.nativeElement;
    if (el) {
      el.removeEventListener('keyup', this._onCaretMove);
      el.removeEventListener('mouseup', this._onCaretMove);
    }
    // 縮圖掛在 body 上、靠 rAF 移除。modal 在那一幀之前關掉就會留殘骸，反覆開關會累積。
    this._removeDragGhost();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.isRendered) return;

    // defs 簽章比對：plain↔select 升降級需全量重建，但 p4-5 的 [variableDefs] 綁定
    // 每次 CD 回新 reference——只在「key 集合或 options 數」實際變化時才重渲染
    const defsSigChanged = changes['variableDefs'] ? this._updateVarDefsSig() : false;

    // 先擋自己的 echo：controlled parent（p4-5-fee / p4-6-notes / p5-letter）會把剛 emit 的
    // template 原封不動回寫成 [template]。此時 DOM 已經是正確狀態，重繪只會把使用者的游標打掉
    // （innerHTML 整批換節點 → selection 塌回編輯器 offset 0 → Backspace 變 no-op，症狀就是
    //  「剛插入的範本變數刪不掉」；2026-08-11 使用者第二輪回報，測試已鎖）。
    // 只有「真正的外部新值」才需要重繪。isEditing 仍保留為第二道門（編輯中一律不重繪）。
    const externalTemplateChange = !!changes['template']
      && changes['template'].currentValue !== this._lastEmittedTemplate;

    if (externalTemplateChange && !this.isEditing) {
      this.renderTemplate();
    } else if (defsSigChanged) {
      if (this.isEditing) {
        this._pendingDefsRender = true; // 編輯中不重渲染（防打字干擾），blur 後補
      } else {
        this.renderTemplate();
      }
    } else if (changes['variables']) {
      this.updateVariableSpans();
    }
    this.syncHasContent();
  }

  /** variableDefs 的語意簽章（key + options 數）；變化時回 true */
  private _varDefsSig = '';
  private _pendingDefsRender = false;
  private _updateVarDefsSig(): boolean {
    const sig = this.variableDefs.map(d => `${d.key}:${d.options?.length ?? 0}`).join(',');
    if (sig === this._varDefsSig) return false;
    this._varDefsSig = sig;
    return true;
  }

  private renderTemplate(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    this._pendingDefsRender = false;
    el.innerHTML = this.buildHTML(this.template, this.variables);
    // innerHTML 整批換節點後，落在被移除節點內的 live Range 依 DOM 規格會**重新錨定到 parent**
    // ＝ 變成 (editorEl, 0)，isConnected 與 contains 兩道驗證都會過 → 變數會被插到編輯器開頭。
    // 必須主動作廢，讓它降級成末尾 fallback（＝修前行為，不會更糟）。
    this._savedRange = null;
    this._savedRangeNodeType = null;
    this._ensureTrailingAnchor();
    this.syncHasContent();
  }

  /**
   * 不變量：編輯器內容若「以 chip 結尾」，chip 之後必須有一個 text node 當游標落點。
   *
   * chip 是 `contenteditable=false` 的 atomic inline 元素，末尾沒有可編輯落點時游標無處可放
   * （實測會塌到編輯器根節點 offset 0），此時 Backspace 是 no-op ——「插入末尾變數後刪不掉」
   * 就是這個狀態（2026-08-11 使用者回報；2026-06-27 曾修過 insertVariable 側的同型缺口）。
   *
   * 為什麼渲染側也需要：`buildHTML` 是用 template 依 `%Key%` split 後拼字串，結尾是變數時
   * 最後一段為空字串、貢獻 0 字元 → `innerHTML` 出來的最後一個子節點就是 chip。
   * 首次渲染 / reopen / 外部 template 變更 / defs 升級後的重繪都走 renderTemplate，全都會踩到。
   *
   * 用**空 text node**而非 ZWSP：實測 ZWSP 會讓第一次 Backspace 只吃掉 ZWSP、chip 反而留著
   * （等於把「刪不掉」換成「要按兩次」）。
   */
  private _ensureTrailingAnchor(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    // 找「最後一個有意義的節點」而非 el.lastChild：真 app 實測尾端常有瀏覽器 normalize 補的 <br>
    // （2026-08-11 診斷檔第 1 行 lastNextSibling:"BR("")" / lastIsLastChild:false），
    // 只看 lastChild 會讓 helper 直接不做事、chip 後仍沒有打字落點。
    let last: ChildNode | null = el.lastChild;
    while (last && last.nodeType === Node.ELEMENT_NODE && (last as HTMLElement).tagName === 'BR') {
      last = last.previousSibling;
    }
    if (last && last.nodeType === Node.ELEMENT_NODE && (last as HTMLElement).matches('.tpl[data-var]')) {
      // 插在 chip **之後**（不是 appendChild 到最尾）：否則 anchor 落在 <br> 之後，
      // 不是 chip 的鄰居，游標仍無處可放。<br> 本身保持原位（可能是使用者按的換行）。
      el.insertBefore(document.createTextNode(''), last.nextSibling);
    }
  }

  /**
   * 記下「游標目前在編輯器內的位置」。呼叫點：keyup / mouseup（游標移動但沒有 input）、
   * onInput（打字、IME、貼上）、onBlur 的**第一行**（焦點被 ⓘ 或搜尋框帶走的那一刻）。
   *
   * 游標不在編輯器內時**保留上一次快照、不清成 null**：點 ⓘ 按鈕本身就會產生一次
   * 編輯器外的 mouseup，清掉的話這個修法當場失效。
   */
  private _snapshotCaret(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!el.contains(range.commonAncestorContainer)) return;
    const snap = range.cloneRange();      // live Range 會被後續 selection 操作改寫，必須 clone
    snap.collapse(false);                 // 非 collapsed（user-select:all 點 chip）一律收斂到結尾
    this._savedRange = snap;
    this._savedRangeNodeType = snap.startContainer.nodeType;
  }

  /** 取回仍然可用的快照；任一項不成立回 null（→ 降級成末尾，即修前行為） */
  private _takeValidSavedRange(): Range | null {
    const el = this.editorRef?.nativeElement;
    const r = this._savedRange;
    if (!el || !r) return null;
    const node = r.startContainer;
    // 節點被 replaceChild 換掉時，Range 會重新錨定到 parent（TEXT_NODE → ELEMENT_NODE）
    if (this._savedRangeNodeType !== null && node.nodeType !== this._savedRangeNodeType) return null;
    if (!node.isConnected || !el.contains(node)) return null;
    const max = node.nodeType === Node.TEXT_NODE
      ? (node as Text).data.length
      : node.childNodes.length;
    if (r.startOffset > max) return null;
    return r;
  }

  /**
   * chip 顯示值同步。**值沒變就不寫 DOM**——`p4-5-fee` 的 `[variables]` 綁定用 spread 產新物件，
   * 每次 CD 都是新 reference → `changes['variables']` 每輪成立 → 無條件寫會讓每顆 chip 每輪
   * 產生一筆 MutationRecord（2026-08-11 真 app 診斷檔 2630 行中 2627 行都是
   * `{target:"SPAN",added:["#text"],removed:["#text"]}`，即下面 plain 那條路）。
   * 已驗證不傷游標，但無謂的 DOM 寫入照樣要消掉。
   */
  private updateVariableSpans(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    el.querySelectorAll<HTMLSpanElement>('.tpl[data-var]').forEach(span => {
      const key = span.getAttribute('data-var') ?? '';
      const val = this.variables[key];
      const def = this.findDef(key);
      span.classList.toggle('tpl--empty', !val); // 狀態相同時 DOM 不變更，無需額外守門
      const next = val || `[${key}]`;
      if (def?.options?.length) {
        // select chip：只更新文字節點（第一個 childNode），保留 caret SVG
        const firstChild = span.childNodes[0];
        if (firstChild?.nodeType === Node.TEXT_NODE) {
          if (firstChild.textContent !== next) firstChild.textContent = next;
        } else {
          span.innerHTML = this.escape(next) + CARET_SVG;
        }
      } else if (span.textContent !== next) {
        span.textContent = next;
      }
    });
  }

  /** editor 點擊事件：點到 select chip 時開啟下拉 menu */
  onEditorClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const chip = target.closest<HTMLElement>('.tpl--select[data-var]');
    if (!chip) return;
    const key = chip.dataset['var'] ?? '';
    const def = this.findDef(key);
    if (!def?.options?.length) return;
    event.stopPropagation();
    this._activeSelectChip = chip;
    this.activeSelectKey = key;
    this._activeSelectOptions = def.options;
  }

  closeSelectMenu(): void {
    this.activeSelectKey = null;
    this._activeSelectChip = null;
  }

  onSelectOptionClick(opt: { label: string; value: string }): void {
    if (!this.activeSelectKey) return;
    const key = this.activeSelectKey;
    this.optionSelect.emit({ key, value: opt.value });
    this.closeSelectMenu();
  }

  private _replaceSelectChip(key: string, newLabel: string): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    const span = el.querySelector<HTMLSpanElement>(`.tpl[data-var="${key}"]`);
    if (!span) return;
    // 只換文字節點，保留 caret SVG
    const firstChild = span.childNodes[0];
    if (firstChild?.nodeType === Node.TEXT_NODE) {
      firstChild.textContent = newLabel;
    } else {
      span.innerHTML = this.escape(newLabel) + CARET_SVG;
    }
    const template = this.extractTemplate();
    this._lastEmittedTemplate = template;
    this.templateChange.emit(template);
    this.textChange.emit(this.extractText());
  }

  private buildHTML(tpl: string, vars: Record<string, string>): string {
    return tpl
      // key 可含 `|variant` 及 `|Case:frag|Bundle:frag` 身份後綴（字元集見 template-var-key）
      .split(splitTemplateVarRe())
      .map(part => {
        const match = part.match(fullTemplateVarRe());
        if (match) {
          const key = match[1];
          const val = vars[key];
          const def = this.findDef(key);
          const display = val || `[${key}]`;
          const isEmpty = !val;
          if (def?.options?.length) {
            return `<span class="tpl tpl--select${isEmpty ? ' tpl--empty' : ''}" data-var="${key}" contenteditable="false">${this.escape(display)}${CARET_SVG}</span>`;
          }
          // draggable 只給普通 chip（見 _makeVarSpan 的說明）
          return `<span class="tpl${isEmpty ? ' tpl--empty' : ''}" data-var="${key}" contenteditable="false" draggable="true">${this.escape(display)}</span>`;
        }
        return this.escape(part).replace(/\n/g, '<br>');
      })
      .join('');
  }

  private escape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  private extractTemplate(): string {
    return this.walkNodes(this.editorRef?.nativeElement);
  }

  private walkNodes(node: Node | null): string {
    if (!node) return '';
    let result = '';
    node.childNodes.forEach(child => {
      if (child.nodeType === Node.TEXT_NODE) {
        result += child.textContent ?? '';
      } else if (child instanceof HTMLElement) {
        if (child.tagName === 'BR') {
          result += '\n';
        } else if (child.classList.contains('tpl') && child.dataset['var']) {
          result += `%${child.dataset['var']}%`;
        } else if (child.tagName === 'DIV') {
          result += '\n' + this.walkNodes(child);
        } else {
          result += this.walkNodes(child);
        }
      }
    });
    return result;
  }

  private extractText(): string {
    return this.editorRef?.nativeElement?.textContent?.trim() ?? '';
  }

  private syncHasContent(): void {
    this.hasContent = (this.editorRef?.nativeElement?.textContent?.trim().length ?? 0) > 0;
  }

  onInput(): void {
    this._parseInlineVars();
    this._snapshotCaret();   // 必須在 _parseInlineVars 之後：它會 replaceChild 換掉 text node
    this.syncHasContent();
    const template = this.extractTemplate();
    this._lastEmittedTemplate = template;
    this.templateChange.emit(template);
    this.textChange.emit(this.extractText());
    this._detectAutocomplete();
  }

  // ── `%%` autocomplete（重用 varPanel inline 模式）──

  onCompositionStart(): void { this._composing = true; }
  onCompositionEnd(): void { this._composing = false; this._detectAutocomplete(); }

  /** autocomplete 面板開啟時路由鍵盤（焦點在編輯器，故由此攔截 ↑↓Enter Esc） */
  /**
   * Backspace 刪除游標前方的 chip —— **必須由元件自己刪，不能靠瀏覽器**。
   *
   * 真 app 實測（2026-08-11 使用者 Console 診斷）：chip 後面已有空 text node、游標就在該 node
   * 的 offset 0、`defaultPrevented === false`（沒有任何人攔事件），原生 Backspace **仍然不刪
   * chip**——chip 數 6→6，瀏覽器反而做 normalize 補了一個 `<br>`、游標跳到 `EDITOR@9`。
   * 也就是說「空 text node」是零寬度落點，對原生刪除不算「前方有可刪內容」。
   * 先前 RCA 的 playwright 實驗顯示「刪得掉」，是因為那裡的 selection 是元素層 offset
   * （`EDITOR@childNodes.length`）——與真 app 的 `TEXT("")@0` 不是同一種位置，這個瀏覽器邊界
   * 行為在 harness 與真 app 不一致、測不出來，所以改成自己刪：行為可控、karma 可完整驗證。
   *
   * @returns true = 已處理（已 preventDefault 並移除 chip）；false = 不介入，交給原生行為
   */
  private _deleteChipBeforeCaret(event: KeyboardEvent): boolean {
    const el = this.editorRef?.nativeElement;
    const sel = window.getSelection();
    if (!el || !sel || sel.rangeCount === 0) return false;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return false;                    // 有選取範圍 → 原生刪選取內容
    if (!el.contains(range.startContainer)) return false;

    let node: Node | null;
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      if (range.startOffset > 0) return false;             // 前方還有字元 → 原生刪字元
      node = range.startContainer.previousSibling;
    } else {
      node = range.startOffset > 0 ? range.startContainer.childNodes[range.startOffset - 1] : null;
    }
    // 只跨過「空 text node」這種零寬度落點；遇到 <br>（使用者按的換行）不跨過去，
    // 讓原生先刪掉那個換行——否則會變成「按一次 Backspace 連換行帶 chip 一起消失」。
    while (node && node.nodeType === Node.TEXT_NODE && !(node as Text).data) {
      node = node.previousSibling;
    }
    const chip = node && node.nodeType === Node.ELEMENT_NODE
      && (node as HTMLElement).matches('.tpl[data-var]')
      ? (node as HTMLElement)
      : null;
    if (!chip) return false;

    event.preventDefault();
    const before = chip.previousSibling;
    chip.remove();

    // 游標落回原本 chip 的位置（前一個 text node 末端 / 前一個節點之後 / 編輯器起點）
    const caret = document.createRange();
    if (before && before.nodeType === Node.TEXT_NODE) {
      caret.setStart(before, (before as Text).data.length);
    } else if (before) {
      caret.setStartAfter(before);
    } else {
      caret.setStart(el, 0);
    }
    caret.collapse(true);
    sel.removeAllRanges();
    sel.addRange(caret);

    this._ensureTrailingAnchor();   // 刪完若又以 chip 結尾 → 補回打字落點
    this.onInput();                 // 走既有路徑：extractTemplate → emit + _lastEmittedTemplate
    return true;
  }

  onKeydown(event: KeyboardEvent): void {
    // Backspace 先於 autocomplete 判斷：面板沒開時下面那行會直接 return，chip 刪除就永遠不會執行
    if (event.key === 'Backspace' && this._deleteChipBeforeCaret(event)) return;

    const p = this.varPanel;
    if (!p?.isOpen || !p.inline) return;
    switch (event.key) {
      case 'ArrowDown': event.preventDefault(); p.moveActive(1); break;
      case 'ArrowUp':   event.preventDefault(); p.moveActive(-1); break;
      case 'Enter':     event.preventDefault(); p.selectActive(); break;
      case 'Escape':    event.preventDefault(); event.stopPropagation(); p.close(); break;
      default: break;
    }
  }

  /** 即時從游標回掃 `%%query`（不存錨點，避免 DOM 重建/拆分/Backspace 失效），開/更新/關面板 */
  private _detectAutocomplete(): void {
    if (this._composing || this.disabled || !this.varPanel) return;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !sel.isCollapsed) { this._closeAutocomplete(); return; }
    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) { this._closeAutocomplete(); return; }

    const textBefore = (node.textContent ?? '').slice(0, range.startOffset);
    const hit = detectInlineTrigger(textBefore);
    if (!hit) { this._closeAutocomplete(); return; }

    this._triggerNode = node as Text;
    this._triggerStart = hit.start;

    const caretRect = range.getBoundingClientRect();
    // collapsed range 的 rect 寬度為 0 屬正常；全 0（罕見）才用父元素 rect 兜底
    const rect = (caretRect.width === 0 && caretRect.height === 0)
      ? ((node.parentElement?.getBoundingClientRect() ?? caretRect) as DOMRect)
      : caretRect;

    if (this.varPanel.isOpen && this.varPanel.inline) {
      this.varPanel.updateInline(rect, hit.query);
    } else {
      this.varPanel.openAt(rect, hit.query);
    }
  }

  private _closeAutocomplete(): void {
    if (this.varPanel?.isOpen && this.varPanel.inline) this.varPanel.close();
    this._triggerNode = null;
  }

  /** 選取插入前，刪掉觸發用的 `%%query` 文字，游標 collapse 到刪除點 */
  private _deleteTriggerText(): void {
    const node = this._triggerNode;
    this._triggerNode = null;
    if (!node || !node.parentNode) return;
    const sel = window.getSelection();
    if (!sel) return;
    const len = node.textContent?.length ?? 0;
    const end = sel.rangeCount > 0 && sel.getRangeAt(0).startContainer === node
      ? sel.getRangeAt(0).startOffset
      : len;
    const del = document.createRange();
    del.setStart(node, Math.min(this._triggerStart, len));
    del.setEnd(node, Math.min(end, len));
    del.deleteContents();
    const after = document.createRange();
    after.setStart(node, Math.min(this._triggerStart, node.textContent?.length ?? 0));
    after.collapse(true);
    sel.removeAllRanges();
    sel.addRange(after);
  }

  private _parseInlineVars(): void {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!range.collapsed) return;
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const text = node.textContent ?? '';
    const cursorPos = range.startOffset;
    const match = text.slice(0, cursorPos).match(endTemplateVarRe());
    if (!match) return;

    const key = match[1];
    // 認得的概念才轉 chip（findDef 有 concept fallback → 貼上的完全限定 token 也認得）
    if (!this.findDef(key)) return;

    const matchStart = cursorPos - match[0].length;
    const afterText = text.slice(cursorPos);

    const parent = node.parentNode!;
    const fragment = document.createDocumentFragment();

    if (matchStart > 0) {
      fragment.appendChild(document.createTextNode(text.slice(0, matchStart)));
    }

    fragment.appendChild(this._makeVarSpan(key));

    const cursorAnchor = document.createTextNode(afterText);
    fragment.appendChild(cursorAnchor);
    parent.replaceChild(fragment, node);

    const newRange = document.createRange();
    newRange.setStart(cursorAnchor, 0);
    newRange.collapse(true);
    sel.removeAllRanges();
    sel.addRange(newRange);
  }

  onFocus(): void { this.focused = true; this.isEditing = true; }
  onBlur(event?: FocusEvent): void  {
    // **第一行**：焦點正在離開編輯器，此刻 selection 還是編輯器的。寫在下面的 relatedTarget
    // guard 之後就抓不到「焦點移進 ⓘ 面板搜尋框」那條（Safari 點 button 不轉移焦點、
    // 點 <input> 才轉移，relatedTarget 正好落在 .tvp-panel 內 → 會 early return）。
    this._snapshotCaret();

    // 焦點移進「公司/方案選擇器」或其下拉 overlay（皆 portal 到 body、非編輯器子節點）→ 使用者正在切
    // context，不要關 autocomplete、也不要重繪（否則 %% 面板一點下拉就消失、無法選）。焦點稍後會回編輯器。
    const to = event?.relatedTarget;
    if (to instanceof Element && (to.closest('.tvp-panel') || to.closest('app-select-panel'))) {
      return;
    }
    this.focused = false;
    this.isEditing = false;
    // 真正離開編輯器（Tab 出去）→ 關掉殘留的 autocomplete 面板；點面板 chip 不會走到這（mousedown preventDefault）
    this._closeAutocomplete();
    this._parseAllInlineVars();
    const template = this.extractTemplate();
    if (template !== this._lastEmittedTemplate) {
      this._lastEmittedTemplate = template;
      this.templateChange.emit(template);
      this.textChange.emit(this.extractText());
    }
    this.blurChange.emit(template);
    if (this._pendingDefsRender) {
      this.renderTemplate(); // 編輯期間擱置的 defs 升降級，blur 後補渲染
    }
  }

  private _parseAllInlineVars(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    const knownKeys = new Set(this.variableDefs.map(v => v.key));

    const textNodes: Text[] = [];
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: node => {
        if ((node.parentElement)?.classList.contains('tpl')) return NodeFilter.FILTER_REJECT;
        return (node.textContent ?? '').includes('%')
          ? NodeFilter.FILTER_ACCEPT
          : NodeFilter.FILTER_REJECT;
      },
    });
    let n: Node | null;
    while ((n = walker.nextNode())) textNodes.push(n as Text);

    for (const textNode of textNodes) {
      this._replaceVarsInTextNode(textNode, knownKeys);
    }
  }

  private _replaceVarsInTextNode(node: Text, knownKeys: Set<string>): void {
    const text = node.textContent ?? '';
    // key 可含 `|variant` 及 `|Case:frag|Bundle:frag` 身份後綴（字元集見 template-var-key）
    const pattern = globalTemplateVarRe();
    let match: RegExpExecArray | null;
    let hasKnown = false;
    while ((match = pattern.exec(text)) !== null) {
      if (knownKeys.has(match[1])) { hasKnown = true; break; }
    }
    if (!hasKnown) return;

    pattern.lastIndex = 0;
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const key = match[1];
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      if (knownKeys.has(key)) {
        fragment.appendChild(this._makeVarSpan(key));
      } else {
        fragment.appendChild(document.createTextNode(match[0]));
      }
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    // 這個 node 正要被換掉：快照若錨在它身上，replaceChild 後會被重新錨定到 (editorEl, index)，
    // 四道驗證全過卻指向錯的位置 → 主動作廢（onBlur 會先拍快照、再走到這裡）。
    if (this._savedRange && this._savedRange.startContainer === node) {
      this._savedRange = null;
      this._savedRangeNodeType = null;
    }
    node.parentNode!.replaceChild(fragment, node);
    // `%Key%` 收在字串結尾時上面的 if 不成立 → chip 後沒有游標落點（同 renderTemplate 的缺口）
    this._ensureTrailingAnchor();
  }

  /**
   * 將 %key% 變數插入游標位置。插入點三階降級：
   *   ① live selection 還在編輯器內 —— ⓘ 直接點 chip（`.tvp-chip` 有 mousedown preventDefault，
   *      不搶焦點）與 `%%` inline（`_deleteTriggerText` 主動把 selection 設回編輯器）走這條。
   *   ② 否則用游標快照 —— ⓘ 面板**先搜尋再點**會走這條：搜尋框是原生 <input>、面板又 portal
   *      到 body，點它必然把 selection 帶離編輯器（2026-09-14 使用者回報「插到最後面」）。
   *   ③ 快照也不可用（例如中途被外部 template 重繪作廢）→ 插到末尾，即修前唯一的行為。
   */
  insertVariable(key: string): void {
    const editorEl = this.editorRef?.nativeElement;
    if (!editorEl || this.disabled) return;

    // autocomplete 選取：先刪掉觸發用的 `%%query`，游標 collapse 到刪除點，再走下方一般插入流程
    if (this._triggerNode) {
      this._deleteTriggerText();
    }

    const sel = window.getSelection();
    const liveRange = sel && sel.rangeCount > 0 &&
      editorEl.contains(sel.getRangeAt(0).commonAncestorContainer)
      ? sel.getRangeAt(0)
      : null;
    const savedRange = liveRange ? null : this._takeValidSavedRange();

    let range: Range;
    if (liveRange) {
      // clone：下面的 focus() 會動 live selection，直接用會連帶改寫這個 range
      range = liveRange.cloneRange();
      range.deleteContents(); // 一般 collapsed → no-op；若有選取則清掉
    } else if (savedRange) {
      // 快照在 `_snapshotCaret` 已收斂成 collapsed，這裡不刪任何既有內容
      range = savedRange.cloneRange();
    } else {
      range = document.createRange();
      range.selectNodeContents(editorEl);
      range.collapse(false); // 末尾
    }

    // 明確 Range 插入「chip + 後置 text node」並把游標設到 text node。
    // 比照 _parseInlineVars 既有作法：末尾的 contenteditable=false chip 之後需有可編輯落點，
    // 否則游標無處可去（execCommand 在此情境會把 selection 弄壞、游標跳開頭、無法移動/刪除）。
    const span = this._makeVarSpan(key);
    const caretAnchor = document.createTextNode('');
    const frag = document.createDocumentFragment();
    frag.appendChild(span);
    frag.appendChild(caretAnchor);
    range.insertNode(frag);

    // 焦點還給編輯器，插完可以直接接著打字（修前只有末尾 fallback 那條 focus，其餘兩條插完
    // 焦點留在 ⓘ 按鈕上、游標看不見）。必須排在 addRange **之前**：contenteditable 的 focus()
    // 會自行擺放游標，排在後面會把我們設好的位置蓋掉。preventScroll 避免長 modal 內跳動。
    editorEl.focus({ preventScroll: true });

    const caret = document.createRange();
    caret.setStart(caretAnchor, 0);
    caret.collapse(true);
    const selAfter = window.getSelection();
    selAfter?.removeAllRanges();
    selAfter?.addRange(caret);
    // 快照推進到新游標：使用者不重新點編輯器就再開一次 ⓘ 時，第二個變數才會接在第一個之後
    this._savedRange = caret.cloneRange();
    this._savedRangeNodeType = caretAnchor.nodeType;

    this.syncHasContent();
    // 記住自己 emit 的值（與 onInput / _replaceSelectChip 對齊）：controlled parent 會把它原封不動
    // 回寫成 [template]，ngOnChanges 靠這個比對才分得出「自己的 echo」與「外部新值」，
    // 不會在使用者游標底下重繪（重繪會讓 selection 塌回編輯器 offset 0 → Backspace 變 no-op）。
    const emittedTemplate = this.extractTemplate();
    this._lastEmittedTemplate = emittedTemplate;
    this.templateChange.emit(emittedTemplate);
    this.textChange.emit(this.extractText());
  }

  // ── chip 拖曳重排（同格內）─────────────────────────────────────────────
  //
  // 2026-06-27 做過一次、踩四個坑後拍板不做；2026-09-14 使用者要求重做，範圍收斂成
  // 「只在同一格編輯器內重排」。四個坑各自的對策寫在對應方法上。
  //
  // 最關鍵的取捨：**不讓瀏覽器代為搬移**。原生 contenteditable 的 drop 會自己插入 HTML，
  // 產出的節點長相由瀏覽器決定（可能掉 class/data-var、可能包一層 span），而 `walkNodes`
  // 靠 `.tpl` + `data-var` 兩個判準辨識 chip —— 掉任何一個都會靜默降級成純文字寫回後端，
  // 使用者看不出來。所以 drop 一律 preventDefault，自己算落點、自己搬。

  /** 拖曳中的來源 chip；null ＝ 當前這場拖曳不是本格發起的（外來拖曳一律不碰） */
  private _dragChip: HTMLElement | null = null;

  /**
   * 坑 1：dragstart 的 `event.target` 可能是**文字節點**（chip 內的 text node），
   * 直接 `.closest()` 會 TypeError。一律先正規化成 element。
   * 坑 3：宿主 `.p4-fee__item` 也是 draggable，其 onDragStart 對非握把來源無條件
   * `preventDefault()`。dragstart 會冒泡，preventDefault 在任何一層都會取消整個拖曳 →
   * 必須 stopPropagation，否則 chip 根本拖不動（這就是 2026-06-27 那次的死因）。
   */
  onFieldDragStart(event: DragEvent): void {
    const chip = this._chipFromEventTarget(event.target);
    if (!chip || this.disabled || chip.classList.contains('tpl--select')) {
      // 不是可拖的 chip（純文字選取、select chip、disabled）→ 取消，別讓瀏覽器亂搬文字
      event.preventDefault();
      return;
    }
    event.stopPropagation();
    this._dragChip = chip;
    // 自訂 MIME：只用來讓瀏覽器承認這是一場合法拖曳。真正的來源辨識靠 _dragChip，
    // 不靠 dataTransfer 字串往返（跨元件/跨視窗的字串我們一概不信）。
    event.dataTransfer?.setData(DRAG_MIME, chip.dataset['var'] ?? '');
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      this._setDragGhost(event.dataTransfer, chip);
    }
    // rAF：等瀏覽器抓完縮圖，下一幀才把原位的 chip 變淡
    requestAnimationFrame(() => chip.classList.add('tpl--dragging'));
  }

  /** 只對「自己發起的拖曳」preventDefault —— 不 preventDefault 瀏覽器就不允許 drop */
  onFieldDragOver(event: DragEvent): void {
    if (!this._isOwnDrag()) return;   // 外來拖曳：完全不碰事件，讓宿主的項目重排照跑
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this._updateDropCaret(event.clientX, event.clientY);
  }

  /** 拖離編輯器 → 收起指示線（拖回來時 dragover 會再畫） */
  onFieldDragLeave(event: DragEvent): void {
    const to = event.relatedTarget as Node | null;
    const el = this.editorRef?.nativeElement;
    if (to && el?.contains(to)) return;   // 只是移到編輯器內的子節點，不算離開
    this._hideDropCaret();
  }

  /**
   * 坑 4：自己算落點、自己搬。外來拖曳（`_dragChip` 為 null）**完全不碰事件**——
   * 無條件 stopPropagation 會吃掉宿主酬金項目重排的 drop。
   */
  onFieldDrop(event: DragEvent): void {
    if (!this._isOwnDrag()) return;
    event.preventDefault();
    event.stopPropagation();

    const chip = this._dragChip!;
    const el = this.editorRef!.nativeElement;
    this._clearDragState();

    const point = this._caretFromPoint(event.clientX, event.clientY);
    const target = point && this._clampOutsideChip(point, el);
    if (!target) return;

    // 落回原位 → 完全不動 DOM、不 emit（避免多一次 API 呼叫與存檔 toast）
    if (target.node === chip.nextSibling && target.offset === 0) return;
    if (target.node === chip || chip.contains(target.node)) return;

    const range = document.createRange();
    range.setStart(target.node, Math.min(target.offset, this._maxOffset(target.node)));
    range.collapse(true);

    // 搬移＝同一個節點 insertBefore，不是「建新的再刪舊的」：中途不存在兩顆同 key chip，
    // `updateVariableSpans` / `_replaceSelectChip` 的 querySelector 取第一顆才不會取錯。
    const anchor = document.createTextNode('');
    const frag = document.createDocumentFragment();
    frag.appendChild(chip);
    frag.appendChild(anchor);
    range.insertNode(frag);

    this._ensureTrailingAnchor();

    const caret = document.createRange();
    caret.setStart(anchor, 0);
    caret.collapse(true);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(caret);
    this._savedRange = caret.cloneRange();
    this._savedRangeNodeType = anchor.nodeType;

    this.syncHasContent();
    // 與 insertVariable 對齊：emit 前同步 _lastEmittedTemplate，否則 controlled parent 回寫時
    // ngOnChanges 會誤判成外部新值 → 在使用者手底下整批重繪。
    const template = this.extractTemplate();
    this._lastEmittedTemplate = template;
    this.templateChange.emit(template);
    this.textChange.emit(this.extractText());
  }

  /**
   * 拖曳結束一律清乾淨。Esc 取消、拖出視窗放開、拖到不接受的區域——這三種都**不會**派 drop，
   * 只有 dragend。不清的話 `_dragChip` 殘留，下一場外來拖曳會被誤判成「自己的」而被攔截。
   * 不 stopPropagation：宿主自己的 dragend 清理要照跑。
   */
  onFieldDragEnd(_event: DragEvent): void {
    this._clearDragState();
  }

  /**
   * 自訂拖曳縮圖。不設的話瀏覽器用預設＝被拖元素的整張截圖，變數值長時就是一大塊跟著滑鼠跑
   * （2026-09-14 使用者回報）。改成寬度有上限的小膠囊：保留 chip 的藍底藍框讓使用者知道
   * 在拖哪一顆，超出的字用省略號截掉。
   *
   * 形態照 p4-6-notes 的既有前例（p4-6-notes.component.ts:306-329）：clone 必須在 document
   * 內且完成 layout 瀏覽器才抓得到，所以先 append 到 body（樣式把它定位到畫面外），
   * 抓完（下一幀）移除。
   */
  private _setDragGhost(dt: DataTransfer, chip: HTMLElement): void {
    const ghost = document.createElement('span');
    ghost.className = 'te-drag-ghost';
    ghost.textContent = chip.textContent ?? '';

    // 樣式一律 inline。放進 component scss **沒用**：Angular emulated encapsulation 會給
    // 選擇器加 [_ngcontent-xxx]，而命令式建立又 append 到 body 的元素沒有那個屬性
    // （2026-09-14 實測：寫在 scss 檔尾時 textOverflow 量到 'clip'、寬度沒被限住）。
    // 顏色與字型從 chip 自己的 computed style 取，不寫死 —— DS token 換了會自動跟上。
    const cs = getComputedStyle(chip);
    Object.assign(ghost.style, {
      // 定位到畫面外：setDragImage 要求元素在 document 內且完成 layout 才抓得到，
      // 但它本身不該被看見。用 fixed + 負座標而非 display:none（後者量不到尺寸、抓出來空白）。
      // 不設 z-index: -1 —— 負堆疊順序在某些情況下不會被 paint，而 setDragImage 抓的是
      // 已繪製的內容，抓到空白就會 fallback 回瀏覽器預設（整顆元素的截圖）。
      position: 'fixed', top: '-9999px', left: '-9999px',
      // 寬度上限是這次的重點：不設就會跟著變數值變長（使用者回報「拖著一張很大的圖」）
      display: 'inline-block', maxWidth: `${GHOST_MAX_WIDTH}px`,
      overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
      padding: cs.padding, borderRadius: cs.borderRadius,
      background: cs.backgroundColor,
      border: `1px solid ${cs.color}`,
      color: cs.color, font: cs.font, lineHeight: cs.lineHeight,
      boxSizing: 'border-box',
    } as Partial<CSSStyleDeclaration>);

    document.body.appendChild(ghost);
    this._dragGhost = ghost;

    // 強制 layout：append 之後不讀一次幾何，瀏覽器可能還沒把 ghost 排版完，
    // setDragImage 當下量到 0×0 就整個忽略、fallback 回預設截圖。
    void ghost.offsetHeight;

    // 抓在膠囊左段：手感對齊「捏著變數前緣拖」，而不是整塊浮在游標正中央
    dt.setDragImage(ghost, 16, ghost.offsetHeight / 2);

    // 用 setTimeout 而非 requestAnimationFrame：rAF 在**繪製之前**執行，而瀏覽器是在
    // 那次繪製時才把 ghost 拍成拖曳影像——rAF 會在拍照前就把它拆掉。
    // dragend 另有一道 _removeDragGhost（拖曳取消時走那條），兩邊都做、不互相依賴。
    setTimeout(() => this._removeDragGhost(), 0);
  }

  private _dragGhost: HTMLElement | null = null;

  private _removeDragGhost(): void {
    this._dragGhost?.remove();
    this._dragGhost = null;
  }

  private _clearDragState(): void {
    this._dragChip = null;
    this._hideDropCaret();
    this._removeDragGhost();
    this.editorRef?.nativeElement
      ?.querySelectorAll('.tpl--dragging')
      .forEach(n => n.classList.remove('tpl--dragging'));
  }

  /** 來源是不是本格還活著的 chip（節點被重繪換掉就不算） */
  private _isOwnDrag(): boolean {
    const el = this.editorRef?.nativeElement;
    return !!(this._dragChip && el && el.contains(this._dragChip));
  }

  /** 坑 1：target 可能是文字節點 → 先正規化成 element 再 closest */
  private _chipFromEventTarget(target: EventTarget | null): HTMLElement | null {
    const node = target as Node | null;
    if (!node) return null;
    const elNode = node.nodeType === Node.ELEMENT_NODE
      ? (node as HTMLElement)
      : node.parentElement;
    const chip = elNode?.closest<HTMLElement>('.tpl[data-var]') ?? null;
    const host = this.editorRef?.nativeElement;
    return chip && host?.contains(chip) ? chip : null;
  }

  /** 螢幕座標 → caret 位置。Blink/WebKit 走 caretRangeFromPoint，Gecko 走 caretPositionFromPoint */
  private _caretFromPoint(x: number, y: number): { node: Node; offset: number } | null {
    const doc = document as Document & {
      caretRangeFromPoint?(x: number, y: number): Range | null;
      caretPositionFromPoint?(x: number, y: number): { offsetNode: Node; offset: number } | null;
    };
    if (typeof doc.caretRangeFromPoint === 'function') {
      const r = doc.caretRangeFromPoint(x, y);
      return r ? { node: r.startContainer, offset: r.startOffset } : null;
    }
    if (typeof doc.caretPositionFromPoint === 'function') {
      const p = doc.caretPositionFromPoint(x, y);
      return p ? { node: p.offsetNode, offset: p.offset } : null;
    }
    return null;
  }

  /**
   * 把落點夾出 chip 之外。caretFromPoint 打在 chip 中央會回傳 chip **內部**的 text node
   * （實測 container 是 chip 的文字節點），照插會產生巢狀 chip —— `walkNodes` 遇到外層就
   * 直接吐 `%外層key%`、內層整個消失，資料靜默遺失。
   * 落點也必須在編輯器內：拖到框外放開時 caretFromPoint 會回傳別人的 DOM。
   */
  private _clampOutsideChip(
    point: { node: Node; offset: number },
    host: HTMLElement,
  ): { node: Node; offset: number } | null {
    if (!host.contains(point.node)) return null;
    const elNode = point.node.nodeType === Node.ELEMENT_NODE
      ? (point.node as HTMLElement)
      : point.node.parentElement;
    const inChip = elNode?.closest<HTMLElement>('.tpl[data-var]');
    if (!inChip || !host.contains(inChip)) return point;
    // 落在 chip 內：以水平中線決定要放在它前面還是後面
    const parent = inChip.parentNode;
    if (!parent) return null;
    const idx = Array.prototype.indexOf.call(parent.childNodes, inChip);
    const half = (point.node.nodeType === Node.TEXT_NODE
      ? point.offset >= ((point.node as Text).data.length / 2)
      : point.offset > 0);
    return { node: parent, offset: half ? idx + 1 : idx };
  }

  // ── 落點指示線 ─────────────────────────────────────────────────────────
  //
  // 對照組（酬金補充說明）靠 ProseMirror 內含的 Dropcursor 畫線。這邊自己畫一條等價的。
  // 更新走**直接改 inline style**，不經 Angular 綁定：dragover 每幀觸發，而本元件沒有
  // OnPush、一頁有 9 個以上實例，每幀 tick 全 app 會拖垮 P4 的那堆 getter。

  /** 上一次畫的位置，值沒變就不寫 DOM（對齊 updateVariableSpans 的既有紀律） */
  private _lastCaretPos = '';

  private _updateDropCaret(x: number, y: number): void {
    const chip = this._dragChip;
    const el = this.editorRef?.nativeElement;
    if (!chip || !el) return this._hideDropCaret();

    const point = this._caretFromPoint(x, y);
    const target = point && this._clampOutsideChip(point, el);
    if (!target) return this._hideDropCaret();

    // 落回原位＝放開不會有任何變化。畫線會告訴使用者「會放這裡」，是誤導。
    if (target.node === chip.nextSibling && target.offset === 0) return this._hideDropCaret();
    if (target.node === chip || chip.contains(target.node)) return this._hideDropCaret();

    const rect = this._caretRect(target.node, target.offset);
    if (!rect) return this._hideDropCaret();

    const caret = this.dropCaretRef?.nativeElement;
    const wrap = caret?.parentElement;
    if (!caret || !wrap) return;
    const base = wrap.getBoundingClientRect();
    const pos = `${rect.left - base.left}|${rect.top - base.top}|${rect.height}`;
    if (pos === this._lastCaretPos) return;   // 位置沒變就不寫 DOM
    this._lastCaretPos = pos;
    caret.style.left = `${rect.left - base.left}px`;
    caret.style.top = `${rect.top - base.top}px`;
    caret.style.height = `${rect.height}px`;
    caret.style.display = 'block';
  }

  private _hideDropCaret(): void {
    const caret = this.dropCaretRef?.nativeElement;
    if (caret && caret.style.display !== 'none') caret.style.display = 'none';
    this._lastCaretPos = '';
  }

  /**
   * 取某個 caret 位置的螢幕矩形。
   *
   * collapsed Range 的 `getBoundingClientRect()` 在元素邊界常回 0×0（空 text node、
   * 元素層 offset），畫出來就是一條看不見的線。所以往旁邊借一格字元／一個節點來量，
   * 取它的左緣或右緣當線的位置。
   */
  private _caretRect(node: Node, offset: number): DOMRect | null {
    const max = this._maxOffset(node);
    const off = Math.min(offset, max);

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node as Text;
      const r = document.createRange();
      if (off < max) {                 // 借右邊那格，取左緣
        r.setStart(text, off); r.setEnd(text, off + 1);
        const rect = r.getBoundingClientRect();
        if (rect.height > 0) return new DOMRect(rect.left, rect.top, 0, rect.height);
      }
      if (off > 0) {                   // 借左邊那格，取右緣
        r.setStart(text, off - 1); r.setEnd(text, off);
        const rect = r.getBoundingClientRect();
        if (rect.height > 0) return new DOMRect(rect.right, rect.top, 0, rect.height);
      }
      // 空 text node（chip 後的游標落點就是這種）→ 量它的鄰居
      return this._rectFromNeighbour(node);
    }

    // 元素層位置：量 childNodes[off]（取左緣）或 childNodes[off-1]（取右緣）
    const after = node.childNodes[off];
    if (after) {
      const rect = this._rectOf(after);
      if (rect && rect.height > 0) return new DOMRect(rect.left, rect.top, 0, rect.height);
    }
    const before = node.childNodes[off - 1];
    if (before) {
      const rect = this._rectOf(before);
      if (rect && rect.height > 0) return new DOMRect(rect.right, rect.top, 0, rect.height);
    }
    return this._rectFromNeighbour(node);
  }

  /** 量一個節點（元素或文字）的矩形 */
  private _rectOf(node: Node): DOMRect | null {
    if (node.nodeType === Node.ELEMENT_NODE) {
      return (node as HTMLElement).getBoundingClientRect();
    }
    if (node.nodeType === Node.TEXT_NODE && (node as Text).data.length > 0) {
      const r = document.createRange();
      r.selectNodeContents(node);
      return r.getBoundingClientRect();
    }
    return null;
  }

  /** 最後手段：借用前後鄰居的矩形（空 text node 本身量不出高度） */
  private _rectFromNeighbour(node: Node): DOMRect | null {
    const prev = node.previousSibling && this._rectOf(node.previousSibling);
    if (prev && prev.height > 0) return new DOMRect(prev.right, prev.top, 0, prev.height);
    const next = node.nextSibling && this._rectOf(node.nextSibling);
    if (next && next.height > 0) return new DOMRect(next.left, next.top, 0, next.height);
    const el = this.editorRef?.nativeElement;
    if (!el) return null;
    const host = el.getBoundingClientRect();
    const line = parseFloat(getComputedStyle(el).lineHeight);
    return Number.isFinite(line) && line > 0
      ? new DOMRect(host.left, host.top, 0, line)
      : null;
  }

  private _maxOffset(node: Node): number {
    return node.nodeType === Node.TEXT_NODE
      ? (node as Text).data.length
      : node.childNodes.length;
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const text = event.clipboardData?.getData('text/plain') ?? '';
    document.execCommand('insertText', false, text);
  }

  /** 建立對應 key 的 chip span（select chip 含 caret SVG；普通 chip 純文字） */
  private _makeVarSpan(key: string): HTMLSpanElement {
    const val = this.variables[key];
    const def = this.findDef(key);
    const display = val || `[${key}]`;
    const isEmpty = !val;
    const span = document.createElement('span');
    span.dataset['var'] = key;
    span.contentEditable = 'false';
    if (def?.options?.length) {
      span.className = `tpl tpl--select${isEmpty ? ' tpl--empty' : ''}`;
      span.innerHTML = this.escape(display) + CARET_SVG;
    } else {
      span.className = `tpl${isEmpty ? ' tpl--empty' : ''}`;
      span.textContent = display;
      // select chip 的點擊要開下拉選單，與拖曳手勢衝突 → 只有普通 chip 可拖
      span.draggable = true;
    }
    return span;
  }
}
