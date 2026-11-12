import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalShellComponent } from '../modal-shell/modal-shell.component';
import { SearchFieldAppearance, SearchFieldComponent, SearchFieldSize } from './search-field.component';

/**
 * app-search-field 契約（2026-11-11，原型 https://claude.ai/artifact/NbQwYY3W5xjTKB3esBsQw5 版本二＋嵌入外觀自帶標頭列）：
 * - 原生 input type="search"、enterkeyhint="search"；ariaLabel 落在 input 的 aria-label；放大鏡 aria-hidden。
 * - 每次輸入送 valueChange；選字中不送，選完送一次，同一個值不重送。Android 例外：選字中也每次都送。
 * - 有字就有清除鈕（不管有沒有焦點）；停用、空字串沒有。清除鈕是 type="button"、aria-label「清除搜尋」，在 Tab 順序裡。
 * - 清除後送空字串，焦點回輸入框。
 * - Esc：有字 → 清空並攔下（preventDefault＋stopPropagation），按住連發也攔到放開；空的 → 不攔；
 *   選字中 → 只攔不清。焦點在清除鈕上按 Esc 也一樣清空，焦點回輸入框。焦點在右側位置的按鈕上 → 不處理。
 * - Enter：送 searchSubmit，事件照常往外傳；選字中、連發不送。
 * - 外觀 outline：S／M／L 高 32／36／40，有焦點時外圍藍框。外觀 embedded：整列，上下 16、左右 24 留白，
 *   底下 2px 線，游標在輸入框時線變藍；字 16px、放大鏡 20px；右側位置放投影進來的 [searchFieldEnd]。
 * 全部從真的 DOM 與 computed style 查，不看元件內部狀態。
 */
@Component({
  standalone: true,
  imports: [SearchFieldComponent],
  template: `
    <div style="width:360px">
      <app-search-field ariaLabel="搜尋人員" [appearance]="appearance" [size]="size" [disabled]="disabled"
        [(value)]="value" (valueChange)="changes.push($event)" (searchSubmit)="submits.push($event)">
        <button searchFieldEnd type="button" data-testid="end">送出</button>
      </app-search-field>
    </div>
  `,
})
class HostComponent {
  appearance: SearchFieldAppearance = 'outline';
  size: SearchFieldSize = 'M';
  disabled = false;
  value = '';
  changes: string[] = [];
  submits: string[] = [];
}

@Component({
  standalone: true,
  imports: [SearchFieldComponent],
  template: `<app-search-field ariaLabel="搜尋檔案名稱"></app-search-field>`,
})
class DefaultsHostComponent {}

@Component({
  standalone: true,
  imports: [SearchFieldComponent, ModalShellComponent],
  template: `
    <app-modal-shell [isOpen]="open" variant="search" ariaLabel="搜尋人員" (escapePress)="escCount = escCount + 1">
      <app-search-field appearance="embedded" ariaLabel="搜尋人員" [(value)]="value"></app-search-field>
    </app-modal-shell>
  `,
})
class ModalHostComponent {
  open = true;
  value = '王';
  escCount = 0;
}

/** embedded 右側位置：沒放東西、放不是按鈕的內容（快速鍵提示） */
@Component({
  standalone: true,
  imports: [SearchFieldComponent],
  template: `
    <div style="width:360px">
      <app-search-field appearance="embedded" ariaLabel="搜尋人員" data-testid="bare"></app-search-field>
      <app-search-field appearance="embedded" ariaLabel="搜尋人員" data-testid="hint">
        <span searchFieldEnd data-testid="hint-end">Ctrl K</span>
      </app-search-field>
    </div>
  `,
})
class EndSlotHostComponent {}

function key(type: 'keydown' | 'keyup', k: string, opts: { repeat?: boolean; isComposing?: boolean; keyCode?: number } = {}): KeyboardEvent {
  const ev = new KeyboardEvent(type, { key: k, bubbles: true, cancelable: true, repeat: !!opts.repeat, isComposing: !!opts.isComposing });
  if (opts.keyCode !== undefined) Object.defineProperty(ev, 'keyCode', { get: () => opts.keyCode });
  return ev;
}

describe('SearchFieldComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let docKeys: string[];
  const onDocKey = (e: KeyboardEvent): void => { docKeys.push(e.key); };

  const root = (): HTMLElement => fixture.nativeElement.querySelector('app-search-field');
  const input = (): HTMLInputElement => root().querySelector('input') as HTMLInputElement;
  const clearBtn = (): HTMLButtonElement | null => root().querySelector('button[aria-label="清除搜尋"]');
  const box = (): HTMLElement => root().firstElementChild as HTMLElement;

  function type(text: string): void {
    input().value = text;
    input().dispatchEvent(new InputEvent('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function press(target: HTMLElement, k: string, opts: { repeat?: boolean; isComposing?: boolean; keyCode?: number } = {}): KeyboardEvent {
    const ev = key('keydown', k, opts);
    target.dispatchEvent(ev);
    fixture.detectChanges();
    return ev;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [HostComponent, DefaultsHostComponent] });
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    fixture.detectChanges();
    docKeys = [];
    document.addEventListener('keydown', onDocKey);
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => {
    document.removeEventListener('keydown', onDocKey);
    fixture.nativeElement.remove();
  });

  describe('屬性', () => {
    it('原生 input type=search、enterkeyhint=search，ariaLabel 落在 aria-label', () => {
      expect(input().type).toBe('search');
      expect(input().getAttribute('enterkeyhint')).toBe('search');
      expect(input().getAttribute('aria-label')).toBe('搜尋人員');
    });

    it('放大鏡 aria-hidden', () => {
      const icon = root().querySelector('[aria-hidden="true"] app-icon, app-icon[aria-hidden="true"]');
      expect(icon).not.toBeNull();
    });

    it('提示文字預設「搜尋」', () => {
      const f = TestBed.createComponent(DefaultsHostComponent);
      f.detectChanges();
      const el = f.nativeElement.querySelector('input') as HTMLInputElement;
      expect(el.placeholder).toBe('搜尋');
      expect(el.getAttribute('aria-label')).toBe('搜尋檔案名稱');
    });
  });

  describe('送值', () => {
    it('每次輸入都送 valueChange', () => {
      type('王');
      type('王俊');
      expect(host.changes).toEqual(['王', '王俊']);
      expect(host.value).toBe('王俊');
    });

    it('選字中不送，選完送一次；之後同值的 input 不重送', () => {
      input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input().value = 'ㄨㄤˊ';
      input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      expect(host.changes).toEqual([]);
      input().value = '王';
      input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      input().dispatchEvent(new InputEvent('input', { bubbles: true }));
      fixture.detectChanges();
      expect(host.changes).toEqual(['王']);
    });

    it('Android：鍵盤打英文也走組字，每打一個字照樣送；選字結束不重送', () => {
      spyOnProperty(navigator, 'userAgent').and.returnValue(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36');
      input().dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
      input().value = 'p';
      input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      input().value = 'p1';
      input().dispatchEvent(new InputEvent('input', { bubbles: true, isComposing: true }));
      input().dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
      fixture.detectChanges();
      expect(host.changes).toEqual(['p', 'p1']);
    });

    it('頁面改值會同步到輸入框，不回送 valueChange', () => {
      host.value = '林';
      fixture.detectChanges();
      expect(input().value).toBe('林');
      expect(clearBtn()).not.toBeNull();
      host.value = '';
      fixture.detectChanges();
      expect(input().value).toBe('');
      expect(clearBtn()).toBeNull();
      expect(host.changes).toEqual([]);
    });
  });

  describe('清除鈕', () => {
    it('有字就出現，不必先有焦點', () => {
      expect(clearBtn()).toBeNull();
      host.value = '林';
      fixture.detectChanges();
      expect(document.activeElement).not.toBe(input());
      expect(clearBtn()).not.toBeNull();
    });

    it('是 type=button、名稱「清除搜尋」、在 Tab 順序裡', () => {
      type('林');
      const b = clearBtn() as HTMLButtonElement;
      expect(b.tagName).toBe('BUTTON');
      expect(b.type).toBe('button');
      expect(b.hasAttribute('tabindex')).toBeFalse();
      expect(b.tabIndex).toBe(0);
    });

    it('點下去：清空、送空字串、焦點回輸入框、清除鈕消失', () => {
      type('林');
      (clearBtn() as HTMLButtonElement).click();
      fixture.detectChanges();
      expect(input().value).toBe('');
      expect(host.changes).toEqual(['林', '']);
      expect(document.activeElement).toBe(input());
      expect(clearBtn()).toBeNull();
    });

    it('停用時有字也沒有清除鈕', () => {
      host.value = '林';
      host.disabled = true;
      fixture.detectChanges();
      expect(input().disabled).toBeTrue();
      expect(clearBtn()).toBeNull();
    });
  });

  describe('Esc', () => {
    it('有字：清空並攔下，外層收不到', () => {
      type('林');
      const ev = press(input(), 'Escape');
      expect(input().value).toBe('');
      expect(host.changes).toEqual(['林', '']);
      expect(ev.defaultPrevented).toBeTrue();
      expect(docKeys).toEqual([]);
    });

    it('空的：不攔，外層收得到', () => {
      const ev = press(input(), 'Escape');
      expect(ev.defaultPrevented).toBeFalse();
      expect(docKeys).toEqual(['Escape']);
    });

    it('選字中（keyCode 229）：不清空、不外傳、不 preventDefault', () => {
      type('林');
      const ev = press(input(), 'Escape', { keyCode: 229 });
      expect(input().value).toBe('林');
      expect(ev.defaultPrevented).toBeFalse();
      expect(docKeys).toEqual([]);
    });

    it('選字中（isComposing）：不清空、不外傳', () => {
      type('林');
      press(input(), 'Escape', { isComposing: true });
      expect(input().value).toBe('林');
      expect(docKeys).toEqual([]);
    });

    it('按住連發：清空後的連發也攔到放開；放開後空的 Esc 才外傳', () => {
      type('林');
      press(input(), 'Escape');
      const r1 = press(input(), 'Escape', { repeat: true });
      const r2 = press(input(), 'Escape', { repeat: true });
      expect(r1.defaultPrevented && r2.defaultPrevented).toBeTrue();
      expect(docKeys).toEqual([]);
      input().dispatchEvent(key('keyup', 'Escape'));
      press(input(), 'Escape');
      expect(docKeys).toEqual(['Escape']);
    });

    it('空的時候按住連發，不攔', () => {
      press(input(), 'Escape', { repeat: true });
      expect(docKeys).toEqual(['Escape']);
    });

    it('焦點在清除鈕上：清空、攔下、焦點回輸入框', () => {
      type('林');
      const b = clearBtn() as HTMLButtonElement;
      b.focus();
      const ev = press(b, 'Escape');
      expect(input().value).toBe('');
      expect(ev.defaultPrevented).toBeTrue();
      expect(docKeys).toEqual([]);
      expect(document.activeElement).toBe(input());
    });

    it('停用時不清空', () => {
      host.value = '林';
      host.disabled = true;
      fixture.detectChanges();
      press(input(), 'Escape');
      expect(input().value).toBe('林');
    });
  });

  describe('Enter', () => {
    it('送 searchSubmit 帶目前的字，事件照常外傳', () => {
      type('林');
      const ev = press(input(), 'Enter');
      expect(host.submits).toEqual(['林']);
      expect(ev.defaultPrevented).toBeFalse();
      expect(docKeys).toEqual(['Enter']);
    });

    it('空的也送（頁面自己決定要不要查）', () => {
      press(input(), 'Enter');
      expect(host.submits).toEqual(['']);
    });

    it('焦點在清除鈕上按 Enter：不送 searchSubmit，交給按鈕自己清空', () => {
      type('林');
      const b = clearBtn() as HTMLButtonElement;
      b.focus();
      press(b, 'Enter');
      expect(host.submits).toEqual([]);
    });

    it('選字中、連發不送', () => {
      type('林');
      press(input(), 'Enter', { keyCode: 229 });
      press(input(), 'Enter', { isComposing: true });
      press(input(), 'Enter', { repeat: true });
      expect(host.submits).toEqual([]);
    });
  });

  describe('焦點', () => {
    it('focus() 把焦點移進輸入框', () => {
      const cmp = fixture.debugElement.query(d => d.componentInstance instanceof SearchFieldComponent).componentInstance as SearchFieldComponent;
      cmp.focus();
      expect(document.activeElement).toBe(input());
    });

    it('點放大鏡也會聚焦輸入框', () => {
      (root().querySelector('app-icon') as HTMLElement).click();
      expect(document.activeElement).toBe(input());
    });

    it('outline：游標在輸入框時外圍有藍色焦點框', () => {
      expect(getComputedStyle(box()).outlineStyle).toBe('none');
      input().focus();
      fixture.detectChanges();
      const cs = getComputedStyle(box());
      expect(cs.outlineStyle).toBe('solid');
      expect(cs.outlineColor).toBe('rgb(58, 156, 205)');
    });
  });

  describe('外觀 outline', () => {
    for (const [size, h] of [['S', 32], ['M', 36], ['L', 40]] as const) {
      it(`尺寸 ${size} 高 ${h}px`, () => {
        host.size = size;
        fixture.detectChanges();
        expect(box().getBoundingClientRect().height).toBe(h);
      });
    }

    it('寬度跟外層一樣', () => {
      expect(box().getBoundingClientRect().width).toBe(360);
    });

    it('有外框、放大鏡 16px；不顯示右側位置', () => {
      expect(getComputedStyle(box()).borderTopWidth).toBe('1px');
      expect((root().querySelector('app-icon') as HTMLElement).getBoundingClientRect().width).toBe(16);
      expect(root().querySelector('[data-testid="end"]')).toBeNull();
    });

    // getComputedStyle 讀不到 ::-webkit-search-cancel-button，只能確認樣式表裡真的有把它藏起來的規則；
    // 畫面上只剩一顆 ✕ 另在範例網站用 Chromium、WebKit 截圖確認
    it('藏掉瀏覽器自帶的清除鈕', () => {
      const rules = Array.from(document.styleSheets).flatMap(s => {
        try { return Array.from(s.cssRules); } catch { return []; }
      }) as CSSStyleRule[];
      const hide = rules.find(r => r.selectorText?.includes('search-field__input')
        && r.selectorText.includes('::-webkit-search-cancel-button') && r.style.display === 'none');
      expect(hide).toBeDefined();
    });
  });

  describe('外觀 embedded', () => {
    beforeEach(() => {
      host.appearance = 'embedded';
      fixture.detectChanges();
    });

    it('整列：沒有四邊外框，底下 2px 線，上下 16、左右 24 留白', () => {
      const cs = getComputedStyle(box());
      expect(cs.borderTopWidth).toBe('0px');
      expect(cs.borderLeftWidth).toBe('0px');
      expect(cs.borderBottomWidth).toBe('2px');
      expect(cs.borderBottomColor).toBe('rgb(231, 231, 231)');
      expect(cs.paddingTop).toBe('16px');
      expect(cs.paddingBottom).toBe('16px');
      expect(cs.paddingLeft).toBe('24px');
      expect(cs.paddingRight).toBe('24px');
      expect(cs.outlineStyle).toBe('none');
    });

    // 底線換色有 0.15 秒過渡，等過渡結束再讀顏色
    const afterTransition = (): Promise<void> => new Promise(r => setTimeout(r, 250));

    it('游標在輸入框時底線變藍，不畫外圍焦點框；離開後變回灰', async () => {
      input().focus();
      fixture.detectChanges();
      await afterTransition();
      const cs = getComputedStyle(box());
      expect(cs.borderBottomColor).toBe('rgb(58, 156, 205)');
      expect(cs.outlineStyle).toBe('none');
      input().blur();
      fixture.detectChanges();
      await afterTransition();
      expect(getComputedStyle(box()).borderBottomColor).toBe('rgb(231, 231, 231)');
    });

    it('焦點在右側位置的按鈕上時，底線不變藍', async () => {
      (root().querySelector('[data-testid="end"]') as HTMLButtonElement).focus();
      fixture.detectChanges();
      await afterTransition();
      expect(getComputedStyle(box()).borderBottomColor).toBe('rgb(231, 231, 231)');
    });

    it('字 16px、放大鏡 20px', () => {
      expect(getComputedStyle(input()).fontSize).toBe('16px');
      expect((root().querySelector('app-icon') as HTMLElement).getBoundingClientRect().width).toBe(20);
    });

    it('右側位置放投影進來的內容，排在清除鈕右邊；點它不會把焦點搶回輸入框', () => {
      type('林');
      const end = root().querySelector('[data-testid="end"]') as HTMLButtonElement;
      expect(end).not.toBeNull();
      const clear = clearBtn() as HTMLButtonElement;
      expect(clear.compareDocumentPosition(end) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      end.focus();
      end.click();
      expect(document.activeElement).toBe(end);
    });

    it('高度由留白決定：輸入框、放大鏡、右側位置都在上下 16 px 留白與 2 px 底線之內；尺寸設定不影響', () => {
      const inside = (): void => {
        const b = box().getBoundingClientRect();
        const parts = [input(), root().querySelector('.search-field__icon'), root().querySelector('.search-field__end')] as HTMLElement[];
        for (const el of parts) {
          const r = el.getBoundingClientRect();
          expect(r.height).toBeGreaterThan(0);
          expect(r.top).toBeGreaterThanOrEqual(b.top + 16 - 0.5);
          expect(r.bottom).toBeLessThanOrEqual(b.bottom - 18 + 0.5);
        }
      };
      inside();
      const h = box().getBoundingClientRect().height;
      host.size = 'S';
      fixture.detectChanges();
      expect(box().getBoundingClientRect().height).toBe(h);
      inside();
    });

    it('焦點在右側位置的按鈕上按 Esc：有字也不清空，照常交給外層', () => {
      type('林');
      const end = root().querySelector('[data-testid="end"]') as HTMLButtonElement;
      end.focus();
      const ev = press(end, 'Escape');
      expect(input().value).toBe('林');
      expect(ev.defaultPrevented).toBeFalse();
      expect(docKeys).toEqual(['Escape']);
    });

    it('停用：字和放大鏡都變淡', () => {
      const icon = root().querySelector('.search-field__icon') as HTMLElement;
      const enabled = getComputedStyle(icon).color;
      host.value = '林';
      host.disabled = true;
      fixture.detectChanges();
      expect(getComputedStyle(icon).color).not.toBe(enabled);
      expect(getComputedStyle(icon).color).toBe(getComputedStyle(input()).color);
    });

    // Karma 的 Chrome 開不了強制色彩模式，只能確認樣式表裡真的有焦點改用系統醒目色的規則
    it('強制色彩模式：游標在輸入框時底線改用系統醒目色', () => {
      const media = Array.from(document.styleSheets).flatMap(s => {
        try { return Array.from(s.cssRules); } catch { return []; }
      }).filter((r): r is CSSMediaRule => r instanceof CSSMediaRule && r.conditionText.includes('forced-colors'));
      const rule = media.flatMap(m => Array.from(m.cssRules) as CSSStyleRule[]).find(r =>
        r.selectorText?.includes('search-field--embedded') && r.selectorText.includes('search-field--focus'));
      expect(rule?.style.borderBottomColor.toLowerCase()).toBe('highlight');
    });
  });
});

describe('SearchFieldComponent embedded 的右側位置', () => {
  let fixture: ComponentFixture<EndSlotHostComponent>;
  const field = (id: string): HTMLElement => fixture.nativeElement.querySelector(`[data-testid="${id}"]`);

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [EndSlotHostComponent] });
    fixture = TestBed.createComponent(EndSlotHostComponent);
    fixture.detectChanges();
    document.body.appendChild(fixture.nativeElement);
  });

  afterEach(() => fixture.nativeElement.remove());

  it('沒放東西時不佔空間：輸入框右緣貼著右邊 24 px 留白', () => {
    const box = field('bare').firstElementChild as HTMLElement;
    const inp = box.querySelector('input') as HTMLInputElement;
    expect(Math.round(box.getBoundingClientRect().right - inp.getBoundingClientRect().right)).toBe(24);
  });

  it('點右側位置裡不是按鈕的內容，不會把焦點搶回輸入框', () => {
    (field('hint-end')).click();
    expect(document.activeElement).not.toBe(field('hint').querySelector('input'));
  });
});

describe('SearchFieldComponent 放在 app-modal-shell 裡', () => {
  it('有字時第一下 Esc 只清空，對話框收不到；第二下才收到', () => {
    TestBed.configureTestingModule({ imports: [ModalHostComponent] });
    const f = TestBed.createComponent(ModalHostComponent);
    f.detectChanges();
    const el = document.querySelector('app-modal-shell app-search-field input') as HTMLInputElement;
    expect(el.value).toBe('王');
    el.dispatchEvent(key('keydown', 'Escape'));
    f.detectChanges();
    expect(el.value).toBe('');
    expect(f.componentInstance.value).toBe('');
    expect(f.componentInstance.escCount).toBe(0);
    el.dispatchEvent(key('keyup', 'Escape'));
    el.dispatchEvent(key('keydown', 'Escape'));
    expect(f.componentInstance.escCount).toBe(1);
    f.componentInstance.open = false;
    f.detectChanges();
    f.destroy();
  });
});
