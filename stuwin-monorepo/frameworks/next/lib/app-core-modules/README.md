# Module Architecture

## Overview

The `src/lib/modules/` directory contains the core business logic organized by domain modules following a clean, standardized structure.

## Module Structure

Each module follows this pattern:

```
src/lib/modules/<module-name>/
├── <module-name>.repository.ts  # Database operations
├── <module-name>.service.ts     # Business logic
├── <module-name>.types.ts       # TypeScript types
├── <module-name>.schema.ts      # Zod validation schemas
└── index.ts                     # Barrel exports
```

## Available Modules

### 1. **Learning** (`/learning`)
Handles educational content: subjects, topics, questions, and quizzes.

**Key Features:**
- Subject management
- Topic creation and organization
- Question CRUD operations
- Quiz generation and handling

**Example Usage:**
```typescript
const factory = new ModuleFactory(authContext);
const subjects = await factory.learning.getPublicSubjects();
```

### 2. **Auth** (`/auth`)
User authentication, account management, and verification.

**Key Features:**
- User login/registration
- Email/Phone OTP verification
- Account management
- Session handling

**Example Usage:**
```typescript
const result = await factory.auth.login({ email, password, ip });
```

### 3. **Workspace** (`/workspace`)
Multi-workspace workspace management, memberships, and roles.

**Key Features:**
- Workspace creation
- Membership management
- Role-based access control
- Educational organization listing

**Example Usage:**
```typescript
const workspace = await factory.workspace.createWorkspace(ownerId, details);
```

### 4. **Content** (`/content`)
CMS functionality for blogs, pages, and system prompts.

**Key Features:**
- Blog management (multi-language)
- Static page handling
- System prompt configuration

**Example Usage:**
```typescript
const blogs = await factory.content.listBlogs({ page: 1, limit: 10 });
```

### 5. **Activity** (`/activity`)
Student activity tracking: quizzes, homework, and learning sessions.

**Key Features:**
- Quiz session management
- Homework submission
- Learning session tracking

**Example Usage:**
```typescript
const quiz = await factory.activity.startQuiz(accountId, quizData);
```

### 6. **Support** (`/support`)
Supporting features: notifications, bookmarks, and geography.

**Key Features:**
- Notification management
- User bookmarks
- Country/City listings

**Example Usage:**
```typescript
const notifications = await factory.support.getNotifications(accountId);
```

## Module Factory

The central access point for all modules:

```typescript
import { ModuleFactory } from '@/lib/modules/factory';

// In API handler
const factory = new ModuleFactory(authContext);

// Access modules
factory.learning    // LearningService
factory.auth        // AuthService
factory.workspace   // WorkspaceService
factory.content     // ContentService
factory.activity    // ActivityService
factory.support     // SupportService

// Legacy aliases (backward compatibility)
factory.blogs           // → content
factory.studentActivity // → activity
factory.eduOrgs         // → workspace
```

## Design Principles

### 1. **Separation of Concerns**
- **Repository**: Pure database operations
- **Service**: Business logic and orchestration
- **Types**: Domain models and interfaces
- **Schema**: Input validation using Zod

### 2. **Self-Contained Modules**
Each module contains ALL its related code:
- ✅ Types live with the module
- ✅ Schemas live with the module
- ✅ No cross-module dependencies
- ✅ Import directly from module folder

### 3. **Backward Compatibility**
The new structure maintains compatibility with legacy code through:
- Factory aliases (`factory.blogs` → `factory.content`)
- Hybrid return types (e.g., `content` returns service + repos)
- Preserved method signatures

## Migration Path

### Before (Legacy)
```typescript
// Scattered imports
import { SubjectRepository } from '@/lib/app-core-modules/repositories/SubjectRepository';
import { LearningService } from '@/lib/app-core-modules/services/LearningService';
import type { Subject } from '@/types/resources/subjects';
```

### After (New Module Structure)
```typescript
// Single import
import { LearningService, LearningRepository, Subject } from '@/lib/modules/learning';

// Or use factory
const factory = new ModuleFactory(ctx);
const result = await factory.learning.getSubjectOverview(id);
```

## Adding a New Module

1. Create module directory: `src/lib/modules/<name>/`
2. Create the 4 core files:
   - `<name>.repository.ts` - extends `BaseRepository`
   - `<name>.service.ts` - extends `BaseService`
   - `<name>.types.ts` - TypeScript interfaces
   - `<name>.schema.ts` - Zod schemas
3. Create `index.ts` for barrel exports
4. Register in `factory.ts`:
   ```typescript
   get myModule() {
       return new MyModuleService(
           new MyModuleRepository(db),
           this.ctx,
           db
       );
   }
   ```

## Best Practices

1. **Always use the ModuleFactory** in API handlers via `unifiedApiHandler`
2. **Keep types in modules**, not in global `/types/resources`
3. **Use Zod schemas** for all input validation
4. **Maintain transaction support** in repository methods
5. **Handle errors** in service layer, not repositories
6. **Return success/error objects** from services

## File Size Guidelines

- Repository: 100-300 lines
- Service: 100-500 lines
- Types: 50-200 lines
- Schema: 30-100 lines

If files grow larger, consider splitting into sub-modules.
