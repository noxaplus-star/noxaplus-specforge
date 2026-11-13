# Changelog

All notable changes to NoxaPlus SpecForge are recorded here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [1.0.0] — 2026-11-13

First public release.

### Added

- `specforge mock <file>` — serve an OpenAPI 3.0/3.1 document (YAML or JSON) as a working HTTP API on `127.0.0.1:4010` by default.
- Route classification for list, item, create, update, patch, delete, and action operations, including nested reads such as `/pets/{petId}/photo`.
- Deterministic seed data generated from response schemas: enums, formats, examples, defaults, `allOf`, `oneOf`/`anyOf`, nested objects, and arrays, with a seeded PRNG and the `--seed` option.
- In-memory collections with create, replace, patch, delete, and reset; seeded records are created for every collection route.
- Request validation: JSON body parsing, required-field checks with 422 details, `readOnly` stripping, and 400 responses for malformed bodies.
- Failure and latency injection per request (`__error`, `X-SpecForge-Error`, `__delay`) and globally (`--error-rate`, `--latency`).
- Collection controls: `__limit`, `__offset`, `__sort`, `__order`, plus envelope-aware list rendering.
- Self-contained dashboard at `/__specforge` with route table, totals, average latency, and a live request log with request detail.
- Admin API at `/__specforge/api` for state, reset, simulation settings, and individual request entries.
- `specforge routes <file>` to print the classified route table without starting a server.
- Options for `--port`, `--host`, `--base`, `--seed`, `--latency`, `--error-rate`, and `--quiet`, with graceful `SIGINT`/`SIGTERM` shutdown.
- Bundled NoxaPlus Pet Store example covering list, CRUD, nested action, and health routes.
- Test suite covering spec loading, sample generation, route classification, server behavior, and CLI parsing.

### Known limits

- Authentication, rate limiting, multipart uploads, streaming, webhooks, and callbacks are not implemented.
- State is in memory and disappears on restart.
- Only `application/json` payloads are meaningfully mocked.
