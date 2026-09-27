// ============================================================
// GET  /api/v1/pipelines/{id}/stages — list stages (scope: pipelines:read)
// POST /api/v1/pipelines/{id}/stages — create a stage (scope: pipelines:write)
//
// Stages are ordered by `position` ascending.
// Position is auto-assigned as max(existing)+1 when not provided.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, okList, fail, toApiErrorResponse } from '@/lib/api/v1/respond';

function serializeStage(row: Record<string, unknown>) {
  return {
    id: row.id,
    pipeline_id: row.pipeline_id,
    name: row.name,
    position: row.position,
    color: row.color,
    created_at: row.created_at,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:read');
    const { id } = await params;

    // Verify pipeline ownership.
    const { data: pipeline } = await ctx.supabase
      .from('pipelines')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!pipeline) return fail('not_found', 'Pipeline not found', 404);

    const { data, error } = await ctx.supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', id)
      .order('position', { ascending: true });

    if (error) {
      console.error('[api/v1/stages] list error:', error);
      return fail('internal', 'Failed to list stages', 500);
    }

    return okList(
      (data ?? []).map((r) => serializeStage(r as Record<string, unknown>)),
      null
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:write');
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return fail('bad_request', "'name' is required", 400);

    // Verify pipeline ownership.
    const { data: pipeline } = await ctx.supabase
      .from('pipelines')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!pipeline) return fail('not_found', 'Pipeline not found', 404);

    // Determine position: explicit or max+1.
    let position: number;
    if (typeof body.position === 'number') {
      position = Math.max(0, Math.floor(body.position));
    } else {
      const { data: maxRow } = await ctx.supabase
        .from('pipeline_stages')
        .select('position')
        .eq('pipeline_id', id)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();
      position = maxRow ? (maxRow.position as number) + 1 : 0;
    }

    const { data: stage, error } = await ctx.supabase
      .from('pipeline_stages')
      .insert({
        pipeline_id: id,
        name,
        position,
        color: typeof body.color === 'string' ? body.color : '#94a3b8',
      })
      .select()
      .single();

    if (error || !stage) {
      console.error('[api/v1/stages] insert error:', error);
      return fail('internal', 'Failed to create stage', 500);
    }

    return ok(serializeStage(stage as Record<string, unknown>), 201);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
