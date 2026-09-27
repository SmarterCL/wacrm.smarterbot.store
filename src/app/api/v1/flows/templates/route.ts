// ============================================================
// GET /api/v1/flows/templates — list flow templates (scope: flows:read)
//
// Returns the static gallery of flow templates (slug, name,
// description, trigger_type, node_count). Use template_slug with
// POST /api/v1/flows to clone a template.
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, toApiErrorResponse } from '@/lib/api/v1/respond';
import { listFlowTemplates } from '@/lib/flows/templates';

export async function GET(request: Request) {
  try {
    await requireApiKey(request, 'flows:read');

    const templates = listFlowTemplates().map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      trigger_type: t.trigger_type,
      node_count: t.nodes.length,
    }));

    return ok({ templates });
  } catch (err) {
    return toApiErrorResponse(err);
  }
}
