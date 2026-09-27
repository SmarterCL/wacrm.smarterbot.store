// ============================================================
// GET /api/v1/flows/{id}/runs — list flow runs (scope: flows:read)
//
// Returns the 50 most recent runs with embedded events.
// Account-scoped.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'flows:read');
    const { id } = await params;

    // Verify flow belongs to this account.
    const { data: flow } = await ctx.supabase
      .from('flows')
      .select('id, name')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!flow) return fail('not_found', 'Flow not found', 404);

    const { data: runs, error: runsErr } = await ctx.supabase
      .from('flow_runs')
      .select(
        'id, status, current_node_key, started_at, last_advanced_at, ended_at, end_reason, vars, reprompt_count, contact:contacts(id, name, phone)'
      )
      .eq('flow_id', id)
      .order('started_at', { ascending: false })
      .limit(50);

    if (runsErr) {
      console.error('[api/v1/flows/runs] list error:', runsErr);
      return fail('internal', 'Failed to list flow runs', 500);
    }

    const runIds = (runs ?? []).map((r) => (r as { id: string }).id);
    let events: unknown[] = [];
    if (runIds.length > 0) {
      const { data: evs } = await ctx.supabase
        .from('flow_run_events')
        .select('flow_run_id, event_type, node_key, payload, created_at')
        .in('flow_run_id', runIds)
        .order('created_at', { ascending: true });
      events = evs ?? [];
    }

    return ok({ flow, runs: runs ?? [], events });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
