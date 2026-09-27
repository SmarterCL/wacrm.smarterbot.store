// ============================================================
// GET  /api/v1/pipelines — list pipelines (scope: pipelines:read)
// POST /api/v1/pipelines — create a pipeline (scope: pipelines:write)
//
// Each pipeline embeds its stages. Account-scoped.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, okList, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  parseListParams,
  keysetFilter,
  buildPage,
} from '@/lib/api/v1/pagination';
import { resolveAuditUserId, ContactError } from '@/lib/api/v1/contacts';

const PIPELINE_SELECT =
  '*, stages:pipeline_stages(id, name, position, color, created_at)';

function serializePipeline(row: Record<string, unknown>) {
  const stages = ((row.stages as unknown[]) ?? []) as Array<Record<string, unknown>>;
  return {
    id: row.id,
    name: row.name,
    created_at: row.created_at,
    stages: stages
      .sort((a, b) => (a.position as number) - (b.position as number))
      .map((s) => ({
        id: s.id,
        name: s.name,
        position: s.position,
        color: s.color,
        created_at: s.created_at,
      })),
  };
}

export async function GET(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:read');
    const { limit, cursor } = parseListParams(request);

    let query = ctx.supabase
      .from('pipelines')
      .select(PIPELINE_SELECT)
      .eq('account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    const kf = keysetFilter(cursor);
    if (kf) query = query.or(kf);

    const { data, error } = await query;
    if (error) {
      console.error('[api/v1/pipelines] list error:', error);
      return fail('internal', 'Failed to list pipelines', 500);
    }

    const { items, nextCursor } = buildPage(
      (data ?? []) as unknown as Array<{ created_at: string; id: string }>,
      limit
    );
    return okList(
      items.map((r) => serializePipeline(r as Record<string, unknown>)),
      nextCursor
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:write');

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

    const { data: pipeline, error } = await ctx.supabase
      .from('pipelines')
      .insert({ user_id: auditUserId, account_id: ctx.accountId, name })
      .select(PIPELINE_SELECT)
      .single();

    if (error || !pipeline) {
      console.error('[api/v1/pipelines] insert error:', error);
      return fail('internal', 'Failed to create pipeline', 500);
    }

    return ok(serializePipeline(pipeline as Record<string, unknown>), 201);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
