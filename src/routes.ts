import type { MockRoute, OpenApiDocument, Operation, PathItem, SchemaObject } from './types.js';
import { requestSchema, resolveSchema, responseSchema } from './load.js';

const METHODS = ['get', 'put', 'post', 'delete', 'options', 'head', 'patch', 'trace'] as const;
const TRAILING_PARAM = /\{([^}/]+)\}$/;

export function normalizeBase(base: string | undefined): string {
  if (!base || base === '/') return '';
  const trimmed = base.replace(/\/+$/, '');
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

function normalizeCollection(path: string): string {
  return path.length > 1 ? path.replace(/\/+$/, '') : path;
}

function looksLikeCollection(document: OpenApiDocument, operation: Operation): boolean {
  const schema = resolveSchema(document, responseSchema(document, operation));
  if (!schema) return false;
  if (schema.type === 'array' || schema.items) return true;
  return Object.values(schema.properties ?? {}).some(property => property.type === 'array' || property.items !== undefined);
}

export function buildRoutes(document: OpenApiDocument, base = ''): MockRoute[] {
  const prefix = normalizeBase(base);
  const routes: MockRoute[] = [];

  for (const [path, item] of Object.entries(document.paths)) {
    for (const method of METHODS) {
      const operation = (item as PathItem)[method];
      if (!operation) continue;
      const fullPath = `${prefix}${path}`;
      const match = TRAILING_PARAM.exec(path);
      let kind: MockRoute['kind'] = 'action';
      let collectionPath: string | undefined;

      if (match) {
        collectionPath = normalizeCollection(`${prefix}${path.replace(TRAILING_PARAM, '')}`);
        if (method === 'get') kind = 'item';
        else if (method === 'put') kind = 'update';
        else if (method === 'patch') kind = 'patch';
        else if (method === 'delete') kind = 'delete';
        else kind = 'action';
      } else if (method === 'get') {
        if (!path.includes('{') && looksLikeCollection(document, operation)) {
          kind = 'list';
          collectionPath = normalizeCollection(fullPath);
        } else {
          kind = 'action';
        }
      } else if (method === 'post' && !path.includes('{')) {
        kind = 'create';
        collectionPath = normalizeCollection(fullPath);
      }

      routes.push({
        method: method.toUpperCase(),
        path: fullPath,
        operation,
        operationId: operation.operationId ?? `${method}_${path}`,
        summary: operation.summary ?? operation.description ?? `${method.toUpperCase()} ${path}`,
        tags: operation.tags ?? [],
        kind,
        ...(collectionPath ? { collectionPath } : {}),
        pattern: pathPattern(fullPath),
        parameterNames: pathParameterNames(path),
      });
    }
  }

  routes.sort((left, right) => left.path.localeCompare(right.path) || METHODS.indexOf(left.method.toLowerCase() as typeof METHODS[number]) - METHODS.indexOf(right.method.toLowerCase() as typeof METHODS[number]));
  return routes;
}

function pathPattern(path: string): RegExp {
  const escaped = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const withGroups = escaped.replace(/\\\{([^}/]+)\\\}/g, '([^/]+)');
  return new RegExp(`^${withGroups}/?$`);
}

export function pathParameterNames(path: string): string[] {
  return [...path.matchAll(/\{([^}/]+)\}/g)].map(match => match[1]!);
}

export function matchRoute(routes: MockRoute[], method: string, pathname: string): { route: MockRoute; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method.toUpperCase()) continue;
    const match = route.pattern.exec(pathname);
    if (!match) continue;
    const params: Record<string, string> = {};
    route.parameterNames.forEach((name, index) => {
      params[name] = decodeURIComponent(match[index + 1] ?? '');
    });
    return { route, params };
  }
  return null;
}

export function findCollectionSchema(document: OpenApiDocument, routes: MockRoute[], collectionPath: string): SchemaObject | undefined {
  const itemRoute = routes.find(route => route.kind === 'item' && route.collectionPath === collectionPath);
  const createRoute = routes.find(route => route.kind === 'create' && route.collectionPath === collectionPath);
  const listRoute = routes.find(route => route.kind === 'list' && route.collectionPath === collectionPath);

  const candidates: Array<SchemaObject | undefined> = [
    itemRoute ? responseSchema(document, itemRoute.operation) : undefined,
    createRoute ? requestSchema(createRoute.operation) : undefined,
    itemRoute?.operation.requestBody ? requestSchema(itemRoute.operation) : undefined,
    listRoute ? collectionItemSchema(document, listRoute.operation) : undefined,
  ];
  for (const candidate of candidates) {
    const resolved = candidate ? resolveSchema(document, candidate) : undefined;
    if (resolved && resolved.type !== 'array') return resolved;
  }
  return undefined;
}

export function collectionItemSchema(document: OpenApiDocument, operation: Operation): SchemaObject | undefined {
  const schema = resolveSchema(document, responseSchema(document, operation));
  if (!schema) return undefined;
  if (schema.type === 'array') return schema.items;
  if (schema.properties) {
    const preferred = ['items', 'data', 'results', 'records', 'content'].find(name => schema.properties?.[name]?.type === 'array' || schema.properties?.[name]?.items);
    const candidate = preferred ? schema.properties[preferred] : Object.values(schema.properties).find(property => property.type === 'array' || property.items);
    if (candidate) return candidate.items;
  }
  return schema;
}

export function itemPathParameter(route: MockRoute): string | undefined {
  return route.parameterNames[route.parameterNames.length - 1];
}
