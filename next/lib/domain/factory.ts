
import { db } from "@/lib/database";
import { AuthContext } from "@/lib/domain/base/types";
import { type ProviderListOptions } from "./workspace/workspace.types";

// Services
import { LearningService } from "./learning/learning.service";
import { AuthService } from "./auth/auth.service";
import { WorkspaceService } from "./workspace/workspace.service";
import { ContentService } from "./content/content.service";
import { ActivityService } from "./activity/activity.service";
import { SupportService } from "./support/support.service";
import { JobService } from "./jobs/jobs.service";
import { PaymentService } from "./payment/payment.service";
import { RoleService } from "./role/role.service";
import { SystemPromptService } from "./ai-prompt/system-prompt.service";
import { SemanticMasteryService } from "./semantic-mastery/semantic-mastery.service";
import { SubjectService } from "./subject/subject.service";
import { TopicService } from "./topic/topic.service";
import { QuestionService } from "./question/question.service";
import { QuizService } from "./quiz/quiz.service";
import { HomeworkService } from "./homework/homework.service";
import { AiSessionService } from "./ai-session/ai-session.service";

// Repositories
import { LearningRepository } from "./learning/learning.repository";
import { AuthRepository } from "./auth/auth.repository";
import { WorkspaceRepository } from "./workspace/workspace.repository";
import { ContentRepository } from "./content/content.repository";
import { ActivityRepository } from "./activity/activity.repository";
import { SupportRepository } from "./support/support.repository";
import { JobRepository } from "./jobs/jobs.repository";
import { PaymentRepository } from "./payment/payment.repository";
import { RoleRepository } from "./role/role.repository";
import { SystemPromptRepository } from "./ai-prompt/system-prompt.repository";
import { OtpRepository } from "./auth/otp.repository";
import { OtpService } from "./auth/otp.service";
import { SubjectRepository } from "./subject/subject.repository";
import { TopicRepository } from "./topic/topic.repository";
import { QuestionRepository } from "./question/question.repository";
import { QuizRepository } from "./quiz/quiz.repository";
import { HomeworkRepository } from "./homework/homework.repository";
import { AiSessionRepository } from "./ai-session/ai-session.repository";

// Notification Services
import { MailService } from "@/lib/notifications/mail.service";
import { SmsService } from "@/lib/notifications/sms.service";
import { PushService } from "@/lib/notifications/push.service";

// Activity-owned Services
import { ReportService } from "./activity/report.service";
import { VerificationService } from "./auth/verification.service";

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
            new SystemPromptService(new SystemPromptRepository(db), this.ctx, db)
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
            this.semanticMastery
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
}
