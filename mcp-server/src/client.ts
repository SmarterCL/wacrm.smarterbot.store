// ============================================================
// wacrm public API client.
//
// A thin wrapper over the `/api/v1` REST surface. It attaches the
// bearer key, unwraps the `{ data }` / `{ error }` envelope, and
// turns API failures into a typed WacrmApiError the tools can render
// cleanly. Nothing here knows about MCP — it's just the CRM API.
// ============================================================

import type { Config } from './config.js';

/** A structured error from the wacrm API envelope (`{ error: { code, message } }`). */
export class WacrmApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.name = 'WacrmApiError';
    this.status = status;
    this.code = code;
  }
}

export interface Paginated<T> {
  data: T[];
  next_cursor: string | null;
}

export class WacrmClient {
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(config: Pick<Config, 'baseUrl' | 'apiKey'>) {
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async request<T>(
    method: string,
    path: string,
    options: { query?: Record<string, string | number | undefined>; body?: unknown } = {},
  ): Promise<{ data: T; meta?: { next_cursor: string | null } }> {
    const url = new URL(`${this.baseUrl}/api/v1${path}`);
    if (options.query) {
      for (const [key, value] of Object.entries(options.query)) {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.set(key, String(value));
        }
      }
    }

    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.apiKey}`,
      Accept: 'application/json',
    };
    if (options.body !== undefined) {
      headers['Content-Type'] = 'application/json';
    }

    let res: Response;
    try {
      res = await fetch(url, {
        method,
        headers,
        body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      });
    } catch (err) {
      throw new WacrmApiError(
        0,
        'network_error',
        `Could not reach wacrm at ${this.baseUrl}: ${(err as Error).message}`,
      );
    }

    let payload: unknown = undefined;
    const text = await res.text();
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        if (!res.ok) {
          throw new WacrmApiError(res.status, 'internal', text.slice(0, 500));
        }
      }
    }

    if (!res.ok) {
      const envelope = payload as { error?: { code?: string; message?: string } } | undefined;
      const code = envelope?.error?.code ?? 'internal';
      let message = envelope?.error?.message ?? `Request failed with status ${res.status}`;
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        if (retryAfter) message += ` (retry after ${retryAfter}s)`;
      }
      throw new WacrmApiError(res.status, code, message);
    }

    const envelope = payload as { data: T; meta?: { next_cursor: string | null } };
    return { data: envelope.data, meta: envelope.meta };
  }

  private async list<T>(
    path: string,
    query: Record<string, string | number | undefined>,
  ): Promise<Paginated<T>> {
    const res = await this.request<T[]>('GET', path, { query });
    return { data: res.data, next_cursor: res.meta?.next_cursor ?? null };
  }

  // --- Identity -----------------------------------------------------

  me(): Promise<{ data: unknown }> {
    return this.request('GET', '/me');
  }

  // --- Messages -----------------------------------------------------

  sendMessage(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/messages', { body });
  }

  sendTemplateMessage(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/messages/template', { body });
  }

  // --- Contacts -----------------------------------------------------

  listContacts(query: {
    limit?: number;
    cursor?: string;
    search?: string;
    tag?: string;
  }): Promise<Paginated<unknown>> {
    return this.list('/contacts', query);
  }

  getContact(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/contacts/${encodeURIComponent(id)}`);
  }

  createContact(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/contacts', { body });
  }

  updateContact(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('PATCH', `/contacts/${encodeURIComponent(id)}`, { body });
  }

  deleteContact(id: string): Promise<{ data: null }> {
    return this.request('DELETE', `/contacts/${encodeURIComponent(id)}`).then(() => ({ data: null }));
  }

  // --- Conversations ------------------------------------------------

  listConversations(query: {
    limit?: number;
    cursor?: string;
    status?: string;
    contact_id?: string;
  }): Promise<Paginated<unknown>> {
    return this.list('/conversations', query);
  }

  getConversation(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/conversations/${encodeURIComponent(id)}`);
  }

  updateConversation(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('PATCH', `/conversations/${encodeURIComponent(id)}`, { body });
  }

  listConversationMessages(
    id: string,
    query: { limit?: number; cursor?: string },
  ): Promise<Paginated<unknown>> {
    return this.list(`/conversations/${encodeURIComponent(id)}/messages`, query);
  }

  // --- Broadcasts ---------------------------------------------------

  listBroadcasts(query: { limit?: number; cursor?: string }): Promise<Paginated<unknown>> {
    return this.list('/broadcasts', query);
  }

  sendBroadcast(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/broadcasts', { body });
  }

  getBroadcast(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/broadcasts/${encodeURIComponent(id)}`);
  }

  // --- Templates ----------------------------------------------------

  listTemplates(query: {
    limit?: number;
    cursor?: string;
    status?: string;
    category?: string;
  }): Promise<Paginated<unknown>> {
    return this.list('/templates', query);
  }

  getTemplate(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/templates/${encodeURIComponent(id)}`);
  }

  // --- Deals --------------------------------------------------------

  listDeals(query: {
    limit?: number;
    cursor?: string;
    pipeline_id?: string;
    stage_id?: string;
    status?: string;
  }): Promise<Paginated<unknown>> {
    return this.list('/deals', query);
  }

  getDeal(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/deals/${encodeURIComponent(id)}`);
  }

  createDeal(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/deals', { body });
  }

  updateDeal(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('PATCH', `/deals/${encodeURIComponent(id)}`, { body });
  }

  deleteDeal(id: string): Promise<{ data: null }> {
    return this.request('DELETE', `/deals/${encodeURIComponent(id)}`).then(() => ({ data: null }));
  }

  // --- Pipelines ----------------------------------------------------

  listPipelines(query: { limit?: number; cursor?: string }): Promise<Paginated<unknown>> {
    return this.list('/pipelines', query);
  }

  getPipeline(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/pipelines/${encodeURIComponent(id)}`);
  }

  createPipeline(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/pipelines', { body });
  }

  updatePipeline(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('PATCH', `/pipelines/${encodeURIComponent(id)}`, { body });
  }

  deletePipeline(id: string): Promise<{ data: null }> {
    return this.request('DELETE', `/pipelines/${encodeURIComponent(id)}`).then(() => ({ data: null }));
  }

  // --- Stages -------------------------------------------------------

  listStages(pipelineId: string): Promise<Paginated<unknown>> {
    return this.list(`/pipelines/${encodeURIComponent(pipelineId)}/stages`, {});
  }

  createStage(pipelineId: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', `/pipelines/${encodeURIComponent(pipelineId)}/stages`, { body });
  }

  updateStage(pipelineId: string, stageId: string, body: unknown): Promise<{ data: unknown }> {
    return this.request(
      'PATCH',
      `/pipelines/${encodeURIComponent(pipelineId)}/stages/${encodeURIComponent(stageId)}`,
      { body },
    );
  }

  deleteStage(pipelineId: string, stageId: string): Promise<{ data: null }> {
    return this.request(
      'DELETE',
      `/pipelines/${encodeURIComponent(pipelineId)}/stages/${encodeURIComponent(stageId)}`,
    ).then(() => ({ data: null }));
  }

  // --- Tags ---------------------------------------------------------

  listTags(query: { limit?: number; cursor?: string }): Promise<Paginated<unknown>> {
    return this.list('/tags', query);
  }

  createTag(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/tags', { body });
  }

  updateTag(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('PATCH', `/tags/${encodeURIComponent(id)}`, { body });
  }

  deleteTag(id: string): Promise<{ data: null }> {
    return this.request('DELETE', `/tags/${encodeURIComponent(id)}`).then(() => ({ data: null }));
  }

  // --- Automations --------------------------------------------------

  listAutomations(query: { limit?: number; cursor?: string }): Promise<Paginated<unknown>> {
    return this.list('/automations', query);
  }

  getAutomation(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/automations/${encodeURIComponent(id)}`);
  }

  createAutomation(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/automations', { body });
  }

  updateAutomation(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('PATCH', `/automations/${encodeURIComponent(id)}`, { body });
  }

  deleteAutomation(id: string): Promise<{ data: null }> {
    return this.request('DELETE', `/automations/${encodeURIComponent(id)}`).then(() => ({ data: null }));
  }

  activateAutomation(id: string): Promise<{ data: unknown }> {
    return this.request('POST', `/automations/${encodeURIComponent(id)}/activate`);
  }

  deactivateAutomation(id: string): Promise<{ data: unknown }> {
    return this.request('POST', `/automations/${encodeURIComponent(id)}/deactivate`);
  }

  triggerAutomation(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', `/automations/${encodeURIComponent(id)}/trigger`, { body });
  }

  duplicateAutomation(id: string): Promise<{ data: unknown }> {
    return this.request('POST', `/automations/${encodeURIComponent(id)}/duplicate`);
  }

  // --- Flows --------------------------------------------------------

  listFlows(query: { limit?: number; cursor?: string }): Promise<Paginated<unknown>> {
    return this.list('/flows', query);
  }

  getFlow(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/flows/${encodeURIComponent(id)}`);
  }

  createFlow(body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', '/flows', { body });
  }

  updateFlow(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('PUT', `/flows/${encodeURIComponent(id)}`, { body });
  }

  deleteFlow(id: string): Promise<{ data: null }> {
    return this.request('DELETE', `/flows/${encodeURIComponent(id)}`).then(() => ({ data: null }));
  }

  activateFlow(id: string, body: unknown): Promise<{ data: unknown }> {
    return this.request('POST', `/flows/${encodeURIComponent(id)}/activate`, { body });
  }

  deactivateFlow(id: string): Promise<{ data: unknown }> {
    return this.request('POST', `/flows/${encodeURIComponent(id)}/deactivate`);
  }

  listFlowRuns(id: string): Promise<{ data: unknown }> {
    return this.request('GET', `/flows/${encodeURIComponent(id)}/runs`);
  }

  listFlowTemplates(): Promise<{ data: unknown }> {
    return this.request('GET', '/flows/templates');
  }
}
