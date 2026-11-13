import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadSpec, parseSpecText, resolveRef, resolveSchema, SpecForgeError } from '../src/load.js';

const MINIMAL = {
  openapi: '3.0.3',
  info: { title: 'Tiny API', version: '1.0.0' },
  paths: {
    '/ping': {
      get: {
        responses: {
          '200': {
            description: 'ok',
            content: { 'application/json': { schema: { type: 'object', properties: { ok: { type: 'boolean' } } } } },
          },
        },
      },
    },
  },
  components: { schemas: { Pet: { type: 'object', properties: { id: { type: 'integer' } } } } },
};

describe('spec loading', () => {
  it('loads JSON documents and counts operations', () => {
    const loaded = parseSpecText(JSON.stringify(MINIMAL), 'spec.json');
    expect(loaded.document.openapi).toBe('3.0.3');
    expect(loaded.title).toBe('Tiny API');
    expect(loaded.routeCount).toBe(1);
  });

  it('loads YAML documents', () => {
    const yaml = `openapi: 3.1.0
info:
  title: YAML API
  version: 2.0.0
paths:
  /items:
    get:
      responses:
        '200':
          description: ok
`;
    const loaded = parseSpecText(yaml, 'spec.yaml');
    expect(loaded.title).toBe('YAML API');
    expect(loaded.routeCount).toBe(1);
  });

  it('rejects unsupported or malformed documents', () => {
    expect(() => parseSpecText('openapi: 2.0\ninfo: {title: Old, version: "1"}\npaths: {}', 'old.yaml')).toThrow(SpecForgeError);
    expect(() => parseSpecText('openapi: 3.0.0\ninfo: {title: NoPaths}\npaths: {}', 'bad.yaml')).toThrow(/info/);
    expect(() => parseSpecText('openapi: 3.0.0\ninfo: {title: NoPaths, version: "1"}\npaths: {}', 'bad.yaml')).toThrow(/paths/);
    expect(() => parseSpecText('', 'empty.yaml')).toThrow(/empty/);
    expect(() => parseSpecText('{"openapi":', 'broken.json')).toThrow(/Invalid JSON/);
  });

  it('loads a file from disk and reports a readable source', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'specforge-'));
    try {
      const file = join(directory, 'spec.json');
      await writeFile(file, JSON.stringify(MINIMAL), 'utf8');
      const loaded = await loadSpec(file);
      expect(loaded.source).toBe(file);
      expect(loaded.title).toBe('Tiny API');
      expect(loaded.document.paths).toHaveProperty('/ping');
    } finally {
      await rm(directory, { recursive: true, force: true });
    }
  });

  it('resolves local references and escapes pointer tokens', () => {
    const loaded = parseSpecText(JSON.stringify(MINIMAL), 'spec.json');
    expect(resolveRef(loaded.document, '#/components/schemas/Pet')).toMatchObject({ type: 'object' });
    expect(resolveRef(loaded.document, '#/components/schemas/Missing')).toBeUndefined();
    expect(() => resolveRef(loaded.document, 'https://example.com/schema.json')).toThrow(/local \$ref/);
    const merged = resolveSchema(loaded.document, {
      $ref: '#/components/schemas/Pet',
      properties: { name: { type: 'string' } },
    });
    expect(merged?.properties).toHaveProperty('id');
  });
});
