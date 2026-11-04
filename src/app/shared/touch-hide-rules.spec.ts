import { TestBed } from '@angular/core/testing';
import { TooltipsComponent } from './components/tooltips/tooltips.component';
import { TooltipPortalComponent } from './directives/tooltip/tooltip-portal.component';
import { NumberListComponent } from './components/number-list/number-list.component';

// 提示框只在觸控裝置（沒有滑鼠）隱藏，不看視窗寬度（2026-11-04 使用者拍板）。
// 原本用寬度小於 1024px 判斷：電腦視窗拉窄就看不到提示，iPad 橫放（寬度超過 1024）反而沒藏。
// 觸控條件跟 mendesky-web 的 TouchDeviceService 一樣：(hover: none) and (pointer: coarse)。
//
// Number List 的截斷跟提示框綁在一起：提示框不出現的地方就不能截斷，否則「截斷又看不到全文」。
// 所以它在窄畫面和觸控裝置都要換行。
//
// Karma 跑在桌機的 Chrome，沒辦法切成觸控裝置，所以這裡直接讀元件樣式裡的 @media 條件。
// 實際在觸控裝置上藏不藏，另外用 Playwright 模擬 iPad、iPhone 驗過。

const TOUCH = '(hover: none) and (pointer: coarse)';

/** 回傳所有「裡面有符合條件的規則」的 @media 條件文字 */
function mediaTextsOf(match: (rule: CSSStyleRule) => boolean): string[] {
  const out: string[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSMediaRule)) continue;
      for (const inner of Array.from(rule.cssRules)) {
        if (inner instanceof CSSStyleRule && match(inner)) out.push(rule.media.mediaText);
      }
    }
  }
  return out;
}

/** 元件樣式封裝用的屬性名，例如 _ngcontent-ng-c123 */
function encapsulationAttr(el: Element, prefix: '_nghost' | '_ngcontent'): string {
  const attr = Array.from(el.attributes).find((a) => a.name.startsWith(prefix));
  if (!attr) throw new Error(`找不到 ${prefix} 屬性`);
  return attr.name;
}

describe('觸控裝置的隱藏與換行規則', () => {
  it('Tooltips 元件只在觸控裝置隱藏，不看視窗寬度', async () => {
    await TestBed.configureTestingModule({ imports: [TooltipsComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TooltipsComponent);
    fixture.componentRef.setInput('text', '說明文字');
    fixture.detectChanges();
    const box = (fixture.nativeElement as HTMLElement).querySelector('.tooltip')!;
    const attr = encapsulationAttr(box, '_ngcontent');

    const hiding = mediaTextsOf(
      (r) => r.selectorText === `.tooltip[${attr}]` && r.style.display === 'none',
    );
    expect(hiding).toEqual([TOUCH]);
  });

  it('滑過提示（appTooltip）的浮層只在觸控裝置隱藏，不看視窗寬度', async () => {
    await TestBed.configureTestingModule({ imports: [TooltipPortalComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TooltipPortalComponent);
    fixture.componentRef.setInput('text', '說明文字');
    fixture.detectChanges();
    const attr = encapsulationAttr(fixture.nativeElement as HTMLElement, '_nghost');

    const hiding = mediaTextsOf((r) => r.selectorText === `[${attr}]` && r.style.display === 'none');
    expect(hiding).toEqual([TOUCH]);
  });

  it('Number List 在窄畫面和觸控裝置都換行，不截斷', async () => {
    await TestBed.configureTestingModule({ imports: [NumberListComponent] }).compileComponents();
    const fixture = TestBed.createComponent(NumberListComponent);
    fixture.componentRef.setInput('label', '標題');
    fixture.componentRef.setInput('text', '檔名.pdf');
    fixture.detectChanges();
    const label = (fixture.nativeElement as HTMLElement).querySelector('.nl-label')!;
    const attr = encapsulationAttr(label, '_ngcontent');

    const wrapping = mediaTextsOf(
      (r) => r.selectorText.split(',').some((s) => s.trim() === `.nl-label[${attr}]`) && r.style.whiteSpace === 'normal',
    );
    expect(wrapping.length).withContext('找不到換行規則').toBe(1);
    const conditions = wrapping[0].split(',').map((s) => s.trim());
    expect(conditions).toContain('(max-width: 1023px)');
    expect(conditions).toContain(TOUCH);
  });
});
