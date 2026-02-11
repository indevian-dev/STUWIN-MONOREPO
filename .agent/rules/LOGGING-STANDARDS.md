# Logging Standards

## Key Files
| File | Definition |
|---|---|
| `next/lib/logging/Logger.ts` | Main `Logger` class — structured logging with request context |
| `next/lib/logging/ConsoleLogger.ts` | Console transport — color-coded dev output |
| `next/lib/logging/ActionLogger.ts` | User action audit logging — stored in database |
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

## External Observability
| File | Definition |
|---|---|
| `next/lib/integrations/axiom/axiom.client.ts` | Axiom logging / observability client |

## Rules
- **ALWAYS** use the injected `log` from `unifiedApiHandler` context: `log.info("msg", { metadata })`
- **NEVER** use raw `console.log` / `console.error` in production code
- **ALWAYS** log structured metadata objects, not concatenated strings
- **ALWAYS** scrub sensitive fields — never log passwords, tokens, card numbers
- **ALWAYS** log full error stack in `catch` blocks: `log.error("Message", { error })`
