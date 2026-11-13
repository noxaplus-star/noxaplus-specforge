import { readFile } from 'node:fs/promises';
import { parse as parseYaml } from 'yaml';
import type { OpenApiDocument, PathItem, SchemaObject } from './types.js';

export class SpecForgeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SpecForgeError';
  }
}

export interface LoadedSpec {
  document: OpenApiDocument;
  source: string;
  title: string;
  version: string;
  routeCount: number;
}

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;

export async function loadSpec(file: string): Promise<LoadedSpec> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch {
    throw new SpecForgeError(`Could not read OpenAPI file "${file}".`);
  }
  return { ...parseSpecText(text, file), source: file };
}

export function parseSpecText(text: string, source = 'inline'): Omit<LoadedSpec, 'source'> {
  const trimmed = text.trim();
  if (!trimmed) throw new SpecForgeError(`The OpenAPI document "${source}" is empty.`);

  let parsed: unknown;
  if (source.toLowerCase().endsWith('.json') || trimmed.startsWith('{')) {
    try {
      parsed = JSON.parse(trimmed);
    } catch (error) {
      throw new SpecForgeError(`Invalid JSON in "${source}": ${error instanceof Error ? error.message : String(error)}`);
    }
  } else {
    try {
      parsed = parseYaml(trimmed);
    } catch (error) {
      throw new SpecForgeError(`Invalid YAML in "${source}": ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  return validateSpec(parsed, source);
}

export function validateSpec(value: unknown, source = 'inline'): Omit<LoadedSpec, 'source'> {
  if (!value || typeof value !== 'object') throw new SpecForgeError(`"${source}" is not an OpenAPI document.`);
  const document = value as OpenApiDocument;
  if (typeof document.openapi !== 'string' || !/^3\.\d/.test(document.openapi)) {
    throw new SpecForgeError(`"${source}" must declare openapi: 3.x. Found: ${String(document.openapi ?? 'nothing')}.`);
  }
  if (!document.info || typeof document.info.title !== 'string' || typeof document.info.version !== 'string') {
    throw new SpecForgeError(`"${source}" is missing info.title or info.version.`);
  }
  if (!document.paths || typeof document.paths !== 'object' || Object.keys(document.paths).length === 0) {
    throw new SpecForgeError(`"${source}" has no paths. Add at least one path with an operation.`);
  }
  for (const [path, item] of Object.entries(document.paths)) {
    if (!path.startsWith('/')) throw new SpecForgeError(`Path "${path}" must start with "/".`);
    if (!item || typeof item !== 'object') throw new SpecForgeError(`Path "${path}" is not a path item.`);
    const operations = METHODS.filter(method => (item as Record<string, unknown>)[method] !== undefined);
    if (operations.length === 0) throw new SpecForgeError(`Path "${path}" has no operations.`);
  }
  return {
    document,
    title: document.info.title,
    version: document.info.version,
    routeCount: countRoutes(document),
  };
}

export function countRoutes(document: OpenApiDocument): number {
  return Object.values(document.paths).reduce((total, item: PathItem) => {
    return total + METHODS.filter(method => item[method] !== undefined).length;
  }, 0);
}

export function resolveRef(document: OpenApiDocument, ref: string): unknown {
  if (!ref.startsWith('#/')) throw new SpecForgeError(`Only local $ref values are supported. Found "${ref}".`);
  let current: unknown = document;
  for (const rawPart of ref.slice(2).split('/')) {
    const part = rawPart.replaceAll('~1', '/').replaceAll('~0', '~');
    if (current === null || typeof current !== 'object') return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

export function resolveSchema(document: OpenApiDocument, schema: SchemaObject | undefined, depth = 0): SchemaObject | undefined {
  if (!schema) return undefined;
  if (schema.$ref) {
    if (depth > 12) return {};
    const resolved = resolveRef(document, schema.$ref);
    if (!resolved || typeof resolved !== 'object') throw new SpecForgeError(`Unresolved $ref "${schema.$ref}".`);
    const siblings = Object.fromEntries(Object.entries(schema).filter(([key]) => key !== '$ref'));
    return mergeSchemas(document, [resolved as SchemaObject, siblings], depth + 1);
  }
  return schema;
}

export function mergeSchemas(document: OpenApiDocument, schemas: SchemaObject[], depth = 0): SchemaObject {
  const merged: SchemaObject = {};
  const properties: Record<string, SchemaObject> = {};
  const required = new Set<string>();
  for (const raw of schemas) {
    const schema = resolveSchema(document, raw, depth + 1) ?? {};
    if (schema.type) merged.type = schema.type;
    if (schema.format) merged.format = schema.format;
    if (schema.enum) merged.enum = schema.enum;
    if (schema.example !== undefined) merged.example = schema.example;
    if (schema.default !== undefined) merged.default = schema.default;
    if (schema.items) merged.items = schema.items;
    if (schema.minimum !== undefined) merged.minimum = schema.minimum;
    if (schema.maximum !== undefined) merged.maximum = schema.maximum;
    if (schema.nullable !== undefined) merged.nullable = schema.nullable;
    if (schema.additionalProperties !== undefined) merged.additionalProperties = schema.additionalProperties;
    Object.assign(properties, schema.properties ?? {});
    for (const name of schema.required ?? []) required.add(name);
  }
  if (Object.keys(properties).length > 0) merged.properties = properties;
  if (required.size > 0) merged.required = [...required];
  if (!merged.type && merged.properties) merged.type = 'object';
  return merged;
}

export function responseSchema(document: OpenApiDocument, operation: { responses?: Record<string, { content?: Record<string, { schema?: SchemaObject }>; }> }, preferred = '200'): SchemaObject | undefined {
  const responses = operation.responses ?? {};
  const statuses = Object.keys(responses).sort();
  const success = statuses.filter(status => /^2/.test(status));
  const key = success.includes(preferred) ? preferred : success[0];
  if (!key) return undefined;
  const response = responses[key];
  const content = response?.content ?? {};
  const media = content['application/json'] ?? content['*/*'] ?? Object.values(content)[0];
  return media?.schema;
}

export function requestSchema(operation: { requestBody?: { content?: Record<string, { schema?: SchemaObject }> } }): SchemaObject | undefined {
  const content = operation.requestBody?.content ?? {};
  const media = content['application/json'] ?? content['*/*'] ?? Object.values(content)[0];
  return media?.schema;
}
