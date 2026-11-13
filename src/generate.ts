import { mergeSchemas, resolveSchema } from './load.js';
import type { OpenApiDocument, SchemaObject } from './types.js';

const NOUNS = ['aurora', 'basil', 'cedar', 'delta', 'ember', 'fjord', 'glade', 'harbor', 'ivory', 'juniper', 'kestrel', 'lumen', 'meadow', 'nimbus', 'orchid', 'pebble', 'quartz', 'ripple', 'summit', 'tundra', 'umber', 'velvet', 'willow', 'zephyr'];
const PEOPLE = ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson', 'Margaret Hamilton', 'Linus Torvalds', 'Barbara Liskov', 'Dennis Ritchie'];
const ADJECTIVES = ['brisk', 'calm', 'clever', 'crimson', 'eager', 'gentle', 'honest', 'narrow', 'quiet', 'rapid', 'silver', 'steady', 'subtle', 'vivid'];

function hash(value: string): number {
  let result = 0x811c9dc5;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 0x01000193);
  }
  return result >>> 0;
}

function randomFor(seed: number, trail: string): () => number {
  let state = hash(`${seed}|${trail}`) || 1;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let value = Math.imul(state ^ (state >>> 15), 1 | state);
    value = (value + Math.imul(value ^ (value >>> 7), 61 | value)) ^ value;
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)] ?? values[0]!;
}

function pad(value: string, minLength: number | undefined, maxLength: number | undefined): string {
  let result = value;
  while (minLength !== undefined && result.length < minLength) result += '-sample';
  if (maxLength !== undefined && result.length > maxLength) result = result.slice(0, maxLength);
  return result;
}

export interface GeneratorOptions {
  seed: number;
}

export class SampleGenerator {
  private readonly document: OpenApiDocument;
  private readonly seed: number;

  constructor(document: OpenApiDocument, options: GeneratorOptions) {
    this.document = document;
    this.seed = options.seed;
  }

  generate(schema: SchemaObject | undefined, trail = 'value'): unknown {
    return this.value(schema, trail, 0);
  }

  private value(schema: SchemaObject | undefined, trail: string, depth: number): unknown {
    if (!schema) return null;
    if (depth > 12) return null;
    const resolved = resolveSchema(this.document, schema);
    if (!resolved) return null;
    const random = randomFor(this.seed, trail);

    if (resolved.example !== undefined) return resolved.example;
    if (resolved.examples !== undefined) {
      const first = Array.isArray(resolved.examples) ? resolved.examples[0] : Object.values(resolved.examples)[0];
      if (first !== undefined) return typeof first === 'object' && first !== null && 'value' in first ? (first as { value?: unknown }).value : first;
    }
    if (resolved.default !== undefined) return resolved.default;
    if (resolved.const !== undefined) return resolved.const;
    if (resolved.enum && resolved.enum.length > 0) return pick(resolved.enum, random);

    if (resolved.allOf && resolved.allOf.length > 0) {
      const rest = Object.fromEntries(Object.entries(resolved).filter(([key]) => key !== 'allOf')) as SchemaObject;
      const merged = mergeSchemas(this.document, [...resolved.allOf, rest]);
      return this.value(merged, trail, depth + 1);
    }
    const union = resolved.oneOf ?? resolved.anyOf;
    if (union && union.length > 0) {
      const choice = union[Math.floor(random() * union.length)] ?? union[0]!;
      return this.value(choice, trail, depth + 1);
    }

    const type = resolved.type ?? (resolved.properties ? 'object' : resolved.items ? 'array' : undefined);

    if (type === 'object') {
      const result: Record<string, unknown> = {};
      const properties = resolved.properties ?? {};
      for (const [name, child] of Object.entries(properties)) {
        result[name] = this.value(child, `${trail}.${name}`, depth + 1);
      }
      if (Object.keys(properties).length === 0 && resolved.additionalProperties && typeof resolved.additionalProperties === 'object') {
        result.additionalProp1 = this.value(resolved.additionalProperties, `${trail}.additionalProp1`, depth + 1);
      }
      return result;
    }

    if (type === 'array') {
      const minimum = Math.max(1, resolved.minItems ?? 2);
      const maximum = Math.max(minimum, Math.min(resolved.maxItems ?? 3, 5));
      const count = Math.min(maximum, minimum + Math.floor(random() * (maximum - minimum + 1)));
      return Array.from({ length: count }, (_, index) => this.value(resolved.items, `${trail}[${index}]`, depth + 1));
    }

    if (type === 'integer' || type === 'number') {
      const minimum = resolved.minimum ?? 1;
      const maximum = resolved.maximum ?? (minimum + 500);
      const raw = minimum + random() * Math.max(0, maximum - minimum);
      return type === 'integer' ? Math.round(raw) : Number(raw.toFixed(2));
    }

    if (type === 'boolean') return random() > 0.5;

    if (type === 'string' || type === undefined) {
      return this.string(resolved, trail, random);
    }

    return null;
  }

  private string(schema: SchemaObject, trail: string, random: () => number): string {
    const format = schema.format;
    const key = trail.split('.').pop() ?? trail;
    let value: string;

    if (format === 'date') {
      const day = Math.floor(random() * 365);
      value = new Date(Date.UTC(2026, 0, 1 + day)).toISOString().slice(0, 10);
    } else if (format === 'date-time') {
      const day = Math.floor(random() * 365);
      const hour = Math.floor(random() * 24);
      value = new Date(Date.UTC(2026, 0, 1 + day, hour)).toISOString();
    } else if (format === 'email') {
      value = `${pick(NOUNS, random)}.${Math.floor(random() * 90) + 10}@example.com`;
    } else if (format === 'uuid') {
      const hex = Array.from({ length: 32 }, () => Math.floor(random() * 16).toString(16)).join('');
      value = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
    } else if (format === 'uri' || format === 'url') {
      value = `https://example.com/${pick(NOUNS, random)}/${Math.floor(random() * 900) + 100}`;
    } else if (format === 'hostname') {
      value = `${pick(NOUNS, random)}.example.com`;
    } else if (format === 'ipv4') {
      value = `192.0.2.${Math.floor(random() * 254) + 1}`;
    } else if (format === 'ipv6') {
      value = '2001:db8::1';
    } else if (format === 'byte') {
      value = Buffer.from('NoxaPlus sample').toString('base64');
    } else if (format === 'binary') {
      value = 'sample-binary';
    } else if (format === 'password') {
      value = 'Sample-Pass-123';
    } else if (/name$/i.test(key) && !/username|hostname|filename/i.test(key)) {
      value = pick(PEOPLE, random);
    } else if (/title$/i.test(key)) {
      value = `${pick(ADJECTIVES, random)} ${pick(NOUNS, random)}`;
    } else if (/slug$/i.test(key)) {
      value = `${pick(ADJECTIVES, random)}-${pick(NOUNS, random)}`;
    } else {
      value = `${pick(ADJECTIVES, random)}-${pick(NOUNS, random)}-${Math.floor(random() * 900) + 100}`;
    }
    return pad(value, schema.minLength, schema.maxLength);
  }
}

export function generateSample(document: OpenApiDocument, schema: SchemaObject | undefined, seed: number, trail = 'value'): unknown {
  return new SampleGenerator(document, { seed }).generate(schema, trail);
}

export function deterministicFraction(seed: number, key: string): number {
  return randomFor(seed, key)();
}
