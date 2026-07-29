import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { EmptyStateComponent } from './empty-state.component';
import { By } from '@angular/platform-browser';

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
      component.message = '查無符合的報價案件';
      fixture.detectChanges();
      const p = fixture.debugElement.query(By.css('.es-message'));
      expect(p).toBeTruthy();
      expect(p.nativeElement.textContent).toContain('查無符合的報價案件');
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
});
