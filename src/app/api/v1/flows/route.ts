// ============================================================
// GET  /api/v1/flows — list flows (scope: flows:read)
// POST /api/v1/flows — create a flow (scope: flows:write)
//
// List is keyset-paginated, newest first.
// Create mirrors the dashboard POST /api/flows but uses API key auth
// and account_id from the key context instead of cookie session.
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
import { getFlowTemplate } from '@/lib/flows/templates';

export async function GET(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'flows:read');
    const { limit, cursor } = parseListParams(request);

    let query = ctx.supabase
      .from('flows')
      .select('id, name, description, status, trigger_type, trigger_config, entry_node_id, created_at, updated_at')
      .eq('account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    const kf = keysetFilter(cursor);
    if (kf) query = query.or(kf);

    const { data, error } = await query;
    if (error) {
      console.error('[api/v1/flows] list error:', error);
      return fail('internal', 'Failed to list flows', 500);
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
    const ctx = await requireApiKey(request, 'flows:write');

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    let auditUserId: string;
    try {
      auditUserId = await resolveAuditUserId(ctx.supabase, ctx.accountId);
    } catch (e) {
      if (e instanceof ContactError) return fail('internal', e.message, e.status);
      throw e;
    }

    const admin = supabaseAdmin();

    // Template clone path.
    if (typeof body.template_slug === 'string') {
      const template = getFlowTemplate(body.template_slug);
      if (!template) {
        return fail('bad_request', `Unknown template_slug "${body.template_slug}"`, 400);
      }

      const { data: flow, error: flowErr } = await admin
        .from('flows')
        .insert({
          user_id: auditUserId,
          account_id: ctx.accountId,
          name: typeof body.name === 'string' && body.name.trim()
            ? body.name.trim()
            : template.name,
          description: template.description,
          status: 'draft',
          trigger_type: template.trigger_type,
          trigger_config: template.trigger_config,
          entry_node_id: template.entry_node_id,
        })
        .select()
        .single();

      if (flowErr || !flow) {
        console.error('[api/v1/flows] template insert error:', flowErr);
        return fail('internal', 'Failed to create flow from template', 500);
      }

      if (template.nodes.length > 0) {
        const { error: nodesErr } = await admin.from('flow_nodes').insert(
          template.nodes.map((n) => ({
            flow_id: (flow as Record<string, unknown>).id,
            node_key: n.node_key,
            node_type: n.node_type,
            config: n.config,
          }))
        );
        if (nodesErr) {
          await admin.from('flows').delete().eq('id', (flow as Record<string, unknown>).id);
          return fail('internal', nodesErr.message, 500);
        }
      }

      const { data: nodes } = await admin
        .from('flow_nodes')
        .select('*')
        .eq('flow_id', (flow as Record<string, unknown>).id)
        .order('created_at', { ascending: true });

      return ok({ flow, nodes: nodes ?? [] }, 201);
    }

    // Plain create path.
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    if (!name) return fail('bad_request', "'name' is required", 400);

    const triggerType = typeof body.trigger_type === 'string' ? body.trigger_type : 'keyword';

    const { data: flow, error } = await admin
      .from('flows')
      .insert({
        user_id: auditUserId,
        account_id: ctx.accountId,
        name,
        description: typeof body.description === 'string' ? body.description : null,
        status: 'draft',
        trigger_type: triggerType,
        trigger_config:
          body.trigger_config && typeof body.trigger_config === 'object'
            ? body.trigger_config
            : {},
      })
      .select()
      .single();

    if (error || !flow) {
      console.error('[api/v1/flows] insert error:', error);
      return fail('internal', 'Failed to create flow', 500);
    }

    return ok({ flow, nodes: [] }, 201);
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
