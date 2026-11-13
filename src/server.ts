import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import { renderDashboard } from './dashboard.js';
import { deterministicFraction, generateSample } from './generate.js';
import { requestSchema, resolveSchema, responseSchema } from './load.js';
import { buildRoutes, matchRoute, normalizeBase } from './routes.js';
import { MockStore } from './store.js';
import type { LogEntry, MockRoute, OpenApiDocument, RuntimeOptions, SchemaObject } from './types.js';

export interface MockServerOptions {
  base?: string;
  seed?: number;
  latency?: number;
  errorRate?: number;
  host?: string;
  port?: number;
  quiet?: boolean;
}

export interface ListenResult {
  url: string;
  dashboardUrl: string;
  port: number;
}

export interface MockServer {
  server: Server;
  routes: MockRoute[];
  store: MockStore;
  runtime: RuntimeOptions;
  listen: (port?: number, host?: string) => Promise<ListenResult>;
  close: () => Promise<void>;
}

interface Outcome {
  status: number;
  body: unknown;
  headers?: Record<string, string>;
  simulated?: boolean;
}

const MAX_BODY = 1_048_576;
const MAX_LOG_BODY = 4_000;

function setCors(response: ServerResponse): void {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS,HEAD');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-SpecForge-Error');
  response.setHeader('Access-Control-Expose-Headers', 'X-SpecForge-Route');
}

function sendJson(response: ServerResponse, status: number, body: unknown, headers: Record<string, string> = {}): void {
  for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
  if (status === 204 || body === undefined) {
    response.statusCode = status;
    response.end();
    return;
  }
  const payload = JSON.stringify(body, null, 2);
  response.statusCode = status;
  response.setHeader('Content-Type', 'application/json; charset=utf-8');
  response.setHeader('Content-Length', Buffer.byteLength(payload));
  response.end(payload);
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function readBody(request: IncomingMessage): Promise<{ text: string | null; json: unknown; error: string | null }> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    request.on('data', (chunk: Buffer) => {
      size += chunk.length;
      if (size > MAX_BODY) {
        request.destroy();
        resolve({ text: null, json: undefined, error: 'Request body exceeds 1 MiB.' });
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      const text = Buffer.concat(chunks).toString('utf8');
      if (!text.trim()) {
        resolve({ text: null, json: undefined, error: null });
        return;
      }
      try {
        resolve({ text, json: JSON.parse(text), error: null });
      } catch {
        resolve({ text, json: undefined, error: 'Request body is not valid JSON.' });
      }
    });
    request.on('error', reject);
  });
}

function asObject(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function successStatus(operation: MockRoute['operation']): number {
  const statuses = Object.keys(operation.responses ?? {}).filter(key => /^2\d\d$/.test(key)).map(Number).sort((left, right) => left - right);
  return statuses[0] ?? 200;
}

function responseExample(operation: MockRoute['operation'], status: number): unknown {
  const response = operation.responses?.[String(status)];
  const content = response?.content ?? {};
  const media = content['application/json'] ?? content['*/*'] ?? Object.values(content)[0];
  if (!media) return undefined;
  if (media.example !== undefined) return media.example;
  if (media.examples) {
    const first = Array.isArray(media.examples) ? media.examples[0] : Object.values(media.examples)[0];
    if (first !== undefined) {
      return first && typeof first === 'object' && 'value' in first ? (first as { value?: unknown }).value : first;
    }
  }
  return undefined;
}

function listKey(schema: SchemaObject): string | undefined {
  const properties = schema.properties ?? {};
  const preferred = ['items', 'data', 'results', 'records', 'content'].find(name => {
    const property = properties[name];
    return property && (property.type === 'array' || property.items !== undefined);
  });
  return preferred ?? Object.keys(properties).find(name => {
    const property = properties[name];
    return property && (property.type === 'array' || property.items !== undefined);
  });
}

export function createMockServer(document: OpenApiDocument, options: MockServerOptions = {}): MockServer {
  const base = normalizeBase(options.base);
  const routes = buildRoutes(document, base);
  const runtime: RuntimeOptions = {
    seed: options.seed ?? 42,
    latency: Math.max(0, options.latency ?? 0),
    errorRate: Math.min(1, Math.max(0, options.errorRate ?? 0)),
  };
  const store = new MockStore(document, routes, runtime.seed);
  const quiet = options.quiet ?? false;
  let logs: LogEntry[] = [];
  let totalRequests = 0;
  let totalErrors = 0;
  let totalDuration = 0;
  let logId = 0;
  let url = '';
  let dashboardUrl = '';
  let resolvedPort = options.port ?? 4010;

  function buildUrl(request: IncomingMessage): string {
    const host = request.headers.host ?? `127.0.0.1:${resolvedPort}`;
    return `http://${host}${base}`;
  }

  function log(entry: Omit<LogEntry, 'id'>): void {
    logId += 1;
    logs = [{ id: logId, ...entry }, ...logs].slice(0, 100);
    if (!quiet) {
      const simulated = entry.simulated ? ' (simulated)' : '';
      console.log(`${entry.method} ${entry.path} ${entry.status} ${entry.durationMs}ms${simulated}`);
    }
  }

  function statePayload(request: IncomingMessage): unknown {
    return {
      spec: {
        title: document.info.title,
        version: document.info.version,
        description: document.info.description ?? '',
        openapi: document.openapi,
      },
      baseUrl: buildUrl(request),
      routes: routes.map(route => ({
        method: route.method,
        path: route.path,
        operationId: route.operationId,
        summary: route.summary,
        tags: route.tags,
        kind: route.kind,
      })),
      collections: store.toSummary(),
      runtime: { ...runtime },
      stats: {
        requests: totalRequests,
        errors: totalErrors,
        avgDuration: totalRequests === 0 ? 0 : Math.round(totalDuration / totalRequests),
      },
      requests: logs,
    };
  }

  function simulatedError(request: IncomingMessage, search: URLSearchParams): number | null {
    const fromQuery = Number(search.get('__error'));
    if (Number.isInteger(fromQuery) && fromQuery >= 400 && fromQuery <= 599) return fromQuery;
    const header = request.headers['x-specforge-error'];
    const fromHeader = Number(Array.isArray(header) ? header[0] : header);
    if (Number.isInteger(fromHeader) && fromHeader >= 400 && fromHeader <= 599) return fromHeader;
    if (runtime.errorRate > 0 && deterministicFraction(runtime.seed, `simulate:${totalRequests}`) < runtime.errorRate) {
      return 500;
    }
    return null;
  }

  function renderList(route: MockRoute, items: Array<Record<string, unknown>>, total: number): unknown {
    const schema = resolveSchema(document, responseSchema(document, route.operation));
    if (!schema) return items;
    if (schema.type === 'array') return items;
    const generated = generateSample(document, schema, runtime.seed, `${route.method}:${route.path}.list`);
    const template = asObject(generated);
    if (!template) return items;
    const key = listKey(schema);
    if (key) template[key] = items;
    for (const name of ['total', 'count', 'totalCount']) {
      if (typeof template[name] === 'number') template[name] = total;
    }
    return template;
  }

  function handleRoute(route: MockRoute, params: Record<string, string>, search: URLSearchParams, body: unknown, bodyError: string | null, requestIndex: number): Outcome {
    const collection = route.collectionPath;
    const isBodyMethod = ['POST', 'PUT', 'PATCH'].includes(route.method);

    if (isBodyMethod && bodyError) {
      return { status: 400, body: { error: { status: 400, message: bodyError, source: 'specforge' } } };
    }

    if (route.kind === 'list' && collection) {
      let items = [...store.list(collection)];
      for (const [key, value] of search.entries()) {
        if (key.startsWith('__')) continue;
        items = items.filter(item => String(item[key]) === value);
      }
      const total = items.length;
      const sort = search.get('__sort');
      if (sort) {
        const direction = search.get('__order') === 'desc' ? -1 : 1;
        items.sort((left, right) => String(left[sort] ?? '').localeCompare(String(right[sort] ?? ''), undefined, { numeric: true }) * direction);
      }
      const offset = Math.max(0, Number(search.get('__offset')) || 0);
      const limit = Number(search.get('__limit'));
      if (Number.isFinite(limit) && limit > 0) items = items.slice(offset, offset + Math.min(limit, 1000));
      else if (offset > 0) items = items.slice(offset);
      return { status: 200, body: renderList(route, items, total) };
    }

    if (route.kind === 'item' && collection) {
      const id = params[route.parameterNames.at(-1) ?? ''] ?? '';
      const item = store.find(collection, id);
      if (!item) return { status: 404, body: { error: { status: 404, message: `No item "${id}" in ${collection}.`, source: 'specforge' } } };
      return { status: 200, body: item };
    }

    if (route.kind === 'create' && collection) {
      const object = asObject(body);
      if (!object) return { status: 400, body: { error: { status: 400, message: 'A JSON object body is required.', source: 'specforge' } } };
      const itemSchema = store.getState(collection)?.itemSchema;
      const missing = (itemSchema?.required ?? []).filter(name => itemSchema?.properties?.[name]?.readOnly !== true && object[name] === undefined);
      if (missing.length > 0) {
        return { status: 422, body: { error: { status: 422, message: 'Required fields are missing.', details: missing, source: 'specforge' } } };
      }
      const template = asObject(generateSample(document, itemSchema, runtime.seed, `${route.path}.created.${requestIndex}`)) ?? {};
      const idKey = store.getState(collection)?.idKey;
      if (idKey) delete template[idKey];
      const item = store.create(collection, { ...template, ...object });
      return { status: 201, body: item, headers: idKey ? { Location: `${route.path}/${String(item[idKey])}` } : {} };
    }

    if ((route.kind === 'update' || route.kind === 'patch') && collection) {
      const id = params[route.parameterNames.at(-1) ?? ''] ?? '';
      const object = asObject(body);
      if (!object) return { status: 400, body: { error: { status: 400, message: 'A JSON object body is required.', source: 'specforge' } } };
      const updated = route.kind === 'update' ? store.replace(collection, id, object) : store.patch(collection, id, object);
      if (!updated) return { status: 404, body: { error: { status: 404, message: `No item "${id}" in ${collection}.`, source: 'specforge' } } };
      return { status: 200, body: updated };
    }

    if (route.kind === 'delete' && collection) {
      const id = params[route.parameterNames.at(-1) ?? ''] ?? '';
      if (!store.remove(collection, id)) return { status: 404, body: { error: { status: 404, message: `No item "${id}" in ${collection}.`, source: 'specforge' } } };
      return { status: 204, body: undefined };
    }

    const status = successStatus(route.operation);
    if (status === 204) return { status, body: undefined };
    const example = responseExample(route.operation, status);
    if (example !== undefined) return { status, body: example };
    const schema = responseSchema(document, route.operation, String(status)) ?? requestSchema(route.operation);
    const generated = generateSample(document, schema, runtime.seed, `${route.method}:${route.path}.response`);
    return { status, body: generated ?? {} };
  }

  async function handleAdmin(request: IncomingMessage, response: ServerResponse, pathname: string, search: URLSearchParams, body: unknown): Promise<boolean> {
    if (pathname !== '/__specforge/api/state' && pathname !== '/__specforge/api/reset' && pathname !== '/__specforge/api/simulate' && !/^\/__specforge\/api\/requests\/\d+$/.test(pathname)) {
      return false;
    }

    if (pathname === '/__specforge/api/state' && request.method === 'GET') {
      sendJson(response, 200, statePayload(request));
      return true;
    }

    if (pathname === '/__specforge/api/reset' && request.method === 'POST') {
      store.reset();
      logs = [];
      totalRequests = 0;
      totalErrors = 0;
      totalDuration = 0;
      logId = 0;
      sendJson(response, 200, statePayload(request));
      return true;
    }

    if (pathname === '/__specforge/api/simulate' && request.method === 'POST') {
      const object = asObject(body) ?? {};
      if (object.latency !== undefined) {
        const latency = Number(object.latency);
        if (Number.isFinite(latency)) runtime.latency = Math.min(10_000, Math.max(0, Math.round(latency)));
      }
      if (object.errorRate !== undefined) {
        const rate = Number(object.errorRate);
        if (Number.isFinite(rate)) runtime.errorRate = Math.min(1, Math.max(0, rate));
      }
      sendJson(response, 200, { runtime: { ...runtime } });
      return true;
    }

    const match = /^\/__specforge\/api\/requests\/(\d+)$/.exec(pathname);
    if (match && request.method === 'GET') {
      const entry = logs.find(item => item.id === Number(match[1]));
      if (!entry) {
        sendJson(response, 404, { error: { status: 404, message: 'Request log entry not found.' } });
      } else {
        sendJson(response, 200, entry);
      }
      return true;
    }

    void search;
    sendJson(response, 405, { error: { status: 405, message: 'Method not allowed for this admin endpoint.' } });
    return true;
  }

  async function handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const started = performance.now();
    setCors(response);
    const parsed = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
    const pathname = parsed.pathname;
    const search = parsed.searchParams;

    if (pathname === '/__specforge' || pathname === '/__specforge/' || pathname === '/__specforge/index.html') {
      const html = renderDashboard();
      response.statusCode = 200;
      response.setHeader('Content-Type', 'text/html; charset=utf-8');
      response.setHeader('Content-Length', Buffer.byteLength(html));
      response.end(request.method === 'HEAD' ? undefined : html);
      return;
    }

    if (pathname.startsWith('/__specforge/api/')) {
      const bodyState = await readBody(request);
      const handled = await handleAdmin(request, response, pathname, search, bodyState.json);
      if (handled) return;
    }

    if (request.method === 'OPTIONS') {
      response.statusCode = 204;
      response.end();
      return;
    }

    const bodyState = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method ?? '') ? await readBody(request) : { text: null, json: undefined, error: null };
    const matched = matchRoute(routes, request.method ?? 'GET', pathname);
    let status = 404;
    let payload: unknown = {
      error: {
        status: 404,
        message: `No mock route matches ${request.method} ${pathname}.`,
        hint: 'Open /__specforge to inspect the available routes.',
        source: 'specforge',
      },
    };
    let headers: Record<string, string> = { 'X-SpecForge-Route': 'none' };
    let simulated = false;

    const delayParam = Number(search.get('__delay'));
    const delay = runtime.latency + (Number.isFinite(delayParam) ? Math.min(10_000, Math.max(0, delayParam)) : 0);
    if (delay > 0) await sleep(delay);

    if (matched) {
      totalRequests += 1;
      const injected = simulatedError(request, search);
      if (injected !== null) {
        status = injected;
        payload = { error: { status: injected, message: 'Simulated failure injected by SpecForge.', hint: 'Remove __error, X-SpecForge-Error, or the global error rate to get a normal response.', source: 'specforge' } };
        simulated = true;
      } else {
        const outcome = handleRoute(matched.route, matched.params, search, bodyState.json, bodyState.error, totalRequests);
        status = outcome.status;
        payload = outcome.body;
        headers = { ...outcome.headers, 'X-SpecForge-Route': `${matched.route.method} ${matched.route.path}` };
      }
    }

    const duration = Math.round(performance.now() - started);
    if (matched) {
      totalDuration += duration;
      if (status >= 400) totalErrors += 1;
    }
    sendJson(response, status, payload, headers);
    log({
      time: new Date().toISOString(),
      method: request.method ?? 'GET',
      path: pathname,
      status,
      durationMs: duration,
      route: matched ? `${matched.route.method} ${matched.route.path}` : null,
      requestBody: bodyState.text ? bodyState.text.slice(0, MAX_LOG_BODY) : null,
      responseBody: payload === undefined ? '' : JSON.stringify(payload).slice(0, MAX_LOG_BODY),
      simulated,
    });
  }

  const server = createServer((request, response) => {
    handle(request, response).catch(error => {
      if (!response.headersSent) {
        sendJson(response, 500, { error: { status: 500, message: error instanceof Error ? error.message : 'Unexpected server error.', source: 'specforge' } });
      } else {
        response.end();
      }
    });
  });

  return {
    server,
    routes,
    store,
    runtime,
    async listen(port = options.port ?? 4010, host = options.host ?? '127.0.0.1'): Promise<ListenResult> {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: Error): void => reject(error);
        server.once('error', onError);
        server.listen(port, host, () => {
          server.off('error', onError);
          resolve();
        });
      });
      const address = server.address();
      resolvedPort = address && typeof address === 'object' ? address.port : port;
      url = `http://${host}:${resolvedPort}`;
      dashboardUrl = `${url}/__specforge`;
      return { url, dashboardUrl, port: resolvedPort };
    },
    async close(): Promise<void> {
      await new Promise<void>(resolve => {
        server.close(() => resolve());
        server.closeAllConnections();
      });
    },
  };
}
