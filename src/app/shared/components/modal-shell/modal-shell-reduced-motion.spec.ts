import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalShellComponent } from './modal-shell.component';

/**
 * 減少動態時，每一種位置的對話框都要留在原本的位置。
 *
 * Bug（2026-11-19）：減少動態的規則把所有卡片的位移一律設成「往左、往上各退半個自己」。
 * 那是置中卡片的位移；上方對齊的 search 卡片（top: 14vh）套到它之後變成以 14vh 為中心，
 * 內容一長就往上長出畫面，搜尋框被裁掉。右下角的 floating-right 卡片也被推離原位。
 *
 * Karma 沒辦法切換系統的減少動態設定，這裡直接讀樣式表裡那一段規則。
 */
describe('ModalShellComponent 減少動態時的位置', () => {
  let fixture: ComponentFixture<ModalShellComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ModalShellComponent] }).compileComponents();
    fixture = TestBed.createComponent(ModalShellComponent);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  /** 減少動態那一段裡，選擇器含 part 的規則（照樣式表裡的先後） */
  function reducedMotionRules(part: string): { index: number; rule: CSSStyleRule }[] {
    for (const sheet of Array.from(document.styleSheets)) {
      let rules: CSSRuleList;
      try { rules = sheet.cssRules; } catch { continue; }
      for (const media of Array.from(rules)) {
        if (!(media instanceof CSSMediaRule) || !/prefers-reduced-motion:\s*reduce/.test(media.conditionText)) continue;
        const inner = Array.from(media.cssRules);
        // 只認視窗外殼自己的那一段
        if (!inner.some(r => r instanceof CSSStyleRule && r.selectorText.includes('.modal-card'))) continue;
        return inner
          .map((rule, index) => ({ index, rule }))
          .filter((x): x is { index: number; rule: CSSStyleRule } =>
            x.rule instanceof CSSStyleRule && x.rule.selectorText.split(',').some(s => s.includes(part)));
      }
    }
    return [];
  }

  /** 只有 .modal-card、不帶變體的那一條位移規則 */
  function baseTransformRule(): { index: number; rule: CSSStyleRule } | undefined {
    return reducedMotionRules('.modal-card').find(x =>
      x.rule.style.transform !== '' && !/--(search|floating-right)/.test(x.rule.selectorText));
  }

  it('置中的卡片：位移仍是往左、往上各退半個自己', () => {
    const base = baseTransformRule();
    expect(base).withContext('找不到減少動態下的卡片位移規則').toBeDefined();
    expect(base!.rule.style.transform.replace(/\s+/g, '')).toBe('translate(-50%,-50%)');
  });

  it('上方對齊的 search 卡片：只往左退半個自己，不往上退；規則排在通用那一條後面才蓋得過', () => {
    const base = baseTransformRule()!;
    const search = reducedMotionRules('.modal-card--search').find(x => x.rule.style.transform !== '');
    expect(search).withContext('search 卡片在減少動態下沒有自己的位移規則').toBeDefined();
    expect(search!.rule.style.transform.replace(/\s+/g, '')).toMatch(/^translate\(-50%(,0(px)?)?\)$/);
    expect(search!.rule.style.getPropertyPriority('transform')).toBe('important');
    expect(search!.index).toBeGreaterThan(base.index);
  });

  it('右下角的 floating-right 卡片：不位移', () => {
    const base = baseTransformRule()!;
    const floating = reducedMotionRules('.modal-card--floating-right').find(x => x.rule.style.transform !== '');
    expect(floating).withContext('floating-right 卡片在減少動態下沒有自己的位移規則').toBeDefined();
    expect(floating!.rule.style.transform).toBe('none');
    expect(floating!.rule.style.getPropertyPriority('transform')).toBe('important');
    expect(floating!.index).toBeGreaterThan(base.index);
  });
});
