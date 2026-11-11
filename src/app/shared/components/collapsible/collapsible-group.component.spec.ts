import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CollapsibleComponent } from './collapsible.component';
import { CollapsibleGroupComponent } from './collapsible-group.component';

/**
 * app-collapsible-group 契約（2026-11-11）：
 * - single 設了：使用者打開一段時，同一組裡原本開著的段落收起來，並發 expandedChange(false)，雙向綁定的值跟著變。
 * - 可以全部收起來。
 * - 沒設 single：跟沒包一樣，各段各自開合。
 * - 包在其他元素裡（例如卡片）的段落也算同一組。
 * - 段落內容裡巢狀的收合區塊不算這一組：打開它不會收掉外層。
 * - 停用的段落不會被收掉（停用時維持原來的開合）。
 */
@Component({
  standalone: true,
  imports: [CollapsibleComponent, CollapsibleGroupComponent],
  template: `
    <app-collapsible-group [single]="single">
      <app-collapsible data-testid="a" title="項目 A" [(expanded)]="a"></app-collapsible>
      <div class="card">
        <app-collapsible data-testid="b" title="項目 B" [(expanded)]="b">
          <app-collapsible data-testid="b-inner" title="項目 B 的細項" [(expanded)]="bInner"></app-collapsible>
        </app-collapsible>
      </div>
      <app-collapsible data-testid="c" title="項目 C" [disabled]="cDisabled" [(expanded)]="c"></app-collapsible>
    </app-collapsible-group>
  `,
})
class HostComponent {
  single = true;
  a = false;
  b = false;
  bInner = false;
  c = false;
  cDisabled = false;
}

describe('CollapsibleGroupComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;
  let el: HTMLElement;

  const trigger = (id: string) =>
    el.querySelector<HTMLElement>(`[data-testid="${id}"]`)!.querySelector<HTMLButtonElement>('.collapsible__trigger')!;
  const expanded = (id: string) => trigger(id).getAttribute('aria-expanded') === 'true';
  const click = (id: string) => {
    trigger(id).click();
    fixture.detectChanges();
  };

  beforeEach(() => {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    el = fixture.nativeElement;
    document.body.appendChild(el);
    fixture.detectChanges();
  });

  afterEach(() => el.remove());

  it('single：打開 B 時 A 收起來，A 的雙向綁定值也變 false', () => {
    click('a');
    expect(expanded('a')).toBeTrue();
    click('b');
    expect(expanded('b')).toBeTrue();
    expect(expanded('a')).toBeFalse();
    expect(host.a).toBeFalse();
    expect(host.b).toBeTrue();
  });

  it('single：可以全部收起來', () => {
    click('a');
    click('a');
    expect([expanded('a'), expanded('b'), expanded('c')]).toEqual([false, false, false]);
  });

  it('single：包在卡片裡的 B 也算同一組，打開 A 會收掉 B', () => {
    click('b');
    click('a');
    expect(expanded('b')).toBeFalse();
    expect(host.b).toBeFalse();
  });

  it('single：B 內容裡巢狀的收合區塊不算這一組，打開它不會收掉 B', () => {
    click('b');
    click('b-inner');
    expect(expanded('b-inner')).toBeTrue();
    expect(expanded('b')).toBeTrue();
  });

  it('single：停用的段落不會被收掉', () => {
    host.c = true;
    host.cDisabled = true;
    fixture.detectChanges();
    click('a');
    expect(expanded('a')).toBeTrue();
    expect(expanded('c')).toBeTrue();
  });

  it('沒設 single：各段各自開合', () => {
    host.single = false;
    fixture.detectChanges();
    click('a');
    click('b');
    expect(expanded('a')).toBeTrue();
    expect(expanded('b')).toBeTrue();
  });
});
