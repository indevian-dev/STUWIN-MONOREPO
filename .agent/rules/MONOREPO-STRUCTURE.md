# Monorepo Structure

## Root Layout
| Path | Definition |
|---|---|
| `next/` | Web app — Next.js 16+ App Router, independent `bun install` |
| `expo/` | Mobile app — React Native / Expo, independent `bun install` |
| `_shared.types/` | Cross-platform TS types — no package.json, resolved via tsconfig `@/types` |
| `_scripts/` | Build / migration helper scripts |
| `.agent/rules/` | AI agent rule files |

## `_shared.types/` — Cross-Platform Types
| Path | Definition |
|---|---|
| `auth/authData.ts` | `AuthData`, `AuthContext` interfaces |
| `auth/session.ts` | Session / token types |
| `auth/otp.ts` | OTP request/response types |
| `auth/permissions.ts` | Permission enum / maps |
| `auth/oauth.ts` | OAuth provider types |
| `domain/question.ts` | `QuestionEntity` shared shape |
| `domain/subject.ts` | `SubjectEntity` shared shape |
| `domain/topic.ts` | `TopicEntity` shared shape |
| `domain/user.ts` | `UserProfile` shared shape |
| `domain/provider.ts` | `ProviderProfile` shared shape |
| `common/base.ts` | Generic util types (`Paginated`, `ApiResponse`) |
| `common/values.ts` | Shared constants / enums |
| `common/logger.ts` | Logger interface contract |

## Rules
- `next/` and `expo/` are **fully independent** — never import across app boundaries.
- `_shared.types/` is **plain `.ts` files only** — never import framework-specific code here.
- Run `bun install` from inside `next/` or `expo/`, never from root.
