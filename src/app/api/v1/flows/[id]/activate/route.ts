// ============================================================
// POST /api/v1/flows/{id}/activate — activate or deactivate a flow
// (scope: flows:write)
//
// Body: { "status": "draft" | "active" | "archived" }
//
// Activating runs validateFlowForActivation and returns 422 on errors.
// Deactivating (draft/archived) is unconditional.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { supabaseAdmin } from '@/lib/flows/admin-client';
import { validateFlowForActivation } from '@/lib/flows/validate';

const VALID_STATUSES = ['draft', 'active', 'archived'] as const;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'flows:write');
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const status = body?.status as string | undefined;
    if (!status || !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return fail(
        'bad_request',
        `"status" must be one of: ${VALID_STATUSES.join(', ')}`,
        400
      );
    }

    // Verify ownership.
    const { data: existing } = await ctx.supabase
      .from('flows')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Flow not found', 404);

    const admin = supabaseAdmin();

    if (status === 'active') {
      const [{ data: flow }, { data: nodes }] = await Promise.all([
        admin
          .from('flows')
          .select('name, trigger_type, trigger_config, entry_node_id')
          .eq('id', id)
          .maybeSingle(),
        admin.from('flow_nodes').select('node_key, node_type, config').eq('flow_id', id),
      ]);
      if (!flow) return fail('not_found', 'Flow not found', 404);

      const issues = validateFlowForActivation(
        flow as Parameters<typeof validateFlowForActivation>[0],
        (nodes ?? []) as Parameters<typeof validateFlowForActivation>[1]
      );
      const blockers = issues.filter((i) => (i as { severity: string }).severity === 'error');
      if (blockers.length > 0) {
        return fail('bad_request', 'Cannot activate flow — fix the issues below first', 422);
      }
    }

    const { data: updated, error } = await admin
      .from('flows')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) {
      console.error('[api/v1/flows] activate error:', error);
      return fail('internal', 'Failed to update flow status', 500);
    }

    return ok({ flow: updated });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
