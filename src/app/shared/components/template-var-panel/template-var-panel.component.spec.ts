import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TemplateVarPanelComponent } from './template-var-panel.component';
import { TEMPLATE_VAR_GROUPS, TEMPLATE_VAR_CONTEXT_TEXT } from './template-var-panel.tokens';

/**
 * varGroups getter 的搜尋行為：除了比對變數 label(中) / key(英)，
 * 也比對「轉換後的值」(resolved value)。值含 HTML/markdown 時先 strip 標記再比對。
 */
describe('TemplateVarPanelComponent — search by resolved value', () => {
  let fixture: ComponentFixture<TemplateVarPanelComponent>;
  let component: TemplateVarPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateVarPanelComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateVarPanelComponent);
    component = fixture.componentInstance;
  });

  /** 攤平 varGroups → def.key 集合，方便斷言（getter 為純邏輯，不需 detectChanges） */
  const keysOf = (): string[] => component.varGroups.flatMap(g => g.defs.map(d => d.key));

  it('label/key 都不含 query 時，靠 resolved value 命中', () => {
    component.varDefs = [{ key: 'DocumentTitle', label: '文件標題', group: 'basic' }];
    component.variables = { DocumentTitle: '年度活動企劃' };
    component.searchQuery = '活動'; // 既不在 label('文件標題') 也不在 key('DocumentTitle')
    expect(keysOf()).toContain('DocumentTitle');
  });

  it('value 比對大小寫不敏感', () => {
    component.varDefs = [{ key: 'DefaultFromName', label: '預設寄件者', group: 'basic' }];
    component.variables = { DefaultFromName: 'ACME LLP' };
    component.searchQuery = 'acme';
    expect(keysOf()).toContain('DefaultFromName');
  });

  it('value 為 undefined / 空字串時不 throw，且非空 query 下不命中', () => {
    component.varDefs = [
      { key: 'A', label: 'AAA', group: 'basic' },
      { key: 'B', label: 'BBB', group: 'basic' },
    ];
    component.variables = { B: '' }; // A undefined、B 空字串
    component.searchQuery = 'zzz';
    expect(() => component.varGroups).not.toThrow();
    expect(keysOf()).toEqual([]);
  });

  it('長 HTML/markdown 值：搜標籤字元不誤命中、搜純文字仍命中', () => {
    component.varDefs = [{ key: 'Note', label: '補充說明', group: 'basic' }];
    component.variables = { Note: '<p>每月<strong>5,000</strong>元</p>' };

    component.searchQuery = 'strong'; // HTML 標籤名
    expect(keysOf()).not.toContain('Note');

    component.searchQuery = '每月'; // 純文字
    expect(keysOf()).toContain('Note');

    component.searchQuery = '5,000'; // 純文字
    expect(keysOf()).toContain('Note');
  });

  it('label / key 既有搜尋路徑仍有效（回歸）', () => {
    component.varDefs = [{ key: 'Budget', label: '預算', group: 'financial' }];
    component.variables = { Budget: '5,000元' };

    component.searchQuery = 'budg'; // 命中 key
    expect(keysOf()).toContain('Budget');

    component.searchQuery = '預算'; // 命中 label
    expect(keysOf()).toContain('Budget');
  });

  it('query 為空 → 回完整清單（空 query 行為不受 value 比對影響）', () => {
    component.varDefs = [
      { key: 'A', label: 'AAA', group: 'basic' },
      { key: 'B', label: 'BBB', group: 'financial' },
    ];
    component.variables = {};
    component.searchQuery = '';
    expect(keysOf().sort()).toEqual(['A', 'B']);
  });
});

/**
 * #3 header 文案統一：不傳 headerText 時，預設為潤飾版（兩個 wrapper 共用此預設後即一致）。
 * #4 分群 divider：≥2 分群時，非首組（:not(:first-child)）上方有分隔線。
 */
describe('TemplateVarPanelComponent — header 預設文案 + 分群 divider', () => {
  let fixture: ComponentFixture<TemplateVarPanelComponent>;
  let component: TemplateVarPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateVarPanelComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateVarPanelComponent);
    component = fixture.componentInstance;
  });

  it('#3 不傳 headerText → 預設為潤飾版', () => {
    expect(component.headerText).toBe('藍色文字為可套用的範本變數，點擊插入至游標位置。');
  });

  it('#3 開啟面板時 header 區渲染預設文案', () => {
    component.varDefs = [{ key: 'A', label: 'AAA', group: 'basic' }];
    component.showPanel = true;
    fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('.tvp-panel__header span') as HTMLElement;
    expect(header?.textContent?.trim()).toBe('藍色文字為可套用的範本變數，點擊插入至游標位置。');
  });

  it('#4 ≥2 分群時，非首組有 border-top、首組無', () => {
    component.varDefs = [
      { key: 'A', label: 'AAA', group: 'basic' },
      { key: 'B', label: 'BBB', group: 'financial' },
    ];
    component.showPanel = true;
    fixture.detectChanges();

    const groups = fixture.nativeElement.querySelectorAll('.tvp-group') as NodeListOf<HTMLElement>;
    expect(groups.length).toBe(2);

    const firstBorder = getComputedStyle(groups[0]).borderTopWidth;
    const secondBorder = getComputedStyle(groups[1]).borderTopWidth;
    expect(firstBorder).toBe('0px');
    expect(secondBorder).not.toBe('0px');
  });
});

/**
 * inline autocomplete 模式（`%%` 觸發）：命令式 API openAt/setQuery/moveActive/selectActive。
 * 定位（caret rect）交 e2e/手測；此處驗邏輯與渲染。
 */
describe('TemplateVarPanelComponent — inline autocomplete 模式', () => {
  let fixture: ComponentFixture<TemplateVarPanelComponent>;
  let component: TemplateVarPanelComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateVarPanelComponent],
      schemas: [NO_ERRORS_SCHEMA],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateVarPanelComponent);
    component = fixture.componentInstance;
    component.varDefs = [
      { key: 'DefaultFromName', label: '寄件者', group: 'basic' },
      { key: 'DocumentTitle', label: '文件標題', group: 'basic' },
    ];
    component.variables = { DefaultFromName: '範例團隊', DocumentTitle: '文件A' };
  });

  it('openAt 開 inline 模式並設 query', () => {
    component.openAt(new DOMRect(10, 20, 0, 16), 'Def');
    expect(component.showPanel).toBeTrue();
    expect(component.inline).toBeTrue();
    expect(component.query).toBe('Def');
  });

  it('inline query 過濾用 query（非 searchQuery）', () => {
    component.inline = true;
    component.query = 'Document';
    component.searchQuery = ''; // 確認不靠 searchQuery
    const keys = component.varGroups.flatMap(g => g.defs.map(d => d.key));
    expect(keys).toEqual(['DocumentTitle']);
  });

  it('moveActive 切換 activeKey（環繞）', () => {
    component.inline = true;
    component.query = '';
    component.activeIndex = 0;
    expect(component.activeKey).toBe('DefaultFromName');
    component.moveActive(1);
    expect(component.activeKey).toBe('DocumentTitle');
    component.moveActive(1); // wrap 回第一個
    expect(component.activeKey).toBe('DefaultFromName');
    component.moveActive(-1); // 往上 wrap 到最後
    expect(component.activeKey).toBe('DocumentTitle');
  });

  it('selectActive emit insert(activeKey) 並關閉', () => {
    component.inline = true;
    component.query = '';
    component.activeIndex = 1;
    let emitted = '';
    component.insert.subscribe((k: string) => (emitted = k));
    component.selectActive();
    expect(emitted).toBe('DocumentTitle');
    expect(component.showPanel).toBeFalse();
  });

  it('inline 模式不渲染搜尋框', () => {
    component.openAt(new DOMRect(0, 0, 0, 16), '');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.tvp-search-wrap')).toBeNull();
  });

  it('inline list 有 role=listbox、active option 有 aria-selected=true', () => {
    component.openAt(new DOMRect(0, 0, 0, 16), '');
    component.activeIndex = 0;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="listbox"]')).toBeTruthy();
    const active = fixture.nativeElement.querySelector('.tvp-chip[aria-selected="true"]') as HTMLElement;
    expect(active).toBeTruthy();
    expect(active.textContent).toContain('寄件者');
  });
});

/** 分組由使用端以 TEMPLATE_VAR_GROUPS 提供；DS 不內建任何分組名稱或順序。 */
describe('TemplateVarPanelComponent — 分組由使用端提供', () => {
  const defs = [
    { key: 'A', label: 'AAA', group: 'second' },
    { key: 'B', label: 'BBB', group: 'first' },
    { key: 'C', label: 'CCC', group: 'unlisted' },
  ];

  it('沒提供分組 → 依出現順序顯示全部分組，標題用分組 key', async () => {
    await TestBed.configureTestingModule({ imports: [TemplateVarPanelComponent], schemas: [NO_ERRORS_SCHEMA] }).compileComponents();
    const component = TestBed.createComponent(TemplateVarPanelComponent).componentInstance;
    component.varDefs = defs;
    expect(component.varGroups.map(g => [g.group, g.label])).toEqual([
      ['second', 'second'], ['first', 'first'], ['unlisted', 'unlisted'],
    ]);
  });

  it('有提供分組 → 只顯示清單內的分組、照清單順序、用清單的標題', async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateVarPanelComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{ provide: TEMPLATE_VAR_GROUPS, useValue: [{ key: 'first', label: '第一組' }, { key: 'second', label: '第二組' }] }],
    }).compileComponents();
    const component = TestBed.createComponent(TemplateVarPanelComponent).componentInstance;
    component.varDefs = defs;
    expect(component.varGroups.map(g => [g.group, g.label])).toEqual([
      ['first', '第一組'], ['second', '第二組'],
    ]);
  });
});

/** 兩層 context 選擇：文字由使用端提供；切換時 emit { contextId, optionId }。 */
describe('TemplateVarPanelComponent — 兩層 context 選擇', () => {
  const contexts = [
    { id: 'c1', label: '甲', options: [{ id: 'o1', label: '一' }, { id: 'o2', label: '二' }] },
    { id: 'c2', label: '乙', options: [{ id: 'o3', label: '三' }] },
  ];

  async function create(providers: unknown[] = []) {
    await TestBed.configureTestingModule({
      imports: [TemplateVarPanelComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: providers as never[],
    }).compileComponents();
    const fixture = TestBed.createComponent(TemplateVarPanelComponent);
    return { fixture, component: fixture.componentInstance };
  }

  it('預設選取：找得到 default 就用它，找不到落第一個', async () => {
    const { component } = await create();
    component.contexts = contexts;
    component.defaultContextId = 'c1';
    component.defaultOptionId = 'o2';
    component.ngOnChanges({ contexts: {} as never });
    expect(component.selectedContextId).toBe('c1');
    expect(component.selectedOptionId).toBe('o2');

    component.defaultContextId = 'missing';
    component.defaultOptionId = 'missing';
    component.ngOnChanges({ defaultContextId: {} as never });
    expect(component.selectedContextId).toBe('c1');
    expect(component.selectedOptionId).toBe('o1');
  });

  it('切 context → option 落該 context 第一個，emit { contextId, optionId }', async () => {
    const { component } = await create();
    component.contexts = contexts;
    component.ngOnChanges({ contexts: {} as never });
    let emitted: unknown;
    component.contextChange.subscribe(e => (emitted = e));
    component.onContextChange('c2');
    expect(emitted).toEqual({ contextId: 'c2', optionId: 'o3' });
    component.onOptionChange('o3');
    expect(component.optionOptions).toEqual([{ value: 'o3', label: '三' }]);
  });

  it('選擇器文字來自 TEMPLATE_VAR_CONTEXT_TEXT', async () => {
    const { fixture, component } = await create([{
      provide: TEMPLATE_VAR_CONTEXT_TEXT,
      useValue: { contextLabel: '來源', contextPlaceholder: '選來源', optionLabel: '版本', optionPlaceholder: '選版本' },
    }]);
    component.contexts = contexts;
    component.ngOnChanges({ contexts: {} as never });
    component.showPanel = true;
    fixture.detectChanges();
    const labels = Array.from(fixture.nativeElement.querySelectorAll('.tvp-context__label') as NodeListOf<HTMLElement>)
      .map(l => l.textContent?.trim());
    expect(labels).toEqual(['來源', '版本']);
  });
});
