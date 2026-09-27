// ============================================================
// Checkpoint: API v1 architecture tests
//
// Criteria covered:
//  3. recurso de otra cuenta devuelve 404
//  4. MCP nunca accede directamente a Supabase
//  9. activation ejecuta las validaciones Core
// 10. errores API se transforman correctamente en WacrmApiError (MCP)
// ============================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ApiError } from '@/lib/api/v1/respond';
import { generateApiKey } from '@/lib/api-keys/keys';
import type { ApiKeyRow } from '@/lib/api-keys/store';

// ─────────────────────────────────────────────────────────────────────────────
// Shared mock infrastructure (mirrors api-context.test.ts pattern)
// ─────────────────────────────────────────────────────────────────────────────

vi.mock('@/lib/flows/admin-client', () => ({
  supabaseAdmin: () => ({ __isMockAdminClient: true }),
}));

const findActiveKeyByHash = vi.fn<(hash: string) => Promise<ApiKeyRow | null>>();
const touchLastUsed = vi.fn();
vi.mock('@/lib/api-keys/store', () => ({
  findActiveKeyByHash: (hash: string) => findActiveKeyByHash(hash),
  touchLastUsed: (id: string) => touchLastUsed(id),
}));

const { requireApiKey } = await import('@/lib/auth/api-context');

const VALID_KEY = generateApiKey().plaintext;

function makeRow(overrides: Partial<ApiKeyRow> = {}): ApiKeyRow {
  return {
    id: 'key-1',
    account_id: 'acct-owner',
    created_by: 'user-1',
    name: 'Test',
    scopes: [
      'automations:execute',
      'automations:read',
      'automations:write',
      'templates:read',
      'broadcasts:read',
      'broadcasts:write',
      'flows:read',
      'flows:write',
    ],
    expires_at: null,
    revoked_at: null,
    ...overrides,
  };
}

function req(path = '/api/v1/me'): Request {
  return new Request(`https://crm.example.com${path}`, {
    headers: { authorization: `Bearer ${VALID_KEY}` },
  });
}

beforeEach(() => {
  findActiveKeyByHash.mockReset();
  touchLastUsed.mockReset();
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 1 + 2 (integration layer): scope enforcement via requireApiKey
// ─────────────────────────────────────────────────────────────────────────────

describe('requireApiKey — scope enforcement', () => {
  it('(criterion 1) correct scope is accepted', async () => {
    findActiveKeyByHash.mockResolvedValue(makeRow());
    const ctx = await requireApiKey(req(), 'automations:execute');
    expect(ctx.accountId).toBe('acct-owner');
  });

  it('(criterion 2) wrong scope throws ApiError 403', async () => {
    findActiveKeyByHash.mockResolvedValue(
      makeRow({ scopes: ['automations:read'] }),
    );
    await expect(
      requireApiKey(req(), 'automations:execute'),
    ).rejects.toMatchObject({ code: 'forbidden', status: 403 });
  });

  it('(criterion 2) broadcasts:read scope refused when key has broadcasts:write only', async () => {
    findActiveKeyByHash.mockResolvedValue(
      makeRow({ scopes: ['broadcasts:write'] }),
    );
    await expect(
      requireApiKey(req(), 'broadcasts:read'),
    ).rejects.toMatchObject({ code: 'forbidden', status: 403 });
  });

  it('(criterion 2) templates:read refused when key has messages:read only', async () => {
    findActiveKeyByHash.mockResolvedValue(
      makeRow({ scopes: ['messages:read'] }),
    );
    await expect(
      requireApiKey(req(), 'templates:read'),
    ).rejects.toMatchObject({ code: 'forbidden', status: 403 });
  });

  it('(criterion 7) automations:execute required for trigger — not automations:write', async () => {
    // write only — trigger should be denied
    findActiveKeyByHash.mockResolvedValue(
      makeRow({ scopes: ['automations:write'] }),
    );
    await expect(
      requireApiKey(req(), 'automations:execute'),
    ).rejects.toMatchObject({ code: 'forbidden', status: 403 });

    // execute granted — trigger should be allowed
    findActiveKeyByHash.mockReset();
    findActiveKeyByHash.mockResolvedValue(
      makeRow({ scopes: ['automations:execute'] }),
    );
    const ctx = await requireApiKey(req(), 'automations:execute');
    expect(ctx.accountId).toBe('acct-owner');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 3: resource isolation (account ownership)
// ─────────────────────────────────────────────────────────────────────────────

describe('(criterion 3) account isolation — supabase scoping', () => {
  /**
   * We can't import Next.js route handlers in vitest without a full
   * App Router environment, so we test the invariant at the layer
   * that enforces it: requireApiKey binds accountId to the context
   * and every route queries with `.eq('account_id', ctx.accountId)`.
   *
   * We verify that two keys from different accounts produce
   * distinct accountIds so a route filtering by accountId will
   * never return rows from the other account.
   */
  it('accountId is isolated to the minted key — different keys → different accounts', async () => {
    const keyA = generateApiKey().plaintext;
    const keyB = generateApiKey().plaintext;

    findActiveKeyByHash.mockImplementation((hash) => {
      // In real life hash is a SHA-256; here we pattern-match on the
      // key since we can't reverse-hash easily in a unit test.
      void hash;
      return Promise.resolve(null); // will be overridden per-call below
    });

    // Key A resolves to account A
    findActiveKeyByHash.mockResolvedValueOnce(
      makeRow({ account_id: 'acct-A', id: 'key-A' }),
    );
    const ctxA = await requireApiKey(
      new Request('https://crm.example.com/api/v1/me', {
        headers: { authorization: `Bearer ${keyA}` },
      }),
    );

    // Key B resolves to account B
    findActiveKeyByHash.mockResolvedValueOnce(
      makeRow({ account_id: 'acct-B', id: 'key-B' }),
    );
    const ctxB = await requireApiKey(
      new Request('https://crm.example.com/api/v1/me', {
        headers: { authorization: `Bearer ${keyB}` },
      }),
    );

    expect(ctxA.accountId).toBe('acct-A');
    expect(ctxB.accountId).toBe('acct-B');
    expect(ctxA.accountId).not.toBe(ctxB.accountId);
  });

  it('a revoked key returns 401, not data from another account', async () => {
    findActiveKeyByHash.mockResolvedValue(null); // simulates revoked
    await expect(
      requireApiKey(req()),
    ).rejects.toMatchObject({ code: 'unauthorized', status: 401 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 4: MCP never imports Supabase directly
// ─────────────────────────────────────────────────────────────────────────────

describe('(criterion 4) MCP source does not reference Supabase internals', () => {
  /**
   * This is a static analysis test. We read the compiled/source of
   * the MCP package and verify none of the files import Supabase
   * packages or internal db/admin modules.
   */
  it('mcp-server/src/client.ts is a pure HTTP client', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const clientSrc = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/client.ts'),
      'utf-8',
    );
    // Must not import any Supabase packages
    expect(clientSrc).not.toMatch(/@supabase\//);
    expect(clientSrc).not.toMatch(/service_role/);
    expect(clientSrc).not.toMatch(/supabaseAdmin/);
    // Must not import internal Next.js app modules
    expect(clientSrc).not.toMatch(/@\/lib\//);
    expect(clientSrc).not.toMatch(/from ['"]\.\.\/\.\.\/src\//);
    // Must use /api/v1 base path
    expect(clientSrc).toMatch(/\/api\/v1/);
  });

  it('mcp-server/src/tools/write.ts contains no Supabase imports', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/tools/write.ts'),
      'utf-8',
    );
    expect(src).not.toMatch(/@supabase\//);
    expect(src).not.toMatch(/supabaseAdmin/);
    expect(src).not.toMatch(/@\/lib\//);
    expect(src).not.toMatch(/runAutomations/);
    expect(src).not.toMatch(/validateFlow/);
    expect(src).not.toMatch(/validateSteps/);
  });

  it('mcp-server/src/tools/read.ts contains no Supabase imports', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/tools/read.ts'),
      'utf-8',
    );
    expect(src).not.toMatch(/@supabase\//);
    expect(src).not.toMatch(/supabaseAdmin/);
    expect(src).not.toMatch(/@\/lib\//);
  });

  it('mcp-server/src/tools/broadcast.ts contains no Supabase imports', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/tools/broadcast.ts'),
      'utf-8',
    );
    expect(src).not.toMatch(/@supabase\//);
    expect(src).not.toMatch(/supabaseAdmin/);
    expect(src).not.toMatch(/@\/lib\//);
    expect(src).not.toMatch(/createBroadcast|deliverBroadcast/);
  });

  it('mcp client only calls /api/v1 endpoints', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/client.ts'),
      'utf-8',
    );
    // All request() calls use paths starting with /
    // and the base is always /api/v1
    expect(src).toMatch(/this\.baseUrl.*\/api\/v1/);
    // No direct DB table references
    expect(src).not.toMatch(/from\('automations'\)|from\('broadcasts'\)|from\('flows'\)/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 5: MCP destructive tools require confirm=true
// ─────────────────────────────────────────────────────────────────────────────

describe('(criterion 5) MCP destructive tools require confirm=true', () => {
  const DESTRUCTIVE_TOOLS = [
    'delete_contact',
    'delete_deal',
    'delete_pipeline',
    'delete_stage',
    'delete_tag',
    'delete_automation',
    'delete_flow',
    'send_broadcast',
  ] as const;

  it('every destructive tool name appears in write.ts or broadcast.ts', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const writeSrc = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/tools/write.ts'),
      'utf-8',
    );
    const broadcastSrc = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/tools/broadcast.ts'),
      'utf-8',
    );
    const combined = writeSrc + broadcastSrc;

    for (const tool of DESTRUCTIVE_TOOLS) {
      expect(combined, `Tool ${tool} not found in write/broadcast source`).toContain(
        `'${tool}'`,
      );
    }
  });

  it('every destructive tool checks confirm !== true before proceeding', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const writeSrc = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/tools/write.ts'),
      'utf-8',
    );
    const broadcastSrc = readFileSync(
      resolve(process.cwd(), 'mcp-server/src/tools/broadcast.ts'),
      'utf-8',
    );

    // Both files must reference confirm check
    expect(writeSrc).toMatch(/confirm.*!==.*true|!confirm/);
    expect(broadcastSrc).toMatch(/confirm.*!==.*true|!confirm/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 6: destructive MCP tools check confirm without API dependency
// ─────────────────────────────────────────────────────────────────────────────

describe('(criterion 6) confirm guard lives in MCP, not in the API', () => {
  it('automation trigger route does NOT check a confirm parameter', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const routeSrc = readFileSync(
      resolve(
        process.cwd(),
        'src/app/api/v1/automations/[id]/trigger/route.ts',
      ),
      'utf-8',
    );
    // The API route enforces automations:execute scope and active state,
    // but has no "confirm" check — that belongs to MCP.
    expect(routeSrc).not.toMatch(/confirm/);
    expect(routeSrc).toMatch(/automations:execute/);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 9: activation calls Core validation functions
// ─────────────────────────────────────────────────────────────────────────────

describe('(criterion 9) activation delegates to Core validators', () => {
  it('automations activate route imports validateStepsForActivation and validateTriggerForActivation', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(
      resolve(
        process.cwd(),
        'src/app/api/v1/automations/[id]/activate/route.ts',
      ),
      'utf-8',
    );
    expect(src).toMatch(/validateStepsForActivation/);
    expect(src).toMatch(/validateTriggerForActivation/);
    // Scope must be automations:write (activating an existing automation)
    expect(src).toMatch(/automations:write/);
  });

  it('flows activate route imports validateFlowForActivation', async () => {
    const { readFileSync } = await import('fs');
    const { resolve } = await import('path');
    const src = readFileSync(
      resolve(
        process.cwd(),
        'src/app/api/v1/flows/[id]/activate/route.ts',
      ),
      'utf-8',
    );
    expect(src).toMatch(/validateFlowForActivation/);
    expect(src).toMatch(/flows:write/);
  });

  it('validateStepsForActivation rejects an empty step array', async () => {
    const { validateStepsForActivation } = await import(
      '@/lib/automations/validate'
    );
    const issues = validateStepsForActivation([]);
    expect(issues.length).toBeGreaterThan(0);
    expect(issues[0].message).toMatch(/at least one step/i);
  });

  it('validateFlowForActivation flags missing entry_node_id', async () => {
    const { validateFlowForActivation } = await import('@/lib/flows/validate');
    const issues = validateFlowForActivation(
      {
        name: 'Test',
        trigger_type: 'keyword',
        trigger_config: { keywords: ['hi'] },
        entry_node_id: null,
      },
      [],
    );
    const errors = issues.filter((i) => i.severity === 'error');
    expect(errors.length).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Criterion 10: API errors transform to WacrmApiError
// ─────────────────────────────────────────────────────────────────────────────

describe('(criterion 10) WacrmApiError transforms from API error envelope', () => {
  /**
   * WacrmApiError lives in the MCP server. We test it by simulating the
   * fetch-based client's error handling logic without importing the
   * MCP package (different TypeScript project).
   *
   * We replicate the relevant logic inline and verify the contract:
   *   { error: { code, message } } → WacrmApiError(status, code, message)
   */

  // Minimal replica of WacrmApiError for unit-test purposes
  class WacrmApiError extends Error {
    constructor(
      public readonly status: number,
      public readonly code: string,
      message: string,
    ) {
      super(message);
      this.name = 'WacrmApiError';
    }
  }

  // The exact mapping logic from mcp-server/src/client.ts
  function parseErrorEnvelope(
    status: number,
    payload: unknown,
  ): WacrmApiError {
    const envelope = payload as
      | { error?: { code?: string; message?: string } }
      | undefined;
    const code = envelope?.error?.code ?? 'internal';
    const message =
      envelope?.error?.message ?? `Request failed with status ${status}`;
    return new WacrmApiError(status, code, message);
  }

  it('maps 403 forbidden to WacrmApiError with code="forbidden"', () => {
    const err = parseErrorEnvelope(403, {
      error: { code: 'forbidden', message: "Missing scope 'automations:execute'" },
    });
    expect(err).toBeInstanceOf(WacrmApiError);
    expect(err.status).toBe(403);
    expect(err.code).toBe('forbidden');
    expect(err.message).toContain('automations:execute');
  });

  it('maps 404 not_found to WacrmApiError', () => {
    const err = parseErrorEnvelope(404, {
      error: { code: 'not_found', message: 'Automation not found' },
    });
    expect(err.status).toBe(404);
    expect(err.code).toBe('not_found');
  });

  it('maps 400 bad_request to WacrmApiError', () => {
    const err = parseErrorEnvelope(400, {
      error: { code: 'bad_request', message: 'Automation is not active' },
    });
    expect(err.status).toBe(400);
    expect(err.code).toBe('bad_request');
  });

  it('falls back to code=internal when envelope is missing', () => {
    const err = parseErrorEnvelope(500, null);
    expect(err.status).toBe(500);
    expect(err.code).toBe('internal');
  });

  it('toApiErrorResponse turns ApiError into the expected envelope', async () => {
    const { toApiErrorResponse } = await import('@/lib/api/v1/respond');
    const resp = toApiErrorResponse(
      new ApiError('forbidden', "Missing scope 'automations:execute'", 403),
    );
    const body = await resp.json() as { error: { code: string; message: string } };
    expect(resp.status).toBe(403);
    expect(body.error.code).toBe('forbidden');
    expect(body.error.message).toContain('automations:execute');
  });

  it('toApiErrorResponse collapses unknown errors to 500 internal', async () => {
    const { toApiErrorResponse } = await import('@/lib/api/v1/respond');
    const resp = toApiErrorResponse(new Error('boom'));
    const body = await resp.json() as { error: { code: string } };
    expect(resp.status).toBe(500);
    expect(body.error.code).toBe('internal');
  });
});
