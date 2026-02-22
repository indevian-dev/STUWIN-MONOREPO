import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const manualSpaRevert = [
    'app/[locale]/(global)/(context)/GlobalAuthProfileContext.tsx',
    'app/[locale]/(global)/(tiles)/GlobalNotificationBadge.tile.tsx',
    'app/[locale]/(public)/(context)/PublicBookmarkedQuestionsContext.tsx',
    'app/[locale]/(public)/(layout)/header/(widgets)/PublicSearch.widget.tsx',
    'app/[locale]/(public)/blogs/(widgets)/PublicBlogsList.widget.tsx',
    'app/[locale]/(public)/blogs/(widgets)/PublicSingleBlog.widget.tsx',
    'app/[locale]/(public)/docs/rules/(widgets)/PublicRules.widget.tsx',
    'app/[locale]/(public)/providers/(widgets)/PublicProviderApplicationForm.widget.tsx',
    'app/[locale]/(public)/providers/(widgets)/PublicProvidersStats.widget.tsx',
    'app/[locale]/(public)/providers/(widgets)/PublicRelatedProviders.widget.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(screens)/take/[id]/StudentTakeQuizPageClient.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizHistoryList.widget.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizReport.widget.tsx',
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentStartQuiz.widget.tsx',
    'lib/utils/http/StaffAiLabApiHelper.ts',
    'lib/utils/http/StaffJobsApiHelper.ts',
];

for (const file of manualSpaRevert) {
    try {
        const fullPath = join(process.cwd(), file);
        let c = readFileSync(fullPath, 'utf8');
        c = c.replace(/import \{ SpaApi\.util \} from/g, 'import { apiCall } from');
        writeFileSync(fullPath, c, 'utf8');
    } catch (e) { }
}

const manualJSXFix = [
    'app/[locale]/(global)/(widgets)/GlobalThemeSwitcherWidget.tsx',
    'app/[locale]/(global)/(widgets)/GlobalInlineForbidden.widget.tsx'
];

for (const file of manualJSXFix) {
    try {
        const fullPath = join(process.cwd(), file);
        let c = readFileSync(fullPath, 'utf8');
        c = c.replace(/<GlobalButton\.widget/g, '<GlobalButtonWidget');
        c = c.replace(/<\/GlobalButton\.widget>/g, '</GlobalButtonWidget>');
        writeFileSync(fullPath, c, 'utf8');
    } catch (e) { }
}

const manualComponentFix = [
    'app/[locale]/workspaces/student/[workspaceId]/quizzes/(widgets)/StudentQuizAnalysis.modal.tsx',
    'app/ui/section-title.tsx'
]

for (const file of manualComponentFix) {
    try {
        const fullPath = join(process.cwd(), file);
        let c = readFileSync(fullPath, 'utf8');
        c = c.replace(/import \{ SectionTitle\.widget \} from/g, 'import { SectionTitleWidget } from');
        c = c.replace(/export function SectionTitle\.widget/g, 'export function SectionTitleWidget');
        writeFileSync(fullPath, c, 'utf8');
    } catch (e) { }
}
