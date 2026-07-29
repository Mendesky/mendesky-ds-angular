import { TestBed } from '@angular/core/testing';
import { IconComponent } from './icon.component';

/**
 * 聚焦「未知 icon name 不再靜默失效」的防呆行為（2026-07-22 加入 dev warning 根本解）。
 * 三態：已知 name 不誤報 / 未知 name 必 warn / 空 name（初始化）不誤報。
 */
describe('IconComponent — 未知 name dev warning', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconComponent],
    }).compileComponents();
  });

  function makeComponent(name: string): IconComponent {
    const fixture = TestBed.createComponent(IconComponent);
    fixture.componentInstance.name = name;
    fixture.componentInstance.ngOnChanges();
    return fixture.componentInstance;
  }

  it('已知 name（Close）：不應 console.warn', () => {
    const warn = spyOn(console, 'warn');
    makeComponent('Close');
    expect(warn).not.toHaveBeenCalled();
  });

  it('未知 name（Info，正是本次誤用值）：應 console.warn 一次且訊息含該 name', () => {
    const warn = spyOn(console, 'warn');
    makeComponent('Info');
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.calls.mostRecent().args[0]).toContain('Info');
  });

  it('空 name（初始化未賦值）：不應誤報 warn', () => {
    const warn = spyOn(console, 'warn');
    makeComponent('');
    expect(warn).not.toHaveBeenCalled();
  });
});
