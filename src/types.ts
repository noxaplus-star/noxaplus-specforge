export interface OpenApiDocument {
  openapi: string;
  info: { title: string; version: string; description?: string };
  servers?: Array<{ url: string; description?: string }>;
  paths: Record<string, PathItem>;
  components?: { schemas?: Record<string, SchemaObject> };
  tags?: Array<{ name: string; description?: string }>;
}

export interface PathItem {
  $ref?: string;
  summary?: string;
  description?: string;
  parameters?: Parameter[];
  get?: Operation;
  put?: Operation;
  post?: Operation;
  delete?: Operation;
  options?: Operation;
  head?: Operation;
  patch?: Operation;
  trace?: Operation;
}

export interface Operation {
  operationId?: string;
  summary?: string;
  description?: string;
  tags?: string[];
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Record<string, ResponseObject>;
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  required?: boolean;
  description?: string;
  schema?: SchemaObject;
  example?: unknown;
}

export interface RequestBody {
  required?: boolean;
  description?: string;
  content?: Record<string, MediaType>;
}

export interface MediaType {
  schema?: SchemaObject;
  example?: unknown;
  examples?: Record<string, { value?: unknown } | unknown>;
}

export interface ResponseObject {
  description?: string;
  content?: Record<string, MediaType>;
}

export interface SchemaObject {
  $ref?: string;
  type?: string;
  format?: string;
  title?: string;
  description?: string;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  example?: unknown;
  examples?: unknown[] | Record<string, { value?: unknown }>;
  properties?: Record<string, SchemaObject>;
  required?: string[];
  items?: SchemaObject;
  allOf?: SchemaObject[];
  oneOf?: SchemaObject[];
  anyOf?: SchemaObject[];
  nullable?: boolean;
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  minItems?: number;
  maxItems?: number;
  uniqueItems?: boolean;
  additionalProperties?: boolean | SchemaObject;
  readOnly?: boolean;
  writeOnly?: boolean;
}

export interface MockRoute {
  method: string;
  path: string;
  operation: Operation;
  operationId: string;
  summary: string;
  tags: string[];
  kind: 'list' | 'item' | 'create' | 'update' | 'patch' | 'delete' | 'action';
  collectionPath?: string;
  pattern: RegExp;
  parameterNames: string[];
}

export interface LogEntry {
  id: number;
  time: string;
  method: string;
  path: string;
  status: number;
  durationMs: number;
  route: string | null;
  requestBody: string | null;
  responseBody: string;
  simulated: boolean;
}

export interface RuntimeOptions {
  seed: number;
  latency: number;
  errorRate: number;
}
