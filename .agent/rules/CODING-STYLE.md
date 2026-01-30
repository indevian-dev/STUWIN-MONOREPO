---
trigger: always_on
---

Here is the specific technical standard for **Dependency Injection** and the **Module Factory (Container)**. You should add this to your AI Agent's rule file to ensure it writes clean, decoupled code.

---

## 🧩 Agent Rule: Dependency Injection & Containerization

### 1. Constructor Injection Standard

To ensure testability and loose coupling, all Services and Repositories must use **Constructor Injection**.

* **Syntax:** Use the `private readonly` shorthand i n the constructor.
* **Benefit:** This automatically declares the property, assigns the value, and hides it from external access (Encapsulation).

```typescript
// MANDATORY SERVICE SYNTAX
export class LearningService {
  constructor(
    private readonly subjectRepo: SubjectRepository, // Injected Repository
    private readonly topicRepo: TopicRepository,     // Injected Repository
    private readonly db: DatabaseType,               // Injected DB Instance (for transactions)
    private readonly ctx: AuthContext                // Injected User/Workspace Context
  ) {}

  // Methods access dependencies via this.subjectRepo, etc.
}

```

---

### 2. Module Factory (The Dependency Container)

To prevent "Import Hell" and manual instantiation in API routes, use a central **Module Factory**. This factory is responsible for "assembling" the modules.

* **Location:** `src/lib/modules/ModuleFactory.ts`
* **Pattern:** Use **Lazy Getters**. Modules should only be instantiated when accessed.
* **Context Injection:** The factory receives the `AuthContext` once and propagates it to all services.

```typescript
// THE FACTORY (CONTAINER)
export class ModuleFactory {
  constructor(private readonly ctx: AuthContext) {}

  /** * Assembles the Learning Module 
   * Logic: Repo -> Service -> Returned to Controller
   */
  get learning() {
    const subjectRepo = new SubjectRepository(db);
    const topicRepo = new TopicRepository(db);
    
    return new LearningService(subjectRepo, topicRepo, db, this.ctx);
  }

  get user() {
    const userRepo = new UserRepository(db);
    return new UserService(userRepo, this.ctx);
  }
}

```

---

### 3. Agent Implementation Logic (Decision Flow)

When the AI Agent is tasked with creating a new feature:

1. **Check the Factory:** Ensure the new Service is registered as a getter in `ModuleFactory.ts`.
2. **Verify Injections:** Ensure the Service constructor asks for the specific Repositories it needs. **Do not** instantiate Repositories inside the Service methods.
3. **Controller Usage:** In the API route (`route.ts`), the Agent must only interact with the Factory:
```typescript
const modules = new ModuleFactory(ctx);
const data = await modules.learning.getSubject(id);

```



---

### 4. Why this is Mandatory (Guardrails)

* **Encapsulation:** Using `private` prevents API routes from bypasssing the Service and touching the Repository or Database directly.
* **Single Source of Truth:** If a constructor signature changes, the Agent only needs to update the `ModuleFactory`, not every API route in the project.
* **Testability:** By injecting dependencies, we can easily "mock" the database or repositories during unit testing.

---

**Would you like me to provide the `BaseService` abstract class that automatically handles the `ctx` and `db` injection for you?** This would make your Service files even smaller and cleaner.