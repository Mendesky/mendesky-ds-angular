import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastContainerComponent } from './toast-container.component';
import { ToastService } from '../../services/toast.service';

describe('ToastContainerComponent', () => {
  let fixture: ComponentFixture<ToastContainerComponent>;
  let toast: ToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ToastContainerComponent],
      providers: [ToastService],
    });
    fixture = TestBed.createComponent(ToastContainerComponent);
    toast = TestBed.inject(ToastService);
    fixture.detectChanges();
  });

  function hosts(): HTMLElement[] {
    return Array.from(fixture.nativeElement.querySelectorAll('app-process-toast')) as HTMLElement[];
  }

  it('多顆依 show 順序渲染；最新排在 DOM 最後（容器 flex column ⇒ 視覺最下）', () => {
    toast.show({ type: 'success', message: '第一顆' });
    toast.show({ type: 'success', message: '第二顆' });
    fixture.detectChanges();

    const nodes = hosts();
    expect(nodes.length).toBe(2);
    expect(nodes[0].textContent).toContain('第一顆');
    expect(nodes[1].textContent)
      .withContext('append-only 插入＋flex column ⇒ 最新在最下；順序反了代表 show() 或容器方向被改')
      .toContain('第二顆');
  });

  it('無 action 的 toast → host pointer-events 為 none（不吃 modal 右下角的點擊）', () => {
    toast.show({ type: 'success', message: '不可點' });
    fixture.detectChanges();

    expect(getComputedStyle(hosts()[0]).pointerEvents)
      .withContext('存檔/錯誤 toast 沒有可互動元素，必須全程穿透，否則會攔住卡片右下的按鈕')
      .toBe('none');
  });

  it('帶 action 的 toast → host pointer-events 為 auto（「復原」鈕必須可點）', () => {
    toast.show({ type: 'success', message: '可點', action: { label: '復原', onClick: () => {} } });
    fixture.detectChanges();

    expect(getComputedStyle(hosts()[0]).pointerEvents)
      .withContext('有 undo action 的 toast 若也穿透，使用者永遠按不到「復原」')
      .toBe('auto');
  });

  it('同時存在有/無 action 兩顆 → 逐顆各自套用，不是整個容器一刀切', () => {
    toast.show({ type: 'success', message: '純通知' });
    toast.show({ type: 'success', message: '可復原', action: { label: '復原', onClick: () => {} } });
    fixture.detectChanges();

    const nodes = hosts();
    expect(getComputedStyle(nodes[0]).pointerEvents).toBe('none');
    expect(getComputedStyle(nodes[1]).pointerEvents).toBe('auto');
  });
});
