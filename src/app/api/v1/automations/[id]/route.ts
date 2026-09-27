// ============================================================
// GET    /api/v1/automations/{id} — read (scope: automations:read)
// PATCH  /api/v1/automations/{id} — update (scope: automations:write)
// DELETE /api/v1/automations/{id} — delete (scope: automations:write)
//
// Account-scoped. GET includes the step tree.
// PATCH allows updating name, description, trigger, is_active, steps.
// Activating triggers validateStepsForActivation / validateTriggerForActivation.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { supabaseAdmin } from '@/lib/flows/admin-client';
import {
  replaceSteps,
  loadStepsTree,
  type BuilderStepInput,
} from '@/lib/automations/steps-tree';
import {
  validateStepsForActivation,
  validateTriggerForActivation,
} from '@/lib/automations/validate';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'automations:read');
    const { id } = await params;

    const { data: automation, error } = await ctx.supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();

    if (error) {
      console.error('[api/v1/automations] read error:', error);
      return fail('internal', 'Failed to read automation', 500);
    }
    if (!automation) return fail('not_found', 'Automation not found', 404);

    const steps = await loadStepsTree(id);
    return ok({ automation, steps });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'automations:write');
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    // Load existing to verify ownership and merge for validation.
    const { data: existing } = await ctx.supabase
      .from('automations')
      .select('id, account_id, is_active, trigger_type, trigger_config')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Automation not found', 404);

    const update: Record<string, unknown> = {};
    for (const k of ['name', 'description', 'trigger_type', 'trigger_config', 'is_active'] as const) {
      if (k in body) update[k] = body[k];
    }

    // If the result will be active, validate the merged config.
    const willBeActive =
      typeof update.is_active === 'boolean'
        ? update.is_active
        : (existing as Record<string, unknown>).is_active;

    if (willBeActive) {
      const mergedTriggerType = (update.trigger_type ??
        (existing as Record<string, unknown>).trigger_type) as string;
      const mergedTriggerConfig =
        update.trigger_config ?? (existing as Record<string, unknown>).trigger_config;
      const mergedSteps = Array.isArray(body.steps)
        ? (body.steps as BuilderStepInput[])
        : await loadStepsTree(id);

      const issues = [
        ...validateTriggerForActivation(mergedTriggerType, mergedTriggerConfig),
        ...validateStepsForActivation(mergedSteps),
      ];
      if (issues.length > 0) {
        return fail(
          'bad_request',
          'Cannot activate automation with invalid configuration',
          400
        );
      }
    }

    if (Object.keys(update).length > 0) {
      update.updated_at = new Date().toISOString();
      const admin = supabaseAdmin();
      const { error: updErr } = await admin
        .from('automations')
        .update(update)
        .eq('id', id);
      if (updErr) {
        console.error('[api/v1/automations] update error:', updErr);
        return fail('internal', 'Failed to update automation', 500);
      }
    }

    if (Array.isArray(body.steps)) {
      const err = await replaceSteps(id, body.steps as BuilderStepInput[]);
      if (err) return fail('internal', `Failed to update steps: ${err}`, 500);
    }

    const { data: updated } = await ctx.supabase
      .from('automations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    const steps = await loadStepsTree(id);
    return ok({ automation: updated, steps });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
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

    // Use admin to bypass RLS for delete (mirrors dashboard route).
    const admin = supabaseAdmin();
    const { error } = await admin.from('automations').delete().eq('id', id);
    if (error) {
      console.error('[api/v1/automations] delete error:', error);
      return fail('internal', 'Failed to delete automation', 500);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
