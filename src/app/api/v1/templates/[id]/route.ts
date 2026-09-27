// ============================================================
// GET /api/v1/templates/{id} — read a message template (scope: templates:read)
//
// Account-scoped. Foreign id → 404.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';

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
    sample_values: row.sample_values ?? null,
    meta_template_id: row.meta_template_id ?? null,
    quality_score: row.quality_score ?? null,
    rejection_reason: row.rejection_reason ?? null,
    created_at: row.created_at,
  };
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ctx = await requireApiKey(request, 'templates:read');
    const { id } = await params;

    const { data, error } = await ctx.supabase
      .from('message_templates')
      .select('*, profile:profiles!inner(account_id)')
      .eq('id', id)
      .eq('profile.account_id', ctx.accountId)
      .maybeSingle();

    if (error) {
      console.error('[api/v1/templates] read error:', error);
      return fail('internal', 'Failed to read template', 500);
    }
    if (!data) return fail('not_found', 'Template not found', 404);

    return ok(serializeTemplate(data as Record<string, unknown>));
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
