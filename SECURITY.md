# Security policy

## Supported versions

| Version | Supported |
| --- | --- |
| 1.x | Yes |
| Earlier | No |

## Reporting a vulnerability

Email **NoxaPlus2025@gmail.com** with a description, reproduction steps, and the affected version. Do not open a public issue for a suspected vulnerability.

Please include:

- the SpecForge version (`specforge --version`);
- the command you ran, with the OpenAPI file or any secret values removed;
- what you expected and what happened;
- relevant server output or dashboard screenshots, redacted.

You can expect an initial response within seven days. Confirmed issues are fixed in a patch release and credited unless you ask to stay anonymous. There is no paid bug bounty.

## Scope notes

- SpecForge is a local mock server. It binds to `127.0.0.1` by default and has no authentication.
- The dashboard and admin API expose mock state, including request bodies. Do not bind the server to a public interface with `--host 0.0.0.0` unless you accept that anyone who can reach the port can read and reset that state.
- Request bodies are limited to 1 MiB and malformed JSON is rejected, but the server is not hardened for hostile input. Treat it as a development tool, not a production gateway.
- Spec files are read from disk and local `$ref`s are resolved within the document. SpecForge does not fetch remote references.
- The dashboard renders spec-controlled strings through HTML escaping. If you find a way to execute script from an OpenAPI document, treat it as a security issue.
