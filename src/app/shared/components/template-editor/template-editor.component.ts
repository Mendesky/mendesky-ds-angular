import {
  Component, Input, Output, EventEmitter,
  ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ErrorTooltipDirective } from '../../directives/error-tooltip.directive';
import { TemplateVarPanelComponent } from '../template-var-panel/template-var-panel.component';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { ButtonComponent } from '../button/button.component';
import { TemplateVarDef, TemplateVarContext } from '../../models/template-var.model';
import { detectInlineTrigger } from '../../utils/inline-trigger';
import { splitTemplateVarRe, fullTemplateVarRe, endTemplateVarRe, globalTemplateVarRe } from '../../utils/template-var-key';

const CARET_SVG = '<svg class="tpl__caret" viewBox="0 0 24 24" width="12" height="12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M4.83586 7.88323C5.22639 7.4927 5.85955 7.4927 6.25008 7.88323L11.543 13.1761L16.8359 7.88323C17.2264 7.4927 17.8596 7.4927 18.2501 7.88323C18.6406 8.27375 18.6406 8.90691 18.2501 9.29744L12.2501 15.2974C11.8596 15.688 11.2264 15.688 10.8359 15.2974L4.83586 9.29744C4.44534 8.90691 4.44534 8.27375 4.83586 7.88323Z" fill="currentColor"/></svg>';

@Component({
  selector: 'app-template-editor',
  standalone: true,
  imports: [CommonModule, ErrorTooltipDirective, TemplateVarPanelComponent, ActionMenuComponent, ButtonComponent],
  templateUrl: './template-editor.component.html',
  styleUrls: ['./template-editor.component.scss'],
})
export class TemplateEditorComponent implements AfterViewInit, OnChanges {
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
          return `<span class="tpl${isEmpty ? ' tpl--empty' : ''}" data-var="${key}" contenteditable="false">${this.escape(display)}</span>`;
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
    node.parentNode!.replaceChild(fragment, node);
    // `%Key%` 收在字串結尾時上面的 if 不成立 → chip 後沒有游標落點（同 renderTemplate 的缺口）
    this._ensureTrailingAnchor();
  }

  /** 將 %key% 變數插入游標位置；若編輯器未聚焦則插入至末尾 */
  insertVariable(key: string): void {
    const editorEl = this.editorRef?.nativeElement;
    if (!editorEl || this.disabled) return;

    // autocomplete 選取：先刪掉觸發用的 `%%query`，游標 collapse 到刪除點，再走下方一般插入流程
    if (this._triggerNode) {
      this._deleteTriggerText();
    }

    const sel = window.getSelection();
    let range: Range;
    const inEditor = sel && sel.rangeCount > 0 &&
      editorEl.contains(sel.getRangeAt(0).commonAncestorContainer);

    if (inEditor) {
      range = sel!.getRangeAt(0);
      range.deleteContents(); // 一般 collapsed → no-op；若有選取則清掉
    } else {
      editorEl.focus();
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

    const caret = document.createRange();
    caret.setStart(caretAnchor, 0);
    caret.collapse(true);
    sel?.removeAllRanges();
    sel?.addRange(caret);

    this.syncHasContent();
    // 記住自己 emit 的值（與 onInput / _replaceSelectChip 對齊）：controlled parent 會把它原封不動
    // 回寫成 [template]，ngOnChanges 靠這個比對才分得出「自己的 echo」與「外部新值」，
    // 不會在使用者游標底下重繪（重繪會讓 selection 塌回編輯器 offset 0 → Backspace 變 no-op）。
    const emittedTemplate = this.extractTemplate();
    this._lastEmittedTemplate = emittedTemplate;
    this.templateChange.emit(emittedTemplate);
    this.textChange.emit(this.extractText());
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
    }
    return span;
  }
}
