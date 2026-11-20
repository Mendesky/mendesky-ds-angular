import { Component } from '@angular/core';
import { TestBed, ComponentFixture, fakeAsync } from '@angular/core/testing';
import { SortHeaderComponent } from './sort-header.component';
import { nextSort, SortState } from './sort-header.model';

/**
 * app-sort-header 是可點擊排序的列表表頭：點了發出這欄的 key，排序狀態與排法由呼叫端負責。
 */
describe('SortHeaderComponent', () => {
  let fixture: ComponentFixture<SortHeaderComponent>;
  let component: SortHeaderComponent;
  let host: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SortHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SortHeaderComponent);
    component = fixture.componentInstance;
    host = fixture.nativeElement as HTMLElement;
    fixture.componentRef.setInput('label', '姓名');
    fixture.componentRef.setInput('key', 'name');
  });

  const button = () => host.querySelector('button') as HTMLButtonElement;

  const status = () => host.querySelector('[role="status"]') as HTMLElement;
  /** 按鈕念出來的名稱：按鈕裡的文字（圖示是 aria-hidden，不算） */
  const name = () => (button().textContent ?? '').replace(/\s+/g, '');

  it('顯示欄名，按鈕是 type="button"（放在表單裡不會送出）', () => {
    fixture.detectChanges();
    expect(name()).toBe('姓名');
    expect(button().type).toBe('button');
  });

  it('外層不是表格列：host 沒有 role，也沒有 aria-sort', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    expect(host.hasAttribute('role')).toBeFalse();
    expect(host.hasAttribute('aria-sort')).toBeFalse();
    expect(host.hasAttribute('aria-label')).toBeFalse();
  });

  it('沒有排序：按鈕只念欄名，圖示是通用排序符號，沒有作用中樣式', () => {
    fixture.detectChanges();
    expect(name()).toBe('姓名');
    expect(component.icon).toBe('Sort');
    expect(button().classList).not.toContain('ds-sort-header--active');
  });

  it('排序的是別欄：這欄維持未作用，按鈕只念欄名', () => {
    fixture.componentRef.setInput('sort', { key: 'email', dir: 'desc' });
    fixture.detectChanges();
    expect(component.active).toBeFalse();
    expect(name()).toBe('姓名');
  });

  it('升冪：按鈕念「姓名，升冪排序」、圖示 Sort-Asc、作用中樣式', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    expect(name()).toBe('姓名，升冪排序');
    expect(component.icon).toBe('Sort-Asc');
    expect(button().classList).toContain('ds-sort-header--active');
  });

  it('畫面上真的換了圖示：沒在排序、升冪、降冪三種的圖形都不一樣', () => {
    const drawn = () => (host.querySelector('.ds-sort-header__icon svg') as SVGElement).innerHTML;
    fixture.detectChanges();
    const idle = drawn();
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    const asc = drawn();
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
    fixture.detectChanges();
    const desc = drawn();
    expect(idle.length).toBeGreaterThan(0);
    expect(new Set([idle, asc, desc]).size).toBe(3);
  });

  it('降冪：按鈕念「姓名，降冪排序」、圖示 Sort-Desc', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
    fixture.detectChanges();
    expect(name()).toBe('姓名，降冪排序');
    expect(component.icon).toBe('Sort-Desc');
  });

  it('排序狀態那段字畫面上看不到，也不佔位置', () => {
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    const sr = button().querySelector('.ds-sort-header__sr') as HTMLElement;
    const cs = getComputedStyle(sr);
    expect(cs.position).toBe('absolute');
    expect(sr.getBoundingClientRect().width).toBeLessThanOrEqual(1);
  });

  it('圖示都標了 aria-hidden，不會被念出來', () => {
    fixture.componentRef.setInput('leftIcon', 'Sort');
    fixture.detectChanges();
    const svgs = Array.from(button().querySelectorAll('svg'));
    expect(svgs.length).toBe(2);
    expect(svgs.every(s => s.getAttribute('aria-hidden') === 'true')).toBeTrue();
  });

  describe('報讀區域', () => {
    it('一開始就在畫面上，而且是空的', () => {
      fixture.detectChanges();
      expect(status()).not.toBeNull();
      expect(status().textContent).toBe('');
    });

    it('已經在排序、但不是因為點了這一欄：不念', () => {
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    it('點了這一欄、排序狀態傳回來之後才念「已依姓名升冪排序」', () => {
      fixture.detectChanges();
      const region = status();
      button().click();
      fixture.detectChanges();
      // 排序狀態還沒傳回來：還是空的
      expect(region.textContent).toBe('');
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      // 同一個元素填字，不是重新插入一個
      expect(status()).toBe(region);
      expect(region.textContent).toBe('已依姓名升冪排序');
    });

    it('再點一次反轉方向：改念「已依姓名降冪排序」', () => {
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      button().click();
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('已依姓名降冪排序');
    });

    it('換成別欄排序：這一欄的報讀區域清空', () => {
      fixture.detectChanges();
      button().click();
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      fixture.componentRef.setInput('sort', { key: 'email', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    it('念過之後，方向從別的入口被反轉（不是點這一欄）：清空，不留著相反的那一句', () => {
      fixture.detectChanges();
      button().click();
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('已依姓名升冪排序');
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    it('念過之後欄名被換掉（例如切語系）：清空，不留著舊欄名', () => {
      fixture.detectChanges();
      button().click();
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('已依姓名升冪排序');
      fixture.componentRef.setInput('label', '名稱');
      fixture.detectChanges();
      expect(name()).toBe('名稱，升冪排序');
      expect(status().textContent).toBe('');
    });

    it('排序被清掉（sort 變回 null）：清空', () => {
      fixture.detectChanges();
      button().click();
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      fixture.componentRef.setInput('sort', null);
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    it('別欄被點而排到別欄：這一欄不念', () => {
      fixture.detectChanges();
      fixture.componentRef.setInput('sort', { key: 'email', dir: 'asc' });
      fixture.detectChanges();
      expect(status().textContent).toBe('');
    });

    describe('一秒的期限（用假時鐘，不真的等）', () => {
      let now = 1_000_000;
      beforeEach(() => {
        now = 1_000_000;
        spyOn(Date, 'now').and.callFake(() => now);
      });

      it('點了之後 999 毫秒排序狀態才傳回來：念', () => {
        fixture.detectChanges();
        button().click();
        now += 999;
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
        fixture.detectChanges();
        expect(status().textContent).toBe('已依姓名升冪排序');
      });

      it('剛好 1000 毫秒：念', () => {
        fixture.detectChanges();
        button().click();
        now += 1000;
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
        fixture.detectChanges();
        expect(status().textContent).toBe('已依姓名升冪排序');
      });

      it('1001 毫秒才傳回來：不念', () => {
        fixture.detectChanges();
        button().click();
        now += 1001;
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
        fixture.detectChanges();
        expect(status().textContent).toBe('');
      });

      it('過期的那一下不會留到下一次：之後從別的入口排到這一欄也不念', () => {
        fixture.detectChanges();
        button().click();
        now += 5000;
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
        fixture.detectChanges();
        now += 10;
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
        fixture.detectChanges();
        expect(status().textContent).toBe('');
      });

      it('點了這一欄但結果排到別欄：這一下作廢，之後這一欄被別的入口排到也不念', () => {
        fixture.detectChanges();
        button().click();
        fixture.componentRef.setInput('sort', { key: 'email', dir: 'asc' });
        fixture.detectChanges();
        now += 10;
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
        fixture.detectChanges();
        expect(status().textContent).toBe('');
      });

      it('連點兩下：以第二下的時間算', () => {
        fixture.detectChanges();
        button().click();
        now += 900;
        button().click();
        now += 900;
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
        fixture.detectChanges();
        expect(status().textContent).toBe('已依姓名升冪排序');
      });
    });

    it('點擊不留計時器：在 fakeAsync 裡點了不用 flush 也不會報「還有計時器」', fakeAsync(() => {
      fixture.detectChanges();
      button().click();
      fixture.detectChanges();
      // fakeAsync 區塊結束時佇列裡若還有計時器，Angular 會丟錯；這條能跑完就代表沒有
      expect(status().textContent).toBe('');
    }));

    describe('離開這一欄就清空', () => {
      const announce = () => {
        fixture.detectChanges();
        button().click();
        fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
        fixture.detectChanges();
        expect(status().textContent).toBe('已依姓名升冪排序');
      };

      it('焦點移走（blur）：清空', () => {
        announce();
        button().dispatchEvent(new FocusEvent('blur'));
        fixture.detectChanges();
        expect(status().textContent).toBe('');
      });

      it('滑鼠移開（pointerleave）：清空', () => {
        announce();
        button().dispatchEvent(new PointerEvent('pointerleave'));
        fixture.detectChanges();
        expect(status().textContent).toBe('');
      });

      it('清空後按鈕名稱照舊帶著排序方向', () => {
        announce();
        button().dispatchEvent(new FocusEvent('blur'));
        fixture.detectChanges();
        expect(name()).toBe('姓名，升冪排序');
      });
    });
  });

  describe('欄名前面的圖示', () => {
    const leftIcon = () => host.querySelector('.ds-sort-header__left-icon') as HTMLElement | null;

    it('沒給 leftIcon：不畫', () => {
      fixture.detectChanges();
      expect(leftIcon()).toBeNull();
    });

    it('給了 leftIcon：畫在欄名前面，12px，顏色跟文字一樣，沒在排序時也看得到', () => {
      fixture.componentRef.setInput('leftIcon', 'Sort');
      fixture.detectChanges();
      const el = leftIcon()!;
      expect(el).not.toBeNull();
      const label = host.querySelector('.ds-sort-header__label')!;
      expect(el.compareDocumentPosition(label) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      expect(el.getBoundingClientRect().width).toBe(12);
      expect(getComputedStyle(el).color).toBe(getComputedStyle(button()).color);
      expect(getComputedStyle(el).opacity).toBe('1');
    });
  });

  it('點擊發出這欄的 key', () => {
    const got: string[] = [];
    component.sortChange.subscribe(k => got.push(k));
    fixture.detectChanges();
    button().click();
    expect(got).toEqual(['name']);
  });

  it('沒在排序時圖示預設隱藏（opacity 0），正在排序時顯示', () => {
    fixture.detectChanges();
    const icon = () => host.querySelector('.ds-sort-header__icon') as HTMLElement;
    // 圖示有 150ms 淡入；關掉動畫才讀得到切換後的值
    icon().style.transition = 'none';
    expect(getComputedStyle(icon()).opacity).toBe('0');
    fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
    fixture.detectChanges();
    expect(getComputedStyle(icon()).opacity).toBe('1');
  });

  it('鍵盤聚焦時也出現排序圖示，並有 2px 外框', () => {
    fixture.detectChanges();
    const icon = host.querySelector('.ds-sort-header__icon') as HTMLElement;
    icon.style.transition = 'none';
    button().style.transition = 'none';
    expect(getComputedStyle(icon).opacity).toBe('0');
    button().focus();
    // 還沒有任何滑鼠操作時，程式聚焦的按鈕算鍵盤聚焦；瀏覽器不這樣判時這條不驗（不讓它空過成綠燈）
    if (!button().matches(':focus-visible')) {
      pending('這個瀏覽器把程式聚焦當成滑鼠聚焦，:focus-visible 沒有生效');
      return;
    }
    expect(getComputedStyle(icon).opacity).toBe('1');
    expect(getComputedStyle(button()).outlineWidth).toBe('2px');
    button().blur();
  });

  it('align="center" 時 host 置中，按鈕左右對稱（各往外 16px）', () => {
    fixture.componentRef.setInput('align', 'center');
    fixture.detectChanges();
    expect(host.classList).toContain('ds-sort-header--center');
    expect(getComputedStyle(host).justifyContent).toBe('center');
    expect(getComputedStyle(button()).marginLeft).toBe('-16px');
    expect(getComputedStyle(button()).marginRight).toBe('-16px');
  });

  describe('align="center"：欄名本身在這一格的正中間', () => {
    const offset = () => {
      const label = host.querySelector('.ds-sort-header__label') as HTMLElement;
      const l = label.getBoundingClientRect();
      const h = host.getBoundingClientRect();
      return l.left + l.width / 2 - (h.left + h.width / 2);
    };
    beforeEach(() => {
      host.style.width = '200px';
      fixture.componentRef.setInput('align', 'center');
    });
    afterEach(() => (host.style.width = ''));

    it('沒在排序（排序圖示看不到）：欄名的中心對齊這一格的中心', () => {
      fixture.detectChanges();
      expect(Math.abs(offset())).toBeLessThan(0.6);
    });

    it('正在排序（排序圖示出現）：欄名不動，還是在正中間', () => {
      fixture.detectChanges();
      const before = (host.querySelector('.ds-sort-header__label') as HTMLElement).getBoundingClientRect().left;
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      // 作用中變半粗，欄名會寬一點點；看的是中心，不是左緣
      expect(Math.abs(offset())).toBeLessThan(0.6);
      const after = (host.querySelector('.ds-sort-header__label') as HTMLElement).getBoundingClientRect().left;
      expect(Math.abs(after - before)).toBeLessThan(2);
    });

    it('排序圖示在欄名右邊', () => {
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'asc' });
      fixture.detectChanges();
      const label = (host.querySelector('.ds-sort-header__label') as HTMLElement).getBoundingClientRect();
      const icon = (host.querySelector('.ds-sort-header__icon') as HTMLElement).getBoundingClientRect();
      expect(icon.left).toBeGreaterThanOrEqual(label.right);
    });

    it('留給圖示的空位不佔欄寬：120px 的欄、14px 的字、六個字的欄名不會被截成刪節號', () => {
      host.style.width = '120px';
      host.style.fontSize = '14px';
      fixture.componentRef.setInput('label', '六個字的欄名');
      fixture.detectChanges();
      const label = host.querySelector('.ds-sort-header__label') as HTMLElement;
      // 欄名大約 84px；左右空位算進欄寬的話要 130px，會被壓成刪節號
      expect(label.getBoundingClientRect().width).toBeGreaterThan(70);
      expect(label.scrollWidth).withContext('欄名沒有被截斷').toBeLessThanOrEqual(label.clientWidth);
      // 佔的版面只有欄名加左右各 6px，放得進 120px
      const slot = button().getBoundingClientRect().width - 32;
      expect(slot).toBeLessThanOrEqual(120);
      expect(Math.abs(offset())).toBeLessThan(0.6);
      host.style.fontSize = '';
    });

    it('正在排序時（半粗、圖示出現）一樣不截', () => {
      host.style.width = '120px';
      host.style.fontSize = '14px';
      fixture.componentRef.setInput('label', '六個字的欄名');
      fixture.componentRef.setInput('sort', { key: 'name', dir: 'desc' });
      fixture.detectChanges();
      const label = host.querySelector('.ds-sort-header__label') as HTMLElement;
      expect(label.scrollWidth).toBeLessThanOrEqual(label.clientWidth);
      host.style.fontSize = '';
    });

    it('真的太長還是會用刪節號，不會無限往外凸', () => {
      host.style.width = '80px';
      fixture.componentRef.setInput('label', '這是一個非常非常長的欄位名稱');
      fixture.detectChanges();
      const label = host.querySelector('.ds-sort-header__label') as HTMLElement;
      expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
      expect(button().getBoundingClientRect().width).toBeLessThanOrEqual(80 + 32 + 0.5);
    });

    it('靠左、靠右不補這塊空位', () => {
      fixture.componentRef.setInput('align', 'start');
      fixture.detectChanges();
      expect(getComputedStyle(button()).paddingLeft).toBe('6px');
      fixture.componentRef.setInput('align', 'end');
      fixture.detectChanges();
      expect(getComputedStyle(button()).paddingLeft).toBe('6px');
    });
  });

  it('靠左時按鈕往左拉 6px、靠右時往右拉 6px（文字跟下方內容的邊緣對齊）', () => {
    fixture.detectChanges();
    expect(getComputedStyle(button()).marginLeft).toBe('-6px');
    fixture.componentRef.setInput('align', 'end');
    fixture.detectChanges();
    expect(getComputedStyle(button()).marginRight).toBe('-6px');
  });

  it('欄名太長：固定一行、尾端用刪節號，圖示不被擠掉', () => {
    host.style.width = '80px';
    fixture.componentRef.setInput('label', '這是一個非常非常長的欄位名稱');
    fixture.componentRef.setInput('leftIcon', 'Sort');
    fixture.detectChanges();
    const label = host.querySelector('.ds-sort-header__label') as HTMLElement;
    expect(label.scrollWidth).toBeGreaterThan(label.clientWidth);
    expect(getComputedStyle(label).textOverflow).toBe('ellipsis');
    host.querySelectorAll('app-icon').forEach(i => expect((i as HTMLElement).getBoundingClientRect().width).toBe(12));
    host.style.width = '';
  });

  it('align="end" 時 host 靠右', () => {
    fixture.componentRef.setInput('align', 'end');
    fixture.detectChanges();
    expect(host.classList).toContain('ds-sort-header--end');
    // 量實際位置，不比對 getComputedStyle 的字：同一條 justify-content: flex-end，
    // Chrome 147 回報 'flex-end'、Chrome 158 回報 'flow-end'，畫出來的位置一樣
    host.style.width = '240px';
    const h = host.getBoundingClientRect();
    const b = button().getBoundingClientRect();
    // 按鈕貼著右邊，並往外多出 6px（文字才跟下方靠右的內容對齊）
    expect(b.right - h.right).toBeCloseTo(6, 0);
    // 左邊留著空位：不是靠左
    expect(b.left - h.left).toBeGreaterThan(40);
    host.style.width = '';
  });

  it('消費端的欄寬 class 帶 overflow: hidden 時也不裁切按鈕', () => {
    const style = document.createElement('style');
    style.textContent = '.clip-cell { overflow: hidden; width: 120px; }';
    document.head.appendChild(style);
    host.classList.add('clip-cell');
    fixture.detectChanges();
    expect(getComputedStyle(host).overflow).toBe('visible');
    style.remove();
  });

  it('data-testid 依 key 產生，方便消費端測試定位', () => {
    fixture.detectChanges();
    expect(button().getAttribute('data-testid')).toBe('sort-name');
  });
});

/** 放在表格列裡：host 要帶 columnheader 與 aria-sort，按鈕名稱不重複寫排序狀態 */
@Component({
  standalone: true,
  imports: [SortHeaderComponent],
  template: `
    <div role="table">
      <div role="row">
        <app-sort-header label="姓名" key="name" [sort]="sort" (sortChange)="clicked = $event" />
      </div>
    </div>
  `,
})
class InRowHostComponent {
  sort: SortState | null = null;
  clicked = '';
}

describe('SortHeaderComponent 放在表格列（role="row"）裡', () => {
  let fixture: ComponentFixture<InRowHostComponent>;
  const el = () => fixture.nativeElement.querySelector('app-sort-header') as HTMLElement;
  const button = () => el().querySelector('button') as HTMLButtonElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [InRowHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(InRowHostComponent);
  });

  it('host 是 columnheader，沒有排序時 aria-sort=none', () => {
    fixture.detectChanges();
    expect(el().getAttribute('role')).toBe('columnheader');
    expect(el().getAttribute('aria-sort')).toBe('none');
  });

  it('升冪、降冪用 aria-sort 表達，按鈕名稱只有欄名（不重複念）', () => {
    fixture.componentInstance.sort = { key: 'name', dir: 'asc' };
    fixture.detectChanges();
    expect(el().getAttribute('aria-sort')).toBe('ascending');
    expect((button().textContent ?? '').replace(/\s+/g, '')).toBe('姓名');
    fixture.componentInstance.sort = { key: 'name', dir: 'desc' };
    fixture.detectChanges();
    expect(el().getAttribute('aria-sort')).toBe('descending');
  });

  it('點了之後一樣會念「已依姓名升冪排序」', () => {
    fixture.detectChanges();
    button().click();
    expect(fixture.componentInstance.clicked).toBe('name');
    fixture.componentInstance.sort = { key: 'name', dir: 'asc' };
    fixture.detectChanges();
    expect(el().querySelector('[role="status"]')!.textContent).toBe('已依姓名升冪排序');
  });

  it('欄標頭的名稱固定是欄名：念過確認句之後也不會把那一句算進去', () => {
    fixture.detectChanges();
    expect(el().getAttribute('aria-label')).toBe('姓名');
    button().click();
    fixture.componentInstance.sort = { key: 'name', dir: 'asc' };
    fixture.detectChanges();
    // 內容裡有那一句（給報讀區域念），但欄標頭的名稱由 aria-label 決定
    expect(el().textContent).toContain('已依姓名升冪排序');
    expect(el().getAttribute('aria-label')).toBe('姓名');
  });
});

/** role="row" 不在上一層、而在更外層時也算；原生 <tr> 沒有 role 屬性，不算 */
@Component({
  standalone: true,
  imports: [SortHeaderComponent],
  template: `
    <div role="row"><div class="cell"><div class="inner"><app-sort-header id="deep" label="姓名" key="name" /></div></div></div>
    <table><tbody><tr><td><app-sort-header id="native" label="姓名" key="name" /></td></tr></tbody></table>
  `,
})
class RowDetectionHostComponent {}

describe('SortHeaderComponent 怎麼判斷外層是表格列', () => {
  let fixture: ComponentFixture<RowDetectionHostComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [RowDetectionHostComponent] }).compileComponents();
    fixture = TestBed.createComponent(RowDetectionHostComponent);
    fixture.detectChanges();
  });

  it('role="row" 隔了幾層：算，帶 columnheader', () => {
    const el = fixture.nativeElement.querySelector('#deep') as HTMLElement;
    expect(el.getAttribute('role')).toBe('columnheader');
    expect(el.getAttribute('aria-sort')).toBe('none');
  });

  it('原生 <tr>（沒有 role 屬性）：不算，不帶 role、aria-sort、aria-label', () => {
    const el = fixture.nativeElement.querySelector('#native') as HTMLElement;
    expect(el.hasAttribute('role')).toBeFalse();
    expect(el.hasAttribute('aria-sort')).toBeFalse();
    expect(el.hasAttribute('aria-label')).toBeFalse();
  });
});

describe('nextSort', () => {
  it('點新的欄從預設方向開始（預設升冪）', () => {
    expect(nextSort(null, 'name')).toEqual({ key: 'name', dir: 'asc' });
    expect(nextSort({ key: 'email', dir: 'asc' }, 'count', 'desc')).toEqual({ key: 'count', dir: 'desc' });
  });

  it('再點同一欄反轉方向（兩段切換）', () => {
    expect(nextSort({ key: 'name', dir: 'asc' }, 'name')).toEqual({ key: 'name', dir: 'desc' });
    expect(nextSort({ key: 'name', dir: 'desc' }, 'name')).toEqual({ key: 'name', dir: 'asc' });
  });
});
