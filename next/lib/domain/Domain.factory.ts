
import { db } from "@/lib/database";
import { AuthContext } from "@/lib/domain/base/Base.types";
import { type ProviderListOptions } from "./workspace/Workspace.types";

// Services
import { LearningService } from "./learning/Learning.service";
import { AuthService } from "./auth/Auth.service";
import { WorkspaceService } from "./workspace/Workspace.service";
import { ContentService } from "./content/Content.service";
import { ActivityService } from "./activity/Activity.service";
import { SupportService } from "./support/Support.service";
import { JobService } from "./jobs/Jobs.service";
import { PaymentService } from "./payment/Payment.service";
import { RoleService } from "./role/Role.service";
import { SystemPromptService } from "./ai-prompt/SystemPrompt.service";
import { SemanticMasteryService } from "./semantic-mastery/SemanticMastery.service";
import { SubjectService } from "./subject/Subject.service";
import { TopicService } from "./topic/Topic.service";
import { QuestionService } from "./question/Question.service";
import { QuizService } from "./quiz/Quiz.service";
import { HomeworkService } from "./homework/Homework.service";
import { AiSessionService } from "./ai-session/AiSession.service";
import { SearchService } from "./search/Search.service";
import { SearchRepository } from "./search/Search.repository";

// Repositories
import { LearningRepository } from "./learning/Learning.repository";
import { AuthRepository } from "./auth/Auth.repository";
import { WorkspaceRepository } from "./workspace/Workspace.repository";
import { ContentRepository } from "./content/Content.repository";
import { ActivityRepository } from "./activity/Activity.repository";
import { SupportRepository } from "./support/Support.repository";
import { JobRepository } from "./jobs/Jobs.repository";
import { PaymentRepository } from "./payment/Payment.repository";
import { RoleRepository } from "./role/Role.repository";
import { SystemPromptRepository } from "./ai-prompt/SystemPrompt.repository";
import { OtpRepository } from "./auth/Otp.repository";
import { OtpService } from "./auth/Otp.service";
import { SubjectRepository } from "./subject/Subject.repository";
import { TopicRepository } from "./topic/Topic.repository";
import { QuestionRepository } from "./question/Question.repository";
import { QuizRepository } from "./quiz/Quiz.repository";
import { HomeworkRepository } from "./homework/Homework.repository";
import { AiSessionRepository } from "./ai-session/AiSession.repository";

// Notification Services
import { MailService } from "@/lib/notifications/Mail.service";
import { SmsService } from "@/lib/notifications/Sms.service";
import { PushService } from "@/lib/notifications/Push.service";

// Activity-owned Services
import { ReportService } from "./activity/Report.service";
import { VerificationService } from "./auth/Verification.service";

/**
 * ModuleFactory - Central entry point for all modularized services
 */
export class ModuleFactory {
    constructor(private ctx: AuthContext) { }

    // ═══════════════════════════════════════════════════════════════
    // MODULES
    // ═══════════════════════════════════════════════════════════════

    /** @deprecated Use module.subject / module.topic / module.question instead */
    get learning() {
        return new LearningService(
            new LearningRepository(db),
            this.ctx,
            db,
            this.semanticMastery
        );
    }

    get subject() {
        return new SubjectService(
            new SubjectRepository(db),
            this.ctx,
            db,
            this.semanticMastery
        );
    }

    get topic() {
        return new TopicService(
            new TopicRepository(db),
            this.ctx,
            db,
            new SystemPromptService(new SystemPromptRepository(db), this.ctx, db),
            this.semanticMastery
        );
    }

    get question() {
        const subjectRepo = new SubjectRepository(db);
        const topicRepo = new TopicRepository(db);
        return new QuestionService(
            new QuestionRepository(db),
            subjectRepo,
            topicRepo,
            this.ctx,
            db,
        );
    }

    get auth() {
        return new AuthService(
            new AuthRepository(db),
            new PaymentRepository(db),
            new OtpService(new OtpRepository(db)),
            this.ctx
        );
    }


    get verification() {
        return new VerificationService(
            new AuthRepository(db),
            new OtpService(new OtpRepository(db)),
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
            list: (options?: ProviderListOptions) => workspaceService.listProviders(options),
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

    /** @deprecated Use module.quiz / module.homework / module.aiSession instead */
    get activity() {
        return new ActivityService(
            new ActivityRepository(db),
            this.ctx,
            db,
            new SystemPromptService(new SystemPromptRepository(db), this.ctx, db),
            this.semanticMastery
        );
    }

    get quiz() {
        return new QuizService(
            new QuizRepository(db),
            this.ctx,
            db,
            new SystemPromptService(new SystemPromptRepository(db), this.ctx, db),
            this.semanticMastery,
            this.search,
        );
    }

    get homework() {
        const aiSessionRepo = new AiSessionRepository(db);
        return new HomeworkService(
            new HomeworkRepository(db),
            aiSessionRepo,
            this.ctx,
            db,
            new SystemPromptService(new SystemPromptRepository(db), this.ctx, db),
            this.semanticMastery
        );
    }

    get aiSession() {
        return new AiSessionService(
            new AiSessionRepository(db),
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

    // ═══════════════════════════════════════════════════════════════
    // NOTIFICATION SERVICES
    // ═══════════════════════════════════════════════════════════════

    get mail() {
        return new MailService(this.ctx);
    }

    get sms() {
        return new SmsService(this.ctx);
    }

    get push() {
        return new PushService(this.ctx);
    }

    // ═══════════════════════════════════════════════════════════════
    // REPORTING
    // ═══════════════════════════════════════════════════════════════

    get reports() {
        return new ReportService(this.ctx);
    }

    // ═══════════════════════════════════════════════════════════════
    // SEARCH (ParadeDB)
    // ═══════════════════════════════════════════════════════════════

    get search() {
        return new SearchService(
            new SearchRepository(),
            this.ctx,
            db,
        );
    }
}
