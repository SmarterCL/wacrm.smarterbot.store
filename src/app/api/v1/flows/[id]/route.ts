// ============================================================
// GET    /api/v1/flows/{id} — read a flow with nodes (scope: flows:read)
// PUT    /api/v1/flows/{id} — replace flow graph (scope: flows:write)
// DELETE /api/v1/flows/{id} — delete a flow (scope: flows:write)
//
// Account-scoped. PUT replaces the full node graph (delete-then-insert).
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { supabaseAdmin } from '@/lib/flows/admin-client';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'flows:read');
    const { id } = await params;

    const [{ data: flow, error: flowErr }, { data: nodes }] = await Promise.all([
      ctx.supabase
        .from('flows')
        .select('*')
        .eq('id', id)
        .eq('account_id', ctx.accountId)
        .maybeSingle(),
      ctx.supabase
        .from('flow_nodes')
        .select('*')
        .eq('flow_id', id)
        .order('created_at', { ascending: true }),
    ]);

    if (flowErr) {
      console.error('[api/v1/flows] read error:', flowErr);
      return fail('internal', 'Failed to read flow', 500);
    }
    if (!flow) return fail('not_found', 'Flow not found', 404);

    return ok({ flow, nodes: nodes ?? [] });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function PUT(
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
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    // Verify ownership.
    const { data: existing } = await ctx.supabase
      .from('flows')
      .select('id')
      .eq('id', id)
      .eq('account_id', ctx.accountId)
      .maybeSingle();
    if (!existing) return fail('not_found', 'Flow not found', 404);

    if (body.name !== undefined) {
      const name = typeof body.name === 'string' ? body.name.trim() : '';
      if (!name) return fail('bad_request', "'name' cannot be empty", 400);
    }

    const admin = supabaseAdmin();

    const flowPatch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (body.name !== undefined) flowPatch.name = (body.name as string).trim();
    if (body.description !== undefined) flowPatch.description = body.description;
    if (body.trigger_type !== undefined) flowPatch.trigger_type = body.trigger_type;
    if (body.trigger_config !== undefined) flowPatch.trigger_config = body.trigger_config;
    if (body.entry_node_id !== undefined) flowPatch.entry_node_id = body.entry_node_id;
    if (body.fallback_policy !== undefined) flowPatch.fallback_policy = body.fallback_policy;

    const { error: updErr } = await admin
      .from('flows')
      .update(flowPatch)
      .eq('id', id);
    if (updErr) {
      console.error('[api/v1/flows] update error:', updErr);
      return fail('internal', 'Failed to update flow', 500);
    }

    if (body.nodes !== undefined) {
      const nodes = Array.isArray(body.nodes) ? body.nodes : [];
      const { error: delErr } = await admin.from('flow_nodes').delete().eq('flow_id', id);
      if (delErr) {
        console.error('[api/v1/flows] node delete error:', delErr);
        return fail('internal', 'Failed to replace nodes', 500);
      }
      if (nodes.length > 0) {
        const { error: insErr } = await admin.from('flow_nodes').insert(
          (nodes as Array<Record<string, unknown>>).map((n) => ({
            flow_id: id,
            node_key: n.node_key,
            node_type: n.node_type,
            config: n.config,
            position_x: typeof n.position_x === 'number' ? n.position_x : 0,
            position_y: typeof n.position_y === 'number' ? n.position_y : 0,
          }))
        );
        if (insErr) {
          console.error('[api/v1/flows] node insert error:', insErr);
          return fail('internal', 'Failed to insert nodes', 500);
        }
      }
    }

    const [{ data: flow }, { data: updatedNodes }] = await Promise.all([
      admin.from('flows').select('*').eq('id', id).maybeSingle(),
      admin.from('flow_nodes').select('*').eq('flow_id', id).order('created_at', { ascending: true }),
    ]);

    return ok({ flow, nodes: updatedNodes ?? [] });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}

export async function DELETE(
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
    const { error } = await admin.from('flows').delete().eq('id', id);
    if (error) {
      console.error('[api/v1/flows] delete error:', error);
      return fail('internal', 'Failed to delete flow', 500);
    }

    return new Response(null, { status: 204 });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
