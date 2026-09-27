// ============================================================
// GET  /api/v1/automations — list automations (scope: automations:read)
// POST /api/v1/automations — create an automation (scope: automations:write)
//
// List is keyset-paginated, newest first. Includes step tree.
// Create accepts trigger + steps; optionally activate immediately.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, okList, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  parseListParams,
  keysetFilter,
  buildPage,
} from '@/lib/api/v1/pagination';
import { resolveAuditUserId, ContactError } from '@/lib/api/v1/contacts';
import { supabaseAdmin } from '@/lib/flows/admin-client';
import {
  insertSteps,
  loadStepsTree,
  type BuilderStepInput,
} from '@/lib/automations/steps-tree';
import {
  validateStepsForActivation,
  validateTriggerForActivation,
} from '@/lib/automations/validate';

export async function GET(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'automations:read');
    const { limit, cursor } = parseListParams(request);

    let query = ctx.supabase
      .from('automations')
      .select(
        'id, name, description, trigger_type, trigger_config, is_active, execution_count, last_executed_at, created_at, updated_at'
      )
      .eq('account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    const kf = keysetFilter(cursor);
    if (kf) query = query.or(kf);

    const { data, error } = await query;
    if (error) {
      console.error('[api/v1/automations] list error:', error);
      return fail('internal', 'Failed to list automations', 500);
    }

    const { items, nextCursor } = buildPage(
      (data ?? []) as unknown as Array<{ created_at: string; id: string }>,
      limit
    );
    return okList(items, nextCursor);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'automations:write');

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return fail('bad_request', "'name' is required", 400);

    const triggerType = typeof body.trigger_type === 'string' ? body.trigger_type : null;
    if (!triggerType) return fail('bad_request', "'trigger_type' is required", 400);

    const triggerConfig =
      body.trigger_config && typeof body.trigger_config === 'object'
        ? (body.trigger_config as Record<string, unknown>)
        : {};

    const isActive = body.is_active === true;
    const steps = Array.isArray(body.steps) ? (body.steps as BuilderStepInput[]) : [];

    // Validate before writing if activating immediately.
    if (isActive) {
      const issues = [
        ...validateTriggerForActivation(triggerType, triggerConfig),
        ...validateStepsForActivation(steps),
      ];
      if (issues.length > 0) {
        return fail(
          'bad_request',
          'Cannot activate automation with invalid configuration',
          400,
          undefined
        );
      }
    }

    let auditUserId: string;
    try {
      auditUserId = await resolveAuditUserId(ctx.supabase, ctx.accountId);
    } catch (e) {
      if (e instanceof ContactError) return fail('internal', e.message, e.status);
      throw e;
    }

    const admin = supabaseAdmin();
    const { data: automation, error: insertErr } = await admin
      .from('automations')
      .insert({
        user_id: auditUserId,
        account_id: ctx.accountId,
        name,
        description: typeof body.description === 'string' ? body.description : null,
        trigger_type: triggerType,
        trigger_config: triggerConfig,
        is_active: isActive,
      })
      .select()
      .single();

    if (insertErr || !automation) {
      console.error('[api/v1/automations] insert error:', insertErr);
      return fail('internal', 'Failed to create automation', 500);
    }

    if (steps.length > 0) {
      const err = await insertSteps(automation.id, steps);
      if (err) return fail('internal', `Failed to insert steps: ${err}`, 500);
    }

    const stepTree = await loadStepsTree(automation.id);
    return ok({ automation, steps: stepTree }, 201);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
