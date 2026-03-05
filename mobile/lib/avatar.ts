import Constants from 'expo-constants';

const BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://capituneweb.vercel.app';

function guessMimeFromBase64(b64: string): string {
  if (b64.startsWith('iVBOR')) return 'image/png';
  if (b64.startsWith('/9j/')) return 'image/jpeg';
  if (b64.startsWith('R0lGOD')) return 'image/gif';
  if (b64.startsWith('UklGR')) return 'image/webp';
  return 'image/jpeg';
}

function isLikelyBareBase64(value: string): boolean {
  if (value.length < 120) return false;
  if (/\s/.test(value)) return false;
  // Only base64 charset (note: we allow '=' padding)
  if (!/^[A-Za-z0-9+/]+=*$/.test(value)) return false;
  return true;
}

function joinBaseUrl(path: string): string {
  const base = BASE_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

export function resolveAvatarUri(value: string | null | undefined): string | null {
  const raw = String(value ?? '').trim();
  if (!raw) return null;

  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^data:image\//i.test(raw)) return raw;

  // `avatar_key` sometimes comes back as bare base64.
  if (isLikelyBareBase64(raw)) {
    const mime = guessMimeFromBase64(raw);
    return `data:${mime};base64,${raw}`;
  }

  // Absolute path on the API host.
  if (raw.startsWith('/')) return joinBaseUrl(raw);

  // Relative path or key (e.g. "uploads/a.png", "avatars/123").
  // Avoid treating unknown schemes (e.g. "blob:") as relative.
  if (!/^[a-z][a-z0-9+.-]*:/i.test(raw) && (raw.includes('/') || raw.includes('.'))) {
    return joinBaseUrl(raw.replace(/^\.\/?/, ''));
  }

  return null;
}

export function getAvatarSource(avatarKey: string | null | undefined): { uri: string } | null {
  const uri = resolveAvatarUri(avatarKey);
  return uri ? { uri } : null;
}
