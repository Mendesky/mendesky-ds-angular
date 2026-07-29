import { copyText } from './clipboard.util';

describe('copyText', () => {
  // ── navigator.clipboard present → async path ──────────────────────────────
  it('uses navigator.clipboard.writeText when available and returns true', async () => {
    const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.resolve());
    const clipboardStub = { writeText: writeTextSpy } as unknown as Clipboard;
    spyOnProperty(navigator, 'clipboard', 'get').and.returnValue(clipboardStub);

    const result = await copyText('hello');

    expect(result).toBeTrue();
    expect(writeTextSpy).toHaveBeenCalledWith('hello');
  });

  // ── navigator.clipboard absent → execCommand fallback ─────────────────────
  it('falls back to execCommand when clipboard is undefined and returns true when execCommand succeeds', async () => {
    // stub clipboard getter to return undefined (non-Secure Context)
    spyOnProperty(navigator, 'clipboard', 'get').and.returnValue(undefined as any);

    const execSpy = spyOn(document, 'execCommand').and.returnValue(true);

    const result = await copyText('world');

    expect(result).toBeTrue();
    expect(execSpy).toHaveBeenCalledWith('copy');
  });

  // ── navigator.clipboard absent → execCommand returns false ────────────────
  it('returns false when clipboard is undefined and execCommand fails', async () => {
    spyOnProperty(navigator, 'clipboard', 'get').and.returnValue(undefined as any);
    spyOn(document, 'execCommand').and.returnValue(false);

    const result = await copyText('fail-case');

    expect(result).toBeFalse();
  });

  // ── navigator.clipboard.writeText rejects → returns false ─────────────────
  it('returns false when clipboard.writeText rejects', async () => {
    const writeTextSpy = jasmine.createSpy('writeText').and.returnValue(Promise.reject(new Error('denied')));
    const clipboardStub = { writeText: writeTextSpy } as unknown as Clipboard;
    spyOnProperty(navigator, 'clipboard', 'get').and.returnValue(clipboardStub);

    const result = await copyText('rejected');

    expect(result).toBeFalse();
  });
});
