import { ICON_REGISTRY } from './icon.registry';

/**
 * Icon 垂直置中回歸測試
 *
 * 背景：`eye`（檢視 / view）icon 的 SVG path 原本畫在 24×24 viewBox 內偏上 3px
 * （y 範圍 0~18，中心 9），導致所有使用 view icon 的 button 內 icon 看起來偏上。
 * 修法是讓 path 整體下移 3px，使垂直中心對齊 viewBox 中心（12）。
 *
 * 此測試用真實瀏覽器 getBBox() 量測 icon 在 24×24 viewBox 內的實際垂直中心，
 * 鎖定「view 類 icon 必須垂直置中」這個視覺契約。
 */
describe('ICON_REGISTRY — 垂直置中', () => {
  const VIEWBOX = 24;
  const CENTER = VIEWBOX / 2; // 12
  // path 端點落在像素邊界、加上曲線控制點影響，給 ±1px 容忍
  const TOLERANCE = 1;

  let host: HTMLDivElement;

  beforeEach(() => {
    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    document.body.removeChild(host);
  });

  /** 把 registry 字串渲染進 24×24 SVG，回傳所有圖形子元素合併後的垂直中心 */
  function measureVerticalCenter(name: string): number {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', `0 0 ${VIEWBOX} ${VIEWBOX}`);
    svg.setAttribute('width', `${VIEWBOX}`);
    svg.setAttribute('height', `${VIEWBOX}`);
    svg.innerHTML = ICON_REGISTRY[name];
    host.appendChild(svg);

    const shapes = Array.from(svg.querySelectorAll('path, g, rect, circle'))
      .filter((el): el is SVGGraphicsElement => typeof (el as SVGGraphicsElement).getBBox === 'function');

    let top = Infinity;
    let bottom = -Infinity;
    for (const shape of shapes) {
      const box = shape.getBBox();
      if (box.height === 0 && box.width === 0) continue;
      top = Math.min(top, box.y);
      bottom = Math.max(bottom, box.y + box.height);
    }
    return (top + bottom) / 2;
  }

  it('eye（view / 檢視）icon 垂直置中於 viewBox', () => {
    const center = measureVerticalCenter('eye');
    expect(center).toBeCloseTo(CENTER, 0);
    expect(Math.abs(center - CENTER)).toBeLessThanOrEqual(TOLERANCE);
  });

  it('eye-off icon 維持垂直置中（對照組，不得被破壞）', () => {
    const center = measureVerticalCenter('eye-off');
    expect(Math.abs(center - CENTER)).toBeLessThanOrEqual(TOLERANCE);
  });
});
