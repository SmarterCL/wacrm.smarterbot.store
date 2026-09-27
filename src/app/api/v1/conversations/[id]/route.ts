// ============================================================
// GET   /api/v1/conversations/{id} — read one conversation
// PATCH /api/v1/conversations/{id} — update conversation status/assignment
//
// GET:  scope: conversations:read. Account-scoped: foreign id → 404.
// PATCH: scope: conversations:write. Allows updating status and
//        assigned_agent_id. Account-scoped.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  CONVERSATION_SELECT,
  normalizeConversation,
} from '@/lib/inbox/conversations';
import { serializeConversation } from '@/lib/api/v1/conversations';
import type { Conversation } from '@/types';

const VALID_STATUSES = ['open', 'pending', 'closed'] as const;
type ConvStatus = (typeof VALID_STATUSES)[number];

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'conversations:read');
    const { id } = await params;

    const { data, error } = await ctx.supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();

    if (error) {
      console.error('[api/v1/conversations] read error:', error);
      return fail('internal', 'Failed to read conversation', 500);
    }
    if (!data) return fail('not_found', 'Conversation not found', 404);

    return ok(serializeConversation(normalizeConversation(data as Conversation)));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'conversations:write');
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    // Verify ownership before mutating.
    const { data: existing } = await ctx.supabase
      .from('conversations')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Conversation not found', 404);

    const updates: Record<string, unknown> = {};

    if ('status' in body) {
      const s = body.status;
      if (!VALID_STATUSES.includes(s as ConvStatus)) {
        return fail(
          'bad_request',
          `'status' must be one of: ${VALID_STATUSES.join(', ')}`,
          400
        );
      }
      updates.status = s;
    }

    if ('assigned_agent_id' in body) {
      const a = body.assigned_agent_id;
      if (a !== null && typeof a !== 'string') {
        return fail('bad_request', "'assigned_agent_id' must be a string or null", 400);
      }
      updates.assigned_agent_id = a;
    }

    if (Object.keys(updates).length === 0) {
      return fail('bad_request', 'No updatable fields provided (status, assigned_agent_id)', 400);
    }

    updates.updated_at = new Date().toISOString();

    const { error: updErr } = await ctx.supabase
      .from('conversations')
      .update(updates)
      .eq('id', id)
      .eq('account_id', ctx.accountId);
    if (updErr) {
      console.error('[api/v1/conversations] update error:', updErr);
      return fail('internal', 'Failed to update conversation', 500);
    }

    const { data, error } = await ctx.supabase
      .from('conversations')
      .select(CONVERSATION_SELECT)
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (error || !data) return fail('internal', 'Failed to read updated conversation', 500);

    return ok(serializeConversation(normalizeConversation(data as Conversation)));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
