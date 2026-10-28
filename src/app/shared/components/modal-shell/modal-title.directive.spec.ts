import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ModalShellComponent } from './modal-shell.component';
import { ModalTitleDirective } from './modal-title.directive';

/**
 * appModalTitle 契約（2026-10-28）：
 * - 掛在 app-modal-shell 裡的標題上，卡片（.modal-card[role=dialog]）的 aria-labelledby 自動指向它。
 * - 沒給 id 就自動產生；寫了 id（固定或綁定）就沿用，之後改值卡片跟著改指。
 * - 標題在投影進來的子元件裡、在 @if 裡，一樣有效；同時開兩個對話框，各指各的標題。
 * - 對話框裡再開對話框：標題接到離它最近的那一層。
 *
 * modal-shell 開啟時把自己搬到 document.body，所以一律從 document 查卡片。
 */

@Component({
  selector: 'test-title-header',
  standalone: true,
  imports: [ModalTitleDirective],
  template: `<h2 appModalTitle>子元件裡的標題</h2>`,
})
class TitleHeaderComponent {}

@Component({
  standalone: true,
  imports: [ModalShellComponent, ModalTitleDirective],
  template: `
    <app-modal-shell [isOpen]="open">
      <h2 appModalTitle>自動 id 標題</h2>
      <p>內容</p>
    </app-modal-shell>
  `,
})
class AutoIdHost {
  open = true;
}

@Component({
  standalone: true,
  imports: [ModalShellComponent, ModalTitleDirective],
  template: `
    <app-modal-shell [isOpen]="open">
      <h2 appModalTitle id="kept-title-id">固定 id 標題</h2>
    </app-modal-shell>
  `,
})
class StaticIdHost {
  open = true;
}

@Component({
  standalone: true,
  imports: [ModalShellComponent, ModalTitleDirective],
  template: `
    <app-modal-shell [isOpen]="open">
      <h2 appModalTitle [id]="titleId">綁定 id 標題</h2>
    </app-modal-shell>
  `,
})
class BoundIdHost {
  open = true;
  titleId = 'bound-title-a';
}

@Component({
  standalone: true,
  imports: [ModalShellComponent, TitleHeaderComponent],
  template: `
    <app-modal-shell [isOpen]="open">
      <test-title-header></test-title-header>
    </app-modal-shell>
  `,
})
class ChildTitleHost {
  open = true;
}

@Component({
  standalone: true,
  imports: [ModalShellComponent, ModalTitleDirective],
  template: `
    <app-modal-shell [isOpen]="open">
      @if (showTitle) {
        <h2 appModalTitle>條件標題</h2>
      }
      <p>內容</p>
    </app-modal-shell>
  `,
})
class ConditionalTitleHost {
  open = true;
  showTitle = true;
}

@Component({
  standalone: true,
  imports: [ModalShellComponent, ModalTitleDirective],
  template: `
    <app-modal-shell class="first" [isOpen]="open">
      <h2 appModalTitle>第一個對話框</h2>
    </app-modal-shell>
    <app-modal-shell class="second" [isOpen]="open">
      <h2 appModalTitle>第二個對話框</h2>
    </app-modal-shell>
  `,
})
class TwoShellsHost {
  open = true;
}

@Component({
  standalone: true,
  imports: [ModalShellComponent, ModalTitleDirective],
  template: `
    <app-modal-shell class="outer" [isOpen]="true">
      <h2 appModalTitle>外層對話框</h2>
      <app-modal-shell class="inner" [isOpen]="innerOpen">
        <h3 appModalTitle>內層對話框</h3>
      </app-modal-shell>
    </app-modal-shell>
  `,
})
class NestedShellsHost {
  innerOpen = true;
}

const cardIn = (root: ParentNode = document): HTMLElement =>
  root.querySelector('.modal-card[role="dialog"]') as HTMLElement;

/** 依 aria-labelledby 找出報讀軟體會念的名稱 */
const nameOf = (card: HTMLElement): string =>
  (card.getAttribute('aria-labelledby') ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
    .join(' ');

describe('ModalTitleDirective — 對話框標題標記', () => {
  let fixture: ComponentFixture<unknown>;

  function render<T>(host: new () => T, patch: Partial<T> = {}): ComponentFixture<T> {
    const f = TestBed.createComponent(host);
    Object.assign(f.componentInstance as object, patch);
    f.detectChanges();
    fixture = f as ComponentFixture<unknown>;
    return f;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutoIdHost, StaticIdHost, BoundIdHost, ChildTitleHost, ConditionalTitleHost, TwoShellsHost, NestedShellsHost],
    }).compileComponents();
  });

  afterEach(() => fixture?.destroy());

  it('標題沒有 id：自動產生 id，卡片 aria-labelledby 指向它', () => {
    render(AutoIdHost);
    const title = document.querySelector('.modal-card h2') as HTMLElement;
    expect(title.id).toMatch(/^app-modal-title-\d+$/);
    expect(cardIn().getAttribute('aria-labelledby')).toBe(title.id);
    expect(nameOf(cardIn())).toBe('自動 id 標題');
  });

  it('標題寫了 id：id 不變，卡片指向原 id', () => {
    render(StaticIdHost);
    const title = document.querySelector('.modal-card h2') as HTMLElement;
    expect(title.id).toBe('kept-title-id');
    expect(cardIn().getAttribute('aria-labelledby')).toBe('kept-title-id');
  });

  it('標題用綁定的 id：開啟後改值，卡片跟著改指', () => {
    const f = render(BoundIdHost);
    expect(cardIn().getAttribute('aria-labelledby')).toBe('bound-title-a');
    f.componentInstance.titleId = 'bound-title-b';
    f.detectChanges();
    const title = document.querySelector('.modal-card h2') as HTMLElement;
    expect(title.id).toBe('bound-title-b');
    expect(cardIn().getAttribute('aria-labelledby')).toBe('bound-title-b');
    expect(nameOf(cardIn())).toBe('綁定 id 標題');
  });

  it('標題在投影進來的子元件裡：卡片指向它', () => {
    render(ChildTitleHost);
    expect(nameOf(cardIn())).toBe('子元件裡的標題');
  });

  it('標題在 @if 裡：出現時指向它，消失時清掉 aria-labelledby，再出現時指向新的標題', () => {
    const f = render(ConditionalTitleHost);
    expect(nameOf(cardIn())).toBe('條件標題');

    f.componentInstance.showTitle = false;
    f.detectChanges();
    expect(cardIn().hasAttribute('aria-labelledby')).toBeFalse();

    f.componentInstance.showTitle = true;
    f.detectChanges();
    expect(nameOf(cardIn())).toBe('條件標題');
  });

  it('同時開兩個對話框：各自指向自己的標題，id 不同', () => {
    render(TwoShellsHost);
    const first = cardIn(document.querySelector('app-modal-shell.first')!);
    const second = cardIn(document.querySelector('app-modal-shell.second')!);
    expect(first.getAttribute('aria-labelledby')).toBeTruthy();
    expect(first.getAttribute('aria-labelledby')).not.toBe(second.getAttribute('aria-labelledby'));
    expect(nameOf(first)).toBe('第一個對話框');
    expect(nameOf(second)).toBe('第二個對話框');
  });

  it('對話框裡再開對話框：兩層各指自己的標題；內層關掉後外層不受影響', () => {
    const f = render(NestedShellsHost);
    const outerCard = () => document.querySelector('app-modal-shell.outer > .modal-card') as HTMLElement;
    const innerCard = () => document.querySelector('app-modal-shell.inner > .modal-card') as HTMLElement;
    expect(nameOf(outerCard())).toBe('外層對話框');
    expect(nameOf(innerCard())).toBe('內層對話框');

    f.componentInstance.innerOpen = false;
    f.detectChanges();
    expect(nameOf(outerCard())).toBe('外層對話框');
  });
});
