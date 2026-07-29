import { FlipReorderDirective } from './flip-reorder.directive';

/**
 * 以 Object.create(prototype) + 真實 DOM（karma ChromeHeadless 有真 layout）測 FLIP 核心邏輯，
 * 繞過 MutationObserver 的非同步：直接 measure()（種基準）→ 改 DOM 順序 → animateReorder()（比對 + play）。
 */
describe('FlipReorderDirective — 資料驅動重排平滑滑動（reactive FLIP）', () => {
  let host: HTMLElement;
  let a: HTMLElement;
  let b: HTMLElement;
  let inst: any;

  function makeChild(id: string): HTMLElement {
    const el = document.createElement('div');
    el.setAttribute('data-flip-id', id);
    el.style.display = 'block';
    el.style.height = '40px';
    return el;
  }

  beforeEach(() => {
    host = document.createElement('div');
    host.style.position = 'relative';
    a = makeChild('A');
    b = makeChild('B');
    host.appendChild(a);
    host.appendChild(b);
    document.body.appendChild(host);

    inst = Object.create(FlipReorderDirective.prototype);
    inst.host = { nativeElement: host };
    inst.zone = { runOutsideAngular: (fn: () => void) => fn() };
    inst.positions = new Map();
  });

  afterEach(() => {
    if (host.parentNode) host.parentNode.removeChild(host);
  });

  it('重排（B 移到 A 前）→ 移動的卡片各自套用 transform 過渡（FLIP play 觸發）', () => {
    spyOn<any>(inst, 'prefersReducedMotion').and.returnValue(false);
    inst.measure();              // 種下舊 layout 位置（A=0, B=40）
    host.insertBefore(b, a);     // 重排：B 上移、A 下移
    inst.animateReorder();

    expect(b.style.transition).toContain('300ms');
    expect(b.style.transition).toContain('transform');
    expect(a.style.transition).toContain('300ms');
  });

  it('prefers-reduced-motion: reduce → 不套用任何過渡（瞬間定位、a11y）', () => {
    spyOn<any>(inst, 'prefersReducedMotion').and.returnValue(true);
    inst.measure();
    host.insertBefore(b, a);
    inst.animateReorder();

    expect(a.style.transition).toBe('');
    expect(b.style.transition).toBe('');
  });

  it('位置未變（非重排）→ 不套用過渡', () => {
    spyOn<any>(inst, 'prefersReducedMotion').and.returnValue(false);
    inst.measure();
    inst.animateReorder();       // DOM 順序不變

    expect(a.style.transition).toBe('');
    expect(b.style.transition).toBe('');
  });

  it('新增卡片（無舊位置基準）→ 不滑動、直接就位', () => {
    spyOn<any>(inst, 'prefersReducedMotion').and.returnValue(false);
    inst.measure();              // 基準只含 A、B
    const c = makeChild('C');
    host.appendChild(c);         // 新增 C（A、B 位置不變）
    inst.animateReorder();

    expect(c.style.transition).toBe('');   // 新卡無 FLIP（無舊基準）
  });
});
