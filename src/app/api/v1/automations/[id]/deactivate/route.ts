// ============================================================
// POST /api/v1/automations/{id}/deactivate — deactivate an automation
// (scope: automations:write)
//
// Sets is_active=false unconditionally. No validation needed.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { supabaseAdmin } from '@/lib/flows/admin-client';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'automations:write');
    const { id } = await params;

    const { data: existing } = await ctx.supabase
      .from('automations')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Automation not found', 404);

    const admin = supabaseAdmin();
    const { data: updated, error } = await admin
      .from('automations')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('[api/v1/automations] deactivate error:', error);
      return fail('internal', 'Failed to deactivate automation', 500);
    }

    return ok({ automation: updated });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
