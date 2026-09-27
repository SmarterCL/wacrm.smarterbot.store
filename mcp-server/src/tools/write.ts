// ============================================================
// Write tools — registered only when WACRM_ENABLE_WRITES is set.
//
// Contacts, conversations, messages, deals, pipelines, stages,
// tags, automations, and flows. Destructive operations (delete_*)
// require confirm=true.
// ============================================================

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { WacrmClient } from '../client.js';
import { errorResult, handle, jsonResult } from './shared.js';

const WRITE = { readOnlyHint: false, openWorldHint: true } as const;
const DESTRUCTIVE = { readOnlyHint: false, destructiveHint: true, openWorldHint: true } as const;

// ── Shared sub-schemas ──────────────────────────────────────

const templateSchema = z.object({
  name: z.string().describe('Meta-approved template name.'),
  language: z.string().describe('Template language code, e.g. "en_US".'),
  params: z
    .array(z.string())
    .optional()
    .describe('Positional body variables, in order.'),
});

// ── Automation types (Zod, for input validation only) ───────
// The enums mirror src/types/index.ts. Validation is shallow —
// the API/Core enforces business rules.

const AutomationTriggerTypeEnum = z.enum([
  'new_message_received',
  'first_inbound_message',
  'keyword_match',
  'new_contact_created',
  'conversation_assigned',
  'tag_added',
  'time_based',
  'interactive_reply',
]);

const AutomationStepTypeEnum = z.enum([
  'send_message',
  'send_buttons',
  'send_list',
  'send_template',
  'add_tag',
  'remove_tag',
  'assign_conversation',
  'update_contact_field',
  'create_deal',
  'wait',
  'condition',
  'send_webhook',
  'close_conversation',
]);

// Discriminated union for step configs — shape validation only.
const AutomationStepConfigUnion = z
  .discriminatedUnion('step_type', [
    z.object({ step_type: z.literal('send_message'), step_config: z.object({ text: z.string() }) }),
    z.object({ step_type: z.literal('send_template'), step_config: z.object({ template_name: z.string(), language: z.string().optional(), variables: z.record(z.string()).optional() }) }),
    z.object({ step_type: z.literal('add_tag'), step_config: z.object({ tag_id: z.string() }) }),
    z.object({ step_type: z.literal('remove_tag'), step_config: z.object({ tag_id: z.string() }) }),
    z.object({ step_type: z.literal('assign_conversation'), step_config: z.object({ mode: z.enum(['specific', 'round_robin']), agent_id: z.string().optional() }) }),
    z.object({ step_type: z.literal('update_contact_field'), step_config: z.object({ field: z.string(), value: z.string() }) }),
    z.object({ step_type: z.literal('create_deal'), step_config: z.object({ pipeline_id: z.string(), stage_id: z.string(), title: z.string(), value: z.number().optional() }) }),
    z.object({ step_type: z.literal('wait'), step_config: z.object({ amount: z.number().positive(), unit: z.enum(['minutes', 'hours', 'days']) }) }),
    z.object({ step_type: z.literal('condition'), step_config: z.object({ subject: z.enum(['contact_field', 'tag_presence', 'message_content', 'time_of_day']), operand: z.string().optional(), value: z.string().optional() }) }),
    z.object({ step_type: z.literal('send_webhook'), step_config: z.object({ url: z.string().url(), headers: z.record(z.string()).optional(), body_template: z.string().optional() }) }),
    z.object({ step_type: z.literal('close_conversation'), step_config: z.object({}).optional().default({}) }),
    z.object({ step_type: z.literal('send_buttons'), step_config: z.record(z.unknown()) }),
    z.object({ step_type: z.literal('send_list'), step_config: z.record(z.unknown()) }),
  ])
  .optional();

// Recursive step schema via lazy (MCP Zod tooling needs concrete shape at registration time).
// We keep it flat and pass arrays of steps as unknown[] — business validation is in the API.
const stepSchema = z.object({
  step_type: AutomationStepTypeEnum,
  step_config: z.record(z.unknown()),
  branches: z
    .object({
      yes: z.array(z.record(z.unknown())).optional(),
      no: z.array(z.record(z.unknown())).optional(),
    })
    .optional(),
});

// ── Flow node schema ────────────────────────────────────────

const FlowNodeTypeEnum = z.enum([
  'send_message',
  'send_buttons',
  'send_list',
  'send_template',
  'add_tag',
  'remove_tag',
  'assign_conversation',
  'update_contact_field',
  'create_deal',
  'wait',
  'condition',
  'send_webhook',
  'close_conversation',
  'transfer_to_agent',
  'end',
]);

const flowNodeSchema = z.object({
  node_key: z.string().describe('Unique key within the flow graph.'),
  node_type: FlowNodeTypeEnum,
  config: z.record(z.unknown()).describe('Node configuration — validated by the API.'),
  position_x: z.number().optional(),
  position_y: z.number().optional(),
});

// ────────────────────────────────────────────────────────────

export function registerWriteTools(server: McpServer, client: WacrmClient): void {

  // ── Messages ──────────────────────────────────────────────

  server.registerTool(
    'send_message',
    {
      title: 'Send WhatsApp message',
      description:
        'Send a WhatsApp message to a phone number (E.164, e.g. +14155550123). Contact and conversation are found-or-created automatically. Use type "text" for a free-form message (only valid inside the 24-hour service window) or "template" to send an approved template (required to open a new conversation). Media types require a media_url. This sends a real message — confirm recipient and content with the user before calling.',
      inputSchema: {
        to: z.string().describe('Recipient phone number in E.164 format.'),
        type: z
          .enum(['text', 'template', 'image', 'video', 'document', 'audio'])
          .default('text')
          .describe('Message type. Defaults to "text".'),
        text: z.string().optional().describe('Message body (text) or caption (media).'),
        media_url: z.string().url().optional().describe('Publicly reachable media URL (required for media types).'),
        filename: z.string().optional().describe('Filename for a "document" send.'),
        template: templateSchema.optional().describe('Required when type is "template".'),
        reply_to_message_id: z.string().optional().describe('Id of a message in the same conversation to reply to.'),
      },
      annotations: { ...WRITE, title: 'Send WhatsApp message' },
    },
    handle(async (args) => jsonResult(await client.sendMessage(args))),
  );

  server.registerTool(
    'send_template_message',
    {
      title: 'Send template message',
      description:
        'Send a Meta-approved WhatsApp template message to a phone number. Convenience alias that always sets type=template. Required to open new conversations outside the 24-hour service window. This sends a real message — confirm with the user first.',
      inputSchema: {
        to: z.string().describe('Recipient phone number in E.164 format.'),
        template: templateSchema.describe('Template to send.'),
        name: z.string().optional().describe('Optional name to use when creating a new contact.'),
      },
      annotations: { ...WRITE, title: 'Send template message' },
    },
    handle(async (args) => jsonResult(await client.sendTemplateMessage(args))),
  );

  // ── Contacts ──────────────────────────────────────────────

  server.registerTool(
    'create_contact',
    {
      title: 'Create contact',
      description:
        'Create a contact by phone number (E.164). Find-or-create: if a contact with that phone already exists it is returned. Optional: name, email, company, tags (names; created if missing).',
      inputSchema: {
        phone: z.string().describe('Phone number in E.164 format.'),
        name: z.string().optional(),
        email: z.string().email().optional(),
        company: z.string().optional(),
        tags: z.array(z.string()).optional().describe('Tag names; created if they do not exist.'),
      },
      annotations: { ...WRITE, title: 'Create contact' },
    },
    handle(async (args) => jsonResult(await client.createContact(args))),
  );

  server.registerTool(
    'update_contact',
    {
      title: 'Update contact',
      description:
        'Update an existing contact. Only the fields you pass are changed. Pass tags (array of tag names) to replace the contact's tags entirely.',
      inputSchema: {
        id: z.string().describe('Contact id.'),
        name: z.string().optional(),
        email: z.string().email().optional(),
        company: z.string().optional(),
        tags: z.array(z.string()).optional().describe('Replaces the contact's tags entirely.'),
      },
      annotations: { ...WRITE, title: 'Update contact' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.updateContact(id, body))),
  );

  server.registerTool(
    'delete_contact',
    {
      title: 'Delete contact',
      description:
        'Permanently delete a contact. Their conversations and deals will have contact_id set to null. Requires confirm=true.',
      inputSchema: {
        id: z.string().describe('Contact id to delete.'),
        confirm: z.boolean().describe('Must be true to proceed. Safety gate against accidental deletion.'),
      },
      annotations: { ...DESTRUCTIVE, title: 'Delete contact' },
    },
    handle(async ({ id, confirm }) => {
      if (!confirm) return errorResult('Refusing to delete: set confirm=true to proceed.');
      await client.deleteContact(id);
      return jsonResult({ deleted: true, id });
    }),
  );

  // ── Conversations ─────────────────────────────────────────

  server.registerTool(
    'update_conversation',
    {
      title: 'Update conversation',
      description:
        'Update a conversation — change its status (open/pending/closed) or reassign it to an agent. Only fields you provide are changed.',
      inputSchema: {
        id: z.string().describe('Conversation id.'),
        status: z.enum(['open', 'pending', 'closed']).optional().describe('New status.'),
        assigned_agent_id: z
          .string()
          .nullable()
          .optional()
          .describe('Agent user id to assign, or null to unassign.'),
      },
      annotations: { ...WRITE, title: 'Update conversation' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.updateConversation(id, body))),
  );

  // ── Deals ─────────────────────────────────────────────────

  server.registerTool(
    'create_deal',
    {
      title: 'Create deal',
      description:
        'Create a new CRM deal in a pipeline stage. pipeline_id and stage_id are required.',
      inputSchema: {
        title: z.string().describe('Deal title.'),
        pipeline_id: z.string().describe('Pipeline id.'),
        stage_id: z.string().describe('Stage id within the pipeline.'),
        contact_id: z.string().optional().describe('Associated contact id.'),
        conversation_id: z.string().optional().describe('Associated conversation id.'),
        value: z.number().min(0).optional().describe('Deal value (monetary amount).'),
        currency: z.string().length(3).optional().describe('ISO 4217 currency code (default USD).'),
        notes: z.string().optional().describe('Deal notes.'),
        expected_close_date: z.string().optional().describe('Expected close date (ISO 8601).'),
        status: z.enum(['open', 'won', 'lost']).optional().describe('Initial status (default open).'),
      },
      annotations: { ...WRITE, title: 'Create deal' },
    },
    handle(async (args) => jsonResult(await client.createDeal(args))),
  );

  server.registerTool(
    'update_deal',
    {
      title: 'Update deal',
      description: 'Update an existing deal. Only provided fields are changed.',
      inputSchema: {
        id: z.string().describe('Deal id.'),
        title: z.string().optional(),
        stage_id: z.string().optional().describe('Move deal to this stage.'),
        pipeline_id: z.string().optional().describe('Move deal to a different pipeline.'),
        contact_id: z.string().nullable().optional(),
        value: z.number().min(0).optional(),
        currency: z.string().length(3).optional(),
        notes: z.string().nullable().optional(),
        expected_close_date: z.string().nullable().optional(),
        status: z.enum(['open', 'won', 'lost']).optional(),
        assigned_to: z.string().nullable().optional(),
      },
      annotations: { ...WRITE, title: 'Update deal' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.updateDeal(id, body))),
  );

  server.registerTool(
    'delete_deal',
    {
      title: 'Delete deal',
      description: 'Permanently delete a deal. Requires confirm=true.',
      inputSchema: {
        id: z.string().describe('Deal id.'),
        confirm: z.boolean().describe('Must be true to proceed.'),
      },
      annotations: { ...DESTRUCTIVE, title: 'Delete deal' },
    },
    handle(async ({ id, confirm }) => {
      if (!confirm) return errorResult('Refusing to delete: set confirm=true to proceed.');
      await client.deleteDeal(id);
      return jsonResult({ deleted: true, id });
    }),
  );

  // ── Pipelines ─────────────────────────────────────────────

  server.registerTool(
    'create_pipeline',
    {
      title: 'Create pipeline',
      description: 'Create a new CRM pipeline.',
      inputSchema: { name: z.string().describe('Pipeline name.') },
      annotations: { ...WRITE, title: 'Create pipeline' },
    },
    handle(async (args) => jsonResult(await client.createPipeline(args))),
  );

  server.registerTool(
    'update_pipeline',
    {
      title: 'Update pipeline',
      description: 'Rename a pipeline.',
      inputSchema: {
        id: z.string().describe('Pipeline id.'),
        name: z.string().describe('New name.'),
      },
      annotations: { ...WRITE, title: 'Update pipeline' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.updatePipeline(id, body))),
  );

  server.registerTool(
    'delete_pipeline',
    {
      title: 'Delete pipeline',
      description:
        'Permanently delete a pipeline and all its stages. Deals in this pipeline will lose their stage reference. Requires confirm=true.',
      inputSchema: {
        id: z.string().describe('Pipeline id.'),
        confirm: z.boolean().describe('Must be true to proceed.'),
      },
      annotations: { ...DESTRUCTIVE, title: 'Delete pipeline' },
    },
    handle(async ({ id, confirm }) => {
      if (!confirm) return errorResult('Refusing to delete: set confirm=true to proceed.');
      await client.deletePipeline(id);
      return jsonResult({ deleted: true, id });
    }),
  );

  // ── Stages ────────────────────────────────────────────────

  server.registerTool(
    'create_stage',
    {
      title: 'Create pipeline stage',
      description: 'Add a new stage to a pipeline.',
      inputSchema: {
        pipeline_id: z.string().describe('Pipeline id.'),
        name: z.string().describe('Stage name.'),
        color: z.string().optional().describe('Hex color (default #94a3b8).'),
        position: z.number().int().min(0).optional().describe('Position (0-indexed; defaults to last).'),
      },
      annotations: { ...WRITE, title: 'Create pipeline stage' },
    },
    handle(async ({ pipeline_id, ...body }) => jsonResult(await client.createStage(pipeline_id, body))),
  );

  server.registerTool(
    'update_stage',
    {
      title: 'Update pipeline stage',
      description: 'Update a stage name, color, or position.',
      inputSchema: {
        pipeline_id: z.string().describe('Pipeline id.'),
        stage_id: z.string().describe('Stage id.'),
        name: z.string().optional(),
        color: z.string().optional(),
        position: z.number().int().min(0).optional(),
      },
      annotations: { ...WRITE, title: 'Update pipeline stage' },
    },
    handle(async ({ pipeline_id, stage_id, ...body }) =>
      jsonResult(await client.updateStage(pipeline_id, stage_id, body)),
    ),
  );

  server.registerTool(
    'delete_stage',
    {
      title: 'Delete pipeline stage',
      description:
        'Permanently delete a stage. Deals in this stage will lose their stage reference. Requires confirm=true.',
      inputSchema: {
        pipeline_id: z.string().describe('Pipeline id.'),
        stage_id: z.string().describe('Stage id.'),
        confirm: z.boolean().describe('Must be true to proceed.'),
      },
      annotations: { ...DESTRUCTIVE, title: 'Delete pipeline stage' },
    },
    handle(async ({ pipeline_id, stage_id, confirm }) => {
      if (!confirm) return errorResult('Refusing to delete: set confirm=true to proceed.');
      await client.deleteStage(pipeline_id, stage_id);
      return jsonResult({ deleted: true, pipeline_id, stage_id });
    }),
  );

  // ── Tags ──────────────────────────────────────────────────

  server.registerTool(
    'create_tag',
    {
      title: 'Create tag',
      description: 'Create a new contact tag.',
      inputSchema: {
        name: z.string().describe('Tag name.'),
        color: z.string().optional().describe('Hex color (default #94a3b8).'),
      },
      annotations: { ...WRITE, title: 'Create tag' },
    },
    handle(async (args) => jsonResult(await client.createTag(args))),
  );

  server.registerTool(
    'update_tag',
    {
      title: 'Update tag',
      description: 'Update a tag name or color.',
      inputSchema: {
        id: z.string().describe('Tag id.'),
        name: z.string().optional(),
        color: z.string().optional(),
      },
      annotations: { ...WRITE, title: 'Update tag' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.updateTag(id, body))),
  );

  server.registerTool(
    'delete_tag',
    {
      title: 'Delete tag',
      description:
        'Permanently delete a tag and remove it from all contacts. Requires confirm=true.',
      inputSchema: {
        id: z.string().describe('Tag id.'),
        confirm: z.boolean().describe('Must be true to proceed.'),
      },
      annotations: { ...DESTRUCTIVE, title: 'Delete tag' },
    },
    handle(async ({ id, confirm }) => {
      if (!confirm) return errorResult('Refusing to delete: set confirm=true to proceed.');
      await client.deleteTag(id);
      return jsonResult({ deleted: true, id });
    }),
  );

  // ── Automations ───────────────────────────────────────────

  server.registerTool(
    'create_automation',
    {
      title: 'Create automation',
      description:
        'Create a new automation with a trigger and optional steps. Set is_active=true to activate immediately (the API will validate the configuration). Leave is_active=false (default) to save as a draft.',
      inputSchema: {
        name: z.string().describe('Automation name.'),
        description: z.string().optional(),
        trigger_type: AutomationTriggerTypeEnum.describe('What event fires this automation.'),
        trigger_config: z.record(z.unknown()).optional().describe('Trigger configuration (keywords, tag_id, schedule, etc.).'),
        is_active: z.boolean().optional().default(false).describe('Activate immediately? (default false)'),
        steps: z.array(stepSchema).optional().describe('Step tree. Each step has step_type, step_config, and optional branches.yes/no.'),
      },
      annotations: { ...WRITE, title: 'Create automation' },
    },
    handle(async (args) => jsonResult(await client.createAutomation(args))),
  );

  server.registerTool(
    'update_automation',
    {
      title: 'Update automation',
      description:
        'Update an automation. Only provided fields are changed. If the result will be active the API validates the configuration.',
      inputSchema: {
        id: z.string().describe('Automation id.'),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        trigger_type: AutomationTriggerTypeEnum.optional(),
        trigger_config: z.record(z.unknown()).optional(),
        is_active: z.boolean().optional(),
        steps: z.array(stepSchema).optional().describe('Replaces the full step tree when provided.'),
      },
      annotations: { ...WRITE, title: 'Update automation' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.updateAutomation(id, body))),
  );

  server.registerTool(
    'delete_automation',
    {
      title: 'Delete automation',
      description: 'Permanently delete an automation. Requires confirm=true.',
      inputSchema: {
        id: z.string().describe('Automation id.'),
        confirm: z.boolean().describe('Must be true to proceed.'),
      },
      annotations: { ...DESTRUCTIVE, title: 'Delete automation' },
    },
    handle(async ({ id, confirm }) => {
      if (!confirm) return errorResult('Refusing to delete: set confirm=true to proceed.');
      await client.deleteAutomation(id);
      return jsonResult({ deleted: true, id });
    }),
  );

  server.registerTool(
    'activate_automation',
    {
      title: 'Activate automation',
      description:
        'Activate an automation. The API validates the trigger and step configuration and returns a 400 with issues if invalid.',
      inputSchema: { id: z.string().describe('Automation id.') },
      annotations: { ...WRITE, title: 'Activate automation' },
    },
    handle(async ({ id }) => jsonResult(await client.activateAutomation(id))),
  );

  server.registerTool(
    'deactivate_automation',
    {
      title: 'Deactivate automation',
      description: 'Deactivate an automation (set is_active=false). No validation needed.',
      inputSchema: { id: z.string().describe('Automation id.') },
      annotations: { ...WRITE, title: 'Deactivate automation' },
    },
    handle(async ({ id }) => jsonResult(await client.deactivateAutomation(id))),
  );

  server.registerTool(
    'trigger_automation',
    {
      title: 'Trigger automation',
      description:
        'Manually trigger an active automation for a specific contact. The automation must be active. The execution runs asynchronously after the call returns.',
      inputSchema: {
        id: z.string().describe('Automation id.'),
        contact_id: z.string().describe('Contact id to run the automation for.'),
        context: z.record(z.unknown()).optional().describe('Optional context variables (message_text, conversation_id, etc.).'),
      },
      annotations: { ...WRITE, title: 'Trigger automation' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.triggerAutomation(id, body))),
  );

  server.registerTool(
    'duplicate_automation',
    {
      title: 'Duplicate automation',
      description:
        'Create a copy of an automation (as a draft). The duplicate has the same trigger and steps but is_active=false.',
      inputSchema: { id: z.string().describe('Automation id to duplicate.') },
      annotations: { ...WRITE, title: 'Duplicate automation' },
    },
    handle(async ({ id }) => jsonResult(await client.duplicateAutomation(id))),
  );

  // ── Flows ─────────────────────────────────────────────────

  server.registerTool(
    'create_flow',
    {
      title: 'Create flow',
      description:
        'Create a new conversation flow. Optionally clone from a template by passing template_slug (use list_flow_templates to see available slugs). Returns the flow and its initial node graph.',
      inputSchema: {
        name: z.string().optional().describe('Flow name (required if not using a template).'),
        description: z.string().optional(),
        trigger_type: z.enum(['keyword', 'first_inbound_message', 'manual']).optional().describe('Trigger type (default keyword).'),
        trigger_config: z.record(z.unknown()).optional(),
        template_slug: z.string().optional().describe('Clone from this template slug instead of creating empty.'),
      },
      annotations: { ...WRITE, title: 'Create flow' },
    },
    handle(async (args) => jsonResult(await client.createFlow(args))),
  );

  server.registerTool(
    'update_flow',
    {
      title: 'Update flow',
      description:
        'Replace a flow\'s header (name, trigger, entry_node_id) and optionally its full node graph. When nodes are provided the entire graph is replaced (delete-then-insert).',
      inputSchema: {
        id: z.string().describe('Flow id.'),
        name: z.string().optional(),
        description: z.string().nullable().optional(),
        trigger_type: z.enum(['keyword', 'first_inbound_message', 'manual']).optional(),
        trigger_config: z.record(z.unknown()).optional(),
        entry_node_id: z.string().nullable().optional().describe('Key of the entry node.'),
        fallback_policy: z.record(z.unknown()).optional(),
        nodes: z.array(flowNodeSchema).optional().describe('Replaces the entire node graph when provided.'),
      },
      annotations: { ...WRITE, title: 'Update flow' },
    },
    handle(async ({ id, ...body }) => jsonResult(await client.updateFlow(id, body))),
  );

  server.registerTool(
    'delete_flow',
    {
      title: 'Delete flow',
      description:
        'Permanently delete a flow and all its nodes, runs, and events. Active runs end abruptly. Requires confirm=true.',
      inputSchema: {
        id: z.string().describe('Flow id.'),
        confirm: z.boolean().describe('Must be true to proceed.'),
      },
      annotations: { ...DESTRUCTIVE, title: 'Delete flow' },
    },
    handle(async ({ id, confirm }) => {
      if (!confirm) return errorResult('Refusing to delete: set confirm=true to proceed.');
      await client.deleteFlow(id);
      return jsonResult({ deleted: true, id });
    }),
  );

  server.registerTool(
    'activate_flow',
    {
      title: 'Activate / change flow status',
      description:
        'Change a flow\'s status: "active" (validates and activates), "draft" (pauses), or "archived". The API validates the flow before activating and returns issues if invalid.',
      inputSchema: {
        id: z.string().describe('Flow id.'),
        status: z.enum(['active', 'draft', 'archived']).describe('Target status.'),
      },
      annotations: { ...WRITE, title: 'Activate / change flow status' },
    },
    handle(async ({ id, status }) => jsonResult(await client.activateFlow(id, { status }))),
  );

  server.registerTool(
    'deactivate_flow',
    {
      title: 'Deactivate flow',
      description: 'Set a flow back to draft status (pauses it without archiving).',
      inputSchema: { id: z.string().describe('Flow id.') },
      annotations: { ...WRITE, title: 'Deactivate flow' },
    },
    handle(async ({ id }) => jsonResult(await client.deactivateFlow(id))),
  );
}

// suppress unused import from tree-shaking the discriminated union
void AutomationStepConfigUnion;
