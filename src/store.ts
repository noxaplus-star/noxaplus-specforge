import { generateSample } from './generate.js';
import { findCollectionSchema } from './routes.js';
import type { MockRoute, OpenApiDocument, SchemaObject } from './types.js';

interface CollectionState {
  items: Array<Record<string, unknown>>;
  itemSchema: SchemaObject | undefined;
  idKey: string | undefined;
}

function slug(value: string): string {
  const segment = value.split('/').filter(Boolean).pop() ?? 'item';
  return segment.replace(/[{}]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'item';
}

function numericId(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value);
  return null;
}

export class MockStore {
  private readonly document: OpenApiDocument;
  private readonly routes: MockRoute[];
  private readonly seed: number;
  private readonly seedCount: number;
  private collections = new Map<string, CollectionState>();

  constructor(document: OpenApiDocument, routes: MockRoute[], seed: number, seedCount = 3) {
    this.document = document;
    this.routes = routes;
    this.seed = seed;
    this.seedCount = seedCount;
    this.reset();
  }

  reset(): void {
    this.collections = new Map();
    const paths = new Set(this.routes.map(route => route.collectionPath).filter((path): path is string => Boolean(path)));
    for (const path of paths) this.ensureCollection(path);
  }

  private ensureCollection(path: string): CollectionState {
    const existing = this.collections.get(path);
    if (existing) return existing;

    const itemSchema = findCollectionSchema(this.document, this.routes, path);
    const itemRoute = this.routes.find(route => route.kind === 'item' && route.collectionPath === path);
    const parameter = itemRoute?.parameterNames.at(-1);
    const properties = itemSchema?.properties ?? {};
    const idKey = properties.id ? 'id' : parameter;
    const state: CollectionState = { items: [], itemSchema, idKey };

    for (let index = 0; index < this.seedCount; index += 1) {
      const generated = generateSample(this.document, itemSchema, this.seed, `${path}[${index}]`);
      const item = generated && typeof generated === 'object' && !Array.isArray(generated)
        ? { ...(generated as Record<string, unknown>) }
        : {};
      if (idKey) item[idKey] = this.makeId(path, item[idKey], index);
      state.items.push(item);
    }

    this.collections.set(path, state);
    return state;
  }

  private makeId(path: string, current: unknown, index: number): string | number {
    if (typeof current === 'number' || (typeof current === 'string' && /^\d+$/.test(current))) return index + 1;
    return `${slug(path)}-${index + 1}`;
  }

  nextId(path: string): string | number {
    const state = this.ensureCollection(path);
    const values = state.items.map(item => state.idKey ? numericId(item[state.idKey]) : null).filter((value): value is number => value !== null);
    if (values.length > 0) return Math.max(...values) + 1;
    const type = state.idKey ? state.itemSchema?.properties?.[state.idKey]?.type : undefined;
    if (type === 'integer' || type === 'number') return 1;
    return `${slug(path)}-${state.items.length + 1}`;
  }

  getState(path: string): CollectionState | undefined {
    return this.collections.get(path);
  }

  list(path: string): Array<Record<string, unknown>> {
    return this.ensureCollection(path).items;
  }

  find(path: string, id: string): Record<string, unknown> | undefined {
    const state = this.ensureCollection(path);
    const key = state.idKey;
    if (!key) return undefined;
    return state.items.find(item => String(item[key]) === id);
  }

  create(path: string, body: Record<string, unknown>): Record<string, unknown> {
    const state = this.ensureCollection(path);
    const item = { ...body };
    if (state.idKey && item[state.idKey] === undefined) item[state.idKey] = this.nextId(path);
    state.items.push(item);
    return item;
  }

  replace(path: string, id: string, body: Record<string, unknown>): Record<string, unknown> | undefined {
    const state = this.ensureCollection(path);
    const key = state.idKey;
    const index = state.items.findIndex(item => key !== undefined && String(item[key]) === id);
    if (index < 0) return undefined;
    const item = { ...body };
    if (key) item[key] = state.items[index]![key];
    state.items[index] = item;
    return item;
  }

  patch(path: string, id: string, body: Record<string, unknown>): Record<string, unknown> | undefined {
    const state = this.ensureCollection(path);
    const item = this.find(path, id);
    if (!item) return undefined;
    const updated = { ...item, ...body };
    if (state.idKey) updated[state.idKey] = item[state.idKey];
    state.items[state.items.indexOf(item)] = updated;
    return updated;
  }

  remove(path: string, id: string): boolean {
    const state = this.ensureCollection(path);
    const key = state.idKey;
    const index = state.items.findIndex(item => key !== undefined && String(item[key]) === id);
    if (index < 0) return false;
    state.items.splice(index, 1);
    return true;
  }

  toSummary(): Array<{ path: string; count: number; idKey: string | null }> {
    return [...this.collections.entries()].map(([path, state]) => ({ path, count: state.items.length, idKey: state.idKey ?? null }));
  }
}
