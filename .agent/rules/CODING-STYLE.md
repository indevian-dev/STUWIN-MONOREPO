---
trigger: always_on
---

## Dependency Injection & Module Factory

### Key Files
| File | Definition |
|---|---|
| `next/lib/domain/factory.ts` | `ModuleFactory` — DI container, lazy getters for every service |
| `next/lib/domain/base/base.service.ts` | `BaseService` — abstract class with `handleError(error, context)` |
| `next/lib/domain/base/base.repository.ts` | `BaseRepository` — injects `DbClient` via constructor |
| `next/lib/domain/base/types.ts` | Re-exports `_shared.types/` (auth, domain, common) |

### Constructor Injection Standard
All Services and Repositories use `private readonly` shorthand:
```typescript
export class QuizService extends BaseService {
  constructor(
    private readonly repository: QuizRepository,
    private readonly ctx: AuthContext,
    private readonly db: Database,
    private readonly systemPrompts: SystemPromptService,
    private readonly semanticMastery: SemanticMasteryService
  ) { super(); }
}
```

### Module Factory (Container)
- Located at `next/lib/domain/factory.ts`
- Uses **lazy getters** — modules instantiated only when accessed
- Receives `AuthContext` once and propagates to all services
- In API routes, use `module.<service>.<method>()` — never instantiate directly

### Domain Module File Naming
| Pattern | Purpose |
|---|---|
| `<module>.service.ts` | Business logic (extends `BaseService`) |
| `<module>.repository.ts` | Database queries (extends `BaseRepository`) |
| `<module>.types.ts` | Entity interfaces, enums, result types |
| `<module>.inputs.ts` | Zod schemas + input DTOs |
| `<module>.entity.ts` | Entity type definitions (if separate) |
| `<module>.views.ts` | View-model / response-shape types |
| `index.ts` | Barrel export (public API of the module) |

### Current Modules in Factory
| Getter | Service Class | Status |
|---|---|---|
| `module.subject` | `SubjectService` | ✅ Active |
| `module.topic` | `TopicService` | ✅ Active |
| `module.question` | `QuestionService` | ✅ Active |
| `module.quiz` | `QuizService` | ✅ Active |
| `module.homework` | `HomeworkService` | ✅ Active |
| `module.aiSession` | `AiSessionService` | ✅ Active |
| `module.auth` | `AuthService` | ✅ Active |
| `module.verification` | `VerificationService` | ✅ Active |
| `module.workspace` | `WorkspaceService` | ✅ Active |
| `module.content` | `ContentService` | ✅ Active |
| `module.support` | `SupportService` | ✅ Active |
| `module.jobs` | `JobService` | ✅ Active |
| `module.payment` | `PaymentService` | ✅ Active |
| `module.roles` | `RoleService` | ✅ Active |
| `module.intelligence` | `SystemPromptService` | ✅ Active |
| `module.semanticMastery` | `SemanticMasteryService` | ✅ Active |
| `module.mail` | `MailService` | ✅ Active |
| `module.sms` | `SmsService` | ✅ Active |
| `module.push` | `PushService` | ✅ Active |
| `module.reports` | `ReportService` | ✅ Active |
| `module.learning` | `LearningService` | ⚠️ Deprecated — use subject/topic/question |
| `module.activity` | `ActivityService` | ⚠️ Deprecated — use quiz/homework/aiSession |

### Rules
- **ALWAYS** extend `BaseService` for services, `BaseRepository` for repositories
- **ALWAYS** register new services in `ModuleFactory` as lazy getters
- **ALWAYS** use Constructor Injection (`private readonly`) for all dependencies
- **NEVER** use `any` type — define proper interfaces in `*.types.ts`
- **NEVER** instantiate services directly in routes — use the factory
- **PREFER** split modules over deprecated monoliths