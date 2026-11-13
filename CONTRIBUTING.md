# Contributing to NoxaPlus SpecForge

Thanks for helping improve SpecForge. Small, focused pull requests are easiest to review.

## Setup

```bash
git clone https://github.com/noxaplus-star/noxaplus-specforge.git
cd noxaplus-specforge
npm ci
npm test
npm run typecheck
```

`npm ci` builds `dist/` through the `prepare` script, so you can run the CLI against the bundled example immediately.

## Before you open a pull request

- Run `npm test` and `npm run typecheck`.
- Add or update tests for behavior changes. Server changes should be covered by an HTTP-level test, not only by a unit test of a helper.
- Update `README.md` and `CHANGELOG.md` when user-visible behavior changes.
- Keep generated data deterministic. Anything that derives from time, randomness, or iteration order must be keyed by the seed and the spec path.
- Do not include real customer specs, tokens, or personal information in fixtures or screenshots.

## Working on route behavior

1. Route classification lives in `src/routes.ts`. If you change how an operation is classified, update `test/server.test.ts` with a spec that exercises the new case.
2. Runtime behavior for each kind is in `handleRoute` in `src/server.ts`. Keep the response shapes consistent with the README table.
3. New runtime controls should be documented in both the CLI help text and the README, and should be additive: a request without the control must behave exactly as before.

## Sample data changes

`src/generate.ts` is the only place that invents values. When you add support for a schema keyword, add a test that asserts the same seed produces the same output and that a different seed produces different output. The generator must never loop forever on a recursive schema; the depth guard is intentional.

## Style

- TypeScript, ESM, Node.js 22+.
- Two-space indentation, single quotes, semicolons.
- Prefer small pure functions and explicit types.
- User-facing copy is English and factual; no emojis.
- Comments should explain a non-obvious constraint, not restate the code.

## Reporting bugs

Use the bug template. Include the SpecForge version, the command you ran, a minimal spec or the relevant path definitions, and the request that produced the wrong response. Never paste credentials or private API documents.

## Code of conduct

Participation is covered by [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contribution is licensed under the MIT License.
