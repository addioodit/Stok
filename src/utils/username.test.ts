import { hueFromString, validateUsername } from './username';

describe('validateUsername', () => {
  it('accepts a normal handle', () => {
    expect(validateUsername('guyana_investor')).toEqual({ ok: true });
    expect(validateUsername('Bob123')).toEqual({ ok: true });
  });

  it('rejects empty / too short', () => {
    expect(validateUsername('').ok).toBe(false);
    expect(validateUsername('ab').ok).toBe(false);
  });

  it('rejects too long (> 20)', () => {
    expect(validateUsername('a'.repeat(21)).ok).toBe(false);
    expect(validateUsername('a'.repeat(19) + 'b').ok).toBe(true);
  });

  it('rejects spaces and punctuation', () => {
    expect(validateUsername('has space').ok).toBe(false);
    expect(validateUsername('has-dash').ok).toBe(false);
    expect(validateUsername('dots.here').ok).toBe(false);
  });

  it('rejects all-numeric handles (needs a letter)', () => {
    expect(validateUsername('12345').ok).toBe(false);
    expect(validateUsername('1234a').ok).toBe(true);
  });

  it('trims surrounding whitespace before checking', () => {
    expect(validateUsername('  bobby  ').ok).toBe(true);
  });
});

describe('hueFromString', () => {
  it('is deterministic for the same input', () => {
    expect(hueFromString('stok')).toBe(hueFromString('stok'));
  });

  it('always returns a hue in [0, 360)', () => {
    for (const s of ['a', 'guyana', 'Z9_', '', 'a very long username here']) {
      const h = hueFromString(s);
      expect(h).toBeGreaterThanOrEqual(0);
      expect(h).toBeLessThan(360);
    }
  });

  it('generally differs between different strings', () => {
    expect(hueFromString('alice')).not.toBe(hueFromString('bob'));
  });
});
