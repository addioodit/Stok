export interface UsernameCheck {
  ok: boolean;
  error?: string;
}

export function validateUsername(raw: string): UsernameCheck {
  const u = raw.trim();
  if (u.length === 0) return { ok: false, error: 'Pick a username' };
  if (u.length < 3) return { ok: false, error: 'At least 3 characters' };
  if (u.length > 20) return { ok: false, error: 'At most 20 characters' };
  if (!/^[a-zA-Z0-9_]+$/.test(u)) {
    return { ok: false, error: 'Letters, numbers and underscore only' };
  }
  if (!/[a-zA-Z]/.test(u)) {
    return { ok: false, error: 'Must contain at least one letter' };
  }
  return { ok: true };
}

// Stable hue (0-359) derived from a string — used to colour avatars
// consistently without storing a colour.
export function hueFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h % 360;
}
