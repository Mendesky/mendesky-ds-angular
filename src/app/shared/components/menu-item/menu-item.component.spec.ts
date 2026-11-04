import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionMenuComponent } from '../action-menu/action-menu.component';
import { LabelComponent } from '../label/label.component';
import { MenuItemComponent } from './menu-item.component';

/**
 * app-menu-item 契約（2026-10-29，DS 第四批；2026-11-01 第五批補停用原因與右箭頭）：
 * - 放在 app-action-menu 裡：外框 role="none"；內層 button 是 menuitem，設了 selected 改成 menuitemradio＋aria-checked。
 * - 放在選單外：內層 button 不加 role；設了 selected 用 aria-pressed。外框寬度跟著文字，排不下換行。
 * - 停用：aria-disabled="true"，不用原生 disabled（選單裡鍵盤還要停得到）；點了不發 itemClick。
 *   整項灰 50（#aaaaaa）、標題一般粗細；投影進來的 LightWhite 標籤字也變灰 50。原因寫在說明文字。
 * - 說明文字：button 用 aria-describedby 指向它，名稱不含說明。文字後面的自訂內容算進名稱。
 *   說明一行最寬 16em（14px 字＝224px），超過換行；沒有說明的長標籤不受這個限制。
 * - 會在旁邊打開面板（opensPanel）：button 有 aria-haspopup、aria-expanded 跟著 panelOpen；
 *   最後一個子元素是右箭頭；panelOpen 為 true 時跟滑過一樣（危險項目是淺紅底）。
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
        <app-menu-item data-testid="locked" label="匯出項目" icon="Download" description="先完成上一步才能使用" [disabled]="true">
          <app-label data-testid="locked-tag" color="LightWhite" size="XS" text="預設"></app-label>
        </app-menu-item>
        <app-menu-item data-testid="panel" label="更多設定" icon="Setting" opensPanel="dialog" [panelOpen]="panelOpen">
          <app-label data-testid="panel-tag" color="LightWhite" size="XS" text="新"></app-label>
        </app-menu-item>
        <app-menu-item data-testid="panel-danger" label="移除設定" tone="danger" icon="Trash-Del" opensPanel="dialog" [panelOpen]="true"></app-menu-item>
        <app-menu-item data-testid="panel-off" label="進階設定" icon="Setting" opensPanel="dialog" [panelOpen]="true" [disabled]="true"></app-menu-item>
      </app-action-menu>
    </div>
  `,
})
class InMenuHostComponent {
  disabledClicks = 0;
  enabledClicks = 0;
  panelOpen = false;
}

/** 強制色彩模式的組合狀態：選中＋說明、選中＋危險、選中＋危險＋面板開著、面板開著＋說明 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <app-action-menu ariaLabel="組合" [autoFocusFirst]="false">
      <app-menu-item data-testid="sel-desc" label="項目 A" description="說明文字" [selected]="true"></app-menu-item>
      <app-menu-item data-testid="sel-danger" label="項目 B" tone="danger" [selected]="true"></app-menu-item>
      <app-menu-item data-testid="sel-panel-danger" label="項目 C" tone="danger" [selected]="true" opensPanel="dialog" [panelOpen]="true"></app-menu-item>
      <app-menu-item data-testid="panel-desc" label="項目 D" description="說明文字" opensPanel="dialog" [panelOpen]="true"></app-menu-item>
    </app-action-menu>
  `,
})
class ForcedComboHostComponent {}

/** 寬度：兩個選單分開量，一個只放長說明，一個只放長標籤 */
@Component({
  standalone: true,
  imports: [ActionMenuComponent, MenuItemComponent],
  template: `
    <div class="wrap-desc">
      <app-action-menu data-testid="desc-menu" ariaLabel="說明很長" [autoFocusFirst]="false">
        <app-menu-item data-testid="long-desc" label="項目 A" icon="Setting" [disabled]="true"
          description="這一段說明比較長，用來確認說明超過一行最寬的字數時會自動換到下一行，選單不會被它撐得很寬"></app-menu-item>
      </app-action-menu>
    </div>
    <div class="wrap-word">
      <app-action-menu data-testid="word-menu" ariaLabel="說明是一長串英數字" [autoFocusFirst]="false">
        <app-menu-item data-testid="long-word" label="項目 B" [disabled]="true"
          description="ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"></app-menu-item>
      </app-action-menu>
    </div>
    <div class="wrap-label">
      <app-action-menu data-testid="label-menu" ariaLabel="標籤很長" [autoFocusFirst]="false">
        <app-menu-item data-testid="long-label" label="這是一個名稱很長很長的項目，用來確認沒有說明時不受寬度限制"></app-menu-item>
      </app-action-menu>
    </div>
  `,
})
class WidthHostComponent {}

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

/**
 * 量強制色彩模式（Windows 高對比）下最後勝出的樣式。Karma 的瀏覽器開不了強制色彩、也做不出滑過，所以：
 * 把含選單選項樣式的樣式表複製一份，@media (forced-colors: active) 裡的規則改成無條件生效，
 * :hover、:active、:focus-visible 換成同權重的 class（fc-hover、fc-active、fc-focus），關掉漸變，插在原本那份後面，再停用原本那份。
 * 權重與先後順序都沒變，量到的 computed style 就是強制色彩模式下勝出的那條規則給的值。
 * 只看規則在不在（forcedColorRules）看不出這件事：media 外權重比較高的規則會蓋過 media 裡的。回傳還原函式
 */
function emulateForcedColorsCascade(): () => void {
  const isForced = (r: CSSRule): r is CSSMediaRule =>
    r instanceof CSSMediaRule && r.conditionText.includes('forced-colors: active');
  const sheets = Array.from(document.styleSheets).filter((sheet) => {
    try {
      return Array.from(sheet.cssRules).some((r) => isForced(r) && r.cssText.includes('.mi--'));
    } catch {
      return false;
    }
  });
  const clones = sheets.map((sheet) => {
    const css = Array.from(sheet.cssRules)
      .map((r) => (isForced(r) ? Array.from(r.cssRules).map((x) => x.cssText).join('\n') : r.cssText))
      .join('\n')
      .replace(/:hover/g, '.fc-hover')
      .replace(/:active/g, '.fc-active')
      .replace(/:focus-visible/g, '.fc-focus')
      // 底色、字色有漸變：不關掉的話，換狀態當下量到的是漸變起點（上一個狀態）的顏色
      + '\n.mi, .mi * { transition: none !important; }';
    const el = document.createElement('style');
    el.textContent = css;
    const owner = sheet.ownerNode as Element;
    owner.parentNode!.insertBefore(el, owner.nextSibling);
    sheet.disabled = true;
    return el;
  });
  expect(sheets.length).withContext('含選單選項強制色彩規則的樣式表').toBeGreaterThan(0);
  return () => {
    clones.forEach((el) => el.remove());
    sheets.forEach((sheet) => (sheet.disabled = false));
  };
}

/** 系統色（Highlight、GrayText 這類）在這個瀏覽器算出來的顏色 */
function systemColor(name: string): string {
  const probe = document.createElement('div');
  probe.style.color = name;
  document.body.appendChild(probe);
  const value = getComputedStyle(probe).color;
  probe.remove();
  return value;
}

/** 灰 50（--color/grey/50，#aaaaaa）：停用的選項整項用這個灰 */
const GREY_50 = 'rgb(170, 170, 170)';

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

    it('tone="danger" 加了說明又停用：標題和說明都是灰 50，標題不加粗', () => {
      const b = btn('purge-off');
      const label = b.querySelector('.mi__label') as HTMLElement;
      expect(getComputedStyle(label).color).toBe(GREY_50);
      expect(getComputedStyle(label).fontWeight).toBe('400');
      expect(getComputedStyle(b.querySelector('.mi__desc') as HTMLElement).color).toBe(GREY_50);
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

    it('停用：aria-disabled="true"、不是原生 disabled，點了不發 itemClick；整項灰 50', () => {
      const b = btn('archive');
      expect(b.getAttribute('aria-disabled')).toBe('true');
      expect(b.disabled).toBeFalse();
      expect(getComputedStyle(b).color).toBe(GREY_50);
      b.click();
      expect(fixture.componentInstance.disabledClicks).toBe(0);
    });

    it('停用＋說明（寫原因）：標題、說明、圖示、LightWhite 標籤的字都是灰 50，標題一般粗細、沒有底色', () => {
      const b = btn('locked');
      const label = b.querySelector('.mi__label') as HTMLElement;
      const desc = b.querySelector('.mi__desc') as HTMLElement;
      const icon = b.querySelector('app-icon') as HTMLElement;
      const tagText = host('locked').querySelector('[data-testid="locked-tag"] .label__text') as HTMLElement;
      expect(getComputedStyle(label).color).toBe(GREY_50);
      expect(getComputedStyle(label).fontWeight).toBe('400');
      expect(getComputedStyle(desc).color).toBe(GREY_50);
      expect(getComputedStyle(icon).color).toBe(GREY_50);
      expect(getComputedStyle(tagText).color).toBe(GREY_50);
      expect(getComputedStyle(b).backgroundColor).toBe('rgba(0, 0, 0, 0)');
      expect(document.getElementById(b.getAttribute('aria-describedby')!)!.textContent!.trim()).toBe('先完成上一步才能使用');
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

    describe('會在旁邊打開面板（opensPanel）', () => {
      it('aria-haspopup="dialog"；aria-expanded 跟著 panelOpen 在 "false"／"true" 之間變', () => {
        expect(btn('panel').getAttribute('aria-haspopup')).toBe('dialog');
        expect(btn('panel').getAttribute('aria-expanded')).toBe('false');
        fixture.componentInstance.panelOpen = true;
        fixture.detectChanges();
        expect(btn('panel').getAttribute('aria-expanded')).toBe('true');
        fixture.componentInstance.panelOpen = false;
        fixture.detectChanges();
        expect(btn('panel').getAttribute('aria-expanded')).toBe('false');
      });

      it('右箭頭是按鈕的最後一個子元素，在自訂內容之後、貼齊右邊內距 10px，不算進名稱', () => {
        const b = btn('panel');
        const arrow = b.lastElementChild as HTMLElement;
        expect(arrow.classList).toContain('mi__arrow');
        expect(arrow.tagName.toLowerCase()).toBe('app-icon');
        const tag = host('panel').querySelector('[data-testid="panel-tag"]') as HTMLElement;
        expect(tag.compareDocumentPosition(arrow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(b.getBoundingClientRect().right - arrow.getBoundingClientRect().right).toBeCloseTo(10, 0);
        expect(arrow.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
        expect(nameFromContent(b)).toBe('更多設定 新');
      });

      it('沒設 opensPanel：沒有 aria-haspopup、aria-expanded，也沒有右箭頭', () => {
        for (const id of ['copy', 'delete', 'archive']) {
          expect(btn(id).hasAttribute('aria-haspopup')).withContext(id).toBeFalse();
          expect(btn(id).hasAttribute('aria-expanded')).withContext(id).toBeFalse();
          expect(btn(id).querySelector('.mi__arrow')).withContext(id).toBeNull();
        }
      });

      it('panelOpen 為 true：跟滑過一樣是灰底 rgb(147, 147, 147)、淺色字 rgb(241, 243, 245)，LightWhite 標籤也變淺色；關著時沒有底色', async () => {
        expect(getComputedStyle(btn('panel')).backgroundColor).toBe('rgba(0, 0, 0, 0)');
        fixture.componentInstance.panelOpen = true;
        fixture.detectChanges();
        // 底色與字色有 0.15s 的轉場，等它跑完再量
        await new Promise((r) => setTimeout(r, 250));
        const style = getComputedStyle(btn('panel'));
        expect(style.backgroundColor).toBe('rgb(147, 147, 147)');
        expect(style.color).toBe('rgb(241, 243, 245)');
        const tagText = host('panel').querySelector('[data-testid="panel-tag"] .label__text') as HTMLElement;
        expect(getComputedStyle(tagText).color).toBe('rgb(241, 243, 245)');
      });

      it('危險項目的 panelOpen 是滑過時的淺紅底 rgb(255, 115, 115)、淺色字', () => {
        const style = getComputedStyle(btn('panel-danger'));
        expect(style.backgroundColor).toBe('rgb(255, 115, 115)');
        expect(style.color).toBe('rgb(241, 243, 245)');
      });

      it('停用的選項就算 panelOpen 為 true 也沒有底色、維持灰 50', () => {
        const style = getComputedStyle(btn('panel-off'));
        expect(style.backgroundColor).toBe('rgba(0, 0, 0, 0)');
        expect(style.color).toBe(GREY_50);
      });
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
      // 投影進來的 LightWhite 標籤走 --text/body-light；不跟著換的話，它會被瀏覽器換成 CanvasText，比停用的標題還醒目
      expect(disabled.some((r) => prop(r, '--text/body-light') === 'graytext')).toBeTrue();
    });

    it('強制色彩模式：面板開著的那一項也用系統選取色當實心底，看得出面板是哪一項打開的；停用的不會', () => {
      const open = forcedColorRules('mi--panel-open')
        .filter((r) => prop(r, 'background-color') === 'highlight' && prop(r, 'color') === 'highlighttext');
      expect(open.length).toBeGreaterThan(0);
      const sel = open.map((r) => r.selectorText).join(',').split(',').filter((x) => x.includes('mi--panel-open'));
      expect(sel.length).toBeGreaterThan(0);
      expect(sel.every((x) => x.includes(':not(.mi--disabled)'))).toBeTrue();
      expect(open.some((r) => prop(r, '--text/body-light') === 'highlighttext')).toBeTrue();
      expect(open.every((r) => prop(r, 'forced-color-adjust') === 'none')).toBeTrue();
    });

    it('強制色彩模式下最後勝出的樣式：選中、面板開著（含危險項目）不論平常、滑過、按下，都是選取色底配選取字色，LightWhite 標籤也是；停用的面板開著是停用字色', () => {
      fixture.componentInstance.panelOpen = true;
      fixture.detectChanges();
      const restore = emulateForcedColorsCascade();
      try {
        const highlight = systemColor('Highlight');
        const highlightText = systemColor('HighlightText');
        const grayText = systemColor('GrayText');
        expect(highlight).not.toBe(highlightText);
        const tags: Record<string, string> = { newest: 'newest-tag', panel: 'panel-tag' };
        for (const id of ['newest', 'panel', 'panel-danger', 'panel-off']) {
          for (const state of ['', 'fc-hover', 'fc-active']) {
            const b = btn(id);
            b.classList.remove('fc-hover', 'fc-active');
            if (state) b.classList.add(state);
            const ctx = `${id} ${state || '平常'}`;
            const style = getComputedStyle(b);
            if (id === 'panel-off') {
              expect(style.color).withContext(`${ctx} 字色`).toBe(grayText);
              expect(style.backgroundColor).withContext(`${ctx} 底色`).not.toBe(highlight);
              continue;
            }
            expect(style.backgroundColor).withContext(`${ctx} 底色`).toBe(highlight);
            expect(style.color).withContext(`${ctx} 字色`).toBe(highlightText);
            if (tags[id]) {
              const tagText = host(id).querySelector(`[data-testid="${tags[id]}"] .label__text`) as HTMLElement;
              expect(getComputedStyle(tagText).color).withContext(`${ctx} LightWhite 標籤`).toBe(highlightText);
            }
          }
          btn(id).classList.remove('fc-hover', 'fc-active');
        }
      } finally {
        restore();
      }
    });
  });

  describe('強制色彩模式的組合狀態', () => {
    let fixture: ComponentFixture<ForcedComboHostComponent>;
    const host = (id: string) => document.querySelector(`app-menu-item[data-testid="${id}"]`) as HTMLElement;
    const btn = (id: string) => host(id).querySelector('button') as HTMLButtonElement;

    beforeEach(() => {
      fixture = TestBed.createComponent(ForcedComboHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('選中或面板開著，再加上說明、危險：平常、滑過、按下、滑過又按下都是選取色底，標題、說明都是選取字色；鍵盤焦點框是系統字色', () => {
      const restore = emulateForcedColorsCascade();
      try {
        const highlight = systemColor('Highlight');
        const highlightText = systemColor('HighlightText');
        const canvasText = systemColor('CanvasText');
        for (const id of ['sel-desc', 'sel-danger', 'sel-panel-danger', 'panel-desc']) {
          for (const state of [[], ['fc-hover'], ['fc-active'], ['fc-hover', 'fc-active'], ['fc-focus']]) {
            const b = btn(id);
            b.classList.remove('fc-hover', 'fc-active', 'fc-focus');
            b.classList.add(...state);
            const ctx = `${id} ${state.join('+') || '平常'}`;
            const style = getComputedStyle(b);
            expect(style.backgroundColor).withContext(`${ctx} 底色`).toBe(highlight);
            expect(style.color).withContext(`${ctx} 字色`).toBe(highlightText);
            for (const part of ['.mi__label', '.mi__desc']) {
              const el = b.querySelector(part);
              if (el) expect(getComputedStyle(el).color).withContext(`${ctx} ${part}`).toBe(highlightText);
            }
            if (state.includes('fc-focus')) {
              // 底色、字色不讓瀏覽器換（forced-color-adjust: none），焦點框也就不會被換成系統色，要自己指定
              expect(style.outlineColor).withContext(`${ctx} 焦點框`).toBe(canvasText);
            }
          }
          btn(id).classList.remove('fc-hover', 'fc-active', 'fc-focus');
        }
      } finally {
        restore();
      }
    });
  });

  describe('寬度', () => {
    let fixture: ComponentFixture<WidthHostComponent>;
    const menuOf = (id: string) => document.querySelector(`app-action-menu[data-testid="${id}"]`) as HTMLElement;

    beforeEach(() => {
      fixture = TestBed.createComponent(WidthHostComponent);
      fixture.detectChanges();
    });

    afterEach(() => fixture.destroy());

    it('說明一行最寬 16em（14px 字＝224px），超過就換行；有圖示時選單外框約 280px', () => {
      const desc = menuOf('desc-menu').querySelector('.mi__desc') as HTMLElement;
      const rect = desc.getBoundingClientRect();
      const lineHeight = parseFloat(getComputedStyle(desc).lineHeight) || 20;
      expect(desc.textContent!.trim().length).toBeGreaterThan(16);
      expect(rect.width).toBeLessThanOrEqual(224.5);
      expect(rect.height).toBeGreaterThan(lineHeight * 1.5);
      const menuWidth = menuOf('desc-menu').getBoundingClientRect().width;
      expect(menuWidth).toBeGreaterThan(260);
      expect(menuWidth).toBeLessThan(290);
    });

    it('說明是一長串不能斷行的英數字：照樣在 224px 內換行，不會超出說明框', () => {
      const desc = menuOf('word-menu').querySelector('.mi__desc') as HTMLElement;
      expect(desc.getBoundingClientRect().width).toBeLessThanOrEqual(224.5);
      expect(desc.scrollWidth).toBeLessThanOrEqual(desc.clientWidth + 1);
    });

    it('沒有說明的長標籤不受 224px 限制：外框跟著標題寬，標題沒有被截斷', () => {
      const label = menuOf('label-menu').querySelector('.mi__label') as HTMLElement;
      expect(label.getBoundingClientRect().width).toBeGreaterThan(224 * 1.5);
      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth + 1);
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
