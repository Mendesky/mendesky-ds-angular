import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchFieldComponent } from './search-field.component';

/**
 * 搜尋框搭配下面的清單（app-result-list）：報讀屬性要在輸入框上。
 * 不設 listboxId 時，輸入框跟以前一樣，一個屬性都不多。
 */
describe('SearchFieldComponent 搭配清單的報讀屬性', () => {
  let fixture: ComponentFixture<SearchFieldComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [SearchFieldComponent] }).compileComponents();
    fixture = TestBed.createComponent(SearchFieldComponent);
    host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('ariaLabel', '搜尋項目');
  });

  const input = () => host.querySelector('input') as HTMLInputElement;
  const set = (name: string, value: unknown) => { fixture.componentRef.setInput(name, value); fixture.detectChanges(); };
  const COMBO_ATTRS = ['role', 'aria-controls', 'aria-expanded', 'aria-autocomplete', 'aria-activedescendant'];

  it('不設 listboxId：輸入框沒有任何清單相關屬性', () => {
    fixture.detectChanges();
    COMBO_ATTRS.forEach(a => expect(input().hasAttribute(a)).withContext(a).toBeFalse());
    expect(input().type).toBe('search');
  });

  it('只設 listboxExpanded 或 activeDescendant、沒設 listboxId：一樣不輸出', () => {
    set('listboxExpanded', true);
    set('activeDescendant', 'x-o0');
    COMBO_ATTRS.forEach(a => expect(input().hasAttribute(a)).withContext(a).toBeFalse());
  });

  it('設了 listboxId：是 combobox，指著那個清單，預設是收起', () => {
    set('listboxId', 'results');
    expect(input().getAttribute('role')).toBe('combobox');
    expect(input().getAttribute('aria-controls')).toBe('results');
    expect(input().getAttribute('aria-autocomplete')).toBe('list');
    expect(input().getAttribute('aria-expanded')).toBe('false');
    expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
    expect(input().getAttribute('aria-label')).toBe('搜尋項目');
  });

  it('listboxExpanded 跟著清單有沒有列', () => {
    set('listboxId', 'results');
    set('listboxExpanded', true);
    expect(input().getAttribute('aria-expanded')).toBe('true');
    set('listboxExpanded', false);
    expect(input().getAttribute('aria-expanded')).toBe('false');
  });

  it('activeDescendant 有值才輸出；改回 null 或空字串就拿掉', () => {
    set('listboxId', 'results');
    set('listboxExpanded', true);
    set('activeDescendant', 'results-o2');
    expect(input().getAttribute('aria-activedescendant')).toBe('results-o2');
    set('activeDescendant', null);
    expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
    set('activeDescendant', '');
    expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
  });

  it('清單收起時不輸出 aria-activedescendant（指著看不到的列沒有意義）', () => {
    set('listboxId', 'results');
    set('listboxExpanded', false);
    set('activeDescendant', 'results-o2');
    expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
  });
});
