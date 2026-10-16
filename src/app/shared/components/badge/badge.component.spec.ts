import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

/**
 * app-badge 是未讀徽章：疊在宿主元素右上角，表示「有未讀」或「未讀幾則」。
 * 語意上不是錯誤也不是警告，所以底色用 --badge/unread，不借用 --button/error。
 */
describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;
  let component: BadgeComponent;

  const badgeEl = () => fixture.nativeElement.querySelector('.ds-badge') as HTMLElement | null;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
  });

  describe('渲染條件', () => {
    it('count 為 null 時不渲染任何節點', () => {
      component.count = null;
      fixture.detectChanges();
      expect(badgeEl()).toBeNull();
    });

    it('count 為 0 時不渲染（沒有未讀就不該佔位）', () => {
      component.count = 0;
      fixture.detectChanges();
      expect(badgeEl()).toBeNull();
    });

    it('variant=dot 時即使沒有 count 也渲染圓點', () => {
      component.variant = 'dot';
      component.count = null;
      fixture.detectChanges();
      expect(badgeEl()).not.toBeNull();
      expect(badgeEl()!.classList).toContain('ds-badge--dot');
      expect(badgeEl()!.textContent!.trim()).toBe('');
    });
  });

  describe('數量呈現', () => {
    it('count 在 max 以內時顯示原數字', () => {
      component.count = 5;
      fixture.detectChanges();
      expect(badgeEl()!.textContent!.trim()).toBe('5');
      expect(badgeEl()!.classList).toContain('ds-badge--number');
    });

    it('count 等於 max 時仍顯示原數字（邊界不提前退化）', () => {
      component.count = 99;
      component.max = 99;
      fixture.detectChanges();
      expect(badgeEl()!.textContent!.trim()).toBe('99');
    });

    it('超過 max 且 overflow=plus 時顯示 `max+`', () => {
      component.count = 100;
      component.max = 99;
      component.overflow = 'plus';
      fixture.detectChanges();
      expect(badgeEl()!.textContent!.trim()).toBe('99+');
    });

    it('超過 max 且 overflow=dot 時退回圓點、不顯示數字（通知鈴現行行為）', () => {
      component.count = 150;
      component.max = 99;
      component.overflow = 'dot';
      fixture.detectChanges();
      expect(badgeEl()!.classList).toContain('ds-badge--dot');
      expect(badgeEl()!.textContent!.trim()).toBe('');
    });

    it('max 可由呼叫端調高：max=999 時 count=100 仍顯示原數字', () => {
      component.count = 100;
      component.max = 999;
      fixture.detectChanges();
      expect(badgeEl()!.textContent!.trim()).toBe('100');
    });
  });

  describe('無障礙', () => {
    it('未提供 ariaLabel 時，數字模式以數量作為讀屏文字', () => {
      component.count = 3;
      fixture.detectChanges();
      expect(badgeEl()!.getAttribute('aria-label')).toBe('3');
    });

    it('提供 ariaLabel 時優先採用', () => {
      component.count = 3;
      component.ariaLabel = '3 則未讀';
      fixture.detectChanges();
      expect(badgeEl()!.getAttribute('aria-label')).toBe('3 則未讀');
    });

    it('圓點模式沒有文字，必須靠 ariaLabel 表達語意', () => {
      component.variant = 'dot';
      component.ariaLabel = '有未讀';
      fixture.detectChanges();
      expect(badgeEl()!.getAttribute('aria-label')).toBe('有未讀');
    });
  });

  describe('視覺規格', () => {
    it('圓點為 10×10（09-10 定案，取代原本 header 手刻的 7×7）', () => {
      component.variant = 'dot';
      fixture.detectChanges();
      const r = badgeEl()!.getBoundingClientRect();
      expect(r.width).toBeCloseTo(10, 0);
      expect(r.height).toBeCloseTo(10, 0);
    });

    it('數字高度為 16、單位數時寬度不小於 16（min-width 撐成圓形）', () => {
      component.count = 5;
      fixture.detectChanges();
      const r = badgeEl()!.getBoundingClientRect();
      expect(r.height).toBeCloseTo(16, 0);
      expect(r.width).toBeGreaterThanOrEqual(16);
    });

    it('底色為未讀紅（來自 --badge/unread，未定義時走 fallback）', () => {
      component.variant = 'dot';
      fixture.detectChanges();
      // 這裡驗的是「渲染出來的顏色對不對」。token 本身定義在 DS 的 core.scss，
      // consumer 端的全域樣式來自已安裝的套件版本，未升版前讀不到新 token，
      // 元件靠 var(--badge/unread, #cc5252) 的 fallback 仍渲染正確顏色。
      expect(getComputedStyle(badgeEl()!).backgroundColor).toBe('rgb(204, 82, 82)');
    });

    it('class 有命名空間，不與 DS 全域的 .badge 標籤工具類撞名', () => {
      component.variant = 'dot';
      fixture.detectChanges();
      // core.scss 既有全域 .badge（padding: 2px 8px），撞名時會在 border-box 下把
      // 10px 圓點撐成 18px。改用 .ds-badge 前綴避開。
      expect(badgeEl()!.classList).not.toContain('badge');
    });
  });

  // ── 通知鈴的現行語意（原本寫在 header 的 badgeMode()，該函式已隨遷移刪除）──
  // 這組 case 是那份語意唯一的可測載體，改動 badge 前先確認這裡仍綠。
  describe('通知鈴語意（overflow=dot、max=99）', () => {
    function bell(count: number): HTMLElement | null {
      fixture.componentInstance.count = count;
      fixture.componentInstance.max = 99;
      fixture.componentInstance.overflow = 'dot';
      fixture.detectChanges();
      return badgeEl();
    }

    it('0 則 → 完全不顯示', () => {
      expect(bell(0)).toBeNull();
    });

    it('5 則 → 顯示 5', () => {
      expect(bell(5)!.textContent!.trim()).toBe('5');
    });

    it('99 則 → 顯示 99（邊界不提前退化成圓點）', () => {
      expect(bell(99)!.textContent!.trim()).toBe('99');
    });

    it('100 則 → 退回圓點，不顯示數字', () => {
      const el = bell(100);
      expect(el!.textContent!.trim()).toBe('');
      expect(el!.classList).toContain('ds-badge--dot');
    });

    it('150 則 → 同樣是圓點', () => {
      const el = bell(150);
      expect(el!.textContent!.trim()).toBe('');
      expect(el!.classList).toContain('ds-badge--dot');
    });
  });
});
