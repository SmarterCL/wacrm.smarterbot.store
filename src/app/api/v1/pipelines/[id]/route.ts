// ============================================================
// GET    /api/v1/pipelines/{id} — read a pipeline (scope: pipelines:read)
// PATCH  /api/v1/pipelines/{id} — update pipeline name (scope: pipelines:write)
// DELETE /api/v1/pipelines/{id} — delete a pipeline (scope: pipelines:write)
//
// Account-scoped. Deleting a pipeline cascades to stages; deals
// referencing it are preserved but lose their stage reference.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:read');
    const { id } = await params;

    const { data, error } = await ctx.supabase
      .from('pipelines')
      .select(PIPELINE_SELECT)
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();

    if (error) {
      console.error('[api/v1/pipelines] read error:', error);
      return fail('internal', 'Failed to read pipeline', 500);
    }
    if (!data) return fail('not_found', 'Pipeline not found', 404);
    return ok(serializePipeline(data as Record<string, unknown>));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function PATCH(
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

    const { data: existing } = await ctx.supabase
      .from('pipelines')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Pipeline not found', 404);

    if ('name' in body) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return fail('bad_request', "'name' cannot be empty", 400);

      const { error } = await ctx.supabase
        .from('pipelines')
        .update({ name })
        .eq('id', id);
      if (error) {
        console.error('[api/v1/pipelines] update error:', error);
        return fail('internal', 'Failed to update pipeline', 500);
      }
    }

    const { data } = await ctx.supabase
      .from('pipelines')
      .select(PIPELINE_SELECT)
      .eq('id', id)
      .maybeSingle();

    return ok(serializePipeline(data as Record<string, unknown>));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:write');
    const { id } = await params;

    const { data: existing } = await ctx.supabase
      .from('pipelines')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Pipeline not found', 404);

    const { error } = await ctx.supabase
      .from('pipelines')
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[api/v1/pipelines] delete error:', error);
      return fail('internal', 'Failed to delete pipeline', 500);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
