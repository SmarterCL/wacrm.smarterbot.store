// ============================================================
// PATCH  /api/v1/tags/{id} — update a tag (scope: tags:write)
// DELETE /api/v1/tags/{id} — delete a tag (scope: tags:write)
//
// Account-scoped via the profile's account_id. Foreign id → 404.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';

function serializeTag(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    created_at: row.created_at,
  };
}

async function getTagForAccount(
  supabase: Awaited<ReturnType<typeof import('@/lib/auth/api-context').requireApiKey>>['supabase'],
  accountId: string,
  tagId: string
) {
  const { data } = await supabase
    .from('tags')
    .select('*, profile:profiles!inner(account_id)')
    .eq('id', tagId)
    .eq('profile.account_id', accountId)
    .maybeSingle();
  return data;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'tags:write');
    const { id } = await params;

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const existing = await getTagForAccount(ctx.supabase, ctx.accountId, id);
    if (!existing) return fail('not_found', 'Tag not found', 404);

    const updates: Record<string, unknown> = {};
    if ('name' in body) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return fail('bad_request', "'name' cannot be empty", 400);
      updates.name = name;
    }
    if ('color' in body && typeof body.color === 'string') {
      updates.color = body.color;
    }

    if (Object.keys(updates).length === 0) {
      return fail('bad_request', 'No updatable fields provided (name, color)', 400);
    }

    const { data: updated, error } = await ctx.supabase
      .from('tags')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !updated) {
      console.error('[api/v1/tags] update error:', error);
      return fail('internal', 'Failed to update tag', 500);
    }

    return ok(serializeTag(updated as Record<string, unknown>));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'tags:write');
    const { id } = await params;

    const existing = await getTagForAccount(ctx.supabase, ctx.accountId, id);
    if (!existing) return fail('not_found', 'Tag not found', 404);

    const { error } = await ctx.supabase.from('tags').delete().eq('id', id);
    if (error) {
      console.error('[api/v1/tags] delete error:', error);
      return fail('internal', 'Failed to delete tag', 500);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
