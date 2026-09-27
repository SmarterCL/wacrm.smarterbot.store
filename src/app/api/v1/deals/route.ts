// ============================================================
// GET  /api/v1/deals — list deals (scope: deals:read)
// POST /api/v1/deals — create a deal (scope: deals:write)
//
// List is keyset-paginated, newest first.
// Filters: ?pipeline_id=, ?stage_id=, ?status= (open/won/lost)
// Each deal embeds its contact (when present) and stage.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, okList, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  parseListParams,
  keysetFilter,
  buildPage,
} from '@/lib/api/v1/pagination';
import { resolveAuditUserId, ContactError } from '@/lib/api/v1/contacts';

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

export async function GET(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'deals:read');
    const { limit, cursor } = parseListParams(request);
    const url = new URL(request.url);
    const pipelineId = url.searchParams.get('pipeline_id');
    const stageId = url.searchParams.get('stage_id');
    const status = url.searchParams.get('status');

    if (status && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return fail('bad_request', `'status' must be one of: ${VALID_STATUSES.join(', ')}`, 400);
    }

    // Deals are owned by user_id in the DB, but account-scoped via
    // pipelines. We join pipelines to enforce account ownership.
    let query = ctx.supabase
      .from('deals')
      .select(`${DEAL_SELECT}, pipeline:pipelines!inner(account_id)`)
      .eq('pipeline.account_id', ctx.accountId);

    if (pipelineId) query = query.eq('pipeline_id', pipelineId);
    if (stageId) query = query.eq('stage_id', stageId);
    if (status) query = query.eq('status', status);

    query = query
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    const kf = keysetFilter(cursor);
    if (kf) query = query.or(kf);

    const { data, error } = await query;
    if (error) {
      console.error('[api/v1/deals] list error:', error);
      return fail('internal', 'Failed to list deals', 500);
    }

    const { items, nextCursor } = buildPage(
      (data ?? []) as unknown as Array<{ created_at: string; id: string }>,
      limit
    );
    return okList(
      items.map((r) => serializeDeal(r as Record<string, unknown>)),
      nextCursor
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'deals:write');

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const title = typeof body.title === 'string' ? body.title.trim() : '';
    if (!title) return fail('bad_request', "'title' is required", 400);

    const pipelineId = typeof body.pipeline_id === 'string' ? body.pipeline_id : null;
    if (!pipelineId) return fail('bad_request', "'pipeline_id' is required", 400);

    const stageId = typeof body.stage_id === 'string' ? body.stage_id : null;
    if (!stageId) return fail('bad_request', "'stage_id' is required", 400);

    // Verify pipeline belongs to this account.
    const { data: pipeline } = await ctx.supabase
      .from('pipelines')
      .select('id')
      .eq('id', pipelineId)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!pipeline) return fail('not_found', 'Pipeline not found', 404);

    // Verify stage belongs to the pipeline.
    const { data: stage } = await ctx.supabase
      .from('pipeline_stages')
      .select('id')
      .eq('id', stageId)
      .eq('pipeline_id', pipelineId)
      .maybeSingle();
    if (!stage) return fail('not_found', 'Stage not found in this pipeline', 404);

    let auditUserId: string;
    try {
      auditUserId = await resolveAuditUserId(ctx.supabase, ctx.accountId);
    } catch (e) {
      if (e instanceof ContactError) {
        return fail('internal', e.message, e.status);
      }
      throw e;
    }

    const { data: deal, error } = await ctx.supabase
      .from('deals')
      .insert({
        user_id: auditUserId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        contact_id: typeof body.contact_id === 'string' ? body.contact_id : null,
        conversation_id: typeof body.conversation_id === 'string' ? body.conversation_id : null,
        assigned_to: typeof body.assigned_to === 'string' ? body.assigned_to : null,
        title,
        value: typeof body.value === 'number' ? body.value : 0,
        currency: typeof body.currency === 'string' ? body.currency : 'USD',
        notes: typeof body.notes === 'string' ? body.notes : null,
        expected_close_date:
          typeof body.expected_close_date === 'string' ? body.expected_close_date : null,
        status:
          typeof body.status === 'string' &&
          VALID_STATUSES.includes(body.status as (typeof VALID_STATUSES)[number])
            ? body.status
            : 'open',
      })
      .select(DEAL_SELECT)
      .single();

    if (error || !deal) {
      console.error('[api/v1/deals] insert error:', error);
      return fail('internal', 'Failed to create deal', 500);
    }

    return ok(serializeDeal(deal as Record<string, unknown>), 201);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
