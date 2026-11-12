import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { EmptyStateComponent } from './empty-state.component';
import { By } from '@angular/platform-browser';
import { ButtonComponent } from '../button/button.component';
import { IconComponent } from '../icon/icon.component';

describe('EmptyStateComponent', () => {
  describe('message input', () => {
    let fixture: ComponentFixture<EmptyStateComponent>;
    let component: EmptyStateComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [EmptyStateComponent],
      }).compileComponents();

      fixture = TestBed.createComponent(EmptyStateComponent);
      component = fixture.componentInstance;
    });

    it('給 message → 顯示文字', () => {
      component.message = '查無符合的項目';
      fixture.detectChanges();
      const p = fixture.debugElement.query(By.css('.es-message'));
      expect(p).toBeTruthy();
      expect(p.nativeElement.textContent).toContain('查無符合的項目');
    });

    it('message 為空字串 → 不顯示 .es-message', () => {
      component.message = '';
      fixture.detectChanges();
      const p = fixture.debugElement.query(By.css('.es-message'));
      expect(p).toBeNull();
    });

    it('無 message 無投影 → 仍渲染 illustration（.es-scene 存在）', () => {
      component.message = '';
      fixture.detectChanges();
      const scene = fixture.debugElement.query(By.css('.es-scene'));
      expect(scene).toBeTruthy();
    });
  });

  describe('ng-content default slot', () => {
    @Component({
      standalone: true,
      imports: [EmptyStateComponent],
      template: `
        <app-empty-state message="">
          <span class="projected-child">投影按鈕</span>
        </app-empty-state>
      `,
    })
    class WrapperWithSlot {}

    let fixture: ComponentFixture<WrapperWithSlot>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [WrapperWithSlot],
      }).compileComponents();

      fixture = TestBed.createComponent(WrapperWithSlot);
      fixture.detectChanges();
    });

    it('給投影內容 → .projected-child 出現在 app-empty-state 內', () => {
      const child = fixture.debugElement.query(By.css('.projected-child'));
      expect(child).toBeTruthy();
      expect(child.nativeElement.textContent).toContain('投影按鈕');
    });
  });

  describe('variant="error"', () => {
    @Component({
      standalone: true,
      imports: [EmptyStateComponent],
      template: `
        <app-empty-state variant="error" title="附件清單載入失敗"
          description="請重試。如果一直失敗，請聯絡系統管理員。"
          message="不該出現的空狀態文字"
          [retrying]="retrying" (retry)="onRetry()">
          <span class="projected-child">自訂內容</span>
        </app-empty-state>
      `,
    })
    class ErrorHost {
      retrying = false;
      retryCount = 0;
      onRetry(): void { this.retryCount++; }
    }

    @Component({
      standalone: true,
      imports: [EmptyStateComponent],
      template: `<app-empty-state variant="error"></app-empty-state>`,
    })
    class ErrorNoRetryHost {}

    @Component({
      standalone: true,
      imports: [EmptyStateComponent],
      template: `<app-empty-state message="目前無資料" (retry)="onRetry()"></app-empty-state>`,
    })
    class EmptyWithRetryHost {
      onRetry(): void {}
    }

    let fixture: ComponentFixture<ErrorHost>;
    let host: ErrorHost;

    const retryButton = () => fixture.debugElement.query(By.css('.es-retry app-button'));
    const wrapper = () => fixture.debugElement.query(By.css('.es-wrapper')).nativeElement as HTMLElement;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ErrorHost, ErrorNoRetryHost, EmptyWithRetryHost],
      }).compileComponents();
      fixture = TestBed.createComponent(ErrorHost);
      host = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('不渲染插圖與 message；渲染 Alert-Info 圖示、標題、說明，外層 role="status"', () => {
      expect(fixture.debugElement.query(By.css('.es-scene'))).toBeNull();
      expect(fixture.debugElement.query(By.css('.es-message'))).toBeNull();
      const icon = fixture.debugElement.query(By.css('.es-error-icon'));
      expect(icon).toBeTruthy();
      expect((icon.componentInstance as IconComponent).name).toBe('Alert-Info');
      expect(icon.nativeElement.getAttribute('aria-hidden')).toBe('true');
      expect(fixture.debugElement.query(By.css('.es-title')).nativeElement.textContent.trim()).toBe('附件清單載入失敗');
      expect(fixture.debugElement.query(By.css('.es-description')).nativeElement.textContent.trim())
        .toBe('請重試。如果一直失敗，請聯絡系統管理員。');
      expect(wrapper().getAttribute('role')).toBe('status');
      expect(wrapper().getAttribute('tabindex')).toBe('-1');
    });

    it('靜態寫 title="…" 時，host 不留原生 title 屬性（滑過不跳瀏覽器提示）', () => {
      const el = fixture.debugElement.query(By.css('app-empty-state')).nativeElement as HTMLElement;
      expect(el.hasAttribute('title')).toBeFalse();
    });

    it('自訂內容在錯誤版本也顯示', () => {
      expect(fixture.debugElement.query(By.css('.projected-child'))).toBeTruthy();
    });

    it('有接 retry → 出現重試鈕（外框、中性色、S、Refresh 圖示、文字「重試」）；按一下 emit 一次', () => {
      const btn = retryButton();
      expect(btn).toBeTruthy();
      const b = btn.componentInstance as ButtonComponent;
      expect(b.variant).toBe('outlined');
      expect(b.color).toBe('neutral');
      expect(b.size).toBe('S');
      expect(b.leftIcon).toBe('Refresh');
      expect(btn.nativeElement.textContent).toContain('重試');
      (btn.nativeElement.querySelector('button') as HTMLButtonElement).click();
      expect(host.retryCount).toBe(1);
    });

    it('沒接 retry → 沒有重試鈕；title 用預設「載入失敗」、沒有說明', () => {
      const f = TestBed.createComponent(ErrorNoRetryHost);
      f.detectChanges();
      expect(f.debugElement.query(By.css('.es-retry'))).toBeNull();
      expect(f.debugElement.query(By.css('.es-title')).nativeElement.textContent.trim()).toBe('載入失敗');
      expect(f.debugElement.query(By.css('.es-description'))).toBeNull();
    });

    it('retrying=true → 重試鈕是載入狀態、文字「重試中」；再觸發按鈕事件也不 emit', () => {
      host.retrying = true;
      fixture.detectChanges();
      const btn = retryButton();
      const b = btn.componentInstance as ButtonComponent;
      expect(b.loading).toBeTrue();
      expect(btn.nativeElement.textContent).toContain('重試中');
      // 直接觸發 app-button 的 btnClick，繞過原生 disabled，驗元件自己的守門
      btn.triggerEventHandler('btnClick');
      expect(host.retryCount).toBe(0);
    });

    it('retrying 改回 false → 重試鈕恢復可按', () => {
      host.retrying = true;
      fixture.detectChanges();
      host.retrying = false;
      fixture.detectChanges();
      const btn = retryButton();
      expect((btn.componentInstance as ButtonComponent).loading).toBeFalse();
      (btn.nativeElement.querySelector('button') as HTMLButtonElement).click();
      expect(host.retryCount).toBe(1);
    });

    it('焦點在重試鈕上時進入重試中 → 焦點移到錯誤區塊本身，不掉出區塊', () => {
      const nativeBtn = retryButton().nativeElement.querySelector('button') as HTMLButtonElement;
      nativeBtn.focus();
      expect(document.activeElement).toBe(nativeBtn);
      host.retrying = true;
      fixture.detectChanges();
      expect(document.activeElement).toBe(wrapper());
    });

    it('焦點不在重試鈕上時進入重試中 → 不搶焦點', () => {
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();
      host.retrying = true;
      fixture.detectChanges();
      expect(document.activeElement).toBe(outside);
      outside.remove();
    });

    it('重試仍失敗（retrying 改回 false）時焦點還在錯誤區塊上 → 移回重試鈕，再按 Enter 就能再試', () => {
      const nativeBtn = retryButton().nativeElement.querySelector('button') as HTMLButtonElement;
      nativeBtn.focus();
      host.retrying = true;
      fixture.detectChanges();
      expect(document.activeElement).toBe(wrapper());
      host.retrying = false;
      fixture.detectChanges();
      const btnAfter = retryButton().nativeElement.querySelector('button') as HTMLButtonElement;
      expect(btnAfter.disabled).toBeFalse();
      expect(document.activeElement).toBe(btnAfter);
    });

    it('重試仍失敗時焦點已經離開錯誤區塊 → 不搶焦點', () => {
      const nativeBtn = retryButton().nativeElement.querySelector('button') as HTMLButtonElement;
      nativeBtn.focus();
      host.retrying = true;
      fixture.detectChanges();
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();
      host.retrying = false;
      fixture.detectChanges();
      expect(document.activeElement).toBe(outside);
      outside.remove();
    });

    it('預設版本（不帶 variant）即使接了 retry 也不出現重試鈕、沒有 role 與 tabindex', () => {
      const f = TestBed.createComponent(EmptyWithRetryHost);
      f.detectChanges();
      expect(f.debugElement.query(By.css('.es-scene'))).toBeTruthy();
      expect(f.debugElement.query(By.css('.es-message')).nativeElement.textContent).toContain('目前無資料');
      expect(f.debugElement.query(By.css('.es-retry'))).toBeNull();
      const w = f.debugElement.query(By.css('.es-wrapper')).nativeElement as HTMLElement;
      expect(w.getAttribute('role')).toBeNull();
      expect(w.getAttribute('tabindex')).toBeNull();
    });

    it('錯誤版本的 host 套 --es-min-height（使用端設 300px → host 高度至少 300px）', () => {
      const el = fixture.debugElement.query(By.css('app-empty-state')).nativeElement as HTMLElement;
      el.style.setProperty('--es-min-height', '300px');
      expect(el.getBoundingClientRect().height).toBeGreaterThanOrEqual(300);
    });
  });
});
