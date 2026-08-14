import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA, SimpleChange } from '@angular/core';
import { TemplateEditorComponent } from './template-editor.component';
import { TemplateVarDef } from '../../models/template-var.model';

describe('TemplateEditorComponent — select chip', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  const selectDef: TemplateVarDef = {
    key: 'CapitalAmount',
    label: '資本額',
    group: 'fee',
    options: [
      { label: '資本100萬內', value: 'fuzzy' },
      { label: '資本額1,000元', value: 'precise' },
    ],
  };

  const badgeDef: TemplateVarDef = {
    key: 'b0',
    label: '雙北地區',
    group: 'fee',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.template = '工商登記處理作業%CapitalAmount%%b0%(不含動資查核)';
    component.variables = { CapitalAmount: '資本額1,000元', b0: '雙北地區' };
    component.variableDefs = [selectDef, badgeDef];
    fixture.detectChanges();
  });

  it('variableDefs 含 options 的變數渲染為 .tpl.tpl--select（含 caret）', () => {
    const el: HTMLElement = fixture.nativeElement;
    const selectSpan = el.querySelector('.tpl.tpl--select[data-var="CapitalAmount"]');
    expect(selectSpan).toBeTruthy();
    expect(selectSpan?.querySelector('.tpl__caret')).toBeTruthy();
    expect(selectSpan?.textContent).toContain('資本額1,000元');
  });

  it('不含 options 的 badge 變數渲染為 .tpl（無 tpl--select，無 caret）', () => {
    const el: HTMLElement = fixture.nativeElement;
    const badgeSpan = el.querySelector('.tpl[data-var="b0"]');
    expect(badgeSpan).toBeTruthy();
    expect(badgeSpan?.classList.contains('tpl--select')).toBeFalse();
    expect(badgeSpan?.querySelector('.tpl__caret')).toBeNull();
  });

  it('點 select chip → activeSelectKey 設為 chip key、_activeSelectOptions 含選項', () => {
    const el: HTMLElement = fixture.nativeElement;
    const selectSpan = el.querySelector<HTMLElement>('.tpl--select[data-var="CapitalAmount"]');
    expect(selectSpan).toBeTruthy();
    selectSpan!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(component.activeSelectKey).toBe('CapitalAmount');
    expect(component['_activeSelectOptions'].length).toBe(2);
  });

  it('onSelectOptionClick → emit optionSelect、span textContent 更新、旁邊純文字與 badge 不變', () => {
    const el: HTMLElement = fixture.nativeElement;
    const selectSpan = el.querySelector<HTMLElement>('.tpl--select[data-var="CapitalAmount"]');
    selectSpan!.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    const emitted: { key: string; value: string }[] = [];
    component.optionSelect.subscribe(e => emitted.push(e));

    component.onSelectOptionClick({ label: '資本100萬內', value: 'fuzzy' });
    fixture.detectChanges();

    // optionSelect emit 正確
    expect(emitted.length).toBe(1);
    expect(emitted[0]).toEqual({ key: 'CapitalAmount', value: 'fuzzy' });

    // controlled component：chip 不自我更新，由 parent 收到 optionSelect 後回寫 variables 才重渲染。
    // 模擬 parent 回寫選中 label + 觸發 ngOnChanges（TestBed 直接賦值不會自動觸發），再驗 chip textContent 更新。
    const prevVars = component.variables;
    component.variables = { ...prevVars, CapitalAmount: '資本100萬內' };
    component.ngOnChanges({ variables: new SimpleChange(prevVars, component.variables, false) });
    fixture.detectChanges();
    const updatedSpan = el.querySelector<HTMLElement>('.tpl--select[data-var="CapitalAmount"]');
    expect(updatedSpan?.textContent).toContain('資本100萬內');

    // 旁邊純文字不變
    const editorEl = el.querySelector('[contenteditable]');
    expect(editorEl?.textContent).toContain('工商登記處理作業');
    expect(editorEl?.textContent).toContain('(不含動資查核)');

    // badge chip 不變
    const badgeSpan = el.querySelector<HTMLElement>('.tpl[data-var="b0"]:not(.tpl--select)');
    expect(badgeSpan).toBeTruthy();

    // menu 關閉
    expect(component.activeSelectKey).toBeNull();
  });
});

describe('TemplateEditorComponent — variableDefs 動態變更（glance defs 晚到）', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  const plainDef: TemplateVarDef = { key: 'AccountingPeriod', label: '記帳收費說明', group: 'accounting' };
  const glanceDef: TemplateVarDef = {
    key: 'AccountingPeriod',
    label: '記帳收費說明',
    group: 'accounting',
    options: [
      { label: '系統依情境判斷', value: 'AccountingPeriod' },
      { label: '以全年計算', value: 'AccountingPeriod|1' },
    ],
  };

  const defsChange = (defs: TemplateVarDef[]) => {
    component.variableDefs = defs;
    component.ngOnChanges({
      variableDefs: { currentValue: defs, previousValue: null, firstChange: false, isFirstChange: () => false } as any,
    });
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.template = '記帳公費%AccountingPeriod%。';
    component.variables = { 'AccountingPeriod': '一年以十四個月計算', 'AccountingPeriod|1': '以全年計算' };
    component.variableDefs = [plainDef];
    fixture.detectChanges();
  });

  it('defs 從無 options 換成有 options（晚到的 glance defs）→ chip 升級為 tpl--select', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.tpl--select[data-var="AccountingPeriod"]')).toBeNull(); // 初始 plain

    defsChange([glanceDef]);
    expect(el.querySelector('.tpl--select[data-var="AccountingPeriod"]')).toBeTruthy();
  });

  it('同 signature 的新 reference（p4-5 每次 CD 的 getter 形態）→ 不重渲染（DOM 節點 identity 不變）', () => {
    const el: HTMLElement = fixture.nativeElement;
    defsChange([glanceDef]);
    const chipBefore = el.querySelector('.tpl--select[data-var="AccountingPeriod"]');
    expect(chipBefore).toBeTruthy();

    // 內容相同、reference 不同（深拷貝）
    defsChange([JSON.parse(JSON.stringify(glanceDef))]);
    const chipAfter = el.querySelector('.tpl--select[data-var="AccountingPeriod"]');
    expect(chipAfter).toBe(chipBefore); // 同一個 DOM 節點 = 沒有全量重建
  });

  it('編輯中 defs 變更 → 不立即重渲染（防打字干擾）；blur 後補渲染升級', () => {
    const el: HTMLElement = fixture.nativeElement;
    component.onFocus(); // isEditing = true
    defsChange([glanceDef]);
    expect(el.querySelector('.tpl--select[data-var="AccountingPeriod"]')).toBeNull(); // 編輯中不動

    component.onBlur();
    expect(el.querySelector('.tpl--select[data-var="AccountingPeriod"]')).toBeTruthy(); // blur 補渲染
  });
});

/**
 * #`%%` autocomplete（contenteditable）：附加到 body 取得真實 selection / getBoundingClientRect / execCommand。
 */
describe('TemplateEditorComponent — %% autocomplete', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.variableDefs = [{ key: 'DefaultFromName', label: '寄件者', group: 'basic' }];
    component.variables = { DefaultFromName: '嘉威' };
    component.template = '';
    document.body.appendChild(fixture.nativeElement); // 真實佈局/選區
    fixture.detectChanges(); // ngAfterViewInit + 渲染 panel（filteredVarDefs 有值）
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode === document.body) {
      document.body.removeChild(fixture.nativeElement);
    }
  });

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.te-field') as HTMLElement;
  }

  function setEditorText(text: string, cursorOffset: number): Text {
    const el = editorEl();
    el.innerHTML = '';
    const tn = document.createTextNode(text);
    el.appendChild(tn);
    el.focus();
    const sel = window.getSelection()!;
    const r = document.createRange();
    r.setStart(tn, cursorOffset);
    r.collapse(true);
    sel.removeAllRanges();
    sel.addRange(r);
    return tn;
  }

  function panel(): { openAt: unknown } {
    return (component as unknown as { varPanel: { openAt: unknown } }).varPanel;
  }

  it('打 `%%Def` → 呼叫 panel.openAt(query="Def")', () => {
    const openAtSpy = spyOn(panel() as any, 'openAt');
    setEditorText('%%Def', 5);
    component.onInput();
    expect(openAtSpy).toHaveBeenCalled();
    expect((openAtSpy as jasmine.Spy).calls.mostRecent().args[1]).toBe('Def');
  });

  it('選取插入 → 刪掉 `%%query`、結果為 `%DefaultFromName%`、emit templateChange 不 emit blurChange', () => {
    setEditorText('%%Def', 5);
    component.onInput(); // 設 _triggerNode

    let tmpl = '';
    let blurred = false;
    component.templateChange.subscribe((v: string) => (tmpl = v));
    component.blurChange.subscribe(() => (blurred = true));

    component.insertVariable('DefaultFromName');

    expect(tmpl).toContain('%DefaultFromName%');
    expect(tmpl).not.toContain('%%');
    expect(blurred).toBeFalse();
  });

  it('IME 組字中 → 不觸發 autocomplete', () => {
    const openAtSpy = spyOn(panel() as any, 'openAt');
    component.onCompositionStart();
    setEditorText('%%公', 3);
    component.onInput();
    expect(openAtSpy).not.toHaveBeenCalled();
  });

  it('（bug）末尾插入變數 → chip 後有 text node、游標落在 chip 之後（非跳開頭）', () => {
    setEditorText('結尾測試', 4); // 游標在末尾
    component.insertVariable('DefaultFromName');
    const chip = editorEl().querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.nextSibling).toBeTruthy();                       // chip 後需有節點供游標落腳
    expect(chip.nextSibling!.nodeType).toBe(Node.TEXT_NODE);
    const r = window.getSelection()!.getRangeAt(0);
    expect(r.collapsed).toBeTrue();
    expect(r.startContainer).toBe(chip.nextSibling as Node);     // 游標在 chip 之後
  });
});

// ── 結尾 chip 的游標落點（渲染側不變量）──────────────────────────────────
// Bug（2026-08-11 使用者回報）：在文字最後插入範本變數後，Backspace 刪不掉最後一個變數。
// 根因不是 Backspace 被攔（本元件沒有任何 Backspace handler，祖先只攔 Escape/Enter），而是
// chip 是 atomic（contenteditable=false）、其後沒有 text node 當游標落點 → selection 塌到
// 編輯器根節點 offset 0，此時 Backspace 是 no-op（Chromium/WebKit 實測一致；游標在 chip 後時
// 一次 Backspace 就整顆刪掉）。
// 插入側 2026-06-27 已修（insertVariable 補 caretAnchor，見上方既有測試），但**渲染側沒修**：
// buildHTML 以 %Key% split 後最後一段是空字串，innerHTML 出來的最後一個節點就是 chip；
// 首次渲染 / reopen / 外部 template 變更 / defs 升級後的重繪都走 renderTemplate。
// 用空 text node 而非 ZWSP：實測 ZWSP 會讓第一次 Backspace 只吃掉 ZWSP、chip 反而留著。
describe('TemplateEditorComponent — 結尾 chip 的游標落點（渲染側）', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('[contenteditable]') as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.variableDefs = [{ key: 'DefaultFromName', label: '寄件者', group: 'basic' }];
    component.variables = { DefaultFromName: '嘉威' };
  });

  it('首次渲染：template 以變數結尾 → chip 後有 text node 當游標落點', () => {
    component.template = '工商登記處理作業%DefaultFromName%';
    fixture.detectChanges();

    const chip = editorEl().querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.nextSibling).withContext('chip 後需有節點供游標落腳').toBeTruthy();
    expect(chip.nextSibling!.nodeType).toBe(Node.TEXT_NODE);
    expect(editorEl().lastChild).toBe(chip.nextSibling);
  });

  it('外部 template 變更觸發的非編輯態重繪：仍維持結尾 text node', () => {
    component.template = '純文字';
    fixture.detectChanges();

    const next = '換成以變數結尾%DefaultFromName%';
    component.template = next;
    component.ngOnChanges({ template: new SimpleChange('純文字', next, false) });

    const chip = editorEl().querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    expect(chip).toBeTruthy();
    expect(chip.nextSibling?.nodeType).toBe(Node.TEXT_NODE);
  });

  it('template 不以變數結尾 → 不多插空 text node（不改變既有結構）', () => {
    component.template = '%DefaultFromName%後面還有字';
    fixture.detectChanges();

    const last = editorEl().lastChild!;
    expect(last.nodeType).toBe(Node.TEXT_NODE);
    expect((last as Text).data).toBe('後面還有字');
  });

  it('blur 把手打的 %Key% 轉成 chip：變數在結尾時也要補 text node', () => {
    component.template = '';
    fixture.detectChanges();

    const el = editorEl();
    el.textContent = '手打結尾%DefaultFromName%';
    component.onFocus();
    component.onBlur();

    const chip = el.querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    expect(chip).withContext('%Key% 應被轉成 chip').toBeTruthy();
    expect(chip.nextSibling?.nodeType).toBe(Node.TEXT_NODE);
  });

  // ── 尾端 <br>：真 app 實測 lastChild 是 BR 而非 chip（診斷檔第 1 行
  //    lastNextSibling:"BR(\"\")" / lastIsLastChild:false），舊 helper 只看 lastChild → 直接不做事 ──

  it('尾端有瀏覽器 normalize 補的 <br> → anchor 仍要插在 chip 之後（不是 <br> 之後）', () => {
    component.template = '工商登記處理作業%DefaultFromName%';
    fixture.detectChanges();

    const el = editorEl();
    const chip = el.querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    chip.nextSibling!.remove();                        // 移掉既有 anchor：重現「chip 後沒落點」
    el.appendChild(document.createElement('br'));      // 瀏覽器 normalize 補的尾端 <br>

    (component as any)._ensureTrailingAnchor();

    expect(chip.nextSibling).withContext('chip 之後必須有落點').toBeTruthy();
    expect(chip.nextSibling!.nodeType).toBe(Node.TEXT_NODE);
    expect((chip.nextSibling as Text).data).toBe('');
    expect((el.lastChild as HTMLElement).tagName)
      .withContext('使用者按的換行不得被動到').toBe('BR');
  });

  it('尾端有 <br> 且 chip 後已有 anchor → 不重複插入', () => {
    component.template = '工商登記處理作業%DefaultFromName%';
    fixture.detectChanges();

    const el = editorEl();
    el.appendChild(document.createElement('br'));
    const before = el.childNodes.length;

    (component as any)._ensureTrailingAnchor();

    expect(el.childNodes.length).toBe(before);
  });

  it('尾端有 <br> 但最後一個有意義節點是純文字 → 不插任何節點', () => {
    component.template = '%DefaultFromName%後面還有字';
    fixture.detectChanges();

    const el = editorEl();
    el.appendChild(document.createElement('br'));
    const before = el.childNodes.length;

    (component as any)._ensureTrailingAnchor();

    expect(el.childNodes.length).toBe(before);
  });
});

// ── updateVariableSpans：值沒變就不得寫 DOM（待辦 2）───────────────────────────
//
// p4-5-fee 的 `[variables]="getItemVarsCtx(...)"` 用 spread 產新物件 → `changes['variables']`
// 每輪 CD 都成立 → 舊實作無條件重寫每顆 chip 的 textContent。使用者真 app 診斷檔 2630 行中
// 2627 行都是同一種 MutationRecord（`{target:"SPAN",added:["#text"],removed:["#text"]}`）。
// 已驗證不傷游標（RCA 實測），但每輪 CD 的無謂 DOM 寫入該消掉。

describe('TemplateEditorComponent — updateVariableSpans 的 DOM 寫入', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('[contenteditable]') as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.variableDefs = [
      { key: 'DefaultFromName', label: '寄件者', group: 'basic' },
      {
        key: 'FilingMethod', label: '申報方式', group: 'basic',
        options: [{ label: '書審', value: '書審' }, { label: '查帳', value: '查帳' }],
      },
    ];
    component.variables = { DefaultFromName: '嘉威', FilingMethod: '書審' };
    component.template = '%DefaultFromName%與%FilingMethod%';
    fixture.detectChanges();
  });

  it('variables 內容相同但 reference 換新（p4-5 每次 CD 的形態）→ 零 DOM 寫入', () => {
    const observer = new MutationObserver(() => undefined);
    observer.observe(editorEl(), { subtree: true, childList: true, characterData: true, attributes: true });

    const prev = component.variables;
    component.variables = { ...prev };
    component.ngOnChanges({ variables: new SimpleChange(prev, component.variables, false) });

    const records = observer.takeRecords();
    observer.disconnect();
    expect(records.length)
      .withContext(`不應有 DOM 變更，實際 ${records.map(r => r.type).join(',')}`).toBe(0);
  });

  it('variables 值真的改變 → chip 文字仍要更新（plain 與 select 兩種都要）', () => {
    const prev = component.variables;
    component.variables = { DefaultFromName: '嘉威台北', FilingMethod: '查帳' };
    component.ngOnChanges({ variables: new SimpleChange(prev, component.variables, false) });

    const plain = editorEl().querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    const select = editorEl().querySelector('.tpl[data-var="FilingMethod"]') as HTMLElement;
    expect(plain.textContent).toBe('嘉威台北');
    expect(select.childNodes[0].textContent).toBe('查帳');
    expect(select.querySelector('svg')).withContext('select chip 的 caret 不得被清掉').toBeTruthy();
  });

  it('值變成空 → 顯示 [key] 佔位並掛上 tpl--empty', () => {
    const prev = component.variables;
    component.variables = { DefaultFromName: '', FilingMethod: '書審' };
    component.ngOnChanges({ variables: new SimpleChange(prev, component.variables, false) });

    const plain = editorEl().querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    expect(plain.textContent).toBe('[DefaultFromName]');
    expect(plain.classList.contains('tpl--empty')).toBeTrue();
  });
});

// ── 連續插入多個變數：重繪不得把游標打掉（2026-08-11 第二輪回報）─────────────────
// 補完「結尾 chip 要有 text node」後使用者仍回報：陸續加變數時，最後一個還是刪不掉。
// 因為 anchor 只保證「有落點」，沒保證「游標在落點上」——controlled component 每次 emit 都讓
// [template] 回寫，只要那一刻 isEditing=false（點 ⓘ 面板會讓 editor blur）就走 renderTemplate，
// innerHTML 整批換節點 → selection 塌回編輯器根節點 offset 0，此時 Backspace 沒東西可刪。
describe('TemplateEditorComponent — 連續插入變數時的游標存續', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('[contenteditable]') as HTMLElement;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.variableDefs = [
      { key: 'A', label: '變數A', group: 'basic' },
      { key: 'B', label: '變數B', group: 'basic' },
    ];
    component.variables = { A: '值A', B: '值B' };
    component.template = '前綴';
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode === document.body) {
      document.body.removeChild(fixture.nativeElement);
    }
  });

  /** 模擬 controlled parent：把 emit 出來的 template 原封不動回寫（p4-5-fee 的行為） */
  function echoBackToParent(emitted: string): void {
    const prev = component.template;
    component.template = emitted;
    component.ngOnChanges({ template: new SimpleChange(prev, emitted, false) });
  }

  it('emit 的 template 被 parent 原封不動回寫（非編輯態）→ 游標不得塌回編輯器根節點', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFocus();
    component.insertVariable('A');
    component.onBlur();          // 點 ⓘ 面板 → editor blur → isEditing=false
    echoBackToParent(emitted);

    const sel = window.getSelection()!;
    expect(sel.rangeCount).toBeGreaterThan(0);
    const r = sel.getRangeAt(0);
    const collapsedAtEditorStart =
      r.startContainer === editorEl() && r.startOffset === 0;
    expect(collapsedAtEditorStart)
      .withContext('游標塌回編輯器 offset 0 → Backspace 會是 no-op（＝刪不掉最後一個變數）')
      .toBeFalse();
  });

  it('連續插入兩個變數（中間經歷 echo 回寫）→ 兩個 chip 都在、最後一個 chip 後有落點', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFocus();
    component.insertVariable('A');
    component.onBlur();
    echoBackToParent(emitted);

    component.onFocus();
    component.insertVariable('B');
    component.onBlur();
    echoBackToParent(emitted);

    const chips = editorEl().querySelectorAll('.tpl[data-var]');
    expect(chips.length).withContext('兩個變數都應保留').toBe(2);
    const last = chips[chips.length - 1];
    expect(last.nextSibling?.nodeType).toBe(Node.TEXT_NODE);
  });
});

// ── Backspace 刪除游標前方的 chip（自訂 handler）──────────────────────────────
// 真 app 實證（2026-08-11，使用者 Console 診斷）：即使 chip 後面有空 text node、游標就在
// 該 node 的 offset 0、且沒有任何人 preventDefault，原生 Backspace **仍然不會刪掉 chip**
// （chips 6→6，瀏覽器反而 normalize 補了一個 <br>，游標跳到 EDITOR@9）。
// 也就是說「空 text node」對原生 Backspace 不算「前方有可刪內容」的位置——那是瀏覽器的邊界
// 行為，harness 與真 app 不一致、測不到。因此刪除改由我們自己做：preventDefault + 手動移除。
describe('TemplateEditorComponent — Backspace 刪除前方 chip（自訂 handler）', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('[contenteditable]') as HTMLElement;
  }
  function chips(): HTMLElement[] {
    return Array.from(editorEl().querySelectorAll<HTMLElement>('.tpl[data-var]'));
  }
  function pressBackspace(): KeyboardEvent {
    const ev = new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true, cancelable: true });
    editorEl().dispatchEvent(ev);
    return ev;
  }
  function setCaret(node: Node, offset: number): void {
    const r = document.createRange();
    r.setStart(node, offset);
    r.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.variableDefs = [{ key: 'A', label: '變數A', group: 'basic' }];
    component.variables = { A: '值A' };
    component.template = '前綴%A%';
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode === document.body) {
      document.body.removeChild(fixture.nativeElement);
    }
  });

  it('游標在 chip 後的空 text node（真 app 的實際狀態）→ 刪掉整顆 chip 並 preventDefault', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    const chip = chips()[0];
    expect(chip.nextSibling?.nodeType).withContext('前置條件：chip 後應有空 text node').toBe(Node.TEXT_NODE);
    setCaret(chip.nextSibling!, 0);

    const ev = pressBackspace();

    expect(chips().length).withContext('chip 應被移除').toBe(0);
    expect(ev.defaultPrevented).withContext('必須 preventDefault，否則瀏覽器會再做一次 normalize').toBeTrue();
    expect(emitted).withContext('要走 onInput 觸發 emit，否則後端不會知道').toBe('前綴');
  });

  it('游標在編輯器元素層、前一個子節點是 chip → 同樣刪掉', () => {
    const el = editorEl();
    // 移除 anchor 讓 chip 成為 lastChild，游標放在元素層末端（RCA 的 S8 情境）
    if (el.lastChild?.nodeType === Node.TEXT_NODE && !el.lastChild.textContent) el.lastChild.remove();
    setCaret(el, el.childNodes.length);

    pressBackspace();

    expect(chips().length).toBe(0);
  });

  it('游標在文字中間（前方是可刪字元）→ 不介入，交給原生 Backspace', () => {
    const textNode = Array.from(editorEl().childNodes).find(n => n.nodeType === Node.TEXT_NODE && n.textContent === '前綴')!;
    setCaret(textNode, 2);

    const ev = pressBackspace();

    expect(chips().length).withContext('不得誤刪 chip').toBe(1);
    expect(ev.defaultPrevented).withContext('要讓原生刪字元').toBeFalse();
  });

  it('有選取範圍（非 collapsed）→ 不介入', () => {
    const chip = chips()[0];
    const r = document.createRange();
    r.selectNode(chip);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);

    const ev = pressBackspace();

    expect(ev.defaultPrevented).toBeFalse();
  });

  it('游標前方是 <br>（使用者的換行）→ 不跨過去誤刪 chip，交給原生刪換行', () => {
    const el = editorEl();
    const br = document.createElement('br');
    el.appendChild(br);
    const tail = document.createTextNode('');
    el.appendChild(tail);
    setCaret(tail, 0);

    const ev = pressBackspace();

    expect(chips().length).withContext('chip 不該被刪').toBe(1);
    expect(ev.defaultPrevented).toBeFalse();
  });

  it('連續兩顆 chip：一次 Backspace 只刪最後一顆', () => {
    component.variableDefs = [
      { key: 'A', label: '變數A', group: 'basic' },
      { key: 'B', label: '變數B', group: 'basic' },
    ];
    component.variables = { A: '值A', B: '值B' };
    component.template = '%A%%B%';
    component.ngOnChanges({ template: new SimpleChange('前綴%A%', '%A%%B%', false) });
    expect(chips().length).toBe(2);

    const last = chips()[1];
    setCaret(last.nextSibling ?? editorEl(), 0);
    pressBackspace();

    const rest = chips();
    expect(rest.length).toBe(1);
    expect(rest[0].dataset['var']).toBe('A');
  });
});
