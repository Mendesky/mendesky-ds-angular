import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { LabelComponent } from '../label/label.component';
import { MenuItemComponent } from './menu-item.component';

/**
 * app-menu-item 契約（2026-10-29，DS 第四批）：
 * - 放在 app-action-menu 裡：外框 role="none"；內層 button 是 menuitem，設了 selected 改成 menuitemradio＋aria-checked。
 * - 放在選單外：內層 button 不加 role；設了 selected 用 aria-pressed。外框寬度跟著文字，排不下換行。
 * - 停用：aria-disabled="true"，不用原生 disabled（選單裡鍵盤還要停得到）；點了不發 itemClick。
 * - 說明文字：button 用 aria-describedby 指向它，名稱不含說明。文字後面的自訂內容算進名稱。
 * - 顏色：選中是深藍底淺色字、危險是紅字；底色變深時，投影進來的 LightWhite 標籤字也變淺色。
 * - 強制色彩模式（Windows 高對比）：選中改用系統選取色當底，停用改用系統停用字色。
 * 全部從真的 DOM 查（屬性、computed style、樣式表），不看元件內部狀態。
 */

@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent, LabelComponent],
  template: `
    <div class="wrap">
      <app-action-menu ariaLabel="排序" [autoFocusFirst]="false">
        <app-menu-item data-testid="newest" label="由新到舊" [selected]="true">
          <app-label data-testid="newest-tag" color="LightWhite" size="XS" text="預設"></app-label>
        </app-menu-item>
        <app-menu-item data-testid="oldest" label="由舊到新" [selected]="false">
          <app-label data-testid="oldest-tag" color="LightWhite" size="XS" text="已封存"></app-label>
        </app-menu-item>
        <app-menu-item data-testid="delete" label="刪除項目" tone="danger" icon="Trash-Del"></app-menu-item>
        <app-menu-item data-testid="archive" label="封存項目" icon="Archive" [disabled]="true" (itemClick)="disabledClicks = disabledClicks + 1"></app-menu-item>
        <app-menu-item data-testid="copy" label="複製項目" description="建立一份內容相同的新項目" (itemClick)="enabledClicks = enabledClicks + 1"></app-menu-item>
        <app-menu-item data-testid="purge" label="永久刪除" description="刪除後無法復原" tone="danger" icon="Trash-Del"></app-menu-item>
        <app-menu-item data-testid="purge-off" label="清空回收桶" description="回收桶已經是空的" tone="danger" icon="Trash-Del" [disabled]="true"></app-menu-item>
      </app-action-menu>
    </div>
  `,
})
class InMenuHostComponent {
  disabledClicks = 0;
  enabledClicks = 0;
}

@Component({
  standalone: true,
  imports: [MenuItemComponent],
  template: `
    <div data-testid="row" [style.width.px]="rowWidth">
      <app-menu-item data-testid="a" label="由新到舊" [selected]="true" (itemClick)="clicks = clicks + 1"></app-menu-item>
      <app-menu-item data-testid="b" label="更新時間 新→舊" [selected]="false"></app-menu-item>
      <app-menu-item data-testid="c" label="名稱 A→Z"></app-menu-item>
      <app-menu-item data-testid="d" label="停用的選項" [selected]="false" [disabled]="true" (itemClick)="clicks = clicks + 1"></app-menu-item>
    </div>
  `,
})
class OutsideMenuHostComponent {
  rowWidth = 600;
  clicks = 0;
}

/** 名稱從內容算出時（沒有 aria-label），報讀軟體念的文字：略過 aria-hidden 的子樹 */
function nameFromContent(el: Element): string {
  let out = '';
  el.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) out += node.textContent ?? '';
    else if (node instanceof Element && node.getAttribute('aria-hidden') !== 'true') out += ' ' + nameFromContent(node) + ' ';
  });
  return out.replace(/\s+/g, ' ').trim();
}

/** 頁面樣式表裡，寫在 @media (forced-colors: active) 之內、選擇器含 token 的規則 */
function forcedColorRules(token: string): CSSStyleRule[] {
  const out: CSSStyleRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSMediaRule) || !rule.conditionText.includes('forced-colors: active')) continue;
      for (const inner of Array.from(rule.cssRules)) {
        if (inner instanceof CSSStyleRule && inner.selectorText.includes(token)) out.push(inner);
      }
    }
  }
  return out;
}

const prop = (rule: CSSStyleRule, name: string) => rule.style.getPropertyValue(name).trim().toLowerCase();

describe('MenuItemComponent', () => {
  afterEach(() => {
    document.querySelectorAll('app-action-menu').forEach((el) => el.remove());
  });

  describe('放在 app-action-menu 裡', () => {
    let fixture: ComponentFixture<InMenuHostComponent>;
    const host = (id: string) => document.querySelector(`app-menu-item[data-testid="${id}"]`) as HTMLElement;
    const btn = (id: string) => host(id).querySelector('button') as HTMLButtonElement;

    beforeEach(() => {
      fixture = TestBed.createComponent(InMenuHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('外框 role="none"；設了 selected 的按鈕是 menuitemradio，aria-checked 照實輸出', () => {
      expect(host('newest').getAttribute('role')).toBe('none');
      expect(host('oldest').getAttribute('role')).toBe('none');
      expect(btn('newest').getAttribute('role')).toBe('menuitemradio');
      expect(btn('newest').getAttribute('aria-checked')).toBe('true');
      expect(btn('oldest').getAttribute('role')).toBe('menuitemradio');
      expect(btn('oldest').getAttribute('aria-checked')).toBe('false');
    });

    it('不設 selected 的一般動作是 menuitem，沒有 aria-checked', () => {
      expect(btn('delete').getAttribute('role')).toBe('menuitem');
      expect(btn('delete').hasAttribute('aria-checked')).toBeFalse();
      expect(btn('delete').hasAttribute('aria-pressed')).toBeFalse();
    });

    it('tone="danger" 的文字是 DS ghost 危險按鈕的紅 rgb(204, 82, 82)', () => {
      expect(getComputedStyle(btn('delete')).color).toBe('rgb(204, 82, 82)');
    });

    it('tone="danger" 加了說明：標題和圖示都是紅字 rgb(204, 82, 82)、標題照樣粗體，說明維持淺灰 rgb(147, 147, 147)', () => {
      const b = btn('purge');
      const label = b.querySelector('.mi__label') as HTMLElement;
      const desc = b.querySelector('.mi__desc') as HTMLElement;
      const icon = b.querySelector('app-icon') as HTMLElement;
      expect(getComputedStyle(label).color).toBe('rgb(204, 82, 82)');
      expect(getComputedStyle(label).fontWeight).toBe('600');
      expect(getComputedStyle(icon).color).toBe('rgb(204, 82, 82)');
      expect(getComputedStyle(desc).color).toBe('rgb(147, 147, 147)');
    });

    it('tone="danger" 加了說明又停用：標題和說明都是停用灰字 rgb(147, 147, 147)', () => {
      const b = btn('purge-off');
      expect(getComputedStyle(b.querySelector('.mi__label') as HTMLElement).color).toBe('rgb(147, 147, 147)');
      expect(getComputedStyle(b.querySelector('.mi__desc') as HTMLElement).color).toBe('rgb(147, 147, 147)');
    });

    it('一般項目加了說明：標題是深色 rgb(28, 28, 46)、說明淺灰 rgb(147, 147, 147)（危險項目的修正不影響它）', () => {
      const b = btn('copy');
      expect(getComputedStyle(b.querySelector('.mi__label') as HTMLElement).color).toBe('rgb(28, 28, 46)');
      expect(getComputedStyle(b.querySelector('.mi__desc') as HTMLElement).color).toBe('rgb(147, 147, 147)');
    });

    it('選中：深藍底 rgb(26, 100, 137)、淺色字 rgb(241, 243, 245)；裡面 LightWhite 標籤的字也變成 rgb(241, 243, 245)', () => {
      const style = getComputedStyle(btn('newest'));
      expect(style.backgroundColor).toBe('rgb(26, 100, 137)');
      expect(style.color).toBe('rgb(241, 243, 245)');
      const tagText = host('newest').querySelector('[data-testid="newest-tag"] .label__text') as HTMLElement;
      expect(getComputedStyle(tagText).color).toBe('rgb(241, 243, 245)');
    });

    it('未選中：沒有底色、灰字 rgb(104, 104, 104)；LightWhite 標籤維持原本的淺灰 rgb(147, 147, 147)', () => {
      const style = getComputedStyle(btn('oldest'));
      expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(style.color).toBe('rgb(104, 104, 104)');
      const tagText = host('oldest').querySelector('[data-testid="oldest-tag"] .label__text') as HTMLElement;
      expect(getComputedStyle(tagText).color).toBe('rgb(147, 147, 147)');
    });

    it('選單裡的項目佔滿一整列、文字靠左', () => {
      const menu = document.querySelector('app-action-menu') as HTMLElement;
      const inner = menu.getBoundingClientRect().width - 2 * 5 - 2 * 1; // 外框 padding 5px、border 1px
      expect(btn('oldest').getBoundingClientRect().width).toBeCloseTo(inner, 0);
      expect(getComputedStyle(btn('oldest')).justifyContent).not.toBe('center');
      expect(getComputedStyle(btn('oldest')).textAlign).toBe('left');
    });

    it('停用：aria-disabled="true"、不是原生 disabled，點了不發 itemClick；停用灰字 rgb(147, 147, 147)', () => {
      const b = btn('archive');
      expect(b.getAttribute('aria-disabled')).toBe('true');
      expect(b.disabled).toBeFalse();
      expect(getComputedStyle(b).color).toBe('rgb(147, 147, 147)');
      b.click();
      expect(fixture.componentInstance.disabledClicks).toBe(0);
    });

    it('可用的項目點了發一次 itemClick', () => {
      btn('copy').click();
      expect(fixture.componentInstance.enabledClicks).toBe(1);
    });

    it('說明文字：aria-describedby 指到說明文字，名稱只有 label', () => {
      const b = btn('copy');
      const describedBy = b.getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      const desc = document.getElementById(describedBy!);
      expect(desc).not.toBeNull();
      expect(b.contains(desc)).toBeTrue();
      expect(desc!.textContent!.trim()).toBe('建立一份內容相同的新項目');
      expect(b.hasAttribute('aria-label')).toBeFalse();
      expect(nameFromContent(b)).toBe('複製項目');
    });

    it('圖示不算進名稱', () => {
      expect(nameFromContent(btn('delete'))).toBe('刪除項目');
      expect(btn('delete').querySelector('app-icon svg')?.getAttribute('aria-hidden')).toBe('true');
    });

    it('文字後面的自訂內容在按鈕裡、沒有 aria-hidden，會接在 label 後面算進名稱', () => {
      const tag = host('oldest').querySelector('[data-testid="oldest-tag"]') as HTMLElement;
      expect(btn('oldest').contains(tag)).toBeTrue();
      expect(tag.closest('[aria-hidden="true"]')).toBeNull();
      expect(nameFromContent(btn('oldest'))).toBe('由舊到新 已封存');
    });

    it('強制色彩模式（Windows 高對比）：選中改用系統選取色當實心底，滑過、按下也一樣；停用改用系統停用字色', () => {
      const selected = forcedColorRules('mi--selected');
      const fill = selected.filter((r) => prop(r, 'background-color') === 'highlight' && prop(r, 'color') === 'highlighttext');
      expect(fill.length).toBeGreaterThan(0);
      const sel = fill.map((r) => r.selectorText).join(',');
      expect(sel).toContain(':hover');
      expect(sel).toContain(':active');
      expect(fill.some((r) => prop(r, '--text/body-light') === 'highlighttext')).toBeTrue();
      // 不加的話 Chrome 會在字後面墊一塊 Canvas 底色（白），白字疊白底整個看不到
      expect(fill.every((r) => prop(r, 'forced-color-adjust') === 'none')).toBeTrue();
      const disabled = forcedColorRules('mi--disabled').filter((r) => !r.selectorText.includes(':not(.mi--disabled)'));
      expect(disabled.some((r) => prop(r, 'color') === 'graytext')).toBeTrue();
    });
  });

  describe('放在選單外（例如篩選視窗的排序區）', () => {
    let fixture: ComponentFixture<OutsideMenuHostComponent>;
    const host = (id: string) => fixture.nativeElement.querySelector(`app-menu-item[data-testid="${id}"]`) as HTMLElement;
    const btn = (id: string) => host(id).querySelector('button') as HTMLButtonElement;

    beforeEach(() => {
      fixture = TestBed.createComponent(OutsideMenuHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('按鈕沒有 role；設了 selected 用 aria-pressed，沒設就沒有；外框沒有 role', () => {
      expect(host('a').hasAttribute('role')).toBeFalse();
      expect(btn('a').hasAttribute('role')).toBeFalse();
      expect(btn('a').getAttribute('aria-pressed')).toBe('true');
      expect(btn('b').getAttribute('aria-pressed')).toBe('false');
      expect(btn('c').hasAttribute('aria-pressed')).toBeFalse();
      expect(btn('a').hasAttribute('aria-checked')).toBeFalse();
    });

    it('選中一樣是深藍底淺色字', () => {
      const style = getComputedStyle(btn('a'));
      expect(style.backgroundColor).toBe('rgb(26, 100, 137)');
      expect(style.color).toBe('rgb(241, 243, 245)');
    });

    it('外框寬度跟著文字，不會撐滿外層', () => {
      const row = fixture.nativeElement.querySelector('[data-testid="row"]') as HTMLElement;
      const w = host('a').getBoundingClientRect().width;
      expect(w).toBeGreaterThan(0);
      expect(w).toBeLessThan(row.getBoundingClientRect().width / 2);
    });

    it('一排放不下時換到下一行', () => {
      fixture.componentInstance.rowWidth = 150;
      fixture.detectChanges();
      const topA = host('a').getBoundingClientRect().top;
      const topB = host('b').getBoundingClientRect().top;
      expect(topB).toBeGreaterThan(topA);
    });

    it('停用：aria-disabled="true"，點了不發 itemClick', () => {
      expect(btn('d').getAttribute('aria-disabled')).toBe('true');
      btn('d').click();
      expect(fixture.componentInstance.clicks).toBe(0);
      btn('a').click();
      expect(fixture.componentInstance.clicks).toBe(1);
    });
  });
});
