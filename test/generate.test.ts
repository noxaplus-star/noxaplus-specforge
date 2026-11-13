import { describe, expect, it } from 'vitest';
import { generateSample } from '../src/generate.js';
import { parseSpecText } from '../src/load.js';
import type { SchemaObject } from '../src/types.js';

const spec = {
  openapi: '3.0.3',
  info: { title: 'Generator', version: '1.0.0' },
  paths: {
    '/ping': {
      get: { responses: { '200': { description: 'ok' } } },
    },
  },
  components: {
    schemas: {
      Address: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          country: { type: 'string', enum: ['NL', 'DE', 'FR'] },
        },
      },
      Base: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', minLength: 4 },
          email: { type: 'string', format: 'email' },
          joined: { type: 'string', format: 'date' },
        },
      },
      Person: {
        type: 'object',
        required: ['name', 'age', 'tags'],
        properties: {
          id: { type: 'integer' },
          age: { type: 'integer', minimum: 18, maximum: 20 },
          tags: { type: 'array', minItems: 2, maxItems: 3, items: { type: 'string' } },
          address: { $ref: '#/components/schemas/Address' },
          role: { type: 'string', default: 'member' },
          visible: { type: 'boolean' },
        },
      },
      Combined: {
        allOf: [
          { $ref: '#/components/schemas/Base' },
          {
            type: 'object',
            properties: {
              score: { type: 'number', minimum: 1, maximum: 2 },
            },
          },
        ],
      },
      ExampleFirst: {
        type: 'object',
        properties: {
          state: { type: 'string', enum: ['a', 'b'], example: 'b' },
          fixed: { type: 'string', example: 'from-example' },
        },
      },
    },
  },
};

const document = parseSpecText(JSON.stringify(spec), 'generator.json').document;

function generate(schema: SchemaObject, seed = 7): unknown {
  return generateSample(document, schema, seed);
}

describe('sample generation', () => {
  it('is deterministic for a seed and changes with another seed', () => {
    const first = generate({ type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }, 9);
    const second = generate({ type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }, 9);
    const other = generate({ type: 'object', properties: { name: { type: 'string' }, email: { type: 'string', format: 'email' } } }, 10);
    expect(first).toEqual(second);
    expect(first).not.toEqual(other);
  });

  it('respects examples, defaults, enums, and numeric bounds', () => {
    const example = generate(spec.components.schemas.ExampleFirst as SchemaObject) as Record<string, unknown>;
    expect(example.state).toBe('b');
    expect(example.fixed).toBe('from-example');

    const person = generate(spec.components.schemas.Person as SchemaObject) as Record<string, unknown>;
    expect(person.age).toBeGreaterThanOrEqual(18);
    expect(person.age).toBeLessThanOrEqual(20);
    expect(person.role).toBe('member');
    expect(Array.isArray(person.tags)).toBe(true);
    expect((person.tags as unknown[]).length).toBeGreaterThanOrEqual(2);
    expect(['NL', 'DE', 'FR']).toContain((person.address as Record<string, unknown>).country);
  });

  it('formats strings for common OpenAPI formats', () => {
    const value = generate({
      type: 'object',
      properties: {
        email: { type: 'string', format: 'email' },
        date: { type: 'string', format: 'date' },
        dateTime: { type: 'string', format: 'date-time' },
        uuid: { type: 'string', format: 'uuid' },
        url: { type: 'string', format: 'uri' },
        ip: { type: 'string', format: 'ipv4' },
      },
    }) as Record<string, string>;
    expect(value.email).toMatch(/^[a-z]+\.[0-9]{2}@example\.com$/);
    expect(value.date).toMatch(/^2026-\d{2}-\d{2}$/);
    expect(value.dateTime).toMatch(/^2026-\d{2}-\d{2}T\d{2}:00:00\.000Z$/);
    expect(value.uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-a[0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(value.url).toMatch(/^https:\/\/example\.com\//);
    expect(value.ip).toMatch(/^192\.0\.2\.\d+$/);
  });

  it('merges allOf schemas', () => {
    const combined = generate(spec.components.schemas.Combined as SchemaObject) as Record<string, unknown>;
    expect(combined.name).toBeTruthy();
    expect(String(combined.name).length).toBeGreaterThanOrEqual(4);
    expect(combined.email).toMatch(/@example\.com$/);
    expect(combined.score).toBeGreaterThanOrEqual(1);
    expect(combined.score).toBeLessThanOrEqual(2);
  });

  it('handles cycles without hanging', () => {
    const cyclic = {
      type: 'object',
      properties: {
        child: { $ref: '#/components/schemas/Cyclic' },
        label: { type: 'string' },
      },
    } as SchemaObject;
    const cyclicDocument = parseSpecText(JSON.stringify({
      ...spec,
      components: { schemas: { Cyclic: cyclic } },
    }), 'cyclic.json').document;
    const result = generateSample(cyclicDocument, { $ref: '#/components/schemas/Cyclic' }, 1);
    expect(result).toBeTruthy();
  });
});
