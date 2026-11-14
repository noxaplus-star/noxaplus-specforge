import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { parseSpecText } from '../src/load.js';
import { createMockServer, type MockServer } from '../src/server.js';

const specText = readFileSync(resolve('examples/petstore.yaml'), 'utf8');
const document = parseSpecText(specText, 'petstore.yaml').document;

async function startServer(options: Parameters<typeof createMockServer>[1] = {}): Promise<{ mock: MockServer; url: string }> {
  const mock = createMockServer(document, { quiet: true, ...options });
  const listening = await mock.listen(0, '127.0.0.1');
  return { mock, url: listening.url };
}

describe('mock server', () => {
  let mock: MockServer;
  let url: string;

  beforeAll(async () => {
    ({ mock, url } = await startServer());
  });

  afterAll(async () => {
    await mock.close();
  });

  it('serves deterministic seeded collections', async () => {
    const response = await fetch(`${url}/pets`);
    expect(response.status).toBe(200);
    const body = await response.json() as { items: Array<Record<string, unknown>>; total: number };
    expect(body.total).toBe(3);
    expect(body.items).toHaveLength(3);
    expect(body.items.map(item => item.id)).toEqual([1, 2, 3]);
    expect(body.items[0]?.name).toBeTruthy();
    expect(['dog', 'cat', 'bird', 'rabbit']).toContain(body.items[0]?.species);

    const second = await fetch(`${url}/pets`).then(result => result.json()) as typeof body;
    expect(second.items.map(item => item.name)).toEqual(body.items.map(item => item.name));
  });

  it('supports create, read, patch, replace, and delete', async () => {
    const created = await fetch(`${url}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nova', species: 'cat' }),
    });
    expect(created.status).toBe(201);
    expect(created.headers.get('location')).toContain('/pets/4');
    const pet = await created.json() as Record<string, unknown>;
    expect(pet.id).toBe(4);
    expect(pet.name).toBe('Nova');
    expect(pet.email).toBeUndefined();

    const fetched = await fetch(`${url}/pets/4`);
    expect(fetched.status).toBe(200);
    expect((await fetched.json() as Record<string, unknown>).name).toBe('Nova');

    const patched = await fetch(`${url}/pets/4`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ age: 3 }),
    });
    expect(patched.status).toBe(200);
    const patchedPet = await patched.json() as Record<string, unknown>;
    expect(patchedPet.age).toBe(3);
    expect(patchedPet.name).toBe('Nova');

    const replaced = await fetch(`${url}/pets/4`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Nova Two', species: 'dog' }),
    });
    expect(replaced.status).toBe(200);
    const replacedPet = await replaced.json() as Record<string, unknown>;
    expect(replacedPet.id).toBe(4);
    expect(replacedPet.species).toBe('dog');

    const deleted = await fetch(`${url}/pets/4`, { method: 'DELETE' });
    expect(deleted.status).toBe(204);
    expect(await deleted.text()).toBe('');
    expect((await fetch(`${url}/pets/4`)).status).toBe(404);
  });

  it('validates required fields and JSON bodies', async () => {
    const missing = await fetch(`${url}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Missing species' }),
    });
    expect(missing.status).toBe(422);
    const error = await missing.json() as { error: { details: string[] } };
    expect(error.error.details).toContain('species');

    const invalid = await fetch(`${url}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{',
    });
    expect(invalid.status).toBe(400);
  });

  it('filters, sorts, paginates, and reports totals', async () => {
    await fetch(`${url}/pets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Filter Cat', species: 'cat' }),
    });

    const filtered = await fetch(`${url}/pets?species=cat`).then(result => result.json()) as { items: Array<Record<string, unknown>>; total: number };
    expect(filtered.items.every(item => item.species === 'cat')).toBe(true);
    expect(filtered.items.some(item => item.name === 'Filter Cat')).toBe(true);
    expect(filtered.total).toBe(filtered.items.length);

    const page = await fetch(`${url}/pets?__limit=2&__offset=1`).then(result => result.json()) as { items: unknown[]; total: number };
    expect(page.items).toHaveLength(2);
    expect(page.total).toBeGreaterThanOrEqual(3);

    const sorted = await fetch(`${url}/pets?__sort=name&__order=asc`).then(result => result.json()) as { items: Array<Record<string, unknown>> };
    const names = sorted.items.map(item => String(item.name));
    expect(names).toEqual([...names].sort((left, right) => left.localeCompare(right, undefined, { numeric: true })));

    const partial = await fetch(`${url}/pets?name=Filter%20Cat`).then(result => result.json()) as { items: Array<Record<string, unknown>> };
    expect(partial.items).toHaveLength(1);
  });

  it('serves generated action responses', async () => {
    const response = await fetch(`${url}/pets/1/photo`);
    expect(response.status).toBe(200);
    const photo = await response.json() as Record<string, unknown>;
    expect(photo.url).toMatch(/^https:\/\//);
    expect(photo.width).toBeGreaterThanOrEqual(200);
    expect(photo.height).toBeGreaterThanOrEqual(200);

    const health = await fetch(`${url}/health`).then(result => result.json()) as Record<string, unknown>;
    expect(health.status).toBe('ok');
    expect(health.uptime).toBeGreaterThan(0);
  });

  it('injects errors and delays without breaking other headers', async () => {
    const injected = await fetch(`${url}/pets?__error=503`);
    expect(injected.status).toBe(503);
    const body = await injected.json() as { error: { status: number; message: string } };
    expect(body.error.status).toBe(503);
    expect(body.error.message).toMatch(/Simulated/);

    const headerInjected = await fetch(`${url}/pets`, { headers: { 'X-SpecForge-Error': '418' } });
    expect(headerInjected.status).toBe(418);

    const started = Date.now();
    const delayed = await fetch(`${url}/pets?__delay=120`);
    const elapsed = Date.now() - started;
    expect(delayed.status).toBe(200);
    expect(elapsed).toBeGreaterThanOrEqual(100);
  });

  it('sets CORS headers and handles preflight requests', async () => {
    const response = await fetch(`${url}/health`);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    const preflight = await fetch(`${url}/pets`, { method: 'OPTIONS' });
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-methods')).toContain('PATCH');
  });

  it('returns a useful 404 for unknown routes', async () => {
    const response = await fetch(`${url}/does-not-exist`);
    expect(response.status).toBe(404);
    const body = await response.json() as { error: { hint: string } };
    expect(body.error.hint).toContain('/__specforge');
  });

  it('serves the dashboard and admin state', async () => {
    const dashboard = await fetch(`${url}/__specforge`);
    expect(dashboard.status).toBe(200);
    const html = await dashboard.text();
    expect(html).toContain('SpecForge');
    expect(html).toContain('/__specforge/api/state');

    const stateResponse = await fetch(`${url}/__specforge/api/state`);
    expect(stateResponse.status).toBe(200);
    const state = await stateResponse.json() as {
      spec: { title: string };
      baseUrl: string;
      routes: Array<{ method: string; path: string }>;
      stats: { requests: number; errors: number; avgDuration: number };
      requests: Array<{ method: string; path: string; responseBody: string }>;
      runtime: { seed: number; latency: number; errorRate: number };
    };
    expect(state.spec.title).toBe('NoxaPlus Pet Store');
    expect(state.baseUrl).toBe(url);
    expect(state.routes.length).toBeGreaterThanOrEqual(7);
    expect(state.stats.requests).toBeGreaterThan(0);
    expect(state.stats.avgDuration).toBeGreaterThanOrEqual(0);
    expect(state.runtime.seed).toBe(42);
    expect(state.requests.some(entry => entry.responseBody.includes('Nova') || entry.path.includes('pets'))).toBe(true);
  });

  it('resets data and runtime controls through the admin API', async () => {
    const simulate = await fetch(`${url}/__specforge/api/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latency: 35, errorRate: 0 }),
    });
    expect(simulate.status).toBe(200);
    expect((await simulate.json() as { runtime: { latency: number } }).runtime.latency).toBe(35);

    const reset = await fetch(`${url}/__specforge/api/reset`, { method: 'POST' });
    expect(reset.status).toBe(200);
    const state = await reset.json() as { stats: { requests: number }; requests: unknown[] };
    expect(state.stats.requests).toBe(0);
    expect(state.requests).toHaveLength(0);

    const pets = await fetch(`${url}/pets`).then(result => result.json()) as { items: Array<{ id: number }> };
    expect(pets.items.map(item => item.id)).toEqual([1, 2, 3]);
  });
});

describe('request field validation', () => {
  it.each(['POST', 'PUT', 'PATCH'])('ignores read-only fields in %s bodies', async method => {
    const spec = structuredClone(document);
    spec.components!.schemas!.Pet!.properties!.createdAt!.readOnly = true;
    const mock = createMockServer(spec, { quiet: true });
    const { url } = await mock.listen(0, '127.0.0.1');
    try {
      const original = await fetch(`${url}/pets/1`).then(response => response.json()) as Record<string, unknown>;
      const path = method === 'POST' ? '/pets' : '/pets/1';
      const response = await fetch(`${url}${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 1, name: 'Updated pet', species: 'cat', createdAt: 'client-controlled' }),
      });
      expect(response.status).toBe(method === 'POST' ? 201 : 200);
      const pet = await response.json() as Record<string, unknown>;
      expect(pet.id).toBe(method === 'POST' ? 4 : 1);
      expect(pet.name).toBe('Updated pet');
      expect(pet.createdAt).toBeTruthy();
      expect(pet.createdAt).not.toBe('client-controlled');
      if (method !== 'POST') expect(pet.createdAt).toBe(original.createdAt);
      const saved = await fetch(`${url}/pets/${String(pet.id)}`).then(result => result.json());
      expect(saved).toEqual(pet);
      if (method === 'POST') {
        expect(await fetch(`${url}/pets/1`).then(result => result.json())).toEqual(original);
        expect(response.headers.get('location')).toBe('/pets/4');
      }
    } finally {
      await mock.close();
    }
  });

  it.each(['POST', 'PUT'])('rejects missing required fields in %s without changing stored data', async method => {
    const { mock, url } = await startServer();
    try {
      const original = await fetch(`${url}/pets`).then(response => response.json());
      const response = await fetch(`${url}${method === 'POST' ? '/pets' : '/pets/1'}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { details: ['name', 'species'] } });
      expect(await fetch(`${url}/pets`).then(result => result.json())).toEqual(original);
    } finally {
      await mock.close();
    }
  });

  it('treats prototype-shaped JSON keys as data during a patch', async () => {
    const { mock, url } = await startServer();
    try {
      const response = await fetch(`${url}/pets/1`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: '{"__proto__":{"polluted":true},"age":4}',
      });
      expect(response.status).toBe(200);
      const item = mock.store.find('/pets', '1');
      expect(Object.getPrototypeOf(item)).toBe(Object.prototype);
      expect(item?.polluted).toBeUndefined();
      expect(item?.age).toBe(4);
    } finally {
      await mock.close();
    }
  });

  it('keeps an item addressable after a patch tries to change its ID', async () => {
    const { mock, url } = await startServer();
    try {
      const response = await fetch(`${url}/pets/2`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: 9000, age: 3 }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ id: 2, age: 3 });
      expect(await fetch(`${url}/pets/2`).then(result => result.json())).toMatchObject({ id: 2, age: 3 });
      expect((await fetch(`${url}/pets/9000`)).status).toBe(404);
    } finally {
      await mock.close();
    }
  });
});

describe('base path', () => {
  it('prefixes every mock route', async () => {
    const { mock, url } = await startServer({ base: '/api/v2' });
    try {
      const matched = await fetch(`${url}/api/v2/health`);
      expect(matched.status).toBe(200);
      const unmatched = await fetch(`${url}/health`);
      expect(unmatched.status).toBe(404);
    } finally {
      await mock.close();
    }
  });
});
