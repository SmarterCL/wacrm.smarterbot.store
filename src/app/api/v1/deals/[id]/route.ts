// ============================================================
// GET    /api/v1/deals/{id} — read a deal (scope: deals:read)
// PATCH  /api/v1/deals/{id} — update a deal (scope: deals:write)
// DELETE /api/v1/deals/{id} — delete a deal (scope: deals:write)
//
// Account-scoped via pipeline ownership. A deal from another account
// returns 404.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';

const DEAL_SELECT =
  '*, contact:contacts(id, phone, name, email, company), stage:pipeline_stages(id, name, color, position)';

const VALID_STATUSES = ['open', 'won', 'lost'] as const;

function serializeDeal(row: Record<string, unknown>) {
  return {
    id: row.id,
    pipeline_id: row.pipeline_id,
    stage_id: row.stage_id,
    contact_id: row.contact_id ?? null,
    conversation_id: row.conversation_id ?? null,
    assigned_to: row.assigned_to ?? null,
    title: row.title,
    value: row.value,
    currency: row.currency ?? 'USD',
    notes: row.notes ?? null,
    expected_close_date: row.expected_close_date ?? null,
    status: row.status ?? 'open',
    contact: row.contact ?? null,
    stage: row.stage ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at ?? null,
  };
}

async function getDealByIdForAccount(
  supabase: Awaited<ReturnType<typeof import('@/lib/auth/api-context').requireApiKey>>['supabase'],
  accountId: string,
  dealId: string
) {
  const { data, error } = await supabase
    .from('deals')
    .select(`${DEAL_SELECT}, pipeline:pipelines!inner(account_id)`)
    .eq('id', dealId)
    .eq('pipeline.account_id', accountId)
    .maybeSingle();
  if (error) return null;
  return data;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'deals:read');
    const { id } = await params;

    const deal = await getDealByIdForAccount(ctx.supabase, ctx.accountId, id);
    if (!deal) return fail('not_found', 'Deal not found', 404);
    return ok(serializeDeal(deal as Record<string, unknown>));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'deals:write');
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const existing = await getDealByIdForAccount(ctx.supabase, ctx.accountId, id);
    if (!existing) return fail('not_found', 'Deal not found', 404);

    const updates: Record<string, unknown> = {};

    for (const field of ['title', 'notes', 'currency', 'assigned_to', 'expected_close_date', 'contact_id', 'conversation_id'] as const) {
      if (!(field in body)) continue;
      updates[field] = body[field] === '' ? null : body[field];
    }

    if ('value' in body) {
      if (typeof body.value !== 'number') {
        return fail('bad_request', "'value' must be a number", 400);
      }
      updates.value = body.value;
    }

    if ('status' in body) {
      if (!VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])) {
        return fail('bad_request', `'status' must be one of: ${VALID_STATUSES.join(', ')}`, 400);
      }
      updates.status = body.status;
    }

    if ('stage_id' in body) {
      if (typeof body.stage_id !== 'string') {
        return fail('bad_request', "'stage_id' must be a string", 400);
      }
      // Verify new stage belongs to the deal's pipeline.
      const pipelineId = (existing as Record<string, unknown>).pipeline_id as string;
      const { data: stage } = await ctx.supabase
        .from('pipeline_stages')
        .select('id')
        .eq('id', body.stage_id)
        .eq('pipeline_id', pipelineId)
        .maybeSingle();
      if (!stage) return fail('not_found', 'Stage not found in this pipeline', 404);
      updates.stage_id = body.stage_id;
    }

    if ('pipeline_id' in body) {
      if (typeof body.pipeline_id !== 'string') {
        return fail('bad_request', "'pipeline_id' must be a string", 400);
      }
      const { data: pipeline } = await ctx.supabase
        .from('pipelines')
        .select('id')
        .eq('id', body.pipeline_id)
        .eq('account_id', ctx.accountId)
        .maybeSingle();
      if (!pipeline) return fail('not_found', 'Pipeline not found', 404);
      updates.pipeline_id = body.pipeline_id;
    }

    if (Object.keys(updates).length === 0) {
      return fail('bad_request', 'No updatable fields provided', 400);
    }
    updates.updated_at = new Date().toISOString();

    const { error } = await ctx.supabase
      .from('deals')
      .update(updates)
      .eq('id', id);
    if (error) {
      console.error('[api/v1/deals] update error:', error);
      return fail('internal', 'Failed to update deal', 500);
    }

    const updated = await getDealByIdForAccount(ctx.supabase, ctx.accountId, id);
    return ok(serializeDeal(updated as Record<string, unknown>));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'deals:write');
    const { id } = await params;

    const existing = await getDealByIdForAccount(ctx.supabase, ctx.accountId, id);
    if (!existing) return fail('not_found', 'Deal not found', 404);

    const { error } = await ctx.supabase.from('deals').delete().eq('id', id);
    if (error) {
      console.error('[api/v1/deals] delete error:', error);
      return fail('internal', 'Failed to delete deal', 500);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
