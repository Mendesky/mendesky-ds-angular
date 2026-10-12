import { TestBed, ComponentFixture } from '@angular/core/testing';
import { NumberListComponent, NumberListAction } from './number-list.component';

describe('NumberListComponent — edit 動作', () => {
  let fixture: ComponentFixture<NumberListComponent>;
  let component: NumberListComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberListComponent);
    component = fixture.componentInstance;
  });

  function buttonLabels(): string[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.nl-buttons .nl-action-btn'))
      .map((btn) => (btn as HTMLElement).textContent?.trim() ?? '');
  }

  it('actions 含 edit 時顯示「編輯」按鈕，點擊 emit edit', () => {
    fixture.componentRef.setInput('actions', ['edit'] satisfies NumberListAction[]);
    fixture.detectChanges();

    const emitted: NumberListAction[] = [];
    component.actionClick.subscribe((a) => emitted.push(a));
    const btn = fixture.nativeElement.querySelector('.nl-buttons .nl-action-btn') as HTMLButtonElement;
    btn.click();

    expect(buttonLabels()).toEqual(['編輯']);
    expect(emitted).toEqual(['edit']);
  });

  it('按鈕順序固定為 檢視 / 下載 / 編輯 / 刪除（刪除永遠在最右）', () => {
    fixture.componentRef.setInput('actions', ['delete', 'edit', 'download', 'view'] satisfies NumberListAction[]);
    fixture.detectChanges();

    expect(buttonLabels()).toEqual(['檢視', '下載', '編輯', '刪除']);
  });

  it('沒有 edit 時不顯示「編輯」', () => {
    fixture.componentRef.setInput('actions', ['view', 'delete'] satisfies NumberListAction[]);
    fixture.detectChanges();

    expect(buttonLabels()).not.toContain('編輯');
  });
});

describe('NumberListComponent — label / text 截斷', () => {
  let fixture: ComponentFixture<NumberListComponent>;

  const LONG = '這是一個非常非常長的檔案標題，窄欄放不下時必須截成刪節號而不是把卡片撐開';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NumberListComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(NumberListComponent);
    (fixture.nativeElement as HTMLElement).style.display = 'block';
    (fixture.nativeElement as HTMLElement).style.width = '240px';
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    (fixture.nativeElement as HTMLElement).remove();
  });

  function el(selector: string): HTMLElement {
    return fixture.nativeElement.querySelector(selector) as HTMLElement;
  }

  it('label chip 放不下時截成「…」，不撐出列寬', () => {
    fixture.componentRef.setInput('label', LONG);
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();

    const label = el('.nl-label');
    const style = getComputedStyle(label);
    expect(style.textOverflow).toBe('ellipsis');
    expect(style.overflow).toBe('hidden');
    expect(label.getBoundingClientRect().width).toBeLessThanOrEqual(240);
  });

  it('label 真的被截斷時才可聚焦（tabindex=0），讓鍵盤也能看到全文', async () => {
    fixture.componentRef.setInput('label', LONG);
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    expect(el('.nl-label').getAttribute('tabindex')).toBe('0');
  });

  it('label 沒被截斷時不可聚焦（不多一個無意義的 tab 停點）', async () => {
    fixture.componentRef.setInput('label', '短標題');
    fixture.componentRef.setInput('actions', []);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    expect(el('.nl-label').hasAttribute('tabindex')).toBeFalse();
  });

  it('text（檔名）被截斷時同樣可聚焦', async () => {
    fixture.componentRef.setInput('text', LONG + '.pdf');
    fixture.componentRef.setInput('actions', ['view', 'delete'] satisfies NumberListAction[]);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((r) => requestAnimationFrame(() => r(null)));

    expect(el('.nl-text').getAttribute('tabindex')).toBe('0');
  });
});
