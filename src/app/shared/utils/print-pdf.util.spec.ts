import { printPdfBlob, supportsIframePrint } from './print-pdf.util';

/**
 * 列印契約（2026-07-22 定案）：任何路徑都不開新分頁。
 * - Chromium：blob 完整下載後載入隱藏 iframe，同分頁無縫列印。
 * - Safari/Firefox：iframe 內列印 PDF 會印空白（瀏覽器限制）→ blob 完整下載後直接下載 PDF 檔，
 *   由使用者開啟檔案列印（產品決策，取代先前的新分頁方案）。
 */
describe('printPdfBlob', () => {
  const blob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

  it('非 iframe 路徑（Safari/Firefox）：不開分頁，blob 下載完成後以指定檔名直接下載 PDF 檔', () => {
    const openSpy = spyOn(window, 'open');
    let downloadName = '';
    const clickSpy = spyOn(HTMLAnchorElement.prototype, 'click').and.callFake(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });

    const outcome = printPdfBlob(blob, '2026 年度報表.pdf', false);

    expect(openSpy).not.toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(downloadName).toBe('2026 年度報表.pdf');
    expect(outcome).toBe('downloaded');
  });

  it('iframe 路徑（Chromium）：不開分頁，同分頁 iframe 列印', () => {
    const openSpy = spyOn(window, 'open');

    const outcome = printPdfBlob(blob, '報表.pdf', true);

    expect(openSpy).not.toHaveBeenCalled();
    expect(outcome).toBe('printed');
    document.querySelectorAll('iframe[aria-hidden="true"]').forEach(f => f.remove());
  });

  it('iframe 路徑：blob 包成具名 File 再產 object URL（Chrome 列印「另存 PDF」預設檔名 = File.name）', () => {
    const urlSpy = spyOn(URL, 'createObjectURL').and.callThrough();

    printPdfBlob(blob, '2026 年度報表.pdf', true);

    const arg = urlSpy.calls.mostRecent().args[0] as File;
    expect(arg instanceof File).toBeTrue();
    expect(arg.name).toBe('2026 年度報表.pdf');
    expect(arg.type).toBe('application/pdf');
    document.querySelectorAll('iframe[aria-hidden="true"]').forEach(f => f.remove());
  });
});

/**
 * Chromium 偵測（2026-07-23 內網實測教訓）：`navigator.userAgentData` 只存在於 secure context
 * （HTTPS / localhost）——部署在內網 `http://<IP>` 時 Chromium 也拿不到，若只靠它判斷，
 * Chrome/Arc/Edge 全被誤判成 Safari/Firefox 走下載路徑。必須以 UA 字串 fallback
 * （`Chrome/` token 僅 Chromium 系有；Safari/Firefox/iOS CriOS 皆無）。
 */
describe('supportsIframePrint', () => {
  const CHROME_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
  const SAFARI_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
  const FIREFOX_UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0';
  const IOS_CHROME_UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0.0.0 Mobile/15E148 Safari/604.1';

  it('secure context（userAgentData 存在）→ true', () => {
    expect(supportsIframePrint({ userAgent: CHROME_UA, userAgentData: {} })).toBeTrue();
  });

  it('內網 http（無 userAgentData）的 Chromium（Chrome/Arc/Edge）→ UA fallback 判為 true', () => {
    expect(supportsIframePrint({ userAgent: CHROME_UA })).toBeTrue();
  });

  it('Safari → false（走下載）', () => {
    expect(supportsIframePrint({ userAgent: SAFARI_UA })).toBeFalse();
  });

  it('Firefox → false（走下載）', () => {
    expect(supportsIframePrint({ userAgent: FIREFOX_UA })).toBeFalse();
  });

  it('iOS Chrome（WebKit 核，CriOS）→ false（走下載）', () => {
    expect(supportsIframePrint({ userAgent: IOS_CHROME_UA })).toBeFalse();
  });
});
