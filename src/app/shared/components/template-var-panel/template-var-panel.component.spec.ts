import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TemplateVarPanelComponent } from './template-var-panel.component';

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
    component.varDefs = [{ key: 'QuotingCaseName', label: '案件名稱', group: 'basic' }];
    component.variables = { QuotingCaseName: '宏達電股份有限公司' };
    component.searchQuery = '宏達'; // 既不在 label('案件名稱') 也不在 key('QuotingCaseName')
    expect(keysOf()).toContain('QuotingCaseName');
  });

  it('value 比對大小寫不敏感', () => {
    component.varDefs = [{ key: 'DefaultFromName', label: '預設信件寄件者', group: 'basic' }];
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
    component.varDefs = [{ key: 'TotalAssets', label: '資產總額', group: 'financial' }];
    component.variables = { TotalAssets: '5,000萬元' };

    component.searchQuery = 'total'; // 命中 key
    expect(keysOf()).toContain('TotalAssets');

    component.searchQuery = '資產'; // 命中 label
    expect(keysOf()).toContain('TotalAssets');
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
      { key: 'QuotingCaseName', label: '案件名稱', group: 'basic' },
    ];
    component.variables = { DefaultFromName: '嘉威', QuotingCaseName: '案件A' };
  });

  it('openAt 開 inline 模式並設 query', () => {
    component.openAt(new DOMRect(10, 20, 0, 16), 'Def');
    expect(component.showPanel).toBeTrue();
    expect(component.inline).toBeTrue();
    expect(component.query).toBe('Def');
  });

  it('inline query 過濾用 query（非 searchQuery）', () => {
    component.inline = true;
    component.query = 'Quoting';
    component.searchQuery = ''; // 確認不靠 searchQuery
    const keys = component.varGroups.flatMap(g => g.defs.map(d => d.key));
    expect(keys).toEqual(['QuotingCaseName']);
  });

  it('moveActive 切換 activeKey（環繞）', () => {
    component.inline = true;
    component.query = '';
    component.activeIndex = 0;
    expect(component.activeKey).toBe('DefaultFromName');
    component.moveActive(1);
    expect(component.activeKey).toBe('QuotingCaseName');
    component.moveActive(1); // wrap 回第一個
    expect(component.activeKey).toBe('DefaultFromName');
    component.moveActive(-1); // 往上 wrap 到最後
    expect(component.activeKey).toBe('QuotingCaseName');
  });

  it('selectActive emit insert(activeKey) 並關閉', () => {
    component.inline = true;
    component.query = '';
    component.activeIndex = 1;
    let emitted = '';
    component.insert.subscribe((k: string) => (emitted = k));
    component.selectActive();
    expect(emitted).toBe('QuotingCaseName');
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
