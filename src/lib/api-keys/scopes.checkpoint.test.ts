// ============================================================
// Checkpoint: scope coherence tests
//
// Criteria covered:
//  1. scope correcto permite acceso
//  2. scope incorrecto devuelve 403
//  7. automations trigger requiere automations:execute
//  8. templates requiere templates:read
// ============================================================

import { describe, it, expect } from 'vitest';
import {
  API_SCOPES,
  SCOPE_DESCRIPTIONS,
  hasScope,
  isApiScope,
  normalizeScopes,
  type ApiScope,
} from './scopes';

// ── Completeness ────────────────────────────────────────────

describe('API_SCOPES completeness', () => {
  it('contains automations:execute', () => {
    expect(API_SCOPES).toContain('automations:execute');
  });

  it('contains templates:read', () => {
    expect(API_SCOPES).toContain('templates:read');
  });

  it('contains broadcasts:read', () => {
    expect(API_SCOPES).toContain('broadcasts:read');
  });

  it('contains broadcasts:write', () => {
    expect(API_SCOPES).toContain('broadcasts:write');
  });

  it('does NOT contain deprecated broadcasts:send', () => {
    expect(API_SCOPES).not.toContain('broadcasts:send');
  });

  it('has a SCOPE_DESCRIPTIONS entry for every scope', () => {
    for (const s of API_SCOPES) {
      expect(
        SCOPE_DESCRIPTIONS[s as ApiScope],
        `Missing description for scope: ${s}`,
      ).toBeTruthy();
    }
  });
});

// ── hasScope — criterion 1 and 2 ───────────────────────────

describe('hasScope — access control', () => {
  it('(criterion 1) correct scope grants access', () => {
    const granted: ApiScope[] = ['automations:execute', 'automations:read'];
    expect(hasScope(granted, 'automations:execute')).toBe(true);
    expect(hasScope(granted, 'automations:read')).toBe(true);
  });

  it('(criterion 2) wrong scope denies access (returns false → 403)', () => {
    const granted: ApiScope[] = ['automations:read'];
    expect(hasScope(granted, 'automations:execute')).toBe(false);
    expect(hasScope(granted, 'automations:write')).toBe(false);
    expect(hasScope(granted, 'templates:read')).toBe(false);
  });

  it('automations:write does NOT implicitly grant automations:execute', () => {
    const granted: ApiScope[] = ['automations:write'];
    expect(hasScope(granted, 'automations:execute')).toBe(false);
  });

  it('(criterion 7) automations trigger requires automations:execute, not write', () => {
    // A key with only write must NOT be treated as having execute.
    const writeOnly: ApiScope[] = ['automations:write'];
    expect(hasScope(writeOnly, 'automations:execute')).toBe(false);

    // A key with execute is allowed.
    const withExecute: ApiScope[] = ['automations:execute'];
    expect(hasScope(withExecute, 'automations:execute')).toBe(true);
  });

  it('(criterion 8) templates endpoints require templates:read, not messages:read', () => {
    const msgRead: ApiScope[] = ['messages:read'];
    expect(hasScope(msgRead, 'templates:read')).toBe(false);

    const tmplRead: ApiScope[] = ['templates:read'];
    expect(hasScope(tmplRead, 'templates:read')).toBe(true);
  });

  it('broadcasts GET requires broadcasts:read, not broadcasts:write', () => {
    const writeOnly: ApiScope[] = ['broadcasts:write'];
    expect(hasScope(writeOnly, 'broadcasts:read')).toBe(false);

    const readOnly: ApiScope[] = ['broadcasts:read'];
    expect(hasScope(readOnly, 'broadcasts:read')).toBe(true);
  });

  it('broadcasts POST requires broadcasts:write, not broadcasts:read', () => {
    const readOnly: ApiScope[] = ['broadcasts:read'];
    expect(hasScope(readOnly, 'broadcasts:write')).toBe(false);

    const writeOnly: ApiScope[] = ['broadcasts:write'];
    expect(hasScope(writeOnly, 'broadcasts:write')).toBe(true);
  });
});

// ── normalizeScopes ─────────────────────────────────────────

describe('normalizeScopes with new scopes', () => {
  it('accepts all new scopes individually', () => {
    const newScopes: string[] = [
      'automations:execute',
      'templates:read',
      'broadcasts:read',
      'broadcasts:write',
    ];
    for (const s of newScopes) {
      expect(normalizeScopes([s]), `normalizeScopes should accept ${s}`).toEqual(
        [s],
      );
    }
  });

  it('rejects the removed broadcasts:send scope', () => {
    expect(normalizeScopes(['broadcasts:send'])).toBeNull();
  });

  it('accepts a mixed list of old and new scopes', () => {
    expect(
      normalizeScopes([
        'automations:read',
        'automations:write',
        'automations:execute',
        'templates:read',
        'broadcasts:read',
        'broadcasts:write',
      ]),
    ).toEqual([
      'automations:read',
      'automations:write',
      'automations:execute',
      'templates:read',
      'broadcasts:read',
      'broadcasts:write',
    ]);
  });
});

// ── isApiScope ──────────────────────────────────────────────

describe('isApiScope', () => {
  it('accepts every declared scope', () => {
    for (const s of API_SCOPES) expect(isApiScope(s)).toBe(true);
  });

  it('rejects broadcasts:send (removed)', () => {
    expect(isApiScope('broadcasts:send')).toBe(false);
  });
});
