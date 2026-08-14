import { lineCount, isSingleLine, unwrappedTextWidth, wrapPremiseHolds } from './text-layout.helpers';

/**
 * 檢查機制自己的測試。
 *
 * 這幾支 helper 是 2026-08-04 CI 事故的產物：原本的折行斷言用「高度比值 > 1.5」與像素常數，
 * 在 macOS 全綠、Linux CI 紅 2 條（單行高 38 vs 34、字寬 14 vs 12）。修法是改用與字型無關的
 * 行數量測，但**新的檢查機制若自己沒有測試，只是把一個沒證據的斷言換成另一個**——
 * 所以這裡逐條驗 helper 的行為，包含「刻意讓它算錯」的反面案例。
 */
describe('text-layout helpers（字型無關的折行量測）', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '0';
    container.style.top = '0';
    container.style.fontSize = '14px';
    container.style.fontFamily = 'sans-serif';
    document.body.appendChild(container);
  });

  afterEach(() => container.remove());

  function makeText(text: string, width: number, extra: Partial<CSSStyleDeclaration> = {}): HTMLElement {
    const el = document.createElement('div');
    el.textContent = text;
    el.style.width = `${width}px`;
    Object.assign(el.style, extra);
    container.appendChild(el);
    return el;
  }

  describe('lineCount', () => {
    it('單行文字回傳 1', () => {
      const el = makeText('短', 300);
      expect(lineCount(el)).toBe(1);
      expect(isSingleLine(el)).toBe(true);
    });

    it('容器窄到必須折行時回傳實際行數（>1）', () => {
      // 30 個中文字塞進 60px：任何字型下都必須折多行
      const el = makeText('這是一段需要折行的測試文字用來驗證行數量測是否正確無誤好嗎', 60);
      const lines = lineCount(el);
      expect(lines).withContext(`實測 ${lines} 行`).toBeGreaterThan(1);
      expect(isSingleLine(el)).toBe(false);
    });

    it('同文字同寬度下，改變 padding 不影響行數（證明與盒模型無關）', () => {
      const text = '這是一段需要折行的測試文字用來驗證行數量測';
      // box-sizing: border-box 讓兩者的內容寬相同，只有外框高度不同
      const thin = makeText(text, 120, { padding: '0px', boxSizing: 'border-box' });
      const fat = makeText(text, 120, { padding: '20px 0', boxSizing: 'border-box' });

      expect(lineCount(thin)).toBe(lineCount(fat));
      // 對照：高度確實不同 —— 這正是「高度比值」斷言會壞的原因
      expect(fat.getBoundingClientRect().height).toBeGreaterThan(thin.getBoundingClientRect().height);
    });

    it('空元素回傳 0（不會誤判成 1 行）', () => {
      const el = makeText('', 300);
      expect(lineCount(el)).toBe(0);
    });
  });

  describe('unwrappedTextWidth', () => {
    it('回傳不換行時的寬度，大於被容器限制後的元素寬', () => {
      const el = makeText('這是一段很長的文字會被容器限制住寬度所以必須折行顯示', 100);
      const unwrapped = unwrappedTextWidth(el);
      expect(unwrapped).withContext(`不換行 ${unwrapped}px vs 受限 100px`).toBeGreaterThan(100);
    });

    it('短文字的不換行寬度小於寬容器', () => {
      const el = makeText('短', 300);
      expect(unwrappedTextWidth(el)).toBeLessThan(300);
    });

    it('量測後不殘留 probe 節點在 body', () => {
      const before = document.body.childElementCount;
      unwrappedTextWidth(makeText('測試文字', 200));
      expect(document.body.childElementCount).toBe(before);
    });
  });

  describe('wrapPremiseHolds（折行斷言的前提檢查）', () => {
    it('測資比可用寬度寬 → true（折行斷言有鑑別力）', () => {
      const el = makeText('這是一段足夠長的測試文字肯定會超過六十像素的寬度', 60);
      expect(wrapPremiseHolds(el, 60)).toBe(true);
    });

    it('測資塞得進可用寬度 → false（這正是 CI 上 CheckChip 那條失去對象的情況）', () => {
      const el = makeText('短', 300);
      expect(wrapPremiseHolds(el, 300)).toBe(false);
    });

    it('前提檢查用當前環境實際字寬，不是寫死的字數推算', () => {
      // 同樣 10 個字，字級放大一倍 → 不換行寬度也該跟著變大，證明是實測而非常數
      const small = makeText('一二三四五六七八九十', 300, { fontSize: '10px' });
      const large = makeText('一二三四五六七八九十', 300, { fontSize: '30px' });
      expect(unwrappedTextWidth(large)).toBeGreaterThan(unwrappedTextWidth(small));
    });
  });
});
