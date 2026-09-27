// ============================================================
// GET /api/v1/templates — list message templates (scope: templates:read)
//
// Lists approved Meta message templates for this account, paginated.
// Filters: ?status= (APPROVED/PENDING/REJECTED/...), ?category=
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { okList, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import {
  parseListParams,
  keysetFilter,
  buildPage,
} from '@/lib/api/v1/pagination';

function serializeTemplate(row: Record<string, unknown>) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    language: row.language ?? null,
    status: row.status ?? null,
    header_type: row.header_type ?? null,
    header_content: row.header_content ?? null,
    body_text: row.body_text,
    footer_text: row.footer_text ?? null,
    buttons: row.buttons ?? null,
    meta_template_id: row.meta_template_id ?? null,
    quality_score: row.quality_score ?? null,
    created_at: row.created_at,
  };
}

export async function GET(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'templates:read');
    const { limit, cursor } = parseListParams(request);
    const url = new URL(request.url);
    const status = url.searchParams.get('status');
    const category = url.searchParams.get('category');

    // message_templates are owned by user_id; account-scope via profile join.
    let query = ctx.supabase
      .from('message_templates')
      .select('*, profile:profiles!inner(account_id)')
      .eq('profile.account_id', ctx.accountId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .limit(limit + 1);

    if (status) query = query.eq('status', status);
    if (category) query = query.eq('category', category);

    const kf = keysetFilter(cursor);
    if (kf) query = query.or(kf);

    const { data, error } = await query;
    if (error) {
      console.error('[api/v1/templates] list error:', error);
      return fail('internal', 'Failed to list templates', 500);
    }

    const { items, nextCursor } = buildPage(
      (data ?? []) as unknown as Array<{ created_at: string; id: string }>,
      limit
    );
    return okList(
      items.map((r) => serializeTemplate(r as Record<string, unknown>)),
      nextCursor
    );
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
