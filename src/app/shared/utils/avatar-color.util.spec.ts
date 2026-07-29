import { AVATAR_COLOR_FALLBACK, AVATAR_COLOR_PALETTE, getAvatarColorByUserId, getInitialFromName } from './avatar-color.util';

describe('getAvatarColorByUserId', () => {
  it('同一 userId 兩次呼叫得到相同顏色（決定性）', () => {
    const first = getAvatarColorByUserId('user-A');
    const second = getAvatarColorByUserId('user-A');
    expect(first).toBe(second);
  });

  it('10 個不同 userId 至少有 5 個唯一顏色（碰撞測試）', () => {
    const ids = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa'];
    const colors = ids.map(id => getAvatarColorByUserId(id));
    const unique = new Set(colors);
    expect(unique.size).toBeGreaterThanOrEqual(5);
  });

  it('空字串回傳 fallback', () => {
    expect(getAvatarColorByUserId('')).toBe(AVATAR_COLOR_FALLBACK);
  });

  it('null / undefined 回傳 fallback', () => {
    expect(getAvatarColorByUserId(null as unknown as string)).toBe(AVATAR_COLOR_FALLBACK);
    expect(getAvatarColorByUserId(undefined as unknown as string)).toBe(AVATAR_COLOR_FALLBACK);
  });

  it('回傳值一定在 AVATAR_COLOR_PALETTE 內', () => {
    const result = getAvatarColorByUserId('some-user-id-123');
    expect(AVATAR_COLOR_PALETTE).toContain(result);
  });
});

describe('getInitialFromName', () => {
  it('取姓名首字', () => {
    expect(getInitialFromName('張威珍')).toBe('張');
  });

  it('英文姓名取首字', () => {
    expect(getInitialFromName('Alice')).toBe('A');
  });

  it('空字串回傳 ?', () => {
    expect(getInitialFromName('')).toBe('?');
  });

  it('null / undefined 回傳 ?', () => {
    expect(getInitialFromName(null as unknown as string)).toBe('?');
    expect(getInitialFromName(undefined as unknown as string)).toBe('?');
  });
});
