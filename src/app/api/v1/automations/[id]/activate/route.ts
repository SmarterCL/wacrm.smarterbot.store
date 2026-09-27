// ============================================================
// POST /api/v1/automations/{id}/activate — activate an automation
// (scope: automations:write)
//
// Delegates validation to validateStepsForActivation and
// validateTriggerForActivation in the core. The API does not
// duplicate those rules.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { supabaseAdmin } from '@/lib/flows/admin-client';
import { loadStepsTree } from '@/lib/automations/steps-tree';
import {
  validateStepsForActivation,
  validateTriggerForActivation,
} from '@/lib/automations/validate';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'automations:write');
    const { id } = await params;

    const { data: automation } = await ctx.supabase
      .from('automations')
      .select('id, account_id, trigger_type, trigger_config')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!automation) return fail('not_found', 'Automation not found', 404);

    const steps = await loadStepsTree(id);

    const issues = [
      ...validateTriggerForActivation(
        (automation as Record<string, unknown>).trigger_type as string,
        (automation as Record<string, unknown>).trigger_config
      ),
      ...validateStepsForActivation(steps),
    ];

    if (issues.length > 0) {
      return fail(
        'bad_request',
        'Cannot activate automation with invalid configuration',
        400
      );
    }

    const admin = supabaseAdmin();
    const { data: updated, error } = await admin
      .from('automations')
      .update({ is_active: true, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('[api/v1/automations] activate error:', error);
      return fail('internal', 'Failed to activate automation', 500);
    }

    return ok({ automation: updated, steps });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
