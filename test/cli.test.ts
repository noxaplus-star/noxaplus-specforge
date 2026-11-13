import { describe, expect, it } from 'vitest';
import { parseArgs } from '../src/cli.js';

describe('CLI arguments', () => {
  it('defaults to a local mock server on port 4010', () => {
    const options = parseArgs(['mock', 'examples/petstore.yaml']);
    expect(options).toMatchObject({
      command: 'mock',
      spec: 'examples/petstore.yaml',
      port: 4010,
      host: '127.0.0.1',
      seed: 42,
      latency: 0,
      errorRate: 0,
      quiet: false,
    });
  });

  it('accepts server options', () => {
    const options = parseArgs(['mock', 'spec.yaml', '--port', '0', '--host', '0.0.0.0', '--base', '/api', '--seed', '7', '--latency', '150', '--error-rate', '0.25', '--quiet']);
    expect(options).toMatchObject({ port: 0, host: '0.0.0.0', base: '/api', seed: 7, latency: 150, errorRate: 0.25, quiet: true });
  });

  it('supports the routes command and help', () => {
    expect(parseArgs(['routes', 'spec.yaml']).command).toBe('routes');
    expect(parseArgs(['--help']).command).toBe('help');
    expect(parseArgs(['-v']).command).toBe('version');
  });

  it('rejects missing files and invalid values', () => {
    expect(() => parseArgs(['mock'])).toThrow(/OpenAPI file/);
    expect(() => parseArgs(['mock', 'spec.yaml', '--port', '70000'])).toThrow(/--port/);
    expect(() => parseArgs(['mock', 'spec.yaml', '--error-rate', '2'])).toThrow(/--error-rate/);
    expect(() => parseArgs(['mock', 'spec.yaml', '--seed', '-1'])).toThrow(/--seed/);
    expect(() => parseArgs(['mock', 'spec.yaml', '--unknown'])).toThrow(/Unknown option/);
    expect(() => parseArgs(['mock', 'spec.yaml', 'extra'])).toThrow(/Unexpected argument/);
  });
});
