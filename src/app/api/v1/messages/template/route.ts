// ============================================================
// POST /api/v1/messages/template — send a template message.
//
// Convenience alias for POST /api/v1/messages with type=template.
// External agents and automations often deal with templates
// exclusively; this endpoint makes the intent explicit and removes
// the need to pass `type: "template"` — it is implied.
//
// Auth: API key with the `messages:send` scope.
//
// Body:
//   {
//     "to": "+14155550123",             // required, E.164
//     "template": {                     // required
//       "name": "order_update",
//       "language": "en_US",
//       "params": ["A123"]              // positional body vars
//     },
//     "name": "Jane Doe"                // optional, names a new contact
//   }
//
// Response (201): same envelope as POST /api/v1/messages
// ============================================================

import { requireApiKey } from '@/lib/auth/api-context';
import { ok, fail, toApiErrorResponse } from '@/lib/api/v1/respond';
import { resolveConversationByPhone } from '@/lib/whatsapp/resolve-conversation';
import {
  sendMessageToConversation,
  validateSendMessageParams,
  SendMessageError,
} from '@/lib/whatsapp/send-message';

export async function POST(request: Request) {
  try {
    const ctx = await requireApiKey(request, 'messages:send');

    const body = (await request.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== 'object') {
      return fail('bad_request', 'Request body must be a JSON object', 400);
    }

    const to = typeof body.to === 'string' ? body.to.trim() : '';
    if (!to) {
      return fail('bad_request', "'to' is required", 400);
    }

    const template =
      body.template && typeof body.template === 'object'
        ? (body.template as Record<string, unknown>)
        : null;
    if (!template) {
      return fail('bad_request', "'template' is required", 400);
    }

    const templateName = typeof template.name === 'string' ? template.name : null;
    if (!templateName) {
      return fail('bad_request', "'template.name' is required", 400);
    }

    const templateLanguage =
      typeof template.language === 'string' ? template.language : null;

    const templateParams = Array.isArray(template.params)
      ? (template.params as unknown[]).filter(
          (p): p is string => typeof p === 'string'
        )
      : undefined;

    const templateMessageParams =
      template.params && !Array.isArray(template.params)
        ? template.params
        : undefined;

    validateSendMessageParams({
      messageType: 'template',
      contentText: null,
      mediaUrl: null,
      templateName,
      interactivePayload: null,
    });

    const resolved = await resolveConversationByPhone(
      ctx.supabase,
      ctx.accountId,
      to,
      typeof body.name === 'string' ? body.name : null
    );

    const result = await sendMessageToConversation(
      ctx.supabase,
      ctx.accountId,
      {
        conversationId: resolved.conversationId,
        messageType: 'template',
        contentText: null,
        mediaUrl: null,
        filename: null,
        templateName,
        templateLanguage,
        templateParams,
        templateMessageParams,
        interactivePayload: null,
        replyToMessageId: null,
      }
    );

    return ok(
      {
        message_id: result.messageId,
        whatsapp_message_id: result.whatsappMessageId,
        conversation_id: resolved.conversationId,
        contact_id: resolved.contactId,
        contact_created: resolved.contactCreated,
      },
      201
    );
  } catch (err) {
    if (err instanceof SendMessageError) {
      return fail(err.code, err.message, err.status);
    }
    return toApiErrorResponse(err);
  }
}
