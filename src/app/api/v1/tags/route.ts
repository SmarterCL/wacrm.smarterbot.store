// ============================================================
// GET  /api/v1/tags — list tags (scope: tags:read)
// POST /api/v1/tags — create a tag (scope: tags:write)
//
// Tags are account-scoped (via user_id → profile → account_id).
// We look up tags by the account's audit user.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, okList, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  parseListParams,
  keysetFilter,
  buildPage,
} from '@/lib/api/v1/pagination';
import { resolveAuditUserId, ContactError } from '@/lib/api/v1/contacts';

function serializeTag(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    created_at: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'tags:read');
    const { limit, cursor } = parseListParams(request);

    // Tags are owned per user, but shared within an account. We look
    // up by account_id on the associated profile for the audit user.
    // Simpler: resolve the account's member user_ids and filter by them.
    // For efficiency, we filter tags by account_id via profiles join.
    let query = ctx.supabase
      .from('tags')
      .select('*, profile:profiles!inner(account_id)')
      .eq('profile.account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    const kf = keysetFilter(cursor);
    if (kf) query = query.or(kf);

    const { data, error } = await query;
    if (error) {
      console.error('[api/v1/tags] list error:', error);
      return fail('internal', 'Failed to list tags', 500);
    }

    const { items, nextCursor } = buildPage(
      (data ?? []) as unknown as Array<{ created_at: string; id: string }>,
      limit
    );
    return okList(
      items.map((r) => serializeTag(r as Record<string, unknown>)),
      nextCursor
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'tags:write');

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return fail('bad_request', "'name' is required", 400);

    let auditUserId: string;
    try {
      auditUserId = await resolveAuditUserId(ctx.supabase, ctx.accountId);
    } catch (e) {
      if (e instanceof ContactError) return fail('internal', e.message, e.status);
      throw e;
    }

    const { data: tag, error } = await ctx.supabase
      .from('tags')
      .insert({
        user_id: auditUserId,
        name,
        color: typeof body.color === 'string' ? body.color : '#94a3b8',
      })
      .select()
      .single();

    if (error || !tag) {
      console.error('[api/v1/tags] insert error:', error);
      return fail('internal', 'Failed to create tag', 500);
    }

    return ok(serializeTag(tag as Record<string, unknown>), 201);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
