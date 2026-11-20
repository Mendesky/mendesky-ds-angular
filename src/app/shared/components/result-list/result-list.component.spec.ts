import { Component, TemplateRef, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ResultListComponent, ResultListGroup, ResultListItem } from './result-list.component';

/**
 * app-result-list 是搜尋結果這類「焦點留在輸入框、用上下鍵選一列」的清單。
 * 它不打後端、不管輸入框：資料、狀態由使用端給，按鍵由使用端轉進 handleKeydown。
 */
const item = (id: string, label = `項目 ${id}`): ResultListItem => ({ id, label });
const TWO_GROUPS: ResultListGroup[] = [
  { id: 'g1', label: '第一組', items: [item('a'), item('b')] },
  { id: 'g2', label: '第二組', items: [item('c'), item('d')] },
];
const FLAT: ResultListGroup[] = [{ id: 'all', items: [item('a'), item('b'), item('c')] }];

function key(k: string, init: KeyboardEventInit = {}): KeyboardEvent {
  return new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init });
}

describe('ResultListComponent', () => {
  let fixture: ComponentFixture<ResultListComponent>;
  let component: ResultListComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ResultListComponent] }).compileComponents();
    fixture = TestBed.createComponent(ResultListComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('ariaLabel', '搜尋結果');
    fixture.componentRef.setInput('listId', 'rl-test');
  });

  const listbox = () => host.querySelector('[role="listbox"]') as HTMLElement;
  const options = () => Array.from(host.querySelectorAll<HTMLElement>('[role="option"]'));
  const selected = () => options().filter(o => o.getAttribute('aria-selected') === 'true').map(o => o.textContent!.trim());
  /** 元件自己那塊一直存在的報讀區（錯誤版的 app-empty-state 另有一塊跟內容一起出現的 status，不算） */
  const status = () => host.querySelector('.rl__sr[role="status"]') as HTMLElement;
  const set = (name: string, value: unknown) => { fixture.componentRef.setInput(name, value); fixture.detectChanges(); };
  const press = (k: string, init: KeyboardEventInit = {}) => {
    const e = key(k, init);
    const used = component.handleKeydown(e);
    fixture.detectChanges();
    return { used, e };
  };

  describe('結構與報讀屬性', () => {
    it('外層是 listbox，有 id 與名稱；每列是 option，id 不重複', () => {
      set('groups', TWO_GROUPS);
      expect(listbox().id).toBe('rl-test');
      expect(listbox().getAttribute('aria-label')).toBe('搜尋結果');
      const ids = options().map(o => o.id);
      expect(ids.length).toBe(4);
      expect(new Set(ids).size).toBe(4);
      ids.forEach(id => expect(id).toMatch(/^rl-test-o\d+$/));
    });

    it('有標題的群組是 group，用標題命名；標題本身不是選項', () => {
      set('groups', TWO_GROUPS);
      const groups = Array.from(host.querySelectorAll<HTMLElement>('[role="group"]'));
      expect(groups.length).toBe(2);
      const label = document.getElementById(groups[0].getAttribute('aria-labelledby')!)!;
      expect(label.textContent!.trim()).toBe('第一組');
      expect(label.getAttribute('role')).toBe('presentation');
      expect(groups[0].querySelectorAll('[role="option"]').length).toBe(2);
    });

    it('沒有標題的群組不包 group，選項直接在 listbox 底下', () => {
      set('groups', FLAT);
      expect(host.querySelector('[role="group"]')).toBeNull();
      options().forEach(o => expect(o.parentElement).toBe(listbox()));
    });

    it('沒給列範本：顯示名稱，有給圖示與說明就一起顯示', () => {
      set('groups', [{ id: 'g', items: [{ id: 'x', label: '項目 X', description: '補充說明', icon: 'Search' }] }]);
      const o = options()[0];
      expect(o.querySelector('.rl__label')!.textContent!.trim()).toBe('項目 X');
      expect(o.querySelector('.rl__desc')!.textContent!.trim()).toBe('補充說明');
      expect(o.querySelector('app-icon')).not.toBeNull();
    });

    it('一開始沒有選中任何一列，activeOptionId 是 null', () => {
      set('groups', FLAT);
      expect(selected()).toEqual([]);
      expect(component.activeOptionId).toBeNull();
    });
  });

  describe('上下鍵移動選中', () => {
    it('沒選中按 ↓ → 第一列；再按 → 下一列，跨群組連續', () => {
      set('groups', TWO_GROUPS);
      expect(press('ArrowDown').used).toBeTrue();
      expect(selected()).toEqual(['項目 a']);
      press('ArrowDown');
      press('ArrowDown');
      expect(selected()).toEqual(['項目 c']);
      expect(component.activeOptionId).toBe(options()[2].id);
    });

    it('最後一列再按 ↓：不動', () => {
      set('groups', TWO_GROUPS);
      for (let i = 0; i < 6; i++) press('ArrowDown');
      expect(selected()).toEqual(['項目 d']);
    });

    it('第一列按 ↑ → 沒選中；沒選中再按 ↑ 還是沒選中', () => {
      set('groups', TWO_GROUPS);
      press('ArrowDown');
      press('ArrowUp');
      expect(selected()).toEqual([]);
      press('ArrowUp');
      expect(selected()).toEqual([]);
    });

    it('用掉的方向鍵：取消預設動作（文字游標不跳）、不往外傳', () => {
      set('groups', FLAT);
      const e = key('ArrowDown');
      spyOn(e, 'stopPropagation').and.callThrough();
      component.handleKeydown(e);
      expect(e.defaultPrevented).toBeTrue();
      expect(e.stopPropagation).toHaveBeenCalled();
    });

    it('空清單按 ↓：不處理，沒有選中', () => {
      set('groups', []);
      const { used, e } = press('ArrowDown');
      expect(used).toBeFalse();
      expect(e.defaultPrevented).toBeFalse();
      expect(selected()).toEqual([]);
    });

    it('wrap：最後一列按 ↓ 回第一列；第一列按 ↑ 到最後一列', () => {
      set('wrap', true);
      set('groups', FLAT);
      for (let i = 0; i < 4; i++) press('ArrowDown');
      expect(selected()).toEqual(['項目 a']);
      press('ArrowUp');
      expect(selected()).toEqual(['項目 c']);
    });

    it('autoActivateFirst：一有結果就選中第一列；第一列按 ↑ 不會變成沒選中', async () => {
      set('autoActivateFirst', true);
      set('groups', FLAT);
      await fixture.whenStable();
      expect(selected()).toEqual(['項目 a']);
      press('ArrowUp');
      expect(selected()).toEqual(['項目 a']);
    });

    it('每次選中改變都發出 activeIdChange 與 activeOptionIdChange', () => {
      set('groups', FLAT);
      const ids: Array<string | null> = [];
      const domIds: Array<string | null> = [];
      component.activeIdChange.subscribe(v => ids.push(v));
      component.activeOptionIdChange.subscribe(v => domIds.push(v));
      press('ArrowDown');
      press('ArrowUp');
      expect(ids).toEqual(['a', null]);
      expect(domIds).toEqual(['rl-test-o0', null]);
    });

    it('按著 Alt、Ctrl、⌘ 的方向鍵不處理', () => {
      set('groups', FLAT);
      expect(press('ArrowDown', { altKey: true }).used).toBeFalse();
      expect(press('ArrowDown', { metaKey: true }).used).toBeFalse();
      expect(press('ArrowDown', { ctrlKey: true }).used).toBeFalse();
      expect(selected()).toEqual([]);
    });
  });

  describe('Enter 選取', () => {
    it('選中一列按 Enter：發出 itemSelect，取消預設動作、不往外傳', () => {
      set('groups', FLAT);
      const picked: ResultListItem[] = [];
      component.itemSelect.subscribe(v => picked.push(v));
      press('ArrowDown');
      const e = key('Enter');
      spyOn(e, 'stopPropagation').and.callThrough();
      expect(component.handleKeydown(e)).toBeTrue();
      expect(picked.map(p => p.id)).toEqual(['a']);
      expect(e.defaultPrevented).toBeTrue();
      expect(e.stopPropagation).toHaveBeenCalled();
    });

    it('沒選中按 Enter：不處理、不發 itemSelect（交給使用端決定）', () => {
      set('groups', FLAT);
      const picked: ResultListItem[] = [];
      component.itemSelect.subscribe(v => picked.push(v));
      const { used, e } = press('Enter');
      expect(used).toBeFalse();
      expect(e.defaultPrevented).toBeFalse();
      expect(picked).toEqual([]);
    });

    it('按住 Enter 的連發：只算第一下，連發攔下但不再發 itemSelect', () => {
      set('groups', FLAT);
      const picked: ResultListItem[] = [];
      component.itemSelect.subscribe(v => picked.push(v));
      press('ArrowDown');
      press('Enter');
      const { used, e } = press('Enter', { repeat: true });
      expect(picked.length).toBe(1);
      expect(used).toBeTrue();
      expect(e.defaultPrevented).toBeTrue();
    });
  });

  describe('輸入法選字中', () => {
    for (const k of ['ArrowDown', 'ArrowUp', 'Enter']) {
      it(`isComposing 時按 ${k}：不處理`, () => {
        set('groups', FLAT);
        component.handleKeydown(key('ArrowDown'));
        const before = component.activeOptionId;
        const picked: ResultListItem[] = [];
        component.itemSelect.subscribe(v => picked.push(v));
        const e = key(k, { isComposing: true });
        expect(component.handleKeydown(e)).toBeFalse();
        expect(e.defaultPrevented).toBeFalse();
        expect(component.activeOptionId).toBe(before);
        expect(picked).toEqual([]);
      });

      it(`keyCode 229 時按 ${k}：不處理`, () => {
        set('groups', FLAT);
        const e = key(k);
        Object.defineProperty(e, 'keyCode', { value: 229 });
        expect(component.handleKeydown(e)).toBeFalse();
        expect(e.defaultPrevented).toBeFalse();
        expect(selected()).toEqual([]);
      });
    }
  });

  describe('滑鼠', () => {
    /** 滑鼠在 target 上、螢幕座標 (x, y) 的一次移動事件 */
    const mouseAt = (target: EventTarget, x: number, y: number) => {
      target.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, screenX: x, screenY: y }));
      fixture.detectChanges();
    };

    it('滑鼠移到一列上 → 選中它', () => {
      set('groups', FLAT);
      mouseAt(document.body, 10, 10);
      mouseAt(options()[1], 40, 40);
      expect(selected()).toEqual(['項目 b']);
    });

    it('滑鼠沒動（位置跟上一次一樣）卻又收到移動事件：不搶走鍵盤選好的列', () => {
      set('groups', FLAT);
      mouseAt(document.body, 10, 10);
      mouseAt(options()[2], 40, 60);
      expect(selected()).toEqual(['項目 c']);
      press('ArrowUp');
      expect(selected()).toEqual(['項目 b']);
      // 清單捲動後，瀏覽器在同一個位置補送的移動事件
      mouseAt(options()[2], 40, 60);
      expect(selected()).toEqual(['項目 b']);
      // 滑鼠真的動了才換
      mouseAt(options()[0], 40, 20);
      expect(selected()).toEqual(['項目 a']);
    });

    it('滑鼠停在群組標題上（不是列）之後，同一個位置的移動事件落在列上：不搶走鍵盤選好的列', () => {
      set('groups', TWO_GROUPS);
      const label = host.querySelector('.rl__group-label') as HTMLElement;
      mouseAt(document.body, 10, 10);
      // 先經過第一列（選中 a），再真的移到標題上、停住。
      // 要先經過一列：只在列上記位置的寫法，這時記的還是列上那個位置，下面補送的事件就會被當成動了
      mouseAt(options()[0], 40, 30);
      expect(selected()).toEqual(['項目 a']);
      mouseAt(label, 40, 12);
      press('ArrowDown');
      expect(selected()).toEqual(['項目 b']);
      // 清單捲動，標題捲走、底下換成一列；滑鼠沒動，瀏覽器補送一次
      mouseAt(options()[2], 40, 12);
      expect(selected()).toEqual(['項目 b']);
    });

    it('還沒看過滑鼠在哪裡時，第一個移動事件不算「動了」：不選中', () => {
      set('groups', FLAT);
      press('ArrowDown');
      mouseAt(options()[2], 40, 60);
      expect(selected()).toEqual(['項目 a']);
    });

    it('元件拿掉之後，不再留著整頁的滑鼠監聽', () => {
      set('groups', FLAT);
      const removed: string[] = [];
      const original = document.removeEventListener.bind(document);
      const spy = spyOn(document, 'removeEventListener').and.callFake(((type: string, ...rest: unknown[]) => {
        removed.push(type);
        return (original as (...a: unknown[]) => void)(type, ...rest);
      }) as typeof document.removeEventListener);
      fixture.destroy();
      spy.and.callThrough();
      expect(removed).toContain('mousemove');
    });

    it('點一列 → 發出 itemSelect', () => {
      set('groups', FLAT);
      const picked: ResultListItem[] = [];
      component.itemSelect.subscribe(v => picked.push(v));
      options()[2].click();
      expect(picked.map(p => p.id)).toEqual(['c']);
    });

    it('在列上按下滑鼠：取消預設動作，輸入框不會失去焦點', () => {
      set('groups', FLAT);
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();
      const e = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      options()[0].dispatchEvent(e);
      expect(e.defaultPrevented).toBeTrue();
      expect(document.activeElement).toBe(input);
      input.remove();
    });
  });

  describe('捲動', () => {
    it('用鍵盤選到捲動區外的列：捲進可視範圍', () => {
      host.style.display = 'block';
      host.style.height = '80px';
      host.style.overflowY = 'auto';
      set('groups', [{ id: 'g', items: Array.from({ length: 30 }, (_, i) => item(`n${i}`)) }]);
      for (let i = 0; i < 25; i++) press('ArrowDown');
      const box = host.getBoundingClientRect();
      const row = options()[24].getBoundingClientRect();
      expect(row.top).toBeGreaterThanOrEqual(box.top - 1);
      expect(row.bottom).toBeLessThanOrEqual(box.bottom + 1);
    });
  });

  describe('狀態與報讀區', () => {
    it('沒有列可以畫：清單元素還在（輸入框指著它），但不佔高度', () => {
      set('groups', []);
      expect(listbox()).not.toBeNull();
      expect(listbox().offsetHeight).toBe(0);
      set('groups', FLAT);
      expect(listbox().offsetHeight).toBeGreaterThan(0);
    });

    it('報讀區一直在：還沒有資料時已存在而且是空的', () => {
      fixture.detectChanges();
      expect(status()).not.toBeNull();
      expect(status().textContent!.trim()).toBe('');
    });

    it('載入中：顯示轉圈與文字，清單藏起來，報讀區有字；結束後換成結果數', () => {
      set('groups', FLAT);
      const region = status();
      set('state', 'loading');
      expect(host.querySelector('.rl__loading')).not.toBeNull();
      expect(host.querySelector('app-spinner')).not.toBeNull();
      expect(listbox().hidden).toBeTrue();
      expect(listbox().offsetHeight).withContext('藏起來的清單不佔高度').toBe(0);
      expect(options().length).withContext('載入中不留上一次的列').toBe(0);
      expect(status()).toBe(region);
      expect(status().textContent!.trim()).toBe('搜尋中');
      set('state', 'ready');
      expect(host.querySelector('.rl__loading')).toBeNull();
      expect(listbox().hidden).toBeFalse();
      expect(status().textContent!.trim()).toBe('找到 3 筆');
    });

    it('載入中按方向鍵、Enter：不處理', () => {
      set('groups', FLAT);
      set('state', 'loading');
      expect(press('ArrowDown').used).toBeFalse();
      expect(press('Enter').used).toBeFalse();
    });

    it('沒有結果：顯示 emptyText，報讀區念同一句', () => {
      set('emptyText', '找不到「甲」的相關結果');
      set('state', 'empty');
      expect(host.querySelector('.rl__empty')!.textContent!.trim()).toBe('找不到「甲」的相關結果');
      expect(status().textContent!.trim()).toBe('找不到「甲」的相關結果');
      expect(options().length).toBe(0);
    });

    it('載入失敗：顯示標題、說明；有人聽 retry 才有重試鈕，按了發出 retry', () => {
      set('errorTitle', '搜尋失敗');
      set('errorDescription', '請再試一次');
      set('state', 'error');
      expect(host.querySelector('.rl__error')!.textContent).toContain('搜尋失敗');
      expect(host.querySelector('.rl__error')!.textContent).toContain('請再試一次');
      expect(host.querySelector('.rl__error button')).toBeNull();
      expect(status().textContent!.trim()).toBe('搜尋失敗，請再試一次');

      let retried = 0;
      component.retry.subscribe(() => retried++);
      set('state', 'ready');
      set('state', 'error');
      (host.querySelector('.rl__error button') as HTMLButtonElement).click();
      expect(retried).toBe(1);
    });

    it('showRetry 有設就照它：true 沒人聽也畫重試鈕，false 有人聽也不畫', () => {
      set('showRetry', true);
      set('state', 'error');
      expect(host.querySelector('.rl__error button')).not.toBeNull();
      component.retry.subscribe(() => undefined);
      set('showRetry', false);
      expect(host.querySelector('.rl__error button')).toBeNull();
    });

    it('announcement 有給就念它；給空字串就不念', () => {
      set('groups', FLAT);
      set('announcement', '找到 54 筆，先列出前 3 筆');
      expect(status().textContent!.trim()).toBe('找到 54 筆，先列出前 3 筆');
      set('announcement', '');
      expect(status().textContent!.trim()).toBe('');
    });

    it('狀態不是 ready 時，選中清掉', async () => {
      set('groups', FLAT);
      press('ArrowDown');
      const domIds: Array<string | null> = [];
      component.activeOptionIdChange.subscribe(v => domIds.push(v));
      set('state', 'loading');
      await fixture.whenStable();
      expect(component.activeOptionId).toBeNull();
      // 使用端是靠這個事件更新輸入框的 aria-activedescendant：只讀 getter 對，事件沒送也不行
      expect(domIds).toEqual([null]);
    });
  });

  describe('內容換掉', () => {
    it('新內容不含原本選中的列 → 沒有選中，並通知使用端', async () => {
      set('groups', FLAT);
      press('ArrowDown');
      const ids: Array<string | null> = [];
      component.activeIdChange.subscribe(v => ids.push(v));
      set('groups', [{ id: 'all', items: [item('x'), item('y')] }]);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(selected()).toEqual([]);
      expect(ids).toEqual([null]);
    });

    it('新內容仍含原本選中的列 → 維持選中，activeOptionId 跟著新位置', async () => {
      set('groups', FLAT);
      press('ArrowDown');
      press('ArrowDown');
      const ids: Array<string | null> = [];
      const domIds: Array<string | null> = [];
      component.activeIdChange.subscribe(v => ids.push(v));
      component.activeOptionIdChange.subscribe(v => domIds.push(v));
      set('groups', [{ id: 'all', items: [item('z'), item('q'), item('b')] }]);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(selected()).toEqual(['項目 b']);
      expect(component.activeOptionId).toBe('rl-test-o2');
      // 選中的項目沒變、畫面上的 id 變了：只通知畫面上的 id（輸入框的 aria-activedescendant 要跟著換）
      expect(ids).toEqual([]);
      expect(domIds).toEqual(['rl-test-o2']);
    });

    it('使用端設 activeId：選中那一列；設成不存在的 id → 沒有選中', async () => {
      set('groups', FLAT);
      const domIds: Array<string | null> = [];
      component.activeOptionIdChange.subscribe(v => domIds.push(v));
      set('activeId', 'c');
      await fixture.whenStable();
      expect(selected()).toEqual(['項目 c']);
      expect(domIds).toEqual(['rl-test-o2']);
      set('activeId', 'nope');
      await fixture.whenStable();
      expect(selected()).toEqual([]);
      expect(domIds).toEqual(['rl-test-o2', null]);
    });

    it('autoActivateFirst：還原之後內容直接換掉（中間沒有載入中）→ 選中新內容的第一列，不是留在舊的那一筆', async () => {
      set('autoActivateFirst', true);
      set('groups', FLAT);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(selected()).toEqual(['項目 a']);
      // 查詢的字變了：使用端還原選中，接著同一輪就給新結果，舊的第一筆排到後面
      component.resetActive();
      set('groups', [{ id: 'all', items: [item('b'), item('a')] }]);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(selected()).toEqual(['項目 b']);
    });

    it('autoActivateFirst：使用者自己移到別列之後內容換掉、那一筆還在 → 留在使用者選的那一筆', async () => {
      set('autoActivateFirst', true);
      set('groups', FLAT);
      await fixture.whenStable();
      press('ArrowDown');
      set('groups', [{ id: 'all', items: [item('z'), item('b')] }]);
      await fixture.whenStable();
      fixture.detectChanges();
      expect(selected()).toEqual(['項目 b']);
    });

    it('resetActive：清掉選中並通知；autoActivateFirst 時回到第一列', async () => {
      set('groups', FLAT);
      press('ArrowDown');
      press('ArrowDown');
      const domIds: Array<string | null> = [];
      component.activeOptionIdChange.subscribe(v => domIds.push(v));
      component.resetActive();
      fixture.detectChanges();
      expect(selected()).toEqual([]);
      expect(domIds).toEqual([null]);

      set('autoActivateFirst', true);
      await fixture.whenStable();
      press('ArrowDown');
      component.resetActive();
      fixture.detectChanges();
      expect(selected()).toEqual(['項目 a']);
    });

    it('兩筆 id 相同：都畫得出來（不報錯），選中算第一筆；主控台提醒一次', () => {
      const warn = spyOn(console, 'warn');
      set('groups', [{ id: 'g', items: [item('dup', '甲'), item('dup', '乙')] }]);
      expect(warn).toHaveBeenCalledTimes(1);
      expect(warn.calls.mostRecent().args[0]).toContain('dup');
      expect(options().length).toBe(2);
      press('ArrowDown');
      expect(component.activeOptionId).toBe('rl-test-o0');
    });
  });

  describe('最長內容', () => {
    it('40 個字的名稱在 360px 寬裡：一行、有刪節號、列高跟一般列一樣', () => {
      host.style.display = 'block';
      host.style.width = '360px';
      host.style.fontFamily = "'Noto Sans TC', sans-serif";
      set('groups', [{ id: 'g', items: [item('short', '短名稱'), item('long', '很長的名稱'.repeat(8))] }]);
      const [short, long] = options();
      const label = long.querySelector('.rl__label') as HTMLElement;
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
      expect(long.getBoundingClientRect().height).toBeCloseTo(short.getBoundingClientRect().height, 0);
      expect(long.getBoundingClientRect().width).toBeLessThanOrEqual(360);
    });
  });
});

@Component({
  standalone: true,
  imports: [ResultListComponent],
  template: `
    <ng-template #row let-item let-active="active">
      <span class="custom" [attr.data-active]="active">{{ item.label }}｜{{ item.data.code }}</span>
    </ng-template>
    <app-result-list ariaLabel="搜尋結果" listId="rl-host" [groups]="groups" [itemTemplate]="row"></app-result-list>
  `,
})
class TemplateHostComponent {
  @ViewChild('row') row!: TemplateRef<unknown>;
  @ViewChild(ResultListComponent) list!: ResultListComponent;
  groups: ResultListGroup<{ code: string }>[] = [
    { id: 'g', items: [{ id: 'a', label: '項目 A', data: { code: 'P1031' } }, { id: 'b', label: '項目 B', data: { code: 'P1047' } }] },
  ];
}

@Component({
  standalone: true,
  imports: [ResultListComponent],
  // 範本裡直接呼叫函式：每次畫面更新都拿到一個新的陣列
  template: `<app-result-list ariaLabel="搜尋結果" [groups]="make()" (activeOptionIdChange)="changes = changes + 1"></app-result-list>`,
})
class FreshArrayHostComponent {
  @ViewChild(ResultListComponent) list!: ResultListComponent;
  calls = 0;
  changes = 0;
  make(): ResultListGroup[] {
    this.calls++;
    return [{ id: 'g', items: [{ id: 'a', label: '項目 A' }, { id: 'b', label: '項目 B' }] }];
  }
}

/** 找元件樣式裡某個 media 條件底下、選擇器含指定字樣的規則（Karma 裡沒辦法真的切到強制色彩或減少動態） */
function mediaRule(condition: RegExp, selectorPart: string): CSSStyleRule | null {
  for (const sheet of Array.from(document.styleSheets)) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of Array.from(rules)) {
      if (!(rule instanceof CSSMediaRule) || !condition.test(rule.conditionText)) continue;
      const hit = Array.from(rule.cssRules).find(r => r instanceof CSSStyleRule && r.selectorText.includes(selectorPart));
      if (hit) return hit as CSSStyleRule;
    }
  }
  return null;
}

describe('ResultListComponent 樣式', () => {
  let fixture: ComponentFixture<ResultListComponent>;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [ResultListComponent] }).compileComponents();
    fixture = TestBed.createComponent(ResultListComponent);
    host = fixture.nativeElement as HTMLElement;
    document.body.appendChild(host);
    fixture.componentRef.setInput('ariaLabel', '搜尋結果');
    fixture.componentRef.setInput('groups', FLAT);
    fixture.detectChanges();
  });
  afterEach(() => { fixture.destroy(); host.remove(); });

  const options = () => Array.from(host.querySelectorAll<HTMLElement>('[role="option"]'));

  it('選中的列有底色，沒選中的沒有；字的顏色一樣', () => {
    fixture.componentInstance.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    fixture.detectChanges();
    // 底色有 0.15 秒的過渡，先關掉再量
    options().forEach(o => (o.style.transition = 'none'));
    const [active, idle] = options().map(o => getComputedStyle(o));
    expect(active.backgroundColor).not.toBe(idle.backgroundColor);
    expect(idle.backgroundColor).toBe('rgba(0, 0, 0, 0)');
    expect(active.color).toBe(idle.color);
  });

  it('選中的列另外有一圈焦點框顏色的外框（畫在列裡面）；沒選中的沒有', () => {
    fixture.componentInstance.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    fixture.detectChanges();
    const [active, idle] = options().map(o => getComputedStyle(o));
    expect(active.outlineStyle).toBe('solid');
    expect(active.outlineWidth).toBe('2px');
    expect(active.outlineOffset).toBe('-2px');
    // 淺灰底對白底只有 1.11:1，看不出選到哪一列；外框 #3a9ccd 對白底 3.08:1
    expect(active.outlineColor).toBe('rgb(58, 156, 205)');
    expect(idle.outlineStyle).toBe('none');
  });

  it('強制色彩：選中的列加系統醒目色的外框', () => {
    const rule = mediaRule(/forced-colors:\s*active/, '.rl__option--active');
    expect(rule).withContext('找不到強制色彩的規則').not.toBeNull();
    expect(rule!.style.outlineStyle).toBe('solid');
    expect(rule!.style.outlineColor.toLowerCase()).toBe('highlight');
  });

  it('減少動態：底色直接換，不做過渡', () => {
    const rule = mediaRule(/prefers-reduced-motion:\s*reduce/, '.rl__option');
    expect(rule).withContext('找不到減少動態的規則').not.toBeNull();
    expect(rule!.style.transition).toContain('none');
  });
});

describe('ResultListComponent 每次畫面更新都收到新陣列', () => {
  it('內容一樣就不排通知：畫面更新會停下來，不會一直重跑', async () => {
    await TestBed.configureTestingModule({ imports: [FreshArrayHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(FreshArrayHostComponent);
    fixture.autoDetectChanges(true);
    await fixture.whenStable();
    const host = fixture.componentInstance;
    const before = host.calls;
    // 等幾輪 microtask 與一個計時器：如果每次更新都排通知，這段時間 make() 會被叫上千次
    await new Promise(r => setTimeout(r, 50));
    await fixture.whenStable();
    expect(host.calls - before).toBeLessThan(5);

    // 選中改變時照樣通知一次，之後一樣會停
    host.list.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    await fixture.whenStable();
    const mid = host.calls;
    await new Promise(r => setTimeout(r, 50));
    expect(host.changes).toBe(1);
    expect(host.calls - mid).toBeLessThan(5);
    fixture.destroy();
  });
});

describe('ResultListComponent 自訂列範本', () => {
  it('每列用使用端的範本畫，拿得到項目與「是不是選中」', async () => {
    await TestBed.configureTestingModule({ imports: [TemplateHostComponent] }).compileComponents();
    const fixture = TestBed.createComponent(TemplateHostComponent);
    fixture.detectChanges();
    const el = fixture.nativeElement as HTMLElement;
    const rows = () => Array.from(el.querySelectorAll<HTMLElement>('[role="option"] .custom'));
    expect(rows().map(r => r.textContent!.trim())).toEqual(['項目 A｜P1031', '項目 B｜P1047']);
    expect(el.querySelector('.rl__label')).toBeNull();
    fixture.componentInstance.list.handleKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown', cancelable: true }));
    fixture.detectChanges();
    expect(rows().map(r => r.getAttribute('data-active'))).toEqual(['true', 'false']);
  });
});
