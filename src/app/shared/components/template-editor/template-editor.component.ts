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

    if (changes['template'] && !this.isEditing) {
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
    this.syncHasContent();
  }

  private updateVariableSpans(): void {
    const el = this.editorRef?.nativeElement;
    if (!el) return;
    el.querySelectorAll<HTMLSpanElement>('.tpl[data-var]').forEach(span => {
      const key = span.getAttribute('data-var') ?? '';
      const val = this.variables[key];
      const def = this.findDef(key);
      span.classList.toggle('tpl--empty', !val);
      if (def?.options?.length) {
        // select chip：只更新文字節點（第一個 childNode），保留 caret SVG
        const firstChild = span.childNodes[0];
        if (firstChild?.nodeType === Node.TEXT_NODE) {
          firstChild.textContent = val || `[${key}]`;
        } else {
          span.innerHTML = this.escape(val || `[${key}]`) + CARET_SVG;
        }
      } else {
        span.textContent = val || `[${key}]`;
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
  onKeydown(event: KeyboardEvent): void {
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
    this.templateChange.emit(this.extractTemplate());
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
