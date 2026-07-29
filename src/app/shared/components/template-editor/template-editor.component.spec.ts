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
