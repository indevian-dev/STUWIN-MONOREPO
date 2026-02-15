# Logging Standards

## Key Files
| File | Definition |
|---|---|
| `next/lib/logging/Logger.ts` | Main `Logger` class — structured logging with request context |
| `next/lib/logging/ActionLogger.ts` | User action audit logging — stored in database |
| `next/lib/routes/types.ts` | `HandlerLogger` — typed interface for route handler logging |
| `_shared.types/common/logger.ts` | Logger interface contract (cross-platform) |

## Two Logging Channels
| Channel | Purpose | Storage |
|---|---|---|
| Console Logs | Dev/debug trace — ephemeral, high-volume | Terminal (color-coded) |
| Action Logs | Audit trail — durable, high-value | PostgreSQL (`ActionLog` table) |

## Console Log Levels
| Level | Color | Usage |
|---|---|---|
| `INFO` | Blue | Normal flow confirmation |
| `WARN` | Yellow | Non-fatal issues |
| `ERROR` | Red | Failures requiring attention |
| `DEBUG` | Gray | Verbose dev-only tracing |

## Logger Method Signatures
| Method | Signature | Notes |
|---|---|---|
| `info` | `(message: string, meta?: Record<string, unknown>)` | |
| `warn` | `(message: string, meta?: Record<string, unknown>)` | |
| `error` | `(message: string, metaOrError?: unknown, metadata?: Record<string, unknown>)` | Accepts `unknown` for catch clause errors |
| `debug` | `(message: string, meta?: Record<string, unknown>)` | |
| `http` | `(message: string, meta?: Record<string, unknown>)` | |
| `apiComplete` | `({ statusCode, duration, success?, metadata? })` | Request completion metric |

## External Observability
| File | Definition |
|---|---|
| `next/lib/integrations/axiom/axiom.client.ts` | Axiom logging / observability client |

## Rules
- **ALWAYS** use the injected `log` from `unifiedApiHandler` context: `log.info("msg", { metadata })`
- **ALWAYS** type catch clause errors as `unknown`: `catch (error: unknown)`
- **ALWAYS** pass raw `unknown` errors to `log.error()` — it handles type narrowing internally
- **NEVER** use raw `console.log` / `console.error` in production code
- **ALWAYS** log structured metadata objects, not concatenated strings
- **ALWAYS** scrub sensitive fields — never log passwords, tokens, card numbers
- **NEVER** cast errors to `any` for logging — `log.error("msg", error)` works directly with `unknown`
