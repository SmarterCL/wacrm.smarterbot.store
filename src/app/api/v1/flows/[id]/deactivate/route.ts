// ============================================================
// POST /api/v1/flows/{id}/deactivate — set flow status to draft
// (scope: flows:write)
//
// Convenience endpoint; equivalent to activate with status=draft.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { supabaseAdmin } from '@/lib/flows/admin-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'flows:write');
    const { id } = await params;

    const { data: existing } = await ctx.supabase
      .from('flows')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Flow not found', 404);

    const admin = supabaseAdmin();
    const { data: updated, error } = await admin
      .from('flows')
      .update({ status: 'draft', updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[api/v1/flows] deactivate error:', error);
      return fail('internal', 'Failed to deactivate flow', 500);
    }

    return ok({ flow: updated });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
