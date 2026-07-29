export const AVATAR_COLOR_PALETTE: string[] = [
  'var(--color-avatar-1)',
  'var(--color-avatar-2)',
  'var(--color-avatar-3)',
  'var(--color-avatar-4)',
  'var(--color-avatar-5)',
  'var(--color-avatar-6)',
  'var(--color-avatar-7)',
  'var(--color-avatar-8)',
];

export const AVATAR_COLOR_FALLBACK = 'var(--color-avatar-fallback)';

function djb2Hash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash);
}

export function getAvatarColorByUserId(userId: string | null | undefined): string {
  if (!userId) return AVATAR_COLOR_FALLBACK;
  return AVATAR_COLOR_PALETTE[djb2Hash(userId) % AVATAR_COLOR_PALETTE.length];
}

export function getInitialFromName(name: string | null | undefined): string {
  if (!name) return '?';
  return name.charAt(0);
}
