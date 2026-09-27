// ============================================================
// POST /api/v1/automations/{id}/trigger — manually trigger an automation
// (scope: automations:execute)
//
// Runs the automation against the provided contact_id. The automation
// must be active. The engine is invoked as a fire-and-forget (after())
// so the request returns quickly.
//
// Body:
//   { "contact_id": "<uuid>", "context": { ... } }
// ============================================================

import { after } from 'next/server';
import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { runAutomationsForTrigger } from '@/lib/automations/engine';

export const maxDuration = 60;

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'automations:execute');
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const contactId = typeof body.contact_id === 'string' ? body.contact_id : null;
    if (!contactId) return fail('bad_request', "'contact_id' is required", 400);

    // Verify automation exists, belongs to this account, and is active.
    const { data: automation } = await ctx.supabase
      .from('automations')
      .select('id, is_active, trigger_type')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!automation) return fail('not_found', 'Automation not found', 404);

    if (!(automation as Record<string, unknown>).is_active) {
      return fail('bad_request', 'Automation is not active', 400);
    }

    // Verify contact belongs to this account.
    const { data: contact } = await ctx.supabase
      .from('contacts')
      .select('id')
      .eq('id', contactId)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!contact) return fail('not_found', 'Contact not found', 404);

    const context =
      body.context && typeof body.context === 'object'
        ? (body.context as Record<string, unknown>)
        : {};

    after(() =>
      runAutomationsForTrigger({
        accountId: ctx.accountId,
        triggerType: (automation as Record<string, unknown>).trigger_type as Parameters<typeof runAutomationsForTrigger>[0]['triggerType'],
        contactId,
        context,
      })
    );

    return ok({ queued: true, automation_id: id, contact_id: contactId });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
