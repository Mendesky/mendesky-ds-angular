import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommandPaletteCloseReason, CommandPaletteComponent } from './command-palette.component';
import { ResultListGroup, ResultListItem, ResultListState } from '../result-list/result-list.component';

/**
 * app-command-palette：對話框裡放搜尋框＋結果清單＋按鍵提示。
 * 元件不打後端：字變了通知使用端，使用端給 groups 與 state。
 */
const GROUPS: ResultListGroup[] = [
  { id: 'g', items: [{ id: 'a', label: '項目 A' }, { id: 'b', label: '項目 B' }, { id: 'c', label: '項目 C' }] },
];

@Component({
  standalone: true,
  imports: [CommandPaletteComponent],
  template: `
    <button id="opener" type="button" (click)="open = true">打開</button>
    <button id="other" type="button">別的按鈕</button>
    <app-command-palette
      ariaLabel="搜尋項目"
      placeholder="輸入名稱或編號"
      [isOpen]="open"
      [query]="query"
      [groups]="groups"
      [state]="state"
      [showHints]="showHints"
      (queryChange)="onQuery($event)"
      (itemSelect)="picked.push($event)"
      (querySubmit)="submitted.push($event)"
      (closeRequest)="onClose($event)"
      (retry)="retries = retries + 1"
    >
      <button paletteEnd type="button" id="end-btn">搜尋</button>
      <p class="hint-line">可以搜尋全部項目</p>
    </app-command-palette>
  `,
})
class HostComponent {
  @ViewChild(CommandPaletteComponent) palette!: CommandPaletteComponent;
  open = false;
  query = '';
  groups: ResultListGroup[] = GROUPS;
  state: ResultListState = 'ready';
  showHints = true;
  queries: string[] = [];
  picked: ResultListItem[] = [];
  submitted: string[] = [];
  closes: CommandPaletteCloseReason[] = [];
  retries = 0;
  /** 像真的使用端一樣：收到關閉就關 */
  closeOnRequest = true;
  onQuery(q: string): void { this.queries.push(q); this.query = q; }
  onClose(r: CommandPaletteCloseReason): void { this.closes.push(r); if (this.closeOnRequest) this.open = false; }
}

function key(k: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
}
const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

describe('CommandPaletteComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HostComponent] }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    (fixture.nativeElement as HTMLElement).remove();
  });

  const dialog = () => document.body.querySelector('[role="dialog"]') as HTMLElement | null;
  const input = () => dialog()!.querySelector('input') as HTMLInputElement;
  const listbox = () => dialog()!.querySelector('[role="listbox"]') as HTMLElement;
  const options = () => Array.from(dialog()!.querySelectorAll<HTMLElement>('[role="option"]'));
  const settle = async () => { fixture.detectChanges(); await fixture.whenStable(); fixture.detectChanges(); };
  const open = async () => { host.open = true; await settle(); };
  const type = async (text: string) => {
    input().value = text;
    input().dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
  };
  const press = async (k: string, init: KeyboardEventInit = {}, target: HTMLElement = input()) => {
    const e = key(k, init);
    target.dispatchEvent(e);
    await settle();
    return e;
  };

  describe('組成與報讀屬性', () => {
    it('關著的時候畫面上沒有對話框', () => {
      expect(dialog()).toBeNull();
    });

    it('打開：對話框有名稱；輸入框是 combobox，指著下面的清單', async () => {
      await open();
      expect(dialog()!.getAttribute('aria-label')).toBe('搜尋項目');
      expect(input().getAttribute('aria-label')).toBe('搜尋項目');
      expect(input().placeholder).toBe('輸入名稱或編號');
      expect(input().getAttribute('role')).toBe('combobox');
      expect(input().getAttribute('aria-controls')).toBe(listbox().id);
      expect(input().getAttribute('aria-expanded')).toBe('true');
      expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
      expect(options().length).toBe(3);
    });

    it('沒有列可以選時 aria-expanded 是 false', async () => {
      host.groups = [];
      await open();
      expect(input().getAttribute('aria-expanded')).toBe('false');
      host.groups = GROUPS;
      host.state = 'loading';
      await settle();
      expect(input().getAttribute('aria-expanded')).toBe('false');
    });

    it('paletteEnd 的內容放在搜尋框右邊；其他內容放在清單上面', async () => {
      await open();
      expect(dialog()!.querySelector('.search-field__end #end-btn')).not.toBeNull();
      const hint = dialog()!.querySelector('.hint-line')!;
      expect(hint.compareDocumentPosition(listbox()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('按鍵提示：看得到、報讀軟體不念；showHints 關掉就不畫', async () => {
      await open();
      const footer = dialog()!.querySelector('.cp__footer') as HTMLElement;
      expect(footer.getAttribute('aria-hidden')).toBe('true');
      expect(footer.textContent).toContain('選取');
      expect(footer.textContent).toContain('關閉');
      host.showHints = false;
      await settle();
      expect(dialog()!.querySelector('.cp__footer')).toBeNull();
    });

    it('觸控裝置（沒有滑過、指標是粗的）不畫按鍵提示：樣式裡有這條規則', async () => {
      await open();
      let found: CSSStyleRule | null = null;
      for (const sheet of Array.from(document.styleSheets)) {
        let rules: CSSRuleList;
        try { rules = sheet.cssRules; } catch { continue; }
        for (const rule of Array.from(rules)) {
          if (!(rule instanceof CSSMediaRule)) continue;
          if (!/hover:\s*none/.test(rule.conditionText) || !/pointer:\s*coarse/.test(rule.conditionText)) continue;
          const hit = Array.from(rule.cssRules).find(r => r instanceof CSSStyleRule && r.selectorText.includes('.cp__footer'));
          if (hit) found = hit as CSSStyleRule;
        }
      }
      expect(found).withContext('找不到觸控裝置的規則').not.toBeNull();
      expect(found!.style.display).toBe('none');
    });

    it('狀態交給清單畫：載入中有轉圈', async () => {
      host.state = 'loading';
      await open();
      expect(dialog()!.querySelector('app-result-list .rl__loading')).not.toBeNull();
    });
  });

  describe('打字與選取', () => {
    it('打字：通知使用端 queryChange', async () => {
      await open();
      await type('甲');
      expect(host.queries).toEqual(['甲']);
    });

    it('按 ↓：輸入框的 aria-activedescendant 指到第一列，焦點還在輸入框', async () => {
      await open();
      input().focus();
      const e = await press('ArrowDown');
      expect(e.defaultPrevented).toBeTrue();
      expect(input().getAttribute('aria-activedescendant')).toBe(options()[0].id);
      expect(options()[0].getAttribute('aria-selected')).toBe('true');
      expect(document.activeElement).toBe(input());
    });

    it('選中後按 Enter：發出 itemSelect，不發 querySubmit', async () => {
      await open();
      await press('ArrowDown');
      await press('ArrowDown');
      await press('Enter');
      expect(host.picked.map(p => p.id)).toEqual(['b']);
      expect(host.submitted).toEqual([]);
    });

    it('沒選中按 Enter：發出 querySubmit（帶目前的字），不發 itemSelect；這一下不往外傳', async () => {
      await open();
      await type('甲乙');
      let leaked = 0;
      const spy = () => leaked++;
      document.body.addEventListener('keydown', spy);
      const e = await press('Enter');
      document.body.removeEventListener('keydown', spy);
      expect(host.submitted).toEqual(['甲乙']);
      expect(host.picked).toEqual([]);
      expect(e.defaultPrevented).toBeTrue();
      expect(leaked).toBe(0);
    });

    it('輸入法選字中的 Enter、按住不放的連發：都不發', async () => {
      await open();
      await press('Enter', { isComposing: true });
      await press('Enter', { repeat: true });
      expect(host.submitted).toEqual([]);
      expect(host.picked).toEqual([]);
    });

    it('點一列：發出 itemSelect', async () => {
      await open();
      options()[2].click();
      expect(host.picked.map(p => p.id)).toEqual(['c']);
    });

    it('字變了：上一次選中的列清掉', async () => {
      await open();
      await press('ArrowDown');
      expect(input().hasAttribute('aria-activedescendant')).toBeTrue();
      await type('甲');
      expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
      expect(options().every(o => o.getAttribute('aria-selected') === 'false')).toBeTrue();
    });

    it('焦點在右邊的按鈕上按 ↓、Enter：元件不處理（Enter 是按那顆按鈕）', async () => {
      await open();
      const btn = dialog()!.querySelector('#end-btn') as HTMLElement;
      const down = await press('ArrowDown', {}, btn);
      const enter = await press('Enter', {}, btn);
      expect(down.defaultPrevented).toBeFalse();
      expect(enter.defaultPrevented).toBeFalse();
      expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
      expect(host.submitted).toEqual([]);
    });
  });

  describe('重試', () => {
    const retryBtn = () =>
      Array.from(dialog()!.querySelectorAll<HTMLElement>('button')).find(b => b.textContent!.includes('重試')) ?? null;

    it('載入失敗、有人聽 retry：有重試鈕；按了往外送，焦點回到輸入框（重試鈕接著會消失）', async () => {
      host.state = 'error';
      await open();
      const btn = retryBtn()!;
      btn.focus();
      btn.click();
      expect(host.retries).toBe(1);
      expect(document.activeElement).toBe(input());
      // 使用端換成載入中：重試鈕消失，焦點仍在輸入框，沒有掉到 body
      host.state = 'loading';
      await settle();
      expect(retryBtn()).toBeNull();
      expect(document.activeElement).toBe(input());
    });

    it('沒按重試時，狀態改變不會搬焦點', async () => {
      host.state = 'error';
      await open();
      const end = dialog()!.querySelector('#end-btn') as HTMLElement;
      end.focus();
      host.state = 'loading';
      await settle();
      expect(document.activeElement).toBe(end);
    });
  });

  describe('Esc 與關閉', () => {
    it('退場動畫期間（已經關了）打字、按 ↓、Enter：都不再往外送', async () => {
      await open();
      host.open = false;
      fixture.detectChanges();
      await Promise.resolve();
      host.queries.length = 0;
      input().value = 'x';
      input().dispatchEvent(new Event('input', { bubbles: true }));
      input().dispatchEvent(key('ArrowDown'));
      input().dispatchEvent(key('Enter'));
      fixture.detectChanges();
      expect(host.queries).toEqual([]);
      expect(host.picked).toEqual([]);
      expect(host.submitted).toEqual([]);
    });

    it('有字按 Esc：清空，面板還開著，事件不往外傳', async () => {
      await open();
      await type('甲');
      let leaked = 0;
      const spy = () => leaked++;
      document.body.addEventListener('keydown', spy);
      await press('Escape');
      document.body.removeEventListener('keydown', spy);
      expect(input().value).toBe('');
      expect(host.queries).toEqual(['甲', '']);
      expect(host.closes).toEqual([]);
      expect(host.open).toBeTrue();
      expect(leaked).toBe(0);
    });

    it('沒字按 Esc：通知關閉，原因是 escape', async () => {
      await open();
      await press('Escape');
      expect(host.closes).toEqual(['escape']);
    });

    it('點背景：通知關閉，原因是 backdrop', async () => {
      await open();
      (document.body.querySelector('.modal-backdrop') as HTMLElement).click();
      await settle();
      expect(host.closes).toEqual(['backdrop']);
    });

    it('關掉：字清空並通知使用端；重開沒有殘留的字與選中', async () => {
      await open();
      await type('甲');
      await press('ArrowDown');
      host.open = false;
      await settle();
      expect(host.queries).toEqual(['甲', '']);
      await wait(500);
      await settle();
      await open();
      expect(input().value).toBe('');
      expect(input().hasAttribute('aria-activedescendant')).toBeFalse();
    });
  });

  describe('焦點', () => {
    it('打開的那一輪畫面更新完，焦點就在輸入框（不用等進場動畫）', () => {
      (document.getElementById('opener') as HTMLElement).focus();
      host.open = true;
      // 只做一次同步的畫面更新，不等任何計時器：對話框 0.45 秒後的自動抓焦點還沒發生
      fixture.detectChanges();
      expect(document.activeElement).toBe(input());
    });

    it('關掉、退場動畫結束後，焦點回到打開它的按鈕', async () => {
      const opener = document.getElementById('opener') as HTMLElement;
      opener.focus();
      await open();
      await wait(500); // 讓對話框的自動抓焦點（0.45 秒）先跑完
      await settle();
      await press('Escape');
      await wait(500);
      await settle();
      expect(dialog()).toBeNull();
      expect(document.activeElement).toBe(opener);
    });

    it('關掉時焦點已經被使用者移到別的元素：不搶回來', async () => {
      const opener = document.getElementById('opener') as HTMLElement;
      const other = document.getElementById('other') as HTMLElement;
      opener.focus();
      await open();
      host.open = false;
      // 只做同步更新：退場動畫（0.45 秒）還沒跑完，這時使用者把焦點移到別的按鈕
      fixture.detectChanges();
      other.focus();
      await wait(500);
      await settle();
      expect(document.activeElement).toBe(other);
    });

    it('關掉後退場動畫還沒跑完就重開（快速鍵開關）：再關一次，焦點還是回到最早那顆按鈕', async () => {
      const opener = document.getElementById('opener') as HTMLElement;
      opener.focus();
      await open();
      host.open = false;
      fixture.detectChanges();
      await wait(200);
      // 這時焦點還在退場中的輸入框裡
      host.open = true;
      fixture.detectChanges();
      await wait(500);
      await settle();
      expect(document.activeElement).toBe(input());
      host.open = false;
      await settle();
      await wait(500);
      await settle();
      expect(dialog()).toBeNull();
      expect(document.activeElement).toBe(opener);
    });

    it('打開後 60 毫秒內就關掉：不會之後又把焦點搶進輸入框', async () => {
      const opener = document.getElementById('opener') as HTMLElement;
      opener.focus();
      await open();
      host.open = false;
      await settle();
      await wait(600);
      await settle();
      expect(dialog()).toBeNull();
      expect(document.activeElement).toBe(opener);
    });
  });
});
