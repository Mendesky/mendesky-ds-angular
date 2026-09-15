import { TestBed, ComponentFixture } from '@angular/core/testing';
import { StepperComponent, NavSection } from './stepper.component';

/**
 * Nav variant：非展開（收合）的大項，其子項清單是 CSS 收合（height 0 + overflow hidden），
 * 但 <button> 仍在 DOM → 若可聚焦，Tab 會跳進隱藏子項、焦點「消失」，使用者要多按幾次才到下一大項。
 * 修正：收合的 .sn-sub-collapse 設 inert（移出 tab 順序 + AT），Tab 直接跳到下一大項。
 */
describe('StepperComponent — nav variant 收合子項不佔 tab 順序', () => {
  let fixture: ComponentFixture<StepperComponent>;
  let comp: StepperComponent;

  const sections: NavSection[] = [{
    pages: [
      { id: 'p1', num: '1', label: '客戶基本資料', subItems: [{ id: 'p1-1', label: '基本資料' }, { id: 'p1-2', label: '負責人' }] },
      { id: 'p2', num: '2', label: '申報資料', subItems: [{ id: 'p2-1', label: '申報' }] },
    ],
  }];

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [StepperComponent] });
    fixture = TestBed.createComponent(StepperComponent);
    comp = fixture.componentInstance;
    comp.variant = 'nav';
    comp.navSections = sections;
    comp.activePage = 'p1';
    comp.expandedPageIds = ['p1']; // 只有 p1 展開；p2 收合
    fixture.detectChanges();
  });

  function collapses(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('.sn-sub-collapse'));
  }

  it('展開的大項（p1）子項 collapse 不 inert（可 Tab 進入可見子項）', () => {
    expect(collapses()[0].hasAttribute('inert')).toBeFalse();
  });

  it('收合的大項（p2）子項 collapse 設 inert（Tab 跳過隱藏子項，直接到下一大項）', () => {
    expect(collapses()[1].hasAttribute('inert')).toBeTrue();
  });

  it('切換展開狀態 → inert 隨之更新', () => {
    // OnPush：直接改 plain 屬性 fixture.detectChanges() 偵測不到，須用 setInput 走 Angular 的
    // input 綁定機制（見 carousel-dot / modal-close-btn 同類修正）。
    fixture.componentRef.setInput('expandedPageIds', ['p2']); // 改成 p2 展開、p1 收合
    fixture.detectChanges();
    expect(collapses()[0].hasAttribute('inert')).toBeTrue();
    expect(collapses()[1].hasAttribute('inert')).toBeFalse();
  });
});
