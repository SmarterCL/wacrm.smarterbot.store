// ============================================================
// PATCH  /api/v1/pipelines/{id}/stages/{stageId} — update a stage
// DELETE /api/v1/pipelines/{id}/stages/{stageId} — delete a stage
//
// Both require scope: pipelines:write and account ownership of the
// parent pipeline.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';

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

async function verifyPipelineOwnership(
  supabase: Awaited<ReturnType<typeof import('@/lib/auth/api-context').requireApiKey>>['supabase'],
  pipelineId: string,
  accountId: string,
  stageId: string
): Promise<{ pipeline: boolean; stage: boolean }> {
  const [{ data: pipeline }, { data: stage }] = await Promise.all([
    supabase
      .from('pipelines')
      .select('id')
      .eq('id', pipelineId)
      .eq('account_id', accountId)
      .maybeSingle(),
    supabase
      .from('pipeline_stages')
      .select('id')
      .eq('id', stageId)
      .eq('pipeline_id', pipelineId)
      .maybeSingle(),
  ]);
  return { pipeline: !!pipeline, stage: !!stage };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:write');
    const { id, stageId } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const { pipeline, stage } = await verifyPipelineOwnership(
      ctx.supabase, id, ctx.accountId, stageId
    );
    if (!pipeline) return fail('not_found', 'Pipeline not found', 404);
    if (!stage) return fail('not_found', 'Stage not found in this pipeline', 404);

    const updates: Record<string, unknown> = {};
    if ('name' in body) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return fail('bad_request', "'name' cannot be empty", 400);
      updates.name = name;
    }
    if ('color' in body && typeof body.color === 'string') updates.color = body.color;
    if ('position' in body && typeof body.position === 'number') {
      updates.position = Math.max(0, Math.floor(body.position));
    }

    if (Object.keys(updates).length === 0) {
      return fail('bad_request', 'No updatable fields provided (name, color, position)', 400);
    }

    const { data: updated, error } = await ctx.supabase
      .from('pipeline_stages')
      .update(updates)
      .eq('id', stageId)
      .eq('pipeline_id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('[api/v1/stages] update error:', error);
      return fail('internal', 'Failed to update stage', 500);
    }

    return ok(serializeStage(updated as Record<string, unknown>));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'pipelines:write');
    const { id, stageId } = await params;

    const { pipeline, stage } = await verifyPipelineOwnership(
      ctx.supabase, id, ctx.accountId, stageId
    );
    if (!pipeline) return fail('not_found', 'Pipeline not found', 404);
    if (!stage) return fail('not_found', 'Stage not found in this pipeline', 404);

    const { error } = await ctx.supabase
      .from('pipeline_stages')
      .delete()
      .eq('id', stageId)
      .eq('pipeline_id', id);

    if (error) {
      console.error('[api/v1/stages] delete error:', error);
      return fail('internal', 'Failed to delete stage', 500);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
