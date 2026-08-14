/**
 * 版面量測 helper（字型無關）——供「長文字必須折行」這類 spec 使用。
 *
 * **Why**：Karma 不載入 Noto Sans TC（`angular.json` test target 無 `index`、`styles` 只有
 * `src/styles.scss`，該檔無 `@font-face`），所以每台機器解析到的 CJK fallback 不同，
 * 中文的行高與字寬都會變。2026-08-04 CI 實證：同一支 chip spec 在 macOS 單行高 38px、
 * Linux CI 34px；同一串 57 字中文在 macOS 約 800px、Linux 約 684px（≈12px/字）。
 *
 * 兩種寫法因此都會壞：
 * 1. **像素常數**（`height < 32`）→ 在單行高 34 的環境假紅。
 * 2. **高度比值**（`longH > singleLineH * 1.5`）→ 數學上不可靠。含 padding 的元素
 *    單行高 = L + P、兩行高 = 2L + P，比值 =(2L+P)/(L+P)，P 越大 L 越小比值越接近 1。
 *    實測 macOS L=20/P=18 → 1.53 通過；Linux L=16/P=18 → 1.47 紅。**兩邊都確實折了兩行**，
 *    紅的是斷言不是產品。
 *
 * **How to apply**：折行斷言用 `lineCount()`（Range 的 client rects，與字型／字級／padding 全無關）。
 * 並且**永遠先驗前提**——用 `unwrappedTextWidth()` 確認測資真的比容器寬，否則字寬一變小，
 * 測資就塞得進容器、不再折行，斷言會靜默失去對象（CI 上 CheckChip 那條就是這樣紅的：
 * 長 chip 高 34 === 單行 34，根本沒折行）。`expectWrappedInto()` 把這兩件包在一起。
 */

/**
 * 元素內文字實際佔幾行。
 *
 * 以 `Range.getClientRects()` 的相異 top 計數——瀏覽器對每個 line box 產生一個 rect，
 * 所以這個數字就是真實行數，不受字型、字級、line-height、padding 影響。
 */
export function lineCount(el: HTMLElement): number {
  const range = document.createRange();
  range.selectNodeContents(el);
  const rects = Array.from(range.getClientRects()).filter(r => r.width > 0 && r.height > 0);
  if (!rects.length) return 0;
  // 同一行可能有多個 rect（混排、inline 子元素），故以 top 去重；1px 容差吸收次像素差異
  const tops = new Set(rects.map(r => Math.round(r.top)));
  return tops.size;
}

/** 文字是否只有一行。 */
export function isSingleLine(el: HTMLElement): boolean {
  return lineCount(el) === 1;
}

/**
 * 量「同樣的文字在不換行時會有多寬」（max-content 寬度）。
 *
 * 用離屏 probe 量而非讀元素自身寬度，因為元素已被容器限制住。probe 複製元素的 computed
 * 字型屬性，所以量到的寬度反映**當前環境實際解析到的字型**——這正是要驗前提的原因。
 */
export function unwrappedTextWidth(el: HTMLElement): number {
  const cs = getComputedStyle(el);
  const probe = document.createElement('span');
  probe.textContent = el.textContent ?? '';
  probe.style.position = 'absolute';
  probe.style.left = '-9999px';
  probe.style.top = '0';
  probe.style.whiteSpace = 'nowrap';
  probe.style.visibility = 'hidden';
  probe.style.fontFamily = cs.fontFamily;
  probe.style.fontSize = cs.fontSize;
  probe.style.fontWeight = cs.fontWeight;
  probe.style.fontStyle = cs.fontStyle;
  probe.style.letterSpacing = cs.letterSpacing;
  document.body.appendChild(probe);
  const width = probe.getBoundingClientRect().width;
  probe.remove();
  return width;
}

/**
 * 折行斷言的前提是否成立：測資不換行時是否真的比可用寬度寬。
 *
 * 抽成純函式讓 helper 自身可被測試（見 text-layout.helpers.spec.ts）——
 * 檢查機制自己也要有故障注入證據，不能只靠「用起來好像對」。
 */
export function wrapPremiseHolds(textEl: HTMLElement, availableWidth = textEl.clientWidth): boolean {
  return unwrappedTextWidth(textEl) > availableWidth;
}

/**
 * 斷言「文字在這個容器內確實折了行」，並先驗證前提（測資比容器寬）。
 *
 * 前提失敗時會給出可執行的訊息（加長測資或縮窄容器），而不是靜默通過——
 * 這是本 helper 存在的主要理由。
 *
 * @param textEl      承載文字的元素（例如 `.chip__text`、值 `<p>`）
 * @param availableWidth 文字可用寬度。**預設用 `textEl.clientWidth`**——折行後那就是文字實際
 *   能用的寬度，於是前提變成「不換行會超出自己現在的寬度」，完全自洽、不需要寫死任何
 *   padding／icon／gap 的像素數字（寫死那些數字就是把剛拆掉的脆弱性換個地方裝回去）。
 * @param minLines    至少幾行（預設 2）
 */
export function expectWrappedInto(textEl: HTMLElement, availableWidth = textEl.clientWidth, minLines = 2): void {
  const unwrapped = unwrappedTextWidth(textEl);
  expect(unwrapped)
    .withContext(
      `【前提不成立】測資不換行時只有 ${Math.round(unwrapped)}px，未超過可用寬度 ${Math.round(availableWidth)}px，` +
      `所以本來就不會折行、折行斷言沒有鑑別力。請加長測資或縮窄容器（字寬會隨環境字型變動，不要靠字數推算）`,
    )
    .toBeGreaterThan(availableWidth);

  const lines = lineCount(textEl);
  expect(lines)
    .withContext(`文字「${(textEl.textContent ?? '').trim().slice(0, 12)}…」應折成至少 ${minLines} 行，實測 ${lines} 行`)
    .toBeGreaterThanOrEqual(minLines);
}

/**
 * 斷言「沒有被壓成一字一行」——中文每字都是合法斷點，flex 可以把元素壓到單字寬而**不溢出**，
 * 用溢出偵測抓不到（memory css_scss_rules Rule 17）。行數上限即可識別。
 */
export function expectNotCollapsedToOneCharPerLine(textEl: HTMLElement, maxLines: number): void {
  const lines = lineCount(textEl);
  expect(lines)
    .withContext(`文字被壓成 ${lines} 行（上限 ${maxLines}），疑似被 flex 壓到單字寬`)
    .toBeLessThanOrEqual(maxLines);
}
