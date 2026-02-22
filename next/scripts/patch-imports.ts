import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const fixes = [
    { old: "require('@/lib/utils/upload/Pdf.util')", new: "require('@/lib/utils/upload/Pdf.util')" },
    { old: "from '@/lib/utils/ids/SlimUlid.util'", new: "from '@/lib/utils/ids/SlimUlid.util'" },
    { old: "from '@/lib/utils/http/SsrApi.util'", new: "from '@/lib/utils/http/SsrApi.util'" },
    { old: "from '@/lib/middleware/Response.Api.type'", new: "from '@/lib/middleware/Response.Api.type'" },
    { old: "from '@/lib/utils/http/FetchApiSPA.util'", new: "from '@/lib/utils/http/FetchApiSPA.util'" },
    { old: "from '@/lib/utils/formatting/TimeFormatting.util'", new: "from '@/lib/utils/formatting/TimeFormatting.util'" },
    { old: "from '@/components/SectionTitle.widget'", new: "from '@/components/SectionTitle.widget'" },
    { old: "from '@/app/ui/SectionTitle.widget'", new: "from '@/app/ui/SectionTitle.widget'" },
    { old: "from '../lib/domain/semantic-mastery/SemanticMastery.service'", new: "from '../lib/domain/semantic-mastery/SemanticMastery.service'" },
    { old: "from '@/lib/utils/upload/S3.util'", new: "from '@/lib/utils/upload/S3.util'" },
    { old: "from '@/lib/utils/formatting/PhoneFormatter.util'", new: "from '@/lib/utils/formatting/PhoneFormatter.util'" },
    { old: "from '@/lib/utils/validation/FinValidator.util'", new: "from '@/lib/utils/validation/FinValidator.util'" },
    { old: "from '@/lib/utils/formatting/CaseConversion.util'", new: "from '@/lib/utils/formatting/CaseConversion.util'" },
    { old: "from '@/lib/utils/formatting/PathNormalizer.util'", new: "from '@/lib/utils/formatting/PathNormalizer.util'" }
];

const filesToFix = [
    "app/[locale]/(global)/(context)/GlobalAuthProfileContext.tsx",
    "app/[locale]/(global)/(tiles)/GlobalNotificationBadge.tile.tsx",
    "app/[locale]/(global)/(widgets)/GlobalInlineForbidden.widget.tsx",
    "app/[locale]/(global)/(widgets)/GlobalThemeSwitcherWidget.tsx",
    "app/[locale]/(public)/(context)/PublicBookmarkedQuestionsContext.tsx",
    "app/[locale]/(public)/(layout)/header/(widgets)/PublicSearch.widget.tsx",
    "app/[locale]/(public)/blogs/(widgets)/PublicBlogsList.widget.tsx",
    "app/[locale]/(public)/blogs/(widgets)/PublicSingleBlog.widget.tsx",
    "app/[locale]/(public)/docs/rules/(widgets)/PublicRules.widget.tsx",
    "app/[locale]/(public)/programs/PublicProgramsService.ts",
    "app/[locale]/(public)/providers/(widgets)/PublicProviderApplicationForm.widget.tsx",
    "app/[locale]/(public)/providers/(widgets)/PublicProvidersList.widget.tsx",
    "app/[locale]/(public)/providers/(widgets)/PublicProvidersStats.widget.tsx",
    "app/[locale]/(public)/providers/(widgets)/PublicRelatedProviders.widget.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/quizzes/(screens)/take/[id]/StudentTakeQuizPageClient.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizAnalysis.modal.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizHistoryList.widget.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizReport.widget.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentStartQuiz.widget.tsx",
    "app/ui/SectionTitle.widget",
    "lib/utils/http/StaffAiLabApiHelper.ts",
    "lib/utils/http/StaffJobsApiHelper.ts",
    "scripts/backfill-topic-vectors.ts",
    "app/[locale]/workspaces/student/[workspaceId]/learning/(widgets)/StudentLearningSession.modal.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/my-account/(widgets)/StudentMyAccount.widget.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworkDetail.widget.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworksList.widget.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/homeworks/(widgets)/StudentHomeworkUpload.widget.tsx",
    "app/[locale]/workspaces/student/[workspaceId]/learning/(widgets)/StudentLearningSession.modal.tsx"
];

for (const file of filesToFix) {
    try {
        const fullPath = join(process.cwd(), file);
        let content = readFileSync(fullPath, 'utf8');
        let changed = false;

        for (const fix of fixes) {
            if (content.includes(fix.old)) {
                content = content.replace(new RegExp(fix.old.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), fix.new);
                changed = true;
            }
        }

        if (changed) {
            writeFileSync(fullPath, content, 'utf8');
            console.log(`Fixed ${file}`);
        }
    } catch (e) { }
}
