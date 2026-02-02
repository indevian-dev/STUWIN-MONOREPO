
import { db } from "@/lib/app-infrastructure/database";
import { AuthContext } from "@/lib/app-core-modules/types";

// Services
import { LearningService } from "./learning/learning.service";
import { AuthService } from "./auth/auth.service";
import { WorkspaceService } from "./workspace/workspace.service";
import { ContentService } from "./content/content.service";
import { ActivityService } from "./activity/activity.service";
import { SupportService } from "./support/support.service";
import { JobService } from "./jobs/jobs.service";
import { PaymentService } from "./payment/payment.service";
import { RoleService } from "./workspace/role.service";
import { SystemPromptService } from "./intelligence/system-prompt.service";
import { SemanticMasteryService } from "./semantic-mastery/SemanticMasteryService";


// Repositories
import { LearningRepository } from "./learning/learning.repository";
import { AuthRepository } from "./auth/auth.repository";
import { WorkspaceRepository } from "./workspace/workspace.repository";
import { ContentRepository } from "./content/content.repository";
import { ActivityRepository } from "./activity/activity.repository";
import { SupportRepository } from "./support/support.repository";
import { JobRepository } from "./jobs/jobs.repository";
import { PaymentRepository } from "./payment/payment.repository";
import { RoleRepository } from "./workspace/role.repository";
import { SystemPromptRepository } from "./intelligence/system-prompt.repository";


// Shared/Legacy Services
import { MailService } from "./domain/MailService";
import { ReportService } from "./domain/ReportService";
import { VerificationService } from "./auth/verification.service";
import { AuditService } from "./domain/AuditService";

/**
 * ModuleFactory - Central entry point for all modularized services
 */
export class ModuleFactory {
    constructor(private ctx: AuthContext) { }

    // ═══════════════════════════════════════════════════════════════
    // MODULES
    // ═══════════════════════════════════════════════════════════════

    get learning() {
        return new LearningService(
            new LearningRepository(db),
            this.ctx,
            db,
            this.semanticMastery
        );
    }

    get auth() {
        return new AuthService(
            new AuthRepository(db),
            new PaymentRepository(db),
            this.ctx
        );
    }


    get verification() {
        return new VerificationService(
            new AuthRepository(db),
            this.ctx
        );
    }

    get provider() {
        const workspaceService = new WorkspaceService(
            new WorkspaceRepository(db),
            this.ctx,
            db
        );
        return {
            list: (options?: any) => workspaceService.listProviders(options),
            get: (id: string) => workspaceService.getWorkspace(id),
        };
    }

    get workspace() {
        return new WorkspaceService(
            new WorkspaceRepository(db),
            this.ctx,
            db
        );
    }

    get content() {
        const contentRepo = new ContentRepository(db);
        const supportRepo = new SupportRepository(db);

        // Return a hybrid for backward compatibility
        const service = new ContentService(contentRepo, this.ctx, db);
        return Object.assign(service, {
            contentRepo,
            supportRepo
        });
    }

    get support() {
        return new SupportService(
            new SupportRepository(db),
            this.ctx,
            db
        );
    }

    get activity() {
        return new ActivityService(
            new ActivityRepository(db),
            this.ctx,
            db,
            new SystemPromptService(new SystemPromptRepository(db), this.ctx, db),
            this.semanticMastery
        );
    }

    get semanticMastery() {
        return new SemanticMasteryService();
    }

    get jobs() {
        return new JobService(
            new JobRepository(db),
            this.ctx,
            db
        );
    }

    get payment() {
        return new PaymentService(
            new PaymentRepository(db),
            this.ctx,
            db
        );
    }

    get roles() {
        return new RoleService(
            new RoleRepository(db),
            this.ctx,
            db
        );
    }

    get intelligence() {
        return new SystemPromptService(
            new SystemPromptRepository(db),
            this.ctx,
            db
        );
    }

    get systemPrompts() {
        return this.intelligence;
    }



    // ═══════════════════════════════════════════════════════════════
    // ALIASES (Backward Compatibility)
    // ═══════════════════════════════════════════════════════════════

    get studentActivity() {
        return this.activity;
    }

    get blogs() {
        return this.content;
    }

    get eduOrgs() {
        return this.workspace;
    }

    // ═══════════════════════════════════════════════════════════════
    // CORE UTILITIES
    // ═══════════════════════════════════════════════════════════════

    get mail() {
        return new MailService(this.ctx);
    }

    get reports() {
        return new ReportService(this.ctx);
    }

    get audit() {
        return new AuditService(this.ctx, db);
    }
}
