// ============================================================
// Read-only tools — always registered.
//
// Identity, contacts, conversations, messages, broadcasts,
// templates, deals, pipelines, stages, tags, automations, flows.
// None of these change state so they are safe to expose
// unconditionally. Each carries readOnlyHint.
// ============================================================

import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { WacrmClient } from '../client.js';
import { handle, jsonResult } from './shared.js';

const READ_ONLY = { readOnlyHint: true, openWorldHint: true } as const;

export function registerReadTools(server: McpServer, client: WacrmClient): void {
  // --- Identity ---------------------------------------------------

  server.registerTool(
    'get_me',
    {
      title: 'Get my account info',
      description:
        'Verify the API key and return the wacrm account it is bound to plus the scopes it carries. Call this first to confirm the connection is working.',
      inputSchema: {},
      annotations: { ...READ_ONLY, title: 'Get my account info' },
    },
    handle(async () => jsonResult(await client.me())),
  );

  // Keep legacy alias so existing tool calls don't break.
  server.registerTool(
    'whoami',
    {
      title: 'Who am I (alias)',
      description: 'Alias for get_me. Prefer get_me.',
      inputSchema: {},
      annotations: { ...READ_ONLY, title: 'Who am I' },
    },
    handle(async () => jsonResult(await client.me())),
  );

  // --- Contacts ---------------------------------------------------

  server.registerTool(
    'list_contacts',
    {
      title: 'List contacts',
      description:
        'List contacts in the CRM, newest first. Optionally filter by free-text search (name or phone) or by a tag id. Results are paginated: pass the returned next_cursor to fetch the next page.',
      inputSchema: {
        search: z.string().optional().describe('Free-text search over name or phone number.'),
        tag: z.string().optional().describe('Tag id to filter by.'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor from a previous response.'),
      },
      annotations: { ...READ_ONLY, title: 'List contacts' },
    },
    handle(async (args) => jsonResult(await client.listContacts(args))),
  );

  server.registerTool(
    'get_contact',
    {
      title: 'Get contact',
      description: 'Read a single contact by its id.',
      inputSchema: { id: z.string().describe('Contact id.') },
      annotations: { ...READ_ONLY, title: 'Get contact' },
    },
    handle(async ({ id }) => jsonResult(await client.getContact(id))),
  );

  // --- Conversations ----------------------------------------------

  server.registerTool(
    'list_conversations',
    {
      title: 'List conversations',
      description:
        'List conversations, newest first. Optionally filter by status (open/pending/closed) or by contact id. Paginated.',
      inputSchema: {
        status: z.enum(['open', 'pending', 'closed']).optional().describe('Status filter.'),
        contact_id: z.string().optional().describe('Only conversations for this contact.'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List conversations' },
    },
    handle(async (args) => jsonResult(await client.listConversations(args))),
  );

  server.registerTool(
    'get_conversation',
    {
      title: 'Get conversation',
      description: 'Read a single conversation by id, including its contact and tags.',
      inputSchema: { id: z.string().describe('Conversation id.') },
      annotations: { ...READ_ONLY, title: 'Get conversation' },
    },
    handle(async ({ id }) => jsonResult(await client.getConversation(id))),
  );

  server.registerTool(
    'list_messages',
    {
      title: 'List messages',
      description:
        'List the messages in a conversation, newest first. Each message includes direction (inbound/outbound), delivery status, and content. Paginated.',
      inputSchema: {
        conversation_id: z.string().describe('The conversation to read messages from.'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List messages' },
    },
    handle(async ({ conversation_id, limit, cursor }) =>
      jsonResult(await client.listConversationMessages(conversation_id, { limit, cursor })),
    ),
  );

  // --- Broadcasts -------------------------------------------------

  server.registerTool(
    'list_broadcasts',
    {
      title: 'List broadcasts',
      description: 'List broadcast campaigns, newest first. Paginated.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List broadcasts' },
    },
    handle(async (args) => jsonResult(await client.listBroadcasts(args))),
  );

  server.registerTool(
    'get_broadcast',
    {
      title: 'Get broadcast status',
      description:
        'Read a broadcast campaign by id — its status and delivered/read/rejected counts. Use this to poll progress after launching one.',
      inputSchema: { id: z.string().describe('Broadcast id.') },
      annotations: { ...READ_ONLY, title: 'Get broadcast status' },
    },
    handle(async ({ id }) => jsonResult(await client.getBroadcast(id))),
  );

  // --- Templates --------------------------------------------------

  server.registerTool(
    'list_templates',
    {
      title: 'List message templates',
      description:
        'List Meta-approved WhatsApp message templates for this account. Optionally filter by status (APPROVED, PENDING, REJECTED) or category (Marketing, Utility, Authentication). Paginated.',
      inputSchema: {
        status: z
          .enum(['APPROVED', 'PENDING', 'REJECTED', 'PAUSED', 'DISABLED', 'IN_APPEAL', 'PENDING_DELETION', 'DRAFT'])
          .optional()
          .describe('Filter by template status.'),
        category: z
          .enum(['Marketing', 'Utility', 'Authentication'])
          .optional()
          .describe('Filter by category.'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List message templates' },
    },
    handle(async (args) => jsonResult(await client.listTemplates(args))),
  );

  server.registerTool(
    'get_template',
    {
      title: 'Get message template',
      description: 'Read a single message template by id.',
      inputSchema: { id: z.string().describe('Template id.') },
      annotations: { ...READ_ONLY, title: 'Get message template' },
    },
    handle(async ({ id }) => jsonResult(await client.getTemplate(id))),
  );

  // --- Deals ------------------------------------------------------

  server.registerTool(
    'list_deals',
    {
      title: 'List deals',
      description:
        'List CRM deals, newest first. Optionally filter by pipeline, stage, or status (open/won/lost). Paginated.',
      inputSchema: {
        pipeline_id: z.string().optional().describe('Filter by pipeline id.'),
        stage_id: z.string().optional().describe('Filter by stage id.'),
        status: z.enum(['open', 'won', 'lost']).optional().describe('Deal status filter.'),
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List deals' },
    },
    handle(async (args) => jsonResult(await client.listDeals(args))),
  );

  server.registerTool(
    'get_deal',
    {
      title: 'Get deal',
      description: 'Read a single deal by id, including its contact and stage.',
      inputSchema: { id: z.string().describe('Deal id.') },
      annotations: { ...READ_ONLY, title: 'Get deal' },
    },
    handle(async ({ id }) => jsonResult(await client.getDeal(id))),
  );

  // --- Pipelines --------------------------------------------------

  server.registerTool(
    'list_pipelines',
    {
      title: 'List pipelines',
      description: 'List CRM pipelines with their stages. Paginated.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List pipelines' },
    },
    handle(async (args) => jsonResult(await client.listPipelines(args))),
  );

  server.registerTool(
    'get_pipeline',
    {
      title: 'Get pipeline',
      description: 'Read a single pipeline by id, including its stages.',
      inputSchema: { id: z.string().describe('Pipeline id.') },
      annotations: { ...READ_ONLY, title: 'Get pipeline' },
    },
    handle(async ({ id }) => jsonResult(await client.getPipeline(id))),
  );

  server.registerTool(
    'list_stages',
    {
      title: 'List pipeline stages',
      description: 'List all stages in a pipeline, ordered by position.',
      inputSchema: { pipeline_id: z.string().describe('Pipeline id.') },
      annotations: { ...READ_ONLY, title: 'List pipeline stages' },
    },
    handle(async ({ pipeline_id }) => jsonResult(await client.listStages(pipeline_id))),
  );

  // --- Tags -------------------------------------------------------

  server.registerTool(
    'list_tags',
    {
      title: 'List tags',
      description: 'List all contact tags for this account. Paginated.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List tags' },
    },
    handle(async (args) => jsonResult(await client.listTags(args))),
  );

  // --- Automations ------------------------------------------------

  server.registerTool(
    'list_automations',
    {
      title: 'List automations',
      description: 'List all automations for this account, newest first. Paginated.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List automations' },
    },
    handle(async (args) => jsonResult(await client.listAutomations(args))),
  );

  server.registerTool(
    'get_automation',
    {
      title: 'Get automation',
      description: 'Read a single automation by id, including its full step tree.',
      inputSchema: { id: z.string().describe('Automation id.') },
      annotations: { ...READ_ONLY, title: 'Get automation' },
    },
    handle(async ({ id }) => jsonResult(await client.getAutomation(id))),
  );

  // --- Flows ------------------------------------------------------

  server.registerTool(
    'list_flows',
    {
      title: 'List flows',
      description: 'List all conversation flows for this account, newest first. Paginated.',
      inputSchema: {
        limit: z.number().int().min(1).max(100).optional().describe('Page size 1–100 (default 50).'),
        cursor: z.string().optional().describe('Opaque pagination cursor.'),
      },
      annotations: { ...READ_ONLY, title: 'List flows' },
    },
    handle(async (args) => jsonResult(await client.listFlows(args))),
  );

  server.registerTool(
    'get_flow',
    {
      title: 'Get flow',
      description: 'Read a single flow by id, including its node graph.',
      inputSchema: { id: z.string().describe('Flow id.') },
      annotations: { ...READ_ONLY, title: 'Get flow' },
    },
    handle(async ({ id }) => jsonResult(await client.getFlow(id))),
  );

  server.registerTool(
    'list_flow_runs',
    {
      title: 'List flow runs',
      description:
        'List the 50 most recent runs for a flow, with embedded event timelines. Use this to debug what the bot did with each customer.',
      inputSchema: { flow_id: z.string().describe('Flow id.') },
      annotations: { ...READ_ONLY, title: 'List flow runs' },
    },
    handle(async ({ flow_id }) => jsonResult(await client.listFlowRuns(flow_id))),
  );

  server.registerTool(
    'list_flow_templates',
    {
      title: 'List flow templates',
      description:
        'List the available flow template gallery (slug, name, description, trigger_type, node_count). Use the slug with create_flow to clone a template.',
      inputSchema: {},
      annotations: { ...READ_ONLY, title: 'List flow templates' },
    },
    handle(async () => jsonResult(await client.listFlowTemplates())),
  );
}
