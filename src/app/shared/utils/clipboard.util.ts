/**
 * Unified clipboard copy utility.
 *
 * Capability-first routing:
 *   - navigator.clipboard.writeText present (Secure Context) → async Web API
 *   - absent (non-Secure Context: plain http LAN) → sync document.execCommand fallback
 *
 * Returns true on success, false on failure or unsupported environment.
 * The caller decides what UI feedback to show.
 */
export async function copyText(text: string): Promise<boolean> {
  if (typeof document === 'undefined' || typeof navigator === 'undefined') {
    return false;
  }

  // Capability-first: only use the async path when the API is actually present.
  // Do NOT fall through from async-catch → sync execCommand: by the time the
  // async reject resolves, the transient user-activation token may have expired,
  // making execCommand('copy') fail as well.
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  // Non-Secure Context fallback: synchronous execCommand
  return execCommandCopy(text);
}

/**
 * Synchronous clipboard fallback using document.execCommand('copy').
 * Manages the textarea lifecycle fully; the caller never touches the DOM.
 */
function execCommandCopy(text: string): boolean {
  const previousActiveElement = document.activeElement as HTMLElement | null;
  const previousSelection = window.getSelection();
  const previousRange = previousSelection && previousSelection.rangeCount > 0
    ? previousSelection.getRangeAt(0)
    : null;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.readOnly = true;  // avoid iOS virtual keyboard popup
  textarea.style.cssText = 'position:fixed;opacity:0;pointer-events:none;top:0;left:0;';

  document.body.appendChild(textarea);

  let ok = false;
  try {
    textarea.select();
    textarea.setSelectionRange(0, text.length);  // iOS Safari compatibility
    ok = document.execCommand('copy');
  } finally {
    textarea.remove();
    // Restore previous focus
    if (previousActiveElement) {
      previousActiveElement.focus();
    }
    // Restore previous selection if any
    if (previousSelection && previousRange) {
      previousSelection.removeAllRanges();
      previousSelection.addRange(previousRange);
    }
  }

  return ok;
}
