#!/usr/bin/env node
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { loadSpec, SpecForgeError } from './load.js';
import { normalizeBase } from './routes.js';
import { createMockServer } from './server.js';

type Command = 'mock' | 'routes' | 'help' | 'version';

interface CliOptions {
  command: Command;
  spec?: string;
  port: number;
  host: string;
  base: string;
  seed: number;
  latency: number;
  errorRate: number;
  quiet: boolean;
}

const HELP = `SpecForge by NoxaPlus — turn an OpenAPI file into a working mock API.

Usage
  specforge mock <openapi.yaml|json> [options]
  specforge routes <openapi.yaml|json>
  specforge --help

Options for "mock"
  --port <number>        Port to listen on (default: 4010)
  --host <address>       Bind address (default: 127.0.0.1)
  --base <path>          Prefix every mock route (for example /api)
  --seed <number>        Seed for deterministic sample data (default: 42)
  --latency <ms>         Add latency to every response (default: 0)
  --error-rate <0..1>    Randomly fail this share of requests (default: 0)
  --quiet                Do not print one line per request

Runtime controls
  __error=503            Force an error status for one request
  X-SpecForge-Error: 500 Force an error with a header
  __delay=250            Add delay to one request
  __limit, __offset      Paginate collection responses
  __sort=name&__order=desc  Sort collection responses
  /__specforge           Open the local dashboard

Exit codes
  0  Server stopped normally, or the routes list was printed
  1  The OpenAPI file could not be loaded or served
  2  Invalid command line usage

Examples
  npx noxaplus-specforge mock examples/petstore.yaml
  specforge mock openapi.json --port 4010 --seed 7 --error-rate 0.1
  specforge routes examples/petstore.yaml
`;

function valueAfter(argv: string[], index: number, flag: string): string {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith('--')) throw new Error(`${flag} requires a value.`);
  return value;
}

function numberArg(raw: string, flag: string, minimum: number, maximum: number): number {
  const value = Number(raw);
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new Error(`${flag} must be a number between ${minimum} and ${maximum}.`);
  return value;
}

export function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = { command: 'help', port: 4010, host: '127.0.0.1', base: '', seed: 42, latency: 0, errorRate: 0, quiet: false };
  const positional: string[] = [];

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    switch (arg) {
      case '-h':
      case '--help':
        options.command = 'help';
        return options;
      case '-v':
      case '--version':
        options.command = 'version';
        return options;
      case 'mock':
      case 'routes':
        options.command = arg;
        break;
      case '--port':
        options.port = numberArg(valueAfter(argv, index, '--port'), '--port', 0, 65_535);
        index += 1;
        break;
      case '--host':
        options.host = valueAfter(argv, index, '--host');
        index += 1;
        break;
      case '--base':
        options.base = valueAfter(argv, index, '--base');
        index += 1;
        break;
      case '--seed':
        options.seed = numberArg(valueAfter(argv, index, '--seed'), '--seed', 0, 2_147_483_647);
        index += 1;
        break;
      case '--latency':
        options.latency = numberArg(valueAfter(argv, index, '--latency'), '--latency', 0, 10_000);
        index += 1;
        break;
      case '--error-rate':
        options.errorRate = numberArg(valueAfter(argv, index, '--error-rate'), '--error-rate', 0, 1);
        index += 1;
        break;
      case '--quiet':
        options.quiet = true;
        break;
      default:
        if (arg.startsWith('-')) throw new Error(`Unknown option: ${arg}`);
        positional.push(arg);
        break;
    }
  }

  if (options.command === 'help' && positional.length > 0) options.command = 'mock';
  options.spec = positional[0]!;
  if (positional.length > 1) throw new Error(`Unexpected argument: ${positional[1]}`);
  if ((options.command === 'mock' || options.command === 'routes') && !options.spec) {
    throw new Error('An OpenAPI file is required. Try: specforge mock examples/petstore.yaml');
  }
  return options;
}

async function version(): Promise<string> {
  const packageJson = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8')) as { version: string };
  return packageJson.version;
}

export async function runCli(argv: string[]): Promise<number> {
  let options: CliOptions;
  try {
    options = parseArgs(argv);
  } catch (error) {
    process.stderr.write(`specforge: ${error instanceof Error ? error.message : String(error)}\n\n${HELP}`);
    return 2;
  }

  if (options.command === 'help') {
    process.stdout.write(HELP);
    return 0;
  }
  if (options.command === 'version') {
    process.stdout.write(`noxaplus-specforge ${await version()}\n`);
    return 0;
  }

  let loaded;
  try {
    loaded = await loadSpec(options.spec!);
  } catch (error) {
    if (error instanceof SpecForgeError) {
      process.stderr.write(`specforge: ${error.message}\n`);
      return 1;
    }
    throw error;
  }

  if (options.command === 'routes') {
    const server = createMockServer(loaded.document, { base: options.base, quiet: true });
    process.stdout.write(`\n${loaded.title} ${loaded.version} · OpenAPI ${loaded.document.openapi}\n\n`);
    process.stdout.write(`${'METHOD'.padEnd(8)}${'PATH'.padEnd(42)}${'KIND'.padEnd(10)}OPERATION\n`);
    for (const route of server.routes) {
      process.stdout.write(`${route.method.padEnd(8)}${route.path.padEnd(42)}${route.kind.padEnd(10)}${route.operationId}\n`);
    }
    process.stdout.write(`\n${server.routes.length} routes in ${loaded.source}\n`);
    return 0;
  }

  const server = createMockServer(loaded.document, {
    base: options.base,
    seed: options.seed,
    latency: options.latency,
    errorRate: options.errorRate,
    host: options.host,
    port: options.port,
    quiet: options.quiet,
  });

  try {
    const listening = await server.listen();
    const specVersion = await version();
    process.stdout.write(`\nSpecForge ${specVersion}  by NoxaPlus\n\n`);
    process.stdout.write(`Spec       ${loaded.title} ${loaded.version} (OpenAPI ${loaded.document.openapi})\n`);
    process.stdout.write(`File       ${loaded.source}\n`);
    process.stdout.write(`Mock API   ${listening.url}${normalizeBase(options.base)}\n`);
    process.stdout.write(`Dashboard  ${listening.dashboardUrl}\n`);
    process.stdout.write(`Routes     ${server.routes.length} · seed ${options.seed} · latency ${options.latency} ms · errors ${Math.round(options.errorRate * 100)}%\n`);
    process.stdout.write('\nPress Ctrl+C to stop.\n');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    if (code === 'EADDRINUSE') {
      process.stderr.write(`specforge: port ${options.port} is already in use. Choose another with --port.\n`);
    } else if (code === 'EACCES') {
      process.stderr.write(`specforge: not allowed to bind ${options.host}:${options.port}.\n`);
    } else {
      process.stderr.write(`specforge: could not start the server: ${error instanceof Error ? error.message : String(error)}\n`);
    }
    return 1;
  }

  await new Promise<void>(resolve => {
    let stopping = false;
    const stop = (): void => {
      if (stopping) return;
      stopping = true;
      process.stdout.write('\nStopping SpecForge.\n');
      void server.close().then(() => resolve());
    };
    process.once('SIGINT', stop);
    process.once('SIGTERM', stop);
  });
  return 0;
}

const invokedDirectly = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  runCli(process.argv.slice(2)).then(code => {
    process.exitCode = code;
  }).catch(error => {
    process.stderr.write(`specforge: ${error instanceof Error ? error.stack ?? error.message : String(error)}\n`);
    process.exitCode = 1;
  });
}
