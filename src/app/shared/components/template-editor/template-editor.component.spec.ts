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

  const plainDef: TemplateVarDef = { key: 'PeriodNote', label: '期間說明', group: 'detail' };
  const glanceDef: TemplateVarDef = {
    key: 'PeriodNote',
    label: '期間說明',
    group: 'detail',
    options: [
      { label: '系統依情境判斷', value: 'PeriodNote' },
      { label: '以全年計算', value: 'PeriodNote|1' },
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
    component.template = '費用%PeriodNote%。';
    component.variables = { 'PeriodNote': '以實際使用月份計算', 'PeriodNote|1': '以全年計算' };
    component.variableDefs = [plainDef];
    fixture.detectChanges();
  });

  it('defs 從無 options 換成有 options（晚到的 glance defs）→ chip 升級為 tpl--select', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelector('.tpl--select[data-var="PeriodNote"]')).toBeNull(); // 初始 plain

    defsChange([glanceDef]);
    expect(el.querySelector('.tpl--select[data-var="PeriodNote"]')).toBeTruthy();
  });

  it('同 signature 的新 reference（使用端每次 CD 的 getter 形態）→ 不重渲染（DOM 節點 identity 不變）', () => {
    const el: HTMLElement = fixture.nativeElement;
    defsChange([glanceDef]);
    const chipBefore = el.querySelector('.tpl--select[data-var="PeriodNote"]');
    expect(chipBefore).toBeTruthy();

    // 內容相同、reference 不同（深拷貝）
    defsChange([JSON.parse(JSON.stringify(glanceDef))]);
    const chipAfter = el.querySelector('.tpl--select[data-var="PeriodNote"]');
    expect(chipAfter).toBe(chipBefore); // 同一個 DOM 節點 = 沒有全量重建
  });

  it('編輯中 defs 變更 → 不立即重渲染（防打字干擾）；blur 後補渲染升級', () => {
    const el: HTMLElement = fixture.nativeElement;
    component.onFocus(); // isEditing = true
    defsChange([glanceDef]);
    expect(el.querySelector('.tpl--select[data-var="PeriodNote"]')).toBeNull(); // 編輯中不動

    component.onBlur();
    expect(el.querySelector('.tpl--select[data-var="PeriodNote"]')).toBeTruthy(); // blur 補渲染
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
    component.variables = { DefaultFromName: '寄件者甲' };
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
    component.variables = { DefaultFromName: '寄件者甲' };
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
// 使用端常見寫法 `[variables]="getVars(...)"` 用 spread 產新物件 → `changes['variables']`
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
        key: 'DeliveryMethod', label: '寄送方式', group: 'basic',
        options: [{ label: '郵寄', value: '郵寄' }, { label: '自取', value: '自取' }],
      },
    ];
    component.variables = { DefaultFromName: '寄件者甲', DeliveryMethod: '郵寄' };
    component.template = '%DefaultFromName%與%DeliveryMethod%';
    fixture.detectChanges();
  });

  it('variables 內容相同但 reference 換新（使用端每次 CD 的形態）→ 零 DOM 寫入', () => {
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
    component.variables = { DefaultFromName: '新寄件者', DeliveryMethod: '自取' };
    component.ngOnChanges({ variables: new SimpleChange(prev, component.variables, false) });

    const plain = editorEl().querySelector('.tpl[data-var="DefaultFromName"]') as HTMLElement;
    const select = editorEl().querySelector('.tpl[data-var="DeliveryMethod"]') as HTMLElement;
    expect(plain.textContent).toBe('新寄件者');
    expect(select.childNodes[0].textContent).toBe('自取');
    expect(select.querySelector('svg')).withContext('select chip 的 caret 不得被清掉').toBeTruthy();
  });

  it('值變成空 → 顯示 [key] 佔位並掛上 tpl--empty', () => {
    const prev = component.variables;
    component.variables = { DefaultFromName: '', DeliveryMethod: '郵寄' };
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

  /** 模擬 controlled parent：把 emit 出來的 template 原封不動回寫（常見的使用端寫法） */
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

// ── ⓘ 面板「搜尋後插入」的游標位置（2026-09-14 使用者回報）────────────────────
// 症狀：點 ⓘ 直接點變數 → 插在游標位置（對）；點 ⓘ **先在搜尋框打字**再點變數 →
// 插到文字最後面（錯）。根因：`insertVariable` 只讀插入當下的 live document selection
// （`editorEl.contains(range.commonAncestorContainer)`），而搜尋框是原生 <input>、
// 面板又 portal 到 body —— 點它必然把 selection 帶離編輯器 → 走末尾 fallback 分支。
// 對照組「直接點 chip」不壞，是因為 `.tvp-chip` 綁了 mousedown preventDefault（不搶焦點）；
// `%%` inline 路徑不壞，是因為 `_deleteTriggerText()` 會主動把 selection 設回編輯器內。
// 修法：編輯器自己保存游標快照，插入時 live selection →快照→末尾 三階降級。
describe('TemplateEditorComponent — ⓘ 搜尋後插入的游標位置', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;
  let outside: HTMLElement;

  const defs: TemplateVarDef[] = [
    { key: 'A', label: '變數A', group: 'basic' },
    { key: 'B', label: '變數B', group: 'basic' },
  ];

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
    component.variableDefs = defs;
    component.variables = { A: '值A', B: '值B' };
    component.template = '前綴中段尾段';
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();

    // 面板 portal 到 body，搜尋框是它的後代——用一個編輯器外的節點忠實模擬「焦點被搜尋框奪走」
    outside = document.createElement('div');
    outside.textContent = '面板搜尋框';
    document.body.appendChild(outside);
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode === document.body) {
      document.body.removeChild(fixture.nativeElement);
    }
    if (outside.parentNode) outside.parentNode.removeChild(outside);
  });

  /** 把游標放進編輯器第一個 text node 的指定 offset */
  function putCaret(offset: number): Text {
    const node = editorEl().firstChild as Text;
    const r = document.createRange();
    r.setStart(node, offset);
    r.collapse(true);
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
    return node;
  }

  /**
   * 忠實模擬「點擊面板搜尋框」：真實瀏覽器下 rangeCount 仍是 1，只是
   * commonAncestorContainer 落在編輯器外（實測 cac=BODY/DIV），不是 rangeCount=0。
   */
  function stealSelectionToPanel(): void {
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    const r = document.createRange();
    r.selectNodeContents(outside);
    sel.addRange(r);
  }

  it('搜尋框奪走焦點後插入 → 變數落在 blur 前的游標位置（不是末尾）', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFocus();
    putCaret(2);                              // 「前綴|中段尾段」
    component.onBlur(new FocusEvent('blur')); // 點 ⓘ → 編輯器失焦
    stealSelectionToPanel();                  // 點搜尋框打字 → selection 離開編輯器

    component.insertVariable('A');

    expect(emitted)
      .withContext('修前為「前綴中段尾段%A%」＝插到末尾')
      .toBe('前綴%A%中段尾段');
  });

  it('blur 的 relatedTarget 落在面板內（onBlur early-return 路徑）→ 仍要有快照', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));
    const panel = document.createElement('div');
    panel.className = 'tvp-panel';
    document.body.appendChild(panel);

    component.onFocus();
    putCaret(2);
    // relatedTarget 在 .tvp-panel 內 → onBlur 在 :521-524 early return
    component.onBlur({ relatedTarget: panel } as unknown as FocusEvent);
    stealSelectionToPanel();

    component.insertVariable('A');
    document.body.removeChild(panel);

    expect(emitted)
      .withContext('快照必須寫在 relatedTarget guard 之前，否則 Safari 這條路徑抓不到')
      .toBe('前綴%A%中段尾段');
  });

  it('方向鍵移動游標（只有 keyup、沒有 input）後失焦 → 插在移動後的位置', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFocus();
    putCaret(4);
    putCaret(2); // 模擬瀏覽器已套用方向鍵
    editorEl().dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowLeft' }));
    stealSelectionToPanel();

    component.insertVariable('A');

    expect(emitted)
      .withContext('keyup 監聽沒註冊成功的話，這條會落回末尾')
      .toBe('前綴%A%中段尾段');
  });

  it('快照失效（外部 template 變更觸發重繪）→ 降級成末尾，不得插到開頭', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFocus();
    putCaret(2);
    component.onBlur(new FocusEvent('blur'));

    const prev = component.template;
    component.template = '全新文字';
    component.ngOnChanges({ template: new SimpleChange(prev, '全新文字', false) });
    stealSelectionToPanel();

    component.insertVariable('A');

    // innerHTML 整批換節點後，live Range 依 DOM 規格會重錨定到 (editorEl, 0)：
    // 不清快照的話 isConnected 與 contains 兩道驗證都會過 → 變數插到開頭。
    expect(emitted).toBe('全新文字%A%');
    expect(emitted).not.toBe('%A%全新文字');
  });

  it('點 chip 造成整塊被選取（user-select:all）→ 插在 chip 之後，不得刪掉該 chip', () => {
    let emitted = '';
    component.template = '%A%尾段';
    component.ngOnChanges({ template: new SimpleChange('前綴中段尾段', '%A%尾段', false) });
    component.templateChange.subscribe((t: string) => (emitted = t));

    const chip = editorEl().querySelector('.tpl[data-var="A"]') as HTMLElement;
    component.onFocus();
    const r = document.createRange();
    r.selectNode(chip);                 // user-select:all → 點一下就是整塊被選取
    const sel = window.getSelection()!;
    sel.removeAllRanges();
    sel.addRange(r);
    editorEl().dispatchEvent(new MouseEvent('mouseup'));
    component.onBlur(new FocusEvent('blur'));
    stealSelectionToPanel();

    component.insertVariable('B');

    expect(emitted)
      .withContext('非 collapsed 快照若直接 deleteContents，%A% 會被吃掉')
      .toBe('%A%%B%尾段');
  });

  it('live selection 在編輯器內（ⓘ 直接點 chip）→ 插在游標位置並把焦點還給編輯器', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));
    const focusSpy = spyOn(editorEl(), 'focus').and.callThrough();

    component.onFocus();
    putCaret(2);
    component.insertVariable('A');

    expect(emitted).toBe('前綴%A%中段尾段');
    expect(focusSpy)
      .withContext('修前 focus() 只出現在末尾 fallback 分支 → 插完游標看不見、無法續打')
      .toHaveBeenCalled();
    const sel = window.getSelection()!;
    const chip = editorEl().querySelector('.tpl[data-var="A"]')!;
    expect(sel.getRangeAt(0).startContainer).toBe(chip.nextSibling!);
  });

  it('連續插入兩個變數（都走快照路徑）→ 第二個接在第一個之後', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFocus();
    putCaret(2);
    component.onBlur(new FocusEvent('blur'));
    stealSelectionToPanel();
    component.insertVariable('A');

    stealSelectionToPanel();
    component.insertVariable('B');

    expect(emitted)
      .withContext('插入後沒有把快照更新到新游標 → 第二個會蓋回第一個的位置')
      .toBe('前綴%A%%B%中段尾段');
  });

  it('`%%` inline 路徑：live selection 優先於快照（回歸鎖）', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    // 先在 offset 0 建立一份舊快照
    component.onFocus();
    putCaret(0);
    component.onBlur(new FocusEvent('blur'));

    // 再走 %% 觸發：_deleteTriggerText 會把 selection 設回編輯器
    component.onFocus();
    editorEl().textContent = '中文%%Def';
    putCaret('中文%%Def'.length);
    component.onInput();
    component.insertVariable('A');

    expect(emitted).toBe('中文%A%');
    expect(emitted).not.toContain('%%');
  });

  it('快照路徑插入後：只 emit 一次 templateChange，parent 原封回寫不重繪', () => {
    let emitted = '';
    let count = 0;
    component.templateChange.subscribe((t: string) => { emitted = t; count++; });

    component.onFocus();
    putCaret(2);
    component.onBlur(new FocusEvent('blur'));
    stealSelectionToPanel();
    component.insertVariable('A');

    expect(count).toBe(1);
    const chipBefore = editorEl().querySelector('.tpl[data-var="A"]');
    const prev = component.template;
    component.template = emitted;
    component.ngOnChanges({ template: new SimpleChange(prev, emitted, false) });
    expect(editorEl().querySelector('.tpl[data-var="A"]'))
      .withContext('echo 抑制失效 → 重繪 → 游標塌回編輯器根節點')
      .toBe(chipBefore);
  });
});

// ── chip 拖曳重排（2026-09-14 使用者要求；2026-06-27 曾做過、踩四個坑後拍板不做）──
// 這次的範圍收斂成「只在同一格編輯器內重排」（使用者 2026-09-14 選項 A），四個舊坑各自對應：
//  坑1 dragstart 的 target 可能是文字節點 → 一律先正規化成 element 再 closest
//  坑2 `.tpl` 的 user-select:all 讓瀏覽器把拖曳當「選取文字」→ 可拖的 chip 改 user-select:none
//  坑3 dragstart 冒泡到 宿主的清單項目（宿主對非握把來源無條件 preventDefault）→ 整個拖曳被殺
//      → chip 的 dragstart/dragover/drop 一律 stopPropagation
//  坑4 原生 DnD 一旦啟動瀏覽器全權接管、可拖出框落到別的編輯器 → 改成自己算落點自己搬，
//      並且「來源不是自己這格的 chip」時完全不碰事件（不 preventDefault、不 stopPropagation），
//      讓宿主的清單項目重排照常運作
describe('TemplateEditorComponent — chip 拖曳重排（同格內）', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  const defs: TemplateVarDef[] = [
    { key: 'A', label: '變數A', group: 'basic' },
    { key: 'B', label: '變數B', group: 'basic' },
    { key: 'S', label: '選擇變數', group: 'fee', options: [{ label: '甲', value: 'a' }] },
  ];

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('[contenteditable]') as HTMLElement;
  }
  function chip(key: string): HTMLElement {
    return editorEl().querySelector(`.tpl[data-var="${key}"]`) as HTMLElement;
  }

  /** 指定 drop 落點：真實瀏覽器靠滑鼠座標換算，karma 無精確 layout，改直接給位置 */
  function stubDropPoint(node: Node, offset: number): void {
    spyOn(component as unknown as { _caretFromPoint: (x: number, y: number) => unknown },
          '_caretFromPoint').and.returnValue({ node, offset });
  }

  /** 合成一顆帶 dataTransfer 的 DragEvent（karma 下 DataTransfer 建構子可用） */
  function dragEvent(type: string, target: Node, init: Partial<DragEventInit> = {}): DragEvent {
    const ev = new DragEvent(type, {
      bubbles: true,
      cancelable: true,
      dataTransfer: new DataTransfer(),
      ...init,
    });
    Object.defineProperty(ev, 'target', { value: target, configurable: true });
    return ev;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.variableDefs = defs;
    component.variables = { A: '值A', B: '值B', S: '甲' };
    component.template = '前段%A%中段%B%尾段';
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode === document.body) {
      document.body.removeChild(fixture.nativeElement);
    }
  });

  it('chip 帶 draggable 屬性（普通 chip 可拖）', () => {
    expect(chip('A').getAttribute('draggable')).toBe('true');
    expect(chip('B').getAttribute('draggable')).toBe('true');
  });

  it('select chip 不可拖（它的點擊要開下拉選單，兩者衝突）', () => {
    component.template = '%S%尾段';
    component.ngOnChanges({ template: new SimpleChange('前段%A%中段%B%尾段', '%S%尾段', false) });
    expect(chip('S').getAttribute('draggable')).toBeNull();
  });

  it('dragstart：stopPropagation 擋住宿主的 preventDefault（坑 3）', () => {
    // 忠實重現宿主：宿主的清單項目也是 draggable，其 onDragStart 對非握把來源
    // 無條件 preventDefault —— dragstart 冒泡上去就會把整個拖曳殺掉。
    const outer = document.createElement('div');
    const hostSpy = jasmine.createSpy('hostDragStart').and.callFake((e: DragEvent) => e.preventDefault());
    outer.addEventListener('dragstart', hostSpy);
    document.body.appendChild(outer);
    outer.appendChild(fixture.nativeElement);

    // 真的 dispatch（不是直接呼叫方法），事件才會走完冒泡鏈
    const ev = new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() });
    chip('A').dispatchEvent(ev);

    expect(hostSpy)
      .withContext('冒泡到宿主 → 宿主 preventDefault → chip 完全拖不動（2026-06-27 的死因）')
      .not.toHaveBeenCalled();
    expect(ev.defaultPrevented).toBeFalse();
    document.body.removeChild(outer);
  });

  it('select chip 的 dragstart 不得被宿主擋下來之外還留下拖曳狀態', () => {
    component.template = '%S%尾段';
    component.ngOnChanges({ template: new SimpleChange('前段%A%中段%B%尾段', '%S%尾段', false) });
    const ev = new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer: new DataTransfer() });
    chip('S').dispatchEvent(ev);
    expect(ev.defaultPrevented)
      .withContext('select chip 不可拖 → 必須 preventDefault，否則瀏覽器會亂搬文字')
      .toBeTrue();
  });

  it('dragstart 的 target 是文字節點時不得爆（坑 1）', () => {
    const textNode = editorEl().firstChild!;
    expect(() => component.onFieldDragStart(dragEvent('dragstart', textNode))).not.toThrow();
  });

  it('把 %A% 拖到 %B% 之後 → 順序變成 前段中段%B%%A%尾段', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    // 落點：%B% 之後那個 text node（「尾段」）的 offset 0
    const tail = chip('B').nextSibling as Text;
    stubDropPoint(tail, 0);
    component.onFieldDrop(dragEvent('drop', editorEl()));

    expect(emitted).toBe('前段中段%B%%A%尾段');
    expect(editorEl().querySelectorAll('.tpl[data-var]').length)
      .withContext('搬移不是複製：總數不變')
      .toBe(2);
  });

  it('拖到自己原位 → 不動 DOM、不 emit（node identity 不變）', () => {
    let count = 0;
    component.templateChange.subscribe(() => count++);

    const before = chip('A');
    const anchorBefore = before.nextSibling;
    component.onFieldDragStart(dragEvent('dragstart', before));
    stubDropPoint(before.nextSibling as Text, 0);
    component.onFieldDrop(dragEvent('drop', editorEl()));

    expect(chip('A')).toBe(before);
    expect(before.nextSibling).toBe(anchorBefore);
    expect(count).toBe(0);
  });

  it('落點被算在 chip 自己內部 → 夾到 chip 之外，不得把 chip 塞進 chip 裡', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    // caretFromPoint 打在 %B% 中央時，真實瀏覽器會回傳 chip **內部**的 text node
    const insideB = chip('B').firstChild as Text;
    stubDropPoint(insideB, 1);
    component.onFieldDrop(dragEvent('drop', editorEl()));

    expect(chip('B').querySelector('.tpl[data-var="A"]'))
      .withContext('chip 巢狀 → walkNodes 會序列化成 %B% 吃掉 %A%')
      .toBeNull();
    expect(emitted).toContain('%A%');
    expect(emitted).toContain('%B%');
  });

  it('外來拖曳（非本格 chip）→ 完全不碰事件，讓宿主的項目重排照跑（坑 3 反向）', () => {
    const ev = dragEvent('drop', editorEl());
    const pd = spyOn(ev, 'preventDefault');
    const sp = spyOn(ev, 'stopPropagation');

    component.onFieldDrop(ev); // 沒有先 dragstart ＝ 來源不是本格 chip

    expect(pd).not.toHaveBeenCalled();
    expect(sp)
      .withContext('無條件 stopPropagation 會吃掉宿主清單項目重排的 drop')
      .not.toHaveBeenCalled();
  });

  it('dragover：只對自己的拖曳 preventDefault（否則瀏覽器不允許 drop）', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    const mine = dragEvent('dragover', editorEl());
    const minePd = spyOn(mine, 'preventDefault');
    component.onFieldDragOver(mine);
    expect(minePd).toHaveBeenCalled();
  });

  it('dragend：拖曳被取消（沒有 drop）也要清乾淨拖曳中樣式與狀態', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    component.onFieldDragEnd(dragEvent('dragend', chip('A')));

    expect(editorEl().querySelectorAll('.tpl--dragging').length).toBe(0);
    // 狀態沒清乾淨的話，下一次外來拖曳會被誤判成「自己的」
    const ev = dragEvent('drop', editorEl());
    const sp = spyOn(ev, 'stopPropagation');
    component.onFieldDrop(ev);
    expect(sp).not.toHaveBeenCalled();
  });

  it('搬移後：最後一個節點是 chip 時仍要有游標落點（_ensureTrailingAnchor 不變量）', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    const tail = chip('B').nextSibling as Text;
    stubDropPoint(tail, tail.data.length);
    component.onFieldDrop(dragEvent('drop', editorEl()));

    const chips = editorEl().querySelectorAll('.tpl[data-var]');
    const last = chips[chips.length - 1];
    expect(last.nextSibling?.nodeType).toBe(Node.TEXT_NODE);
    expect(emitted).toBe('前段中段%B%尾段%A%');
  });

  it('搬移後：echo 回寫不重繪（_lastEmittedTemplate 必須同步）', () => {
    let emitted = '';
    component.templateChange.subscribe((t: string) => (emitted = t));

    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    const tail = chip('B').nextSibling as Text;
    stubDropPoint(tail, 0);
    component.onFieldDrop(dragEvent('drop', editorEl()));

    const chipRef = chip('A');
    const prev = component.template;
    component.template = emitted;
    component.ngOnChanges({ template: new SimpleChange(prev, emitted, false) });
    expect(chip('A'))
      .withContext('沒同步 _lastEmittedTemplate → 在使用者手底下整批重繪')
      .toBe(chipRef);
  });

  it('disabled 時不可拖', () => {
    component.disabled = true;
    component.ngOnChanges({ disabled: new SimpleChange(false, true, false) });
    const ev = dragEvent('dragstart', chip('A'));
    const pd = spyOn(ev, 'preventDefault');
    component.onFieldDragStart(ev);
    expect(pd).toHaveBeenCalled();
  });
});

// ── 拖曳時的落點指示線（2026-09-14 使用者回報「看不出會放到哪」）──────────────
// 對照組（以 ProseMirror 實作的編輯器）用的是 StarterKit 內含的 Dropcursor（一條線）。
// 這裡自己畫一條對應的線，顏色對齊產品既有的落點指示語彙 `--button/action`
// （清單拖曳的 drag-over 指示也用同一個）。
//
// 實作形態：線**永遠存在於 template 裡**（不是 document.createElement）。
// 理由：Angular emulated encapsulation 會給 component scss 的選擇器加 `[_ngcontent-xxx]`，
// 命令式建立的元素沒有那個屬性、吃不到樣式。放進 template 才有；同時用 ViewChild 直接改
// 它的 inline style（不走 Angular 綁定），dragover 每幀更新才不會觸發 CD ——
// 本元件沒有 OnPush，一頁有 9 個以上實例，每幀 tick 全 app 會拖垮整頁。
describe('TemplateEditorComponent — 拖曳落點指示線', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('[contenteditable]') as HTMLElement;
  }
  function chip(key: string): HTMLElement {
    return editorEl().querySelector(`.tpl[data-var="${key}"]`) as HTMLElement;
  }
  function caretEl(): HTMLElement {
    return fixture.nativeElement.querySelector('.te-drop-caret') as HTMLElement;
  }
  function caretVisible(): boolean {
    const el = caretEl();
    return !!el && getComputedStyle(el).display !== 'none';
  }
  function stubDropPoint(node: Node, offset: number): jasmine.Spy {
    return spyOn(component as unknown as { _caretFromPoint: (x: number, y: number) => unknown },
                 '_caretFromPoint').and.returnValue({ node, offset });
  }
  function dragEvent(type: string, target: Node): DragEvent {
    const ev = new DragEvent(type, {
      bubbles: true, cancelable: true, dataTransfer: new DataTransfer(),
    });
    Object.defineProperty(ev, 'target', { value: target, configurable: true });
    return ev;
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
    component.template = '前段%A%中段%B%尾段';
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode === document.body) {
      document.body.removeChild(fixture.nativeElement);
    }
  });

  it('指示線元素存在於 template 內（不是命令式建立），預設不顯示', () => {
    expect(caretEl())
      .withContext('命令式建立的元素吃不到 component scss，必須放在 template 裡')
      .toBeTruthy();
    expect(caretVisible()).toBeFalse();
  });

  it('指示線不在 contenteditable 內 → 不影響序列化', () => {
    expect(editorEl().contains(caretEl()))
      .withContext('線若落在 .te-field 內，walkNodes 會把它當內容序列化進 template 字串')
      .toBeFalse();
    expect(component['extractTemplate']()).toBe('前段%A%中段%B%尾段');
  });

  it('拖曳中 dragover → 指示線顯示在落點上', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    stubDropPoint(chip('B').nextSibling as Text, 0);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));

    expect(caretVisible()).toBeTrue();
    expect(parseFloat(caretEl().style.height))
      .withContext('高度為 0 的線等於看不見')
      .toBeGreaterThan(0);
  });

  it('落點等於原位（放開是 no-op）→ 不顯示線，避免誤導', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    stubDropPoint(chip('A').nextSibling as Text, 0);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));

    expect(caretVisible())
      .withContext('放開不會有任何變化，卻畫線告訴使用者「會放這裡」')
      .toBeFalse();
  });

  it('drop 之後 → 線消失', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    const tail = chip('B').nextSibling as Text;
    stubDropPoint(tail, 0);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));
    expect(caretVisible()).toBeTrue();

    component.onFieldDrop(dragEvent('drop', editorEl()));
    expect(caretVisible()).toBeFalse();
  });

  it('拖曳被取消（dragend，沒有 drop）→ 線消失', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    stubDropPoint(chip('B').nextSibling as Text, 0);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));
    expect(caretVisible()).toBeTrue();

    component.onFieldDragEnd(dragEvent('dragend', chip('A')));
    expect(caretVisible()).toBeFalse();
  });

  it('離開編輯器（dragleave 到框外）→ 線消失', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    stubDropPoint(chip('B').nextSibling as Text, 0);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));
    expect(caretVisible()).toBeTrue();

    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const ev = dragEvent('dragleave', editorEl());
    Object.defineProperty(ev, 'relatedTarget', { value: outside, configurable: true });
    component.onFieldDragLeave(ev);
    expect(caretVisible()).toBeFalse();
    document.body.removeChild(outside);
  });

  // collapsed Range 的 getBoundingClientRect 在**空 text node** 上回 0×0 —— 而 chip 後面的
  // 游標落點（_ensureTrailingAnchor 插的 anchor）正好就是空 text node。只用 collapsed range
  // 量的話，拖到行尾那條線高度是 0 ＝ 使用者看不到。必須往鄰居借高度。
  it('落點在空 text node（chip 後的游標落點）→ 線仍要有高度', () => {
    component.template = '前段%A%中段%B%';
    component.ngOnChanges({ template: new SimpleChange('前段%A%中段%B%尾段', '前段%A%中段%B%', false) });

    const anchor = chip('B').nextSibling as Text;
    expect(anchor.nodeType).toBe(Node.TEXT_NODE);
    expect(anchor.data).withContext('_ensureTrailingAnchor 插的是空 text node').toBe('');

    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    stubDropPoint(anchor, 0);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));

    expect(caretVisible()).toBeTrue();
    expect(parseFloat(caretEl().style.height))
      .withContext('collapsed range 在空 text node 上量到 0 → 線看不見')
      .toBeGreaterThan(0);
  });

  it('落點在元素層位置（container 是編輯器本身）→ 線仍要有高度', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    const el = editorEl();
    const idx = Array.prototype.indexOf.call(el.childNodes, chip('B'));
    stubDropPoint(el, idx);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));

    expect(caretVisible()).toBeTrue();
    expect(parseFloat(caretEl().style.height)).toBeGreaterThan(0);
  });

  it('外來拖曳（非本格 chip）的 dragover → 不顯示線', () => {
    stubDropPoint(chip('B').nextSibling as Text, 0);   // 沒有先 dragstart
    component.onFieldDragOver(dragEvent('dragover', editorEl()));
    expect(caretVisible()).toBeFalse();
  });

  it('落點算不出來（拖到框外）→ 不顯示線', () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    spyOn(component as unknown as { _caretFromPoint: (x: number, y: number) => unknown },
          '_caretFromPoint').and.returnValue(null);
    component.onFieldDragOver(dragEvent('dragover', editorEl()));
    expect(caretVisible()).toBeFalse();
  });

  it('拖曳中的 chip 有 tpl--dragging 且實際變淡（不只是掛了 class）', async () => {
    component.onFieldDragStart(dragEvent('dragstart', chip('A')));
    await new Promise<void>(r => requestAnimationFrame(() => r()));   // 加 class 是 rAF 延後的

    const dragged = chip('A');
    expect(dragged.classList.contains('tpl--dragging')).toBeTrue();
    expect(parseFloat(getComputedStyle(dragged).opacity))
      .withContext('樣式沒穿透 encapsulation 的話 class 掛了也沒視覺效果')
      .toBeLessThan(0.6);
  });
});

// ── 拖曳縮圖（2026-09-14 使用者回報「變數字數多時拖著一張很大的圖」）─────────────
// 不設 setDragImage 時瀏覽器用預設＝被拖元素的整張截圖，長變數就是一大塊跟著滑鼠跑。
// 改成固定寬度上限的小膠囊：保留 chip 的藍底藍框（知道在拖哪一顆），超出用省略號截斷。
// 形態照常見做法（clone → 定位到畫面外 → setDragImage → rAF 移除）。
describe('TemplateEditorComponent — 拖曳縮圖', () => {
  let component: TemplateEditorComponent;
  let fixture: ComponentFixture<TemplateEditorComponent>;

  const LONG = '年度活動場地、餐飲與交通安排（含備案場地）';

  function editorEl(): HTMLElement {
    return fixture.nativeElement.querySelector('[contenteditable]') as HTMLElement;
  }
  function chip(key: string): HTMLElement {
    return editorEl().querySelector(`.tpl[data-var="${key}"]`) as HTMLElement;
  }
  function dragStartOn(node: Node): { ev: DragEvent; spy: jasmine.Spy } {
    const ev = new DragEvent('dragstart', {
      bubbles: true, cancelable: true, dataTransfer: new DataTransfer(),
    });
    Object.defineProperty(ev, 'target', { value: node, configurable: true });
    const spy = spyOn(ev.dataTransfer!, 'setDragImage');
    component.onFieldDragStart(ev);
    return { ev, spy };
  }
  /** 等一次 rAF（clone 移除是 rAF 延後的） */
  const nextFrame = () => new Promise<void>(r => requestAnimationFrame(() => r()));

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateEditorComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateEditorComponent);
    component = fixture.componentInstance;
    component.variableDefs = [{ key: 'A', label: '變數A', group: 'basic' }];
    component.variables = { A: LONG };
    component.template = '前段%A%尾段';
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    if (fixture.nativeElement.parentNode === document.body) {
      document.body.removeChild(fixture.nativeElement);
    }
    document.querySelectorAll('.te-drag-ghost').forEach(n => n.remove());
  });

  it('dragstart → 設定自訂縮圖（不用瀏覽器預設的整張截圖）', () => {
    const { spy } = dragStartOn(chip('A'));
    expect(spy)
      .withContext('沒設 setDragImage ＝ 瀏覽器拿整顆 chip 截圖，長變數就是一大塊')
      .toHaveBeenCalled();
  });

  it('長變數的縮圖寬度受上限拘束（不隨文字長度膨脹）', () => {
    const { spy } = dragStartOn(chip('A'));
    const ghost = spy.calls.mostRecent().args[0] as HTMLElement;

    expect(ghost.offsetWidth).toBeGreaterThan(0);
    expect(ghost.offsetWidth)
      .withContext(`原 chip 寬 ${chip('A').offsetWidth}px；縮圖不得跟著長`)
      .toBeLessThanOrEqual(180);
  });

  it('縮圖保留變數身分（看得出在拖哪一顆），超出以省略號截斷', () => {
    const { spy } = dragStartOn(chip('A'));
    const ghost = spy.calls.mostRecent().args[0] as HTMLElement;

    expect(ghost.textContent).withContext('空白矩形看不出拖的是哪個變數').toBeTruthy();
    expect(LONG.startsWith((ghost.textContent ?? '').replace(/…$/, '')))
      .withContext('縮圖文字應為原值的前綴')
      .toBeTrue();
    expect(getComputedStyle(ghost).textOverflow).toBe('ellipsis');
  });

  it('縮圖用完就從 DOM 移除（不留殘骸）', async () => {
    dragStartOn(chip('A'));
    await new Promise<void>(r => setTimeout(r, 0));
    await new Promise<void>(r => setTimeout(r, 0));
    expect(document.querySelectorAll('.te-drag-ghost').length).toBe(0);
  });

  // 「ghost 必須活到瀏覽器拍完拖曳影像」這件事 **karma 測不出來**：headless Chrome 沒有
  // 真實 vsync，rAF 與 setTimeout(0) 的先後跟真瀏覽器不同，斷言誰先跑只是在測 harness。
  // 這裡只鎖「setDragImage 當下 ghost 仍在 DOM 且有尺寸」——那是同步的、測得準的部分。
  // 「移除時機夠不夠晚」列為真瀏覽器驗證項（V：真 app 拖長變數，看縮圖是小膠囊還是整格截圖）。
  it('setDragImage 當下 ghost 在 DOM 內且已完成 layout', () => {
    const { spy } = dragStartOn(chip('A'));
    const ghost = spy.calls.mostRecent().args[0] as HTMLElement;
    expect(ghost.isConnected)
      .withContext('沒 append 到 document 的元素，setDragImage 會忽略')
      .toBeTrue();
    expect(ghost.offsetHeight)
      .withContext('量到 0×0 的元素瀏覽器同樣忽略 → fallback 回預設截圖')
      .toBeGreaterThan(0);
  });

  it('拖曳取消（dragend）→ 縮圖立刻清掉，不等 setTimeout', () => {
    dragStartOn(chip('A'));
    const ev = new DragEvent('dragend', { bubbles: true, dataTransfer: new DataTransfer() });
    component.onFieldDragEnd(ev);
    expect(document.querySelectorAll('.te-drag-ghost').length).toBe(0);
  });

  it('元件在 rAF 跑完前被銷毀 → 縮圖不得留在 body', () => {
    dragStartOn(chip('A'));
    component.ngOnDestroy();
    expect(document.querySelectorAll('.te-drag-ghost').length)
      .withContext('modal 反覆開關會累積殘骸')
      .toBe(0);
  });

  it('不可拖的 select chip → 不建立縮圖', () => {
    component.variableDefs = [{ key: 'A', label: '變數A', group: 'basic', options: [{ label: '甲', value: 'a' }] }];
    component.ngOnChanges({ variableDefs: new SimpleChange([], component.variableDefs, false) });
    const { spy } = dragStartOn(chip('A'));
    expect(spy).not.toHaveBeenCalled();
    expect(document.querySelectorAll('.te-drag-ghost').length).toBe(0);
  });
});
